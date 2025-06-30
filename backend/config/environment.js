const { clusterApiUrl } = require('@solana/web3.js');

// Supported Solana networks
const SUPPORTED_NETWORKS = ['devnet', 'testnet', 'mainnet-beta'];

// Network configurations
const NETWORK_CONFIGS = {
  'devnet': {
    name: 'devnet',
    displayName: 'Devnet',
    cluster: 'devnet',
    rpcUrl: 'https://api.devnet.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    isProduction: false,
    alternativeEndpoints: [
      'https://api.devnet.solana.com',
      'https://devnet.helius-rpc.com',
      'https://rpc-devnet.helius.xyz',
      clusterApiUrl('devnet')
    ]
  },
  'testnet': {
    name: 'testnet',
    displayName: 'Testnet',
    cluster: 'testnet',
    rpcUrl: 'https://api.testnet.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    isProduction: false,
    alternativeEndpoints: [
      'https://api.testnet.solana.com',
      clusterApiUrl('testnet')
    ]
  },
  'mainnet-beta': {
    name: 'mainnet-beta',
    displayName: 'Mainnet',
    cluster: 'mainnet-beta',
    rpcUrl: 'https://api.mainnet-beta.solana.com',
    explorerUrl: 'https://explorer.solana.com',
    isProduction: true,
    alternativeEndpoints: [
      'https://api.mainnet-beta.solana.com',
      clusterApiUrl('mainnet-beta')
    ]
  }
};

// Get current network from environment
const getCurrentNetwork = () => {
  const envNetwork = process.env.SOLANA_CLUSTER;
  
  // Validate the network
  if (envNetwork && SUPPORTED_NETWORKS.includes(envNetwork)) {
    return envNetwork;
  }
  
  // Default to devnet for development
  console.warn(`Invalid or missing SOLANA_CLUSTER: ${envNetwork}. Defaulting to devnet.`);
  return 'devnet';
};

// Get network configuration
const getNetworkConfig = (network) => {
  const targetNetwork = network || getCurrentNetwork();
  
  if (!NETWORK_CONFIGS[targetNetwork]) {
    throw new Error(`Unsupported network: ${targetNetwork}`);
  }
  
  return NETWORK_CONFIGS[targetNetwork];
};

// Validate network parameter from request
const validateNetworkParameter = (network) => {
  if (!network) {
    return getCurrentNetwork(); // Use default if not provided
  }
  
  if (!SUPPORTED_NETWORKS.includes(network)) {
    throw new Error(`Invalid network parameter: ${network}. Supported networks: ${SUPPORTED_NETWORKS.join(', ')}`);
  }
  
  return network;
};

// Environment validation
const validateEnvironment = () => {
  const errors = [];
  
  // Check required environment variables
  const requiredVars = [
    'MONGO_URI',
    'SOLANA_CLUSTER',
    'PLATFORM_FEE_RECIPIENT_PRIVATE_KEY'
  ];
  
  for (const varName of requiredVars) {
    if (!process.env[varName]) {
      errors.push(`Missing required environment variable: ${varName}`);
    }
  }
  
  // Validate network
  const network = process.env.SOLANA_CLUSTER;
  if (network && !SUPPORTED_NETWORKS.includes(network)) {
    errors.push(`Invalid SOLANA_CLUSTER: ${network}. Must be one of: ${SUPPORTED_NETWORKS.join(', ')}`);
  }
  
  // Validate email configuration
  if (!process.env.RESEND_API_KEY) {
    errors.push('Missing required environment variable: RESEND_API_KEY');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

// Get environment info for debugging
const getEnvironmentInfo = () => {
  const network = getCurrentNetwork();
  const config = getNetworkConfig(network);
  
  return {
    nodeEnv: process.env.NODE_ENV,
    network,
    config,
    validation: validateEnvironment(),
    timestamp: new Date().toISOString()
  };
};

// Middleware to extract and validate network parameter
const networkMiddleware = (req, res, next) => {
  try {
    // Get network from query parameter, header, or use default
    const networkParam = req.query.network || req.headers['x-solana-network'];
    const validatedNetwork = validateNetworkParameter(networkParam);
    
    // Add network info to request object
    req.solanaNetwork = validatedNetwork;
    req.networkConfig = getNetworkConfig(validatedNetwork);
    
    next();
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message,
      supportedNetworks: SUPPORTED_NETWORKS
    });
  }
};

module.exports = {
  SUPPORTED_NETWORKS,
  NETWORK_CONFIGS,
  getCurrentNetwork,
  getNetworkConfig,
  validateNetworkParameter,
  validateEnvironment,
  getEnvironmentInfo,
  networkMiddleware
};
