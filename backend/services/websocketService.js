const { Server } = require('socket.io');
const solanaService = require('./solanaService');
const { validateNetworkParameter, getNetworkConfig } = require('../config/environment');

class WebSocketService {
  constructor() {
    this.io = null;
    this.connectedClients = new Map();
    this.setupSolanaEventListeners();
  }

  initialize(server) {
    this.io = new Server(server, {
      cors: {
        origin: process.env.FRONTEND_URL || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.setupSocketHandlers();
    console.log('🔌 WebSocket service initialized');
  }

  setupSocketHandlers() {
    this.io.on('connection', (socket) => {
      console.log(`🔗 Client connected: ${socket.id}`);
      
      this.connectedClients.set(socket.id, {
        connectedAt: Date.now(),
        subscriptions: new Set()
      });

      // Send initial connection status
      socket.emit('connection_status', {
        connected: true,
        socketId: socket.id,
        solanaStatus: solanaService.getConnectionStatus()
      });

      // Handle wallet connection
      socket.on('wallet_connect', async (data) => {
        try {
          const { publicKey, network } = data;

          // Validate network parameter
          let validatedNetwork;
          try {
            validatedNetwork = validateNetworkParameter(network);
          } catch (error) {
            socket.emit('error', { message: error.message });
            return;
          }

          const networkConfig = getNetworkConfig(validatedNetwork);
          console.log(`👛 Wallet connected: ${publicKey} on ${networkConfig.displayName} (Socket: ${socket.id})`);

          // Store wallet info for this socket
          const clientInfo = this.connectedClients.get(socket.id);
          if (clientInfo) {
            clientInfo.publicKey = publicKey;
            clientInfo.network = validatedNetwork;
            clientInfo.networkConfig = networkConfig;
            clientInfo.subscriptions.add(`balance_${publicKey}`);
          }

          // Subscribe to balance updates
          solanaService.subscribeToBalance(publicKey, socket.id);

          // Get initial balance
          const balance = await solanaService.getBalance(publicKey);

          socket.emit('wallet_connected', {
            publicKey,
            balance,
            network: validatedNetwork,
            networkConfig,
            timestamp: Date.now()
          });

        } catch (error) {
          console.error('Error handling wallet connection:', error);
          socket.emit('wallet_error', {
            error: error.message,
            type: 'connection_failed'
          });
        }
      });

      // Handle wallet disconnection
      socket.on('wallet_disconnect', (data) => {
        try {
          const { publicKey } = data;
          console.log(`👛 Wallet disconnected: ${publicKey} (Socket: ${socket.id})`);
          
          // Unsubscribe from balance updates
          solanaService.unsubscribeFromBalance(publicKey, socket.id);
          
          // Update client info
          const clientInfo = this.connectedClients.get(socket.id);
          if (clientInfo) {
            clientInfo.publicKey = null;
            clientInfo.subscriptions.delete(`balance_${publicKey}`);
          }

          socket.emit('wallet_disconnected', {
            publicKey,
            timestamp: Date.now()
          });

        } catch (error) {
          console.error('Error handling wallet disconnection:', error);
          socket.emit('wallet_error', {
            error: error.message,
            type: 'disconnection_failed'
          });
        }
      });

      // Handle balance requests
      socket.on('get_balance', async (data) => {
        try {
          const { publicKey } = data;
          const balance = await solanaService.getBalance(publicKey);
          
          socket.emit('balance_response', {
            publicKey,
            balance,
            timestamp: Date.now()
          });

        } catch (error) {
          console.error('Error getting balance:', error);
          socket.emit('balance_error', {
            error: error.message,
            publicKey: data.publicKey
          });
        }
      });

      // Handle transaction requests
      socket.on('get_transaction', async (data) => {
        try {
          const { signature } = data;
          const transaction = await solanaService.getTransaction(signature);
          
          socket.emit('transaction_response', {
            signature,
            transaction,
            timestamp: Date.now()
          });

        } catch (error) {
          console.error('Error getting transaction:', error);
          socket.emit('transaction_error', {
            error: error.message,
            signature: data.signature
          });
        }
      });

      // Handle account info requests
      socket.on('get_account_info', async (data) => {
        try {
          const { publicKey } = data;
          const accountInfo = await solanaService.getAccountInfo(publicKey);
          
          socket.emit('account_info_response', {
            publicKey,
            accountInfo,
            timestamp: Date.now()
          });

        } catch (error) {
          console.error('Error getting account info:', error);
          socket.emit('account_info_error', {
            error: error.message,
            publicKey: data.publicKey
          });
        }
      });

      // Handle Solana status requests
      socket.on('get_solana_status', () => {
        socket.emit('solana_status', {
          status: solanaService.getConnectionStatus(),
          timestamp: Date.now()
        });
      });

      // Handle ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong', { timestamp: Date.now() });
      });

      // Handle contract pricing requests
      socket.on('request_contract_pricing', async (data) => {
        try {
          const { contractData, publicKey } = data;

          // Verify wallet is connected for this socket
          const clientInfo = this.connectedClients.get(socket.id);
          if (!clientInfo || clientInfo.publicKey !== publicKey) {
            socket.emit('contract_pricing_error', {
              error: 'Wallet not connected or public key mismatch',
              publicKey
            });
            return;
          }

          console.log(`💰 Contract pricing requested by: ${publicKey} (Socket: ${socket.id})`);

          // Calculate pricing based on contract complexity
          const pricing = this.calculateContractPricing(contractData);

          socket.emit('contract_pricing_response', {
            publicKey,
            pricing,
            contractData: {
              title: contractData.contractTitle,
              description: contractData.contractDescription,
              useBlockchain: contractData.useBlockchain
            },
            timestamp: Date.now()
          });

        } catch (error) {
          console.error('Error handling contract pricing request:', error);
          socket.emit('contract_pricing_error', {
            error: error.message,
            publicKey: data.publicKey
          });
        }
      });

      // Handle contract creation requests
      socket.on('create_contract', async (data) => {
        try {
          const { contractData, publicKey } = data;

          // Verify wallet is connected for this socket
          const clientInfo = this.connectedClients.get(socket.id);
          if (!clientInfo || clientInfo.publicKey !== publicKey) {
            socket.emit('contract_creation_error', {
              error: 'Wallet not connected or public key mismatch',
              publicKey
            });
            return;
          }

          console.log(`📄 Contract creation requested by: ${publicKey} (Socket: ${socket.id})`);

          // Process contract creation
          const contractResult = await this.processContractCreation(contractData, publicKey);

          socket.emit('contract_created', {
            publicKey,
            contractId: contractResult.contractId,
            contractData: contractResult.contractData,
            timestamp: Date.now()
          });

        } catch (error) {
          console.error('Error handling contract creation:', error);
          socket.emit('contract_creation_error', {
            error: error.message,
            publicKey: data.publicKey
          });
        }
      });

      // Handle contract signing requests
      socket.on('sign_contract', async (data) => {
        try {
          const { contractId, publicKey, signature } = data;

          // Verify wallet is connected for this socket
          const clientInfo = this.connectedClients.get(socket.id);
          if (!clientInfo || clientInfo.publicKey !== publicKey) {
            socket.emit('contract_signing_error', {
              error: 'Wallet not connected or public key mismatch',
              publicKey
            });
            return;
          }

          console.log(`✍️ Contract signing requested by: ${publicKey} for contract: ${contractId} (Socket: ${socket.id})`);

          // Process contract signing
          const signingResult = await this.processContractSigning(contractId, publicKey, signature);

          socket.emit('contract_signed', {
            publicKey,
            contractId,
            signature,
            signingResult,
            timestamp: Date.now()
          });

        } catch (error) {
          console.error('Error handling contract signing:', error);
          socket.emit('contract_signing_error', {
            error: error.message,
            publicKey: data.publicKey,
            contractId: data.contractId
          });
        }
      });

      // Handle disconnection
      socket.on('disconnect', (reason) => {
        console.log(`🔌 Client disconnected: ${socket.id} (Reason: ${reason})`);
        
        // Clean up subscriptions
        solanaService.unsubscribeAll(socket.id);
        
        // Remove client info
        this.connectedClients.delete(socket.id);
      });

      // Handle errors
      socket.on('error', (error) => {
        console.error(`Socket error for ${socket.id}:`, error);
      });
    });
  }

  setupSolanaEventListeners() {
    // Listen for balance updates from Solana service
    solanaService.on('balanceUpdate', (data) => {
      this.broadcastBalanceUpdate(data);
    });

    // Listen for transaction confirmations
    solanaService.on('transactionConfirmed', (data) => {
      this.broadcastTransactionUpdate(data);
    });

    // Listen for connection status changes
    solanaService.on('connectionStatusChanged', (data) => {
      this.broadcastConnectionStatus(data);
    });
  }

  broadcastBalanceUpdate(data) {
    const { publicKey, balance, lamports } = data;
    
    // Find all clients subscribed to this public key
    for (const [socketId, clientInfo] of this.connectedClients.entries()) {
      if (clientInfo.publicKey === publicKey) {
        const socket = this.io.sockets.sockets.get(socketId);
        if (socket) {
          socket.emit('balance_update', {
            publicKey,
            balance,
            lamports,
            timestamp: Date.now()
          });
        }
      }
    }
  }

  broadcastTransactionUpdate(data) {
    this.io.emit('transaction_update', {
      ...data,
      timestamp: Date.now()
    });
  }

  broadcastConnectionStatus(data) {
    this.io.emit('solana_status_update', {
      ...data,
      timestamp: Date.now()
    });
  }

  // Utility methods
  getConnectedClients() {
    return Array.from(this.connectedClients.entries()).map(([socketId, info]) => ({
      socketId,
      ...info
    }));
  }

  getClientCount() {
    return this.connectedClients.size;
  }

  broadcastToAll(event, data) {
    this.io.emit(event, {
      ...data,
      timestamp: Date.now()
    });
  }

  sendToClient(socketId, event, data) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit(event, {
        ...data,
        timestamp: Date.now()
      });
    }
  }

  // Helper methods for contract operations
  calculateContractPricing(contractData) {
    // Base pricing calculation
    let baseFee = 0.01; // 0.01 SOL base fee
    let complexityMultiplier = 1;

    // Adjust pricing based on contract complexity
    if (contractData.useBlockchain) {
      baseFee += 0.005; // Additional fee for blockchain deployment
    }

    if (contractData.useMediator) {
      complexityMultiplier += 0.5; // 50% increase for mediation
    }

    if (contractData.structuredClauses && contractData.structuredClauses.length > 5) {
      complexityMultiplier += 0.2; // 20% increase for complex contracts
    }

    const totalFee = baseFee * complexityMultiplier;

    return {
      baseFee,
      complexityMultiplier,
      totalFee,
      currency: 'SOL',
      breakdown: {
        baseFee: baseFee,
        blockchainFee: contractData.useBlockchain ? 0.005 : 0,
        mediationFee: contractData.useMediator ? baseFee * 0.5 : 0,
        complexityFee: contractData.structuredClauses?.length > 5 ? baseFee * 0.2 : 0
      }
    };
  }

  async processContractCreation(contractData, publicKey) {
    // Generate unique contract ID
    const contractId = `contract_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Process contract data
    const processedContract = {
      contractId,
      ...contractData,
      createdBy: publicKey,
      createdAt: new Date().toISOString(),
      status: 'pending_signatures',
      signatures: []
    };

    // In a real implementation, this would save to database
    console.log('📄 Contract created:', contractId);

    return {
      contractId,
      contractData: processedContract
    };
  }

  async processContractSigning(contractId, publicKey, signature) {
    // In a real implementation, this would:
    // 1. Verify the signature
    // 2. Update the contract in database
    // 3. Check if all parties have signed
    // 4. Trigger contract finalization if complete

    console.log('✍️ Contract signed:', contractId, 'by:', publicKey);

    return {
      success: true,
      signedAt: new Date().toISOString(),
      signatureVerified: true // In real implementation, verify the signature
    };
  }
}

module.exports = new WebSocketService();
