const { Server } = require('socket.io');
const solanaService = require('./solanaService');

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
          const { publicKey } = data;
          console.log(`👛 Wallet connected: ${publicKey} (Socket: ${socket.id})`);
          
          // Store wallet info for this socket
          const clientInfo = this.connectedClients.get(socket.id);
          if (clientInfo) {
            clientInfo.publicKey = publicKey;
            clientInfo.subscriptions.add(`balance_${publicKey}`);
          }

          // Subscribe to balance updates
          solanaService.subscribeToBalance(publicKey, socket.id);
          
          // Get initial balance
          const balance = await solanaService.getBalance(publicKey);
          
          socket.emit('wallet_connected', {
            publicKey,
            balance,
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
}

module.exports = new WebSocketService();
