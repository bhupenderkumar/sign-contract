
import React, { createContext, useContext, useState, useEffect } from 'react';

interface WalletInfo {
  publicKey: string;
  balance: number;
  network: string;
  transactions: number;
  stakingRewards: number;
  connectedAt: Date;
}

interface WalletContextType {
  isConnected: boolean;
  walletInfo: WalletInfo | null;
  connectWallet: (publicKey: string) => Promise<void>;
  disconnectWallet: () => void;
  isLoading: boolean;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

// Mock function to simulate fetching wallet data
const fetchWalletData = async (publicKey: string): Promise<WalletInfo> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return {
    publicKey,
    balance: Math.random() * 1000 + 100,
    network: 'Mainnet',
    transactions: Math.floor(Math.random() * 500) + 50,
    stakingRewards: Math.random() * 50 + 10,
    connectedAt: new Date()
  };
};

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for saved wallet connection on mount
    const savedWallet = localStorage.getItem('connectedWallet');
    if (savedWallet) {
      const walletData = JSON.parse(savedWallet);
      setWalletInfo(walletData);
      setIsConnected(true);
    }
  }, []);

  const connectWallet = async (publicKey: string) => {
    setIsLoading(true);
    try {
      const walletData = await fetchWalletData(publicKey);
      setWalletInfo(walletData);
      setIsConnected(true);
      
      // Save to localStorage
      localStorage.setItem('connectedWallet', JSON.stringify(walletData));
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const disconnectWallet = () => {
    setWalletInfo(null);
    setIsConnected(false);
    localStorage.removeItem('connectedWallet');
  };

  return (
    <WalletContext.Provider value={{
      isConnected,
      walletInfo,
      connectWallet,
      disconnectWallet,
      isLoading
    }}>
      {children}
    </WalletContext.Provider>
  );
};
