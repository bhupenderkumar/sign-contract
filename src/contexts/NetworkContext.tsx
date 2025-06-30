import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { 
  SolanaNetwork, 
  NetworkConfig, 
  getCurrentNetwork, 
  getNetworkConfig,
  validateEnvironment 
} from '@/config/environment';
import { useToast } from '@/components/ui/use-toast';

interface NetworkContextType {
  currentNetwork: SolanaNetwork;
  networkConfig: NetworkConfig;
  isChangingNetwork: boolean;
  environmentValid: boolean;
  environmentErrors: string[];
  changeNetwork: (network: SolanaNetwork) => Promise<void>;
  refreshNetworkStatus: () => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = (): NetworkContextType => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

interface NetworkProviderProps {
  children: ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [currentNetwork, setCurrentNetwork] = useState<SolanaNetwork>(getCurrentNetwork());
  const [isChangingNetwork, setIsChangingNetwork] = useState(false);
  const [environmentValid, setEnvironmentValid] = useState(true);
  const [environmentErrors, setEnvironmentErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const networkConfig = getNetworkConfig(currentNetwork);

  // Validate environment on mount
  useEffect(() => {
    const validation = validateEnvironment();
    setEnvironmentValid(validation.isValid);
    setEnvironmentErrors(validation.errors);

    if (!validation.isValid) {
      console.error('Environment validation failed:', validation.errors);
      toast({
        title: "Environment Configuration Error",
        description: "Some environment variables are missing or invalid. Check console for details.",
        variant: "destructive",
      });
    }
  }, [toast]);

  // Listen for environment changes (useful for development)
  useEffect(() => {
    const handleStorageChange = () => {
      const newNetwork = getCurrentNetwork();
      if (newNetwork !== currentNetwork) {
        setCurrentNetwork(newNetwork);
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [currentNetwork]);

  const changeNetwork = async (network: SolanaNetwork): Promise<void> => {
    if (network === currentNetwork) {
      return;
    }

    setIsChangingNetwork(true);

    try {
      const newConfig = getNetworkConfig(network);
      
      // Show warning for production networks
      if (newConfig.isProduction && !networkConfig.isProduction) {
        toast({
          title: "⚠️ Switching to Production Network",
          description: `You are switching to ${newConfig.displayName}. Real SOL will be used for transactions.`,
          variant: "destructive",
        });
      }

      // Update the network
      setCurrentNetwork(network);

      // Store the preference (optional - for persistence across sessions)
      try {
        localStorage.setItem('preferred_solana_network', network);
      } catch (error) {
        console.warn('Failed to store network preference:', error);
      }

      toast({
        title: "Network Changed",
        description: `Successfully switched to ${newConfig.displayName}`,
        variant: "default",
      });

    } catch (error) {
      console.error('Error changing network:', error);
      toast({
        title: "Network Change Failed",
        description: "Failed to switch networks. Please try again.",
        variant: "destructive",
      });
      throw error;
    } finally {
      setIsChangingNetwork(false);
    }
  };

  const refreshNetworkStatus = () => {
    const validation = validateEnvironment();
    setEnvironmentValid(validation.isValid);
    setEnvironmentErrors(validation.errors);
    
    const newNetwork = getCurrentNetwork();
    if (newNetwork !== currentNetwork) {
      setCurrentNetwork(newNetwork);
    }
  };

  const contextValue: NetworkContextType = {
    currentNetwork,
    networkConfig,
    isChangingNetwork,
    environmentValid,
    environmentErrors,
    changeNetwork,
    refreshNetworkStatus,
  };

  return (
    <NetworkContext.Provider value={contextValue}>
      {children}
    </NetworkContext.Provider>
  );
};

// Hook for components that need network-aware API calls
export const useNetworkAwareApi = () => {
  const { currentNetwork, networkConfig } = useNetwork();

  const makeApiCall = async (endpoint: string, options: RequestInit = {}) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
    
    // Add network parameter to all API calls
    const url = new URL(`${apiUrl}${endpoint}`);
    url.searchParams.set('network', currentNetwork);

    const response = await fetch(url.toString(), {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'X-Solana-Network': currentNetwork,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API call failed: ${response.status} ${response.statusText}`);
    }

    return response.json();
  };

  return {
    currentNetwork,
    networkConfig,
    makeApiCall,
  };
};

export default NetworkProvider;
