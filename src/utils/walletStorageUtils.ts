/**
 * Utility functions for managing wallet-related localStorage
 * Helps prevent and fix JSON parsing errors in wallet adapters
 */

export const clearWalletStorage = () => {
  try {
    const walletKeys = [
      'walletName',
      'walletConnected',
      'solana-wallet-adapter-auto-connect',
      'solana-wallet-adapter-wallet-name',
      'solana-wallet-adapter-selected-wallet',
      'phantom-wallet-adapter',
      'solflare-wallet-adapter',
      'torus-wallet-adapter'
    ];

    walletKeys.forEach(key => {
      try {
        localStorage.removeItem(key);
      } catch (error) {
        console.warn(`Failed to remove localStorage key: ${key}`, error);
      }
    });

    console.log('✅ Wallet localStorage cleared successfully');
    return true;
  } catch (error) {
    console.error('❌ Failed to clear wallet localStorage:', error);
    return false;
  }
};

export const validateWalletStorage = () => {
  try {
    const walletKeys = [
      'walletName',
      'walletConnected',
      'solana-wallet-adapter-auto-connect',
      'solana-wallet-adapter-wallet-name'
    ];

    const corruptedKeys: string[] = [];

    walletKeys.forEach(key => {
      try {
        const value = localStorage.getItem(key);
        if (value && value !== 'true' && value !== 'false' && value !== 'null') {
          // Try to parse as JSON to validate
          JSON.parse(value);
        }
      } catch (error) {
        corruptedKeys.push(key);
      }
    });

    if (corruptedKeys.length > 0) {
      console.warn('Found corrupted wallet localStorage keys:', corruptedKeys);
      corruptedKeys.forEach(key => {
        try {
          localStorage.removeItem(key);
          console.log(`Cleared corrupted key: ${key}`);
        } catch (error) {
          console.warn(`Failed to clear corrupted key: ${key}`, error);
        }
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error validating wallet localStorage:', error);
    return false;
  }
};

export const safeSetWalletStorage = (key: string, value: string) => {
  try {
    localStorage.setItem(key, value);
    return true;
  } catch (error) {
    console.warn(`Failed to set localStorage key: ${key}`, error);
    return false;
  }
};

export const safeGetWalletStorage = (key: string): string | null => {
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.warn(`Failed to get localStorage key: ${key}`, error);
    return null;
  }
};

export const safeRemoveWalletStorage = (key: string) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.warn(`Failed to remove localStorage key: ${key}`, error);
    return false;
  }
};

// Debug function to log all wallet-related localStorage
export const debugWalletStorage = () => {
  console.log('🔍 Wallet localStorage Debug:');
  
  const walletKeys = [
    'walletName',
    'walletConnected',
    'solana-wallet-adapter-auto-connect',
    'solana-wallet-adapter-wallet-name',
    'solana-wallet-adapter-selected-wallet'
  ];

  walletKeys.forEach(key => {
    try {
      const value = localStorage.getItem(key);
      console.log(`  ${key}: ${value}`);
    } catch (error) {
      console.log(`  ${key}: ERROR - ${error.message}`);
    }
  });
};
