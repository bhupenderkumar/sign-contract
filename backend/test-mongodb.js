const mongoose = require('mongoose');

async function testMongoDB() {
  console.log('🔍 Testing MongoDB Connection...');
  console.log('=====================================');

  const testUris = [
    'mongodb+srv://contractDB:contractDB%40123321@cluster0.1wfs2to.mongodb.net/digital_contracts?retryWrites=true&w=majority&appName=Cluster0',
    'mongodb://localhost:27017/digital_contracts',
    'mongodb://127.0.0.1:27017/digital_contracts'
  ];

  for (const uri of testUris) {
    console.log(`\n🔄 Testing: ${uri}`);
    
    try {
      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 3000, // 3 seconds timeout
        connectTimeoutMS: 5000, // 5 seconds timeout
      };

      await mongoose.connect(uri, options);
      console.log('✅ SUCCESS: Connected to MongoDB!');
      console.log('📊 Connection details:');
      console.log(`   - Host: ${mongoose.connection.host}`);
      console.log(`   - Port: ${mongoose.connection.port}`);
      console.log(`   - Database: ${mongoose.connection.name}`);
      console.log(`   - Ready State: ${mongoose.connection.readyState}`);
      
      // Test basic operations
      console.log('\n🧪 Testing basic operations...');
      
      // Create a simple test schema
      const TestSchema = new mongoose.Schema({
        name: String,
        timestamp: { type: Date, default: Date.now }
      });
      
      const TestModel = mongoose.model('Test', TestSchema);
      
      // Insert a test document
      const testDoc = new TestModel({ name: 'Connection Test' });
      await testDoc.save();
      console.log('✅ Insert operation successful');
      
      // Find the test document
      const found = await TestModel.findOne({ name: 'Connection Test' });
      console.log('✅ Query operation successful');
      
      // Clean up
      await TestModel.deleteOne({ name: 'Connection Test' });
      console.log('✅ Delete operation successful');
      
      await mongoose.connection.close();
      console.log('✅ Connection closed successfully');
      
      console.log('\n🎉 MongoDB is working perfectly!');
      console.log('You can now start your backend server.');
      return true;
      
    } catch (error) {
      console.log(`❌ FAILED: ${error.message}`);
      
      if (error.message.includes('ECONNREFUSED')) {
        console.log('💡 MongoDB server is not running or not accessible');
      } else if (error.message.includes('Authentication failed')) {
        console.log('💡 Authentication issue - check username/password');
      } else if (error.message.includes('timeout')) {
        console.log('💡 Connection timeout - MongoDB might be slow to respond');
      }
      
      try {
        await mongoose.connection.close();
      } catch (closeError) {
        // Ignore close errors
      }
    }
  }

  console.log('\n❌ All MongoDB connection attempts failed!');
  console.log('\n💡 Solutions:');
  console.log('1. Install MongoDB Community Server:');
  console.log('   https://www.mongodb.com/try/download/community');
  console.log('\n2. Start MongoDB service:');
  console.log('   net start MongoDB');
  console.log('\n3. Use MongoDB Atlas (cloud):');
  console.log('   https://www.mongodb.com/atlas');
  console.log('\n4. Check if MongoDB is installed:');
  console.log('   mongod --version');
  
  return false;
}

// Run the test
testMongoDB()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  });
