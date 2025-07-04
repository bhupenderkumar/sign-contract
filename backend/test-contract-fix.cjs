const { Connection, PublicKey, Keypair, Transaction, SystemProgram, LAMPORTS_PER_SOL } = require('@solana/web3.js');
const anchor = require('@project-serum/anchor');
const path = require('path');

// Load IDL
const idlPath = path.join(__dirname, '..', 'digital_contract', 'target', 'idl', 'digital_contract.json');
const idl = require(idlPath);

// Test the contract creation with correct parameters
async function testContractCreation() {
  try {
    console.log('🧪 Testing contract creation with fixed parameters...');
    
    // Setup connection
    const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
    
    // Load wallet
    const walletPath = path.join(__dirname, 'wallet.json');
    const walletData = require(walletPath);
    const walletKeypair = Keypair.fromSecretKey(new Uint8Array(walletData));
    console.log('💼 Wallet loaded:', walletKeypair.publicKey.toString());
    
    // Setup program
    const programId = new PublicKey("4bmYTgHAoYfBBwoELVqUzc9n8DTfFvtt7CodYq78wzir");
    const provider = new anchor.AnchorProvider(connection, new anchor.Wallet(walletKeypair), {});
    const program = new anchor.Program(idl, programId, provider);
    
    // Test data
    const contractAccount = Keypair.generate();
    const documentHash = "test_hash_123";
    const title = "Test Contract";
    const parties = [
      new PublicKey("BcSXav3jcBKRbN6woZsqPMJGYrS2MXwVEdtUx1ZzD9Xo"),
      new PublicKey("BcSXav3jcBKRbN6woZsqPMJGYrS2MXwVEdtUx1ZzD9Xo")
    ];
    const mediator = null;
    const expiryTimestamp = null;
    const contractValueLamports = new anchor.BN(100_000_000); // 0.1 SOL
    const platformFeeRecipient = new PublicKey("BcSXav3jcBKRbN6woZsqPMJGYrS2MXwVEdtUx1ZzD9Xo");
    
    console.log('📝 Creating transaction instruction...');
    
    // Create the transaction instruction with all 6 parameters
    const instruction = await program.methods
      .createContract(
        documentHash,
        title,
        parties,
        mediator,
        expiryTimestamp,
        contractValueLamports // This was missing before!
      )
      .accounts({
        contract: contractAccount.publicKey,
        creator: walletKeypair.publicKey,
        platformFeeRecipient: platformFeeRecipient,
        systemProgram: SystemProgram.programId,
      })
      .signers([contractAccount]) // Add contract account as signer
      .instruction();
    
    console.log('✅ Transaction instruction created successfully!');
    console.log('📊 Instruction data length:', instruction.data.length);
    console.log('🔑 Required signers:', instruction.keys.filter(k => k.isSigner).map(k => k.pubkey.toString()));
    
    // Create transaction
    const transaction = new Transaction();
    transaction.add(instruction);
    
    // Get recent blockhash
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = walletKeypair.publicKey;
    
    // Add contract account as signer (required for account initialization)
    transaction.partialSign(contractAccount);
    
    console.log('✅ Transaction created successfully!');
    console.log('📦 Transaction size:', transaction.serialize({ requireAllSignatures: false }).length);
    
    // Serialize for frontend
    const serializedTransaction = transaction.serialize({
      requireAllSignatures: false,
      verifySignatures: false
    });
    
    console.log('✅ Transaction serialized successfully!');
    console.log('📤 Serialized transaction length:', serializedTransaction.length);
    console.log('🎯 Contract account:', contractAccount.publicKey.toString());
    
    return {
      success: true,
      serializedTransaction: Buffer.from(serializedTransaction).toString('base64'),
      contractAccount: contractAccount.publicKey.toString()
    };
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('📋 Full error:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

// Run the test
testContractCreation().then(result => {
  console.log('\n🏁 Test Result:');
  console.log(JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
});
