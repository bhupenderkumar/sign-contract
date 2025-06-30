const { Connection, PublicKey, clusterApiUrl } = require('@solana/web3.js');
const EventEmitter = require('events');
const { getNetworkConfig, getCurrentNetwork } = require('../config/environment');

class SolanaService extends EventEmitter {
  constructor() {
    super();
    this.connections = new Map(); // Multiple RPC endpoints for redundancy
    this.currentConnectionIndex = 0;
    this.balanceCache = new Map(); // Cache balances to reduce RPC calls
    this.subscriptions = new Map(); // Track WebSocket subscriptions
    this.retryAttempts = 3;
    this.retryDelay = 1000; // 1 second
    
    this.initializeConnections();
    this.startHealthCheck();
  }

  initializeConnections() {
    // Get endpoints for current network
    const currentNetwork = getCurrentNetwork();
    const networkConfig = getNetworkConfig(currentNetwork);
    const endpoints = networkConfig.alternativeEndpoints || [networkConfig.rpcUrl];

    console.log(`🔗 Initializing Solana connections for ${networkConfig.displayName}`);

    endpoints.forEach((endpoint, index) => {
      try {
        const connection = new Connection(endpoint, {
          commitment: 'confirmed',
          wsEndpoint: endpoint.replace('https://', 'wss://').replace('http://', 'ws://'),
          confirmTransactionInitialTimeout: 60000,
        });
        
        this.connections.set(index, {
          connection,
          endpoint,
          healthy: true,
          lastCheck: Date.now(),
          errors: 0
        });
        
        console.log(`✅ Solana connection ${index} initialized: ${endpoint}`);
      } catch (error) {
        console.error(`❌ Failed to initialize Solana connection ${index}:`, error.message);
      }
    });
  }

  getHealthyConnection() {
    const healthyConnections = Array.from(this.connections.values())
      .filter(conn => conn.healthy)
      .sort((a, b) => a.errors - b.errors); // Prefer connections with fewer errors

    if (healthyConnections.length === 0) {
      throw new Error('No healthy Solana RPC connections available');
    }

    return healthyConnections[0].connection;
  }

  async executeWithRetry(operation, maxRetries = this.retryAttempts) {
    let lastError;
    
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const connection = this.getHealthyConnection();
        return await operation(connection);
      } catch (error) {
        lastError = error;
        console.warn(`Solana operation attempt ${attempt + 1} failed:`, error.message);
        
        // Mark current connection as unhealthy if it's a connection error
        if (error.message.includes('fetch') || error.message.includes('network')) {
          this.markConnectionUnhealthy();
        }
        
        if (attempt < maxRetries - 1) {
          await this.delay(this.retryDelay * (attempt + 1)); // Exponential backoff
        }
      }
    }
    
    throw lastError;
  }

  markConnectionUnhealthy() {
    const currentConn = this.connections.get(this.currentConnectionIndex);
    if (currentConn) {
      currentConn.healthy = false;
      currentConn.errors++;
      console.warn(`Marked connection ${this.currentConnectionIndex} as unhealthy`);
    }
  }

  async delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  async getBalance(publicKeyString) {
    try {
      // Check cache first
      const cacheKey = `balance_${publicKeyString}`;
      const cached = this.balanceCache.get(cacheKey);
      
      if (cached && Date.now() - cached.timestamp < 30000) { // 30 second cache
        return cached.balance;
      }

      const publicKey = new PublicKey(publicKeyString);
      
      const balance = await this.executeWithRetry(async (connection) => {
        return await connection.getBalance(publicKey);
      });

      const balanceInSol = balance / 1e9;
      
      // Cache the result
      this.balanceCache.set(cacheKey, {
        balance: balanceInSol,
        timestamp: Date.now()
      });

      // Emit balance update event
      this.emit('balanceUpdate', {
        publicKey: publicKeyString,
        balance: balanceInSol,
        lamports: balance
      });

      return balanceInSol;
    } catch (error) {
      console.error('Error fetching balance:', error.message);
      throw new Error(`Failed to fetch balance: ${error.message}`);
    }
  }

  async getAccountInfo(publicKeyString) {
    try {
      const publicKey = new PublicKey(publicKeyString);
      
      return await this.executeWithRetry(async (connection) => {
        return await connection.getAccountInfo(publicKey);
      });
    } catch (error) {
      console.error('Error fetching account info:', error.message);
      throw new Error(`Failed to fetch account info: ${error.message}`);
    }
  }

  async getTransaction(signature) {
    try {
      return await this.executeWithRetry(async (connection) => {
        return await connection.getTransaction(signature, {
          commitment: 'confirmed',
          maxSupportedTransactionVersion: 0
        });
      });
    } catch (error) {
      console.error('Error fetching transaction:', error.message);
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }
  }

  async getRecentBlockhash() {
    try {
      return await this.executeWithRetry(async (connection) => {
        const { blockhash } = await connection.getLatestBlockhash('confirmed');
        return blockhash;
      });
    } catch (error) {
      console.error('Error fetching recent blockhash:', error.message);
      throw new Error(`Failed to fetch recent blockhash: ${error.message}`);
    }
  }

  subscribeToBalance(publicKeyString, socketId) {
    try {
      const publicKey = new PublicKey(publicKeyString);
      const subscriptionKey = `balance_${publicKeyString}_${socketId}`;
      
      if (this.subscriptions.has(subscriptionKey)) {
        console.log(`Already subscribed to balance for ${publicKeyString}`);
        return;
      }

      // Start polling for balance updates (WebSocket subscriptions can be unreliable)
      const interval = setInterval(async () => {
        try {
          await this.getBalance(publicKeyString);
        } catch (error) {
          console.error('Error in balance subscription:', error.message);
        }
      }, 10000); // Poll every 10 seconds

      this.subscriptions.set(subscriptionKey, {
        type: 'balance',
        publicKey: publicKeyString,
        socketId,
        interval
      });

      console.log(`✅ Subscribed to balance updates for ${publicKeyString}`);
    } catch (error) {
      console.error('Error subscribing to balance:', error.message);
      throw error;
    }
  }

  unsubscribeFromBalance(publicKeyString, socketId) {
    const subscriptionKey = `balance_${publicKeyString}_${socketId}`;
    const subscription = this.subscriptions.get(subscriptionKey);
    
    if (subscription && subscription.interval) {
      clearInterval(subscription.interval);
      this.subscriptions.delete(subscriptionKey);
      console.log(`✅ Unsubscribed from balance updates for ${publicKeyString}`);
    }
  }

  unsubscribeAll(socketId) {
    const toRemove = [];
    
    for (const [key, subscription] of this.subscriptions.entries()) {
      if (subscription.socketId === socketId) {
        if (subscription.interval) {
          clearInterval(subscription.interval);
        }
        toRemove.push(key);
      }
    }
    
    toRemove.forEach(key => this.subscriptions.delete(key));
    console.log(`✅ Unsubscribed all subscriptions for socket ${socketId}`);
  }

  startHealthCheck() {
    // Check connection health every 30 seconds
    setInterval(async () => {
      for (const [index, connInfo] of this.connections.entries()) {
        try {
          const start = Date.now();
          await connInfo.connection.getSlot();
          const latency = Date.now() - start;
          
          connInfo.healthy = true;
          connInfo.lastCheck = Date.now();
          connInfo.latency = latency;
          
          // Reset error count on successful health check
          if (connInfo.errors > 0) {
            connInfo.errors = Math.max(0, connInfo.errors - 1);
          }
        } catch (error) {
          connInfo.healthy = false;
          connInfo.errors++;
          console.warn(`Health check failed for connection ${index}:`, error.message);
        }
      }
    }, 30000);
  }

  getConnectionStatus() {
    const status = {};
    
    for (const [index, connInfo] of this.connections.entries()) {
      status[index] = {
        endpoint: connInfo.endpoint,
        healthy: connInfo.healthy,
        errors: connInfo.errors,
        lastCheck: connInfo.lastCheck,
        latency: connInfo.latency || null
      };
    }
    
    return status;
  }

  clearCache() {
    this.balanceCache.clear();
    console.log('✅ Solana service cache cleared');
  }
}

module.exports = new SolanaService();
