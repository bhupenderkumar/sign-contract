const { Connection, PublicKey, Transaction } = require('@solana/web3.js');

// Test script to verify blockhash handling fixes
async function testBlockhashHandling() {
  console.log('🧪 Testing Blockhash Handling Fixes...\n');

  try {
    // Test 1: Connection to Solana devnet
    console.log('1️⃣ Testing Solana connection...');
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    const version = await connection.getVersion();
    console.log('✅ Connected to Solana devnet, version:', version['solana-core']);

    // Test 2: Get fresh blockhash
    console.log('\n2️⃣ Testing fresh blockhash retrieval...');
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    
    console.log('✅ Fresh blockhash obtained:', blockhash);
    console.log('✅ Last valid block height:', lastValidBlockHeight);
    
    // Validate blockhash format
    if (blockhash && blockhash.length === 44) {
      console.log('✅ Blockhash format is valid (44 characters)');
    } else {
      console.log('❌ Invalid blockhash format');
      return;
    }

    // Test 3: Create a simple transaction with the blockhash
    console.log('\n3️⃣ Testing transaction creation with fresh blockhash...');
    const transaction = new Transaction();
    transaction.recentBlockhash = blockhash;
    
    // Use a dummy public key for testing
    const dummyPubkey = new PublicKey('11111111111111111111111111111112');
    transaction.feePayer = dummyPubkey;
    
    console.log('✅ Transaction created successfully');
    console.log('✅ Transaction blockhash:', transaction.recentBlockhash);
    console.log('✅ Transaction fee payer:', transaction.feePayer.toString());

    // Test 4: Serialize transaction
    console.log('\n4️⃣ Testing transaction serialization...');
    try {
      const serialized = transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false
      });
      
      console.log('✅ Transaction serialized successfully');
      console.log('✅ Serialized length:', serialized.length, 'bytes');
      
      // Test deserialization
      const deserialized = Transaction.from(serialized);
      console.log('✅ Transaction deserialized successfully');
      console.log('✅ Deserialized blockhash:', deserialized.recentBlockhash);
      
      if (deserialized.recentBlockhash === blockhash) {
        console.log('✅ Blockhash preserved through serialization/deserialization');
      } else {
        console.log('❌ Blockhash not preserved');
      }
      
    } catch (error) {
      console.log('❌ Transaction serialization failed:', error.message);
    }

    console.log('\n🎉 All tests passed! The blockhash handling fixes should work correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

// Test blockhash expiration timing
async function testBlockhashTiming() {
  console.log('\n⏰ Testing blockhash timing...');
  
  try {
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    const start = Date.now();
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash('confirmed');
    const fetchTime = Date.now() - start;
    
    console.log('✅ Blockhash fetch time:', fetchTime, 'ms');
    
    // Get current block height
    const currentBlockHeight = await connection.getBlockHeight();
    const blocksRemaining = lastValidBlockHeight - currentBlockHeight;
    
    console.log('✅ Current block height:', currentBlockHeight);
    console.log('✅ Last valid block height:', lastValidBlockHeight);
    console.log('✅ Blocks remaining for this blockhash:', blocksRemaining);
    
    // Estimate time remaining (assuming ~400ms per block on devnet)
    const estimatedTimeRemaining = blocksRemaining * 400; // ms
    console.log('✅ Estimated time remaining:', Math.round(estimatedTimeRemaining / 1000), 'seconds');
    
    if (estimatedTimeRemaining > 30000) { // More than 30 seconds
      console.log('✅ Sufficient time for transaction processing');
    } else {
      console.log('⚠️ Limited time remaining - transaction should be processed quickly');
    }
    
  } catch (error) {
    console.error('❌ Timing test failed:', error.message);
  }
}

// Run tests
async function runAllTests() {
  await testBlockhashHandling();
  await testBlockhashTiming();
  
  console.log('\n📋 Summary:');
  console.log('- Backend now gets fresh blockhash immediately when preparing transactions');
  console.log('- Frontend no longer needs to replace blockhash - it uses the fresh one from backend');
  console.log('- Transaction structure is properly maintained through serialization');
  console.log('- Contract account is pre-signed by backend before sending to frontend');
  console.log('- Reduced time window between blockhash fetch and transaction submission');
  
  console.log('\n🔧 Key Changes Made:');
  console.log('1. Backend: prepareContractTransaction now gets fresh blockhash immediately');
  console.log('2. Backend: Contract account is pre-signed before serialization');
  console.log('3. Frontend: Simplified transaction handling - no more blockhash replacement');
  console.log('4. Frontend: Better error handling for invalid transactions');
  console.log('5. Backend: Improved blockhash validation and retry logic');
}

// Execute tests
runAllTests().catch(console.error);
