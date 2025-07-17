// Solana configuration constants
import { PublicKey } from '@solana/web3.js';
import { getCurrentNetwork } from './environment';

// Program ID for the digital contract program
export const PROGRAM_ID = new PublicKey(
  import.meta.env.VITE_PROGRAM_ID || '7ow2v1f2EFNWQAVwn6aXih3kuXBP5FAX9ni48Uqva1LK'
);

// Platform fee recipient (same across all networks for now)
export const PLATFORM_FEE_RECIPIENT = new PublicKey(
  'BcSXav3jcBKRbN6woZsqPMJGYrS2MXwVEdtUx1ZzD9Xo'
);

// Platform fee amount in SOL
export const PLATFORM_FEE_AMOUNT = 0.01;

// Contract configuration
export const CONTRACT_CONFIG = {
  maxParties: 10,
  maxTitleLength: 100,
  maxDocumentHashLength: 64,
  platformFeeBasisPoints: 10, // 0.1%
  minPlatformFeeLamports: 1_000_000, // 0.001 SOL
  maxPlatformFeeLamports: 100_000_000, // 0.1 SOL
};

// Get program ID for current network
export const getProgramId = (): PublicKey => {
  return PROGRAM_ID;
};

// Get platform fee recipient for current network
export const getPlatformFeeRecipient = (): PublicKey => {
  return PLATFORM_FEE_RECIPIENT;
};

// Get platform fee amount for current network
export const getPlatformFeeAmount = (): number => {
  return PLATFORM_FEE_AMOUNT;
};

// Validate program ID
export const validateProgramId = (programId: string): boolean => {
  try {
    new PublicKey(programId);
    return true;
  } catch {
    return false;
  }
};

// Get Solana explorer URL for the program
export const getProgramExplorerUrl = (): string => {
  const network = getCurrentNetwork();
  const clusterParam = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
  return `https://explorer.solana.com/address/${PROGRAM_ID.toString()}${clusterParam}`;
};

// Get transaction explorer URL
export const getTransactionExplorerUrl = (signature: string): string => {
  const network = getCurrentNetwork();
  const clusterParam = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
  return `https://explorer.solana.com/tx/${signature}${clusterParam}`;
};

// Get account explorer URL
export const getAccountExplorerUrl = (address: string): string => {
  const network = getCurrentNetwork();
  const clusterParam = network === 'mainnet-beta' ? '' : `?cluster=${network}`;
  return `https://explorer.solana.com/address/${address}${clusterParam}`;
};

// Development mode helpers
export const isDevelopmentMode = (): boolean => {
  return import.meta.env.DEV;
};

// Get configuration info for debugging
export const getSolanaConfigInfo = () => {
  return {
    programId: PROGRAM_ID.toString(),
    platformFeeRecipient: PLATFORM_FEE_RECIPIENT.toString(),
    platformFeeAmount: PLATFORM_FEE_AMOUNT,
    network: getCurrentNetwork(),
    explorerUrl: getProgramExplorerUrl(),
    isDevelopment: isDevelopmentMode(),
    contractConfig: CONTRACT_CONFIG,
  };
};
