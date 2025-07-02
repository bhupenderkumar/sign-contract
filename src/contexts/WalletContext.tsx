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
import { getCurrentNetwork, getNetworkConfig } from '@/config/environment';

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
  forceDisconnect: () => Promise<void>;
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

  // Enhanced auto-connect logic with active connection attempt
  useEffect(() => {
    if (!autoConnectAttempted) {
      const storedWalletName = safeGetWalletStorage('walletName');
      const wasConnected = safeGetWalletStorage('walletConnected') === 'true';
      const autoConnectEnabled = safeGetWalletStorage('solana-wallet-adapter-auto-connect') !== 'false';

      console.log('🔄 Auto-connect check:', {
        storedWalletName,
        wasConnected,
        autoConnectEnabled,
        currentWallet: wallet?.adapter?.name,
        connected,
        connecting
      });

      if (storedWalletName && wasConnected && autoConnectEnabled && !connected && !connecting) {
        // If wallet adapter auto-connect didn't work, try manual connection
        if (wallet && wallet.adapter.name === storedWalletName) {
          console.log('🔄 Attempting manual auto-connect to:', storedWalletName);

          // Use a small delay to ensure wallet adapter is fully initialized
          const autoConnectTimer = setTimeout(async () => {
            try {
              await solanaConnect();
              console.log('✅ Manual auto-connect successful');
            } catch (error) {
              console.warn('Manual auto-connect failed:', error);
              // Don't clear the stored connection - user can still manually connect
            }
          }, 1000);

          setAutoConnectAttempted(true);
          return () => clearTimeout(autoConnectTimer);
        } else {
          console.log('⏳ Waiting for correct wallet to be selected:', storedWalletName);
          // Don't mark as attempted yet, wait for the right wallet
          return;
        }
      }

      setAutoConnectAttempted(true);
    }
  }, [autoConnectAttempted, wallet, connected, connecting, solanaConnect]);

  // Handle successful connection (both manual and auto)
  useEffect(() => {
    if (connected && publicKey && wallet) {
      const storedWalletName = safeGetWalletStorage('walletName');
      const wasAutoConnect = storedWalletName === wallet.adapter.name;

      if (wasAutoConnect) {
        console.log('✅ Auto-connect successful via wallet adapter:', wallet.adapter.name);
      } else {
        console.log('✅ Manual connection successful:', wallet.adapter.name);
      }

      // Ensure auto-connect attempt is marked as completed
      if (!autoConnectAttempted) {
        setAutoConnectAttempted(true);
      }
    }
  }, [connected, publicKey, wallet, autoConnectAttempted]);

  // Handle wallet connection state changes and persistence
  useEffect(() => {
    if (connected && publicKey && wallet?.adapter?.name) {
      // Update localStorage when wallet connects
      try {
        localStorage.setItem('walletName', wallet.adapter.name);
        localStorage.setItem('walletConnected', 'true');

        // Also set the standard Solana wallet adapter keys for better compatibility
        localStorage.setItem('solana-wallet-adapter-auto-connect', 'true');
        localStorage.setItem('solana-wallet-adapter-wallet-name', wallet.adapter.name);

        console.log('💾 Updated wallet connection state:', wallet.adapter.name);
      } catch (error) {
        console.warn('Error updating wallet connection state:', error);
      }
    } else if (!connected && wallet === null) {
      // Only clear connection state when wallet is completely disconnected
      try {
        localStorage.removeItem('walletConnected');
        localStorage.setItem('solana-wallet-adapter-auto-connect', 'false');
        console.log('🗑️ Cleared wallet connection state on disconnect');
      } catch (error) {
        console.warn('Error clearing wallet connection state on disconnect:', error);
      }
    }
  }, [connected, publicKey, wallet]);

  // Monitor for failed auto-connect attempts (without circular dependency)
  useEffect(() => {
    // Only log failed auto-connect attempts for debugging
    if (autoConnectAttempted && !connected && !connecting) {
      const storedWalletName = safeGetWalletStorage('walletName');
      const wasConnected = safeGetWalletStorage('walletConnected') === 'true';
      const autoConnectEnabled = safeGetWalletStorage('solana-wallet-adapter-auto-connect') !== 'false';

      if (storedWalletName && wasConnected && autoConnectEnabled) {
        console.log('⚠️ Auto-connect may have failed for wallet:', storedWalletName);
        console.log('💡 User can manually reconnect using the Connect Wallet button');
      }
    }
  }, [autoConnectAttempted, connected, connecting]);

  // Handle wallet connection to WebSocket
  useEffect(() => {
    if (connected && publicKey && websocketConnected) {
      try {
        websocketService.connectWallet(publicKey.toString());
        console.log('✅ Wallet connected to WebSocket service');

        // Set up wallet-specific event listeners
        const handleWalletConnected = (data: any) => {
          if (data.publicKey === publicKey.toString()) {
            console.log('✅ Wallet connection confirmed by backend:', data);
            setBalance(data.balance || 0);
          }
        };

        const handleWalletDisconnected = (data: any) => {
          if (data.publicKey === publicKey.toString()) {
            console.log('✅ Wallet disconnection confirmed by backend:', data);
            setBalance(0);
          }
        };

        websocketService.on('wallet_connected', handleWalletConnected);
        websocketService.on('wallet_disconnected', handleWalletDisconnected);

        // Cleanup function to remove listeners
        return () => {
          websocketService.off('wallet_connected', handleWalletConnected);
          websocketService.off('wallet_disconnected', handleWalletDisconnected);
        };

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
      // Clear connection state but keep wallet name for easier reconnection
      try {
        localStorage.removeItem('walletConnected');
        localStorage.setItem('solana-wallet-adapter-auto-connect', 'false');
        console.log('🗑️ Cleared wallet connection state (keeping wallet name for easier reconnection)');
      } catch (error) {
        console.warn('Error clearing wallet connection state:', error);
      }
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      // Clear state even if disconnect fails
      try {
        localStorage.removeItem('walletConnected');
        localStorage.setItem('solana-wallet-adapter-auto-connect', 'false');
      } catch (error) {
        console.warn('Error clearing wallet connection state on error:', error);
      }
      throw error;
    }
  };

  // Force clear all wallet data (useful for troubleshooting)
  const forceDisconnect = async () => {
    try {
      await solanaDisconnect();
    } catch (error) {
      console.warn('Error during wallet disconnect:', error);
    }

    setBalance(null);

    // Clear all wallet-related localStorage
    try {
      localStorage.removeItem('walletName');
      localStorage.removeItem('walletConnected');
      localStorage.removeItem('solana-wallet-adapter-auto-connect');
      localStorage.removeItem('solana-wallet-adapter-wallet-name');
      localStorage.removeItem('solana-wallet-adapter-selected-wallet');
      console.log('🗑️ Force cleared all wallet data');
    } catch (error) {
      console.warn('Error force clearing wallet data:', error);
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
    forceDisconnect,
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

  // Use network configuration for RPC endpoints
  const getEndpoint = () => {
    const currentNetwork = getCurrentNetwork();
    const networkConfig = getNetworkConfig(currentNetwork);

    // Use the configured RPC URL for the current network
    return networkConfig.rpcUrl;
  };

  // Check if auto-connect should be enabled and ensure wallet is properly selected
  const shouldAutoConnect = () => {
    try {
      const wasConnected = localStorage.getItem('walletConnected') === 'true';
      const walletName = localStorage.getItem('walletName');
      const autoConnectEnabled = localStorage.getItem('solana-wallet-adapter-auto-connect') !== 'false';

      console.log('🔍 Auto-connect check:', { wasConnected, walletName, autoConnectEnabled });

      // Set the wallet name in the standard location for wallet adapter
      if (wasConnected && walletName && autoConnectEnabled) {
        try {
          localStorage.setItem('solana-wallet-adapter-wallet-name', walletName);
          console.log('🔧 Set wallet adapter wallet name:', walletName);
        } catch (error) {
          console.warn('Error setting wallet adapter wallet name:', error);
        }
      }

      return wasConnected && walletName && autoConnectEnabled;
    } catch (error) {
      console.warn('Error checking auto-connect state:', error);
      return false;
    }
  };

  const endpoint = getEndpoint();

  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider
        wallets={wallets}
        autoConnect={shouldAutoConnect()}
        localStorageKey="solana-wallet-adapter-wallet-name"
        onError={(error) => {
          console.error('Wallet error:', error);
          // Clear connection state if there's a persistent error
          if (error.message?.includes('User rejected') === false) {
            try {
              localStorage.removeItem('walletConnected');
              localStorage.setItem('solana-wallet-adapter-auto-connect', 'false');
            } catch (e) {
              console.warn('Error clearing wallet state:', e);
            }
          }
        }}
      >
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
