import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Connection, PublicKey, Transaction, clusterApiUrl } from '@solana/web3.js';
import { WalletAdapter } from '@solana/wallet-adapter-base';
import {
  ConnectionProvider,
  WalletProvider,
  useConnection,
  useWallet as useSolanaWallet
} from '@solana/wallet-adapter-react';
import { WalletModalProvider, useWalletModal } from '@solana/wallet-adapter-react-ui';
import {
  PhantomWalletAdapter,
  SolflareWalletAdapter,
  TorusWalletAdapter,
} from '@solana/wallet-adapter-wallets';
import websocketService from '@/services/websocketService';
import { validateWalletStorage, safeSetWalletStorage, safeGetWalletStorage, safeRemoveWalletStorage } from '@/utils/walletStorageUtils';

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

interface WalletContextType {
  wallet: WalletAdapter | null;
  publicKey: PublicKey | null;
  connected: boolean;
  connecting: boolean;
  isConnected: boolean;
  balance: number | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  signTransaction: (transaction: Transaction) => Promise<Transaction>;
  signAllTransactions: (transactions: Transaction[]) => Promise<Transaction[]>;
  sendTransaction: (transaction: Transaction) => Promise<string>;
  connection: Connection;
  websocketConnected: boolean;
  solanaStatus: any;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = (): WalletContextType => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider. Make sure your component is wrapped with WalletProviderWrapper.');
  }
  return context;
};

interface WalletContextProviderProps {
  children: ReactNode;
}

// Helper function to safely clear corrupted localStorage
const clearCorruptedWalletData = () => {
  validateWalletStorage();
};

const WalletContextProvider: React.FC<WalletContextProviderProps> = ({ children }) => {
  const { connection } = useConnection();
  const {
    wallet,
    publicKey,
    connected,
    connecting,
    connect: solanaConnect,
    disconnect: solanaDisconnect,
    signTransaction,
    signAllTransactions,
    sendTransaction,
  } = useSolanaWallet();
  const { setVisible } = useWalletModal();

  // Debug logging
  React.useEffect(() => {
    console.log('🔧 WalletContextProvider initialized', {
      connected,
      publicKey: publicKey?.toString(),
      wallet: wallet?.adapter?.name
    });
  }, [connected, publicKey, wallet]);

  const [balance, setBalance] = useState<number | null>(null);
  const [autoConnectAttempted, setAutoConnectAttempted] = useState(false);
  const [websocketConnected, setWebsocketConnected] = useState(false);
  const [solanaStatus, setSolanaStatus] = useState<any>(null);

  // Clear any corrupted localStorage data on mount
  useEffect(() => {
    clearCorruptedWalletData();
  }, []);

  // Initialize WebSocket connection
  useEffect(() => {
    const initializeWebSocket = async () => {
      try {
        await websocketService.connect();
        console.log('✅ WebSocket service connected');
      } catch (error) {
        console.error('❌ Failed to connect WebSocket service:', error);
      }
    };

    initializeWebSocket();

    // Set up WebSocket event listeners
    const handleConnectionStatus = (data: any) => {
      setWebsocketConnected(data.connected);
      if (data.solanaStatus) {
        setSolanaStatus(data.solanaStatus);
      }
    };

    const handleBalanceUpdate = (data: any) => {
      if (publicKey && data.publicKey === publicKey.toString()) {
        setBalance(data.balance);
      }
    };

    const handleSolanaStatusUpdate = (data: any) => {
      setSolanaStatus(data.status);
    };

    websocketService.on('connection_status', handleConnectionStatus);
    websocketService.on('balance_update', handleBalanceUpdate);
    websocketService.on('solana_status_update', handleSolanaStatusUpdate);

    return () => {
      websocketService.off('connection_status', handleConnectionStatus);
      websocketService.off('balance_update', handleBalanceUpdate);
      websocketService.off('solana_status_update', handleSolanaStatusUpdate);
    };
  }, []);

  // Auto-connect wallet on page load with improved reliability
  useEffect(() => {
    const autoConnect = async () => {
      let storedWalletName = null;
      let wasConnected = false;

      try {
        storedWalletName = safeGetWalletStorage('walletName');
        wasConnected = safeGetWalletStorage('walletConnected') === 'true';
      } catch (error) {
        console.warn('Error reading wallet localStorage:', error);
        clearCorruptedWalletData();
      }

      // Only auto-connect if user was previously connected and wallet is available
      if (!autoConnectAttempted && !connected && !connecting && storedWalletName && wasConnected) {
        setAutoConnectAttempted(true);
        try {
          console.log('🔄 Attempting auto-connect to previously used wallet:', storedWalletName);

          // If no wallet is selected, try to select the stored one first
          if (!wallet) {
            const wallets = [
              new PhantomWalletAdapter(),
              new SolflareWalletAdapter(),
              new TorusWalletAdapter(),
            ];
            const targetWallet = wallets.find(w => w.name === storedWalletName);
            if (targetWallet) {
              // This would require access to the select function from useWallet
              console.log('🎯 Found target wallet, attempting to select:', targetWallet.name);
            }
          }

          await solanaConnect();
          console.log('✅ Auto-connect successful');
          localStorage.setItem('walletConnected', 'true');
        } catch (error) {
          console.log('❌ Auto-connect failed:', error);
          // Clear stored connection state if auto-connect fails
          try {
            localStorage.removeItem('walletConnected');
          } catch (storageError) {
            console.warn('Error clearing wallet connection state:', storageError);
          }
          // Don't clear walletName immediately, user might want to reconnect manually
        }
      } else {
        setAutoConnectAttempted(true);
      }
    };

    // Longer delay to ensure wallet adapters are fully ready
    const timer = setTimeout(autoConnect, 1500);
    return () => clearTimeout(timer);
  }, [wallet, connected, connecting, autoConnectAttempted, solanaConnect]);

  // Handle wallet connection state changes
  useEffect(() => {
    if (connected && publicKey) {
      // Update localStorage when wallet connects
      if (wallet?.adapter?.name) {
        try {
          localStorage.setItem('walletName', wallet.adapter.name);
          localStorage.setItem('walletConnected', 'true');
          console.log('💾 Updated wallet connection state:', wallet.adapter.name);
        } catch (error) {
          console.warn('Error updating wallet connection state:', error);
        }
      }
    } else if (!connected) {
      // Clear connection state when wallet disconnects
      try {
        localStorage.removeItem('walletConnected');
        console.log('🗑️ Cleared wallet connection state on disconnect');
      } catch (error) {
        console.warn('Error clearing wallet connection state on disconnect:', error);
      }
    }
  }, [connected, publicKey, wallet]);

  // Handle wallet connection to WebSocket
  useEffect(() => {
    if (connected && publicKey && websocketConnected) {
      try {
        websocketService.connectWallet(publicKey.toString());
        console.log('✅ Wallet connected to WebSocket service');
      } catch (error) {
        console.error('❌ Failed to connect wallet to WebSocket:', error);
      }
    } else if (!connected && publicKey && websocketConnected) {
      try {
        websocketService.disconnectWallet(publicKey.toString());
        console.log('✅ Wallet disconnected from WebSocket service');
      } catch (error) {
        console.error('❌ Failed to disconnect wallet from WebSocket:', error);
      }
    }
  }, [connected, publicKey, websocketConnected]);

  const connect = async () => {
    try {
      // Check if a wallet is selected
      if (!wallet) {
        // Show wallet selection modal
        setVisible(true);
        return;
      }
      await solanaConnect();
      // Store wallet name and connection state for auto-connect next time
      if (wallet?.adapter?.name) {
        try {
          localStorage.setItem('walletName', wallet.adapter.name);
          localStorage.setItem('walletConnected', 'true');
          console.log('💾 Stored wallet connection state:', wallet.adapter.name);
        } catch (error) {
          console.warn('Error storing wallet connection state:', error);
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      // Clear connection state on error
      try {
        localStorage.removeItem('walletConnected');
      } catch (error) {
        console.warn('Error clearing wallet connection state:', error);
      }
      // If connection fails due to no wallet selected, show modal
      if (error.name === 'WalletNotSelectedError') {
        setVisible(true);
        return;
      }
      throw error;
    }
  };

  const disconnect = async () => {
    try {
      await solanaDisconnect();
      setBalance(null);
      // Clear stored wallet connection state
      try {
        localStorage.removeItem('walletName');
        localStorage.removeItem('walletConnected');
        console.log('🗑️ Cleared wallet connection state');
      } catch (error) {
        console.warn('Error clearing wallet connection state:', error);
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      // Clear state even if disconnect fails
      try {
        localStorage.removeItem('walletConnected');
      } catch (error) {
        console.warn('Error clearing wallet connection state on error:', error);
      }
      throw error;
    }
  };

  const contextValue: WalletContextType = {
    wallet,
    publicKey,
    connected,
    connecting,
    isConnected: connected,
    balance,
    connect,
    disconnect,
    signTransaction: signTransaction || (() => Promise.reject(new Error('signTransaction not available'))),
    signAllTransactions: signAllTransactions || (() => Promise.reject(new Error('signAllTransactions not available'))),
    sendTransaction: sendTransaction || (() => Promise.reject(new Error('sendTransaction not available'))),
    connection,
    websocketConnected,
    solanaStatus,
  };

  // Debug logging for context value
  React.useEffect(() => {
    console.log('🔧 WalletContext value updated:', {
      connected: contextValue.connected,
      publicKey: contextValue.publicKey?.toString(),
      wallet: contextValue.wallet?.adapter?.name
    });
  }, [contextValue.connected, contextValue.publicKey, contextValue.wallet]);

  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

// Main provider component that wraps the entire app
interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProviderWrapper: React.FC<WalletProviderProps> = ({ children }) => {
  // Configure supported wallets
  const wallets = [
    new PhantomWalletAdapter(),
    new SolflareWalletAdapter(),
    new TorusWalletAdapter(),
  ];

  // Use multiple RPC endpoints for better reliability
  const getEndpoint = () => {
    if (process.env.NODE_ENV === 'production') {
      return clusterApiUrl('mainnet-beta');
    }

    // For development, try multiple devnet endpoints
    const devnetEndpoints = [
      'https://api.devnet.solana.com',
      'https://devnet.helius-rpc.com',
      'https://rpc-devnet.helius.xyz',
      clusterApiUrl('devnet')
    ];

    // Return the first endpoint (can be enhanced to test connectivity)
    return devnetEndpoints[0];
  };

  const endpoint = getEndpoint();

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect={false}>
        <WalletModalProvider>
          <WalletContextProvider>
            {children}
          </WalletContextProvider>
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

export default WalletContextProvider;
