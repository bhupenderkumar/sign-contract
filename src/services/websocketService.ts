import { io, Socket } from 'socket.io-client';

interface BalanceUpdate {
  publicKey: string;
  balance: number;
  lamports: number;
  timestamp: number;
}

interface TransactionUpdate {
  signature: string;
  status: string;
  timestamp: number;
}

interface SolanaStatus {
  [key: string]: {
    endpoint: string;
    healthy: boolean;
    errors: number;
    lastCheck: number;
    latency: number | null;
  };
}

interface ConnectionStatus {
  connected: boolean;
  socketId?: string;
  solanaStatus?: SolanaStatus;
}

class WebSocketService {
  private socket: Socket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private listeners: Map<string, Set<Function>> = new Map();
  private isConnecting = false;

  constructor() {
    this.initializeEventListeners();
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.socket?.connected) {
        resolve();
        return;
      }

      if (this.isConnecting) {
        // Wait for existing connection attempt
        const checkConnection = () => {
          if (this.socket?.connected) {
            resolve();
          } else if (!this.isConnecting) {
            reject(new Error('Connection failed'));
          } else {
            setTimeout(checkConnection, 100);
          }
        };
        checkConnection();
        return;
      }

      this.isConnecting = true;

      try {
        const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001';
        
        this.socket = io(backendUrl, {
          transports: ['websocket', 'polling'],
          timeout: 10000,
          forceNew: true,
        });

        this.socket.on('connect', () => {
          console.log('🔗 WebSocket connected:', this.socket?.id);
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.emit('connection_status', { connected: true, socketId: this.socket?.id });
          resolve();
        });

        this.socket.on('connect_error', (error) => {
          console.error('🔌 WebSocket connection error:', error);
          this.isConnecting = false;
          this.handleReconnect();
          reject(error);
        });

        this.socket.on('disconnect', (reason) => {
          console.log('🔌 WebSocket disconnected:', reason);
          this.isConnecting = false;
          this.emit('connection_status', { connected: false });
          
          if (reason === 'io server disconnect') {
            // Server initiated disconnect, don't reconnect automatically
            return;
          }
          
          this.handleReconnect();
        });

        this.setupEventHandlers();

      } catch (error) {
        this.isConnecting = false;
        console.error('Failed to create WebSocket connection:', error);
        reject(error);
      }
    });
  }

  private handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('Max reconnection attempts reached');
      this.emit('connection_error', { error: 'Max reconnection attempts reached' });
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1); // Exponential backoff

    console.log(`Attempting to reconnect in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    setTimeout(() => {
      this.connect().catch(error => {
        console.error('Reconnection failed:', error);
      });
    }, delay);
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    // Balance updates
    this.socket.on('balance_update', (data: BalanceUpdate) => {
      this.emit('balance_update', data);
    });

    // Transaction updates
    this.socket.on('transaction_update', (data: TransactionUpdate) => {
      this.emit('transaction_update', data);
    });

    // Solana status updates
    this.socket.on('solana_status_update', (data: { status: SolanaStatus; timestamp: number }) => {
      this.emit('solana_status_update', data);
    });

    // Connection status
    this.socket.on('connection_status', (data: ConnectionStatus) => {
      this.emit('connection_status', data);
    });

    // Error handling
    this.socket.on('wallet_error', (data: { error: string; type: string }) => {
      this.emit('wallet_error', data);
    });

    this.socket.on('balance_error', (data: { error: string; publicKey: string }) => {
      this.emit('balance_error', data);
    });

    // Pong response for health checks
    this.socket.on('pong', (data: { timestamp: number }) => {
      this.emit('pong', data);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  // Wallet operations
  connectWallet(publicKey: string) {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }
    
    this.socket.emit('wallet_connect', { publicKey });
  }

  disconnectWallet(publicKey: string) {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }
    
    this.socket.emit('wallet_disconnect', { publicKey });
  }

  // Solana operations
  getBalance(publicKey: string) {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }
    
    this.socket.emit('get_balance', { publicKey });
  }

  getTransaction(signature: string) {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }
    
    this.socket.emit('get_transaction', { signature });
  }

  getAccountInfo(publicKey: string) {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }
    
    this.socket.emit('get_account_info', { publicKey });
  }

  getSolanaStatus() {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }
    
    this.socket.emit('get_solana_status');
  }

  // Health check
  ping() {
    if (!this.socket?.connected) {
      throw new Error('WebSocket not connected');
    }
    
    this.socket.emit('ping');
  }

  // Event system
  private initializeEventListeners() {
    this.listeners.set('connection_status', new Set());
    this.listeners.set('balance_update', new Set());
    this.listeners.set('transaction_update', new Set());
    this.listeners.set('solana_status_update', new Set());
    this.listeners.set('wallet_error', new Set());
    this.listeners.set('balance_error', new Set());
    this.listeners.set('connection_error', new Set());
    this.listeners.set('pong', new Set());
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(callback);
    }
  }

  private emit(event: string, data: any) {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in event listener for ${event}:`, error);
        }
      });
    }
  }

  // Utility methods
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }

  getConnectionState(): 'connected' | 'connecting' | 'disconnected' {
    if (this.socket?.connected) return 'connected';
    if (this.isConnecting) return 'connecting';
    return 'disconnected';
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
