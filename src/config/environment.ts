// Environment configuration for Solana network selection
export type SolanaNetwork = 'devnet' | 'testnet' | 'mainnet-beta';

export interface NetworkConfig {
  name: string;
  displayName: string;
  cluster: SolanaNetwork;
  rpcUrl: string;
  wsUrl?: string;
  explorerUrl: string;
  color: string;
  isProduction: boolean;
}

export const NETWORK_CONFIGS: Record<SolanaNetwork, NetworkConfig> = {
  'devnet': {
    name: 'devnet',
    displayName: 'Devnet',
    cluster: 'devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    color: 'bg-blue-500',
    isProduction: false,
  },
  'testnet': {
    name: 'testnet',
    displayName: 'Testnet',
    cluster: 'testnet',
    rpcUrl: 'https://api.testnet.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    color: 'bg-yellow-500',
    isProduction: false,
  },
  'mainnet-beta': {
    name: 'mainnet-beta',
    displayName: 'Mainnet',
    cluster: 'mainnet-beta',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    color: 'bg-green-500',
    isProduction: true,
  },
};

// Get current network from environment variables
export const getCurrentNetwork = (): SolanaNetwork => {
  const envNetwork = import.meta.env.VITE_SOLANA_CLUSTER as SolanaNetwork;
  
  // Validate the network
  if (envNetwork && Object.keys(NETWORK_CONFIGS).includes(envNetwork)) {
    return envNetwork;
  }
  
  // Default to devnet for development
  console.warn(`Invalid or missing VITE_SOLANA_CLUSTER: ${envNetwork}. Defaulting to devnet.`);
  return 'devnet';
};

// Get network configuration
export const getNetworkConfig = (network?: SolanaNetwork): NetworkConfig => {
  const targetNetwork = network || getCurrentNetwork();
  return NETWORK_CONFIGS[targetNetwork];
};

// Get API base URL
export const getApiBaseUrl = (): string => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001';
};

// Environment validation
export const validateEnvironment = (): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  // Check required environment variables
  const requiredVars = ['VITE_API_URL', 'VITE_SOLANA_CLUSTER'];
  
  for (const varName of requiredVars) {
    if (!import.meta.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }
  
  // Validate network
  const network = import.meta.env.VITE_SOLANA_CLUSTER;
  if (network && !Object.keys(NETWORK_CONFIGS).includes(network)) {
    errors.push(`Invalid VITE_SOLANA_CLUSTER: ${network}. Must be one of: ${Object.keys(NETWORK_CONFIGS).join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Development mode check
export const isDevelopment = (): boolean => {
  return import.meta.env.DEV;
};

// Production mode check
export const isProduction = (): boolean => {
  return import.meta.env.PROD;
};

// Get environment info for debugging
export const getEnvironmentInfo = () => {
  const network = getCurrentNetwork();
  const config = getNetworkConfig(network);
  
  return {
    mode: import.meta.env.MODE,
    isDev: isDevelopment(),
    isProd: isProduction(),
    network,
    config,
    apiUrl: getApiBaseUrl(),
    validation: validateEnvironment(),
  };
};
