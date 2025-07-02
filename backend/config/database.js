const mongoose = require('mongoose');

class DatabaseManager {
  constructor() {
    this.isConnected = false;
    this.connectionAttempts = 0;
    this.maxRetries = 3;
  }

  async connect(mongoUri) {
    try {
      console.log('🔄 Attempting to connect to MongoDB...');
      console.log('📍 URI:', mongoUri.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@'));

      const options = {
        useNewUrlParser: true,
        useUnifiedTopology: true,
        serverSelectionTimeoutMS: 5000, // 5 seconds timeout
        connectTimeoutMS: 10000, // 10 seconds timeout
        maxPoolSize: 10,
        retryWrites: true,
        w: 'majority'
      };

      await mongoose.connect(mongoUri, options);
      
      this.isConnected = true;
      console.log('✅ MongoDB connected successfully');
      
      // Set up connection event listeners
      this.setupEventListeners();
      
      return { success: true, message: 'Connected to MongoDB' };
    } catch (error) {
      console.error('❌ MongoDB connection error:', error.message);
      this.connectionAttempts++;
      
      if (this.connectionAttempts < this.maxRetries) {
        console.log(`🔄 Retrying connection (${this.connectionAttempts}/${this.maxRetries})...`);
        await this.delay(2000); // Wait 2 seconds before retry
        return this.connect(mongoUri);
      }
      
      return { success: false, error: error.message };
    }
  }

  setupEventListeners() {
    mongoose.connection.on('connected', () => {
      console.log('🔗 Mongoose connected to MongoDB');
      this.isConnected = true;
    });

    mongoose.connection.on('error', (err) => {
      console.error('❌ Mongoose connection error:', err);
      this.isConnected = false;
    });

    mongoose.connection.on('disconnected', () => {
      console.log('🔌 Mongoose disconnected from MongoDB');
      this.isConnected = false;
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await this.disconnect();
      process.exit(0);
    });
  }

  async disconnect() {
    try {
      await mongoose.connection.close();
      console.log('🔌 MongoDB connection closed');
    } catch (error) {
      console.error('❌ Error closing MongoDB connection:', error);
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Fallback to in-memory storage if MongoDB is not available
  async connectWithFallback(mongoUri) {
    const result = await this.connect(mongoUri);
    
    if (!result.success) {
      console.log('⚠️ MongoDB connection failed. Checking for alternatives...');
      
      // Try alternative local MongoDB URIs
      const fallbackUris = [
        'mongodb://127.0.0.1:27017/digital_contracts',
        'mongodb://localhost:27017/digital_contracts_dev'
      ];
      
      for (const uri of fallbackUris) {
        console.log(`🔄 Trying fallback URI: ${uri}`);
        const fallbackResult = await this.connect(uri);
        if (fallbackResult.success) {
          return fallbackResult;
        }
      }
      
      console.log('⚠️ All MongoDB connection attempts failed.');
      console.log('💡 Suggestions:');
      console.log('   1. Install MongoDB locally: https://www.mongodb.com/try/download/community');
      console.log('   2. Use MongoDB Atlas: https://www.mongodb.com/atlas');
      console.log('   3. Run the setup-database.bat script');
      console.log('   4. Check if MongoDB service is running: net start MongoDB');
      
      return { 
        success: false, 
        error: 'All MongoDB connection attempts failed',
        suggestions: [
          'Install MongoDB Community Server',
          'Use MongoDB Atlas (cloud)',
          'Run setup-database.bat script',
          'Check MongoDB service status'
        ]
      };
    }
    
    return result;
  }
}

module.exports = new DatabaseManager();
