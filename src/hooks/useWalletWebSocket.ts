import { useEffect, useCallback, useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import websocketService from '@/services/websocketService';

/**
 * Custom hook for wallet-aware WebSocket operations
 * Ensures all WebSocket calls are made only when wallet is connected
 */
export const useWalletWebSocket = () => {
  const { connected, publicKey, websocketConnected } = useWallet();
  const [contractPricing, setContractPricing] = useState<any>(null);
  const [contractCreationResult, setContractCreationResult] = useState<any>(null);
  const [contractSigningResult, setContractSigningResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if wallet operations are allowed
  const isWalletReady = connected && publicKey && websocketConnected;

  // Clear state when wallet disconnects
  useEffect(() => {
    if (!isWalletReady) {
      setContractPricing(null);
      setContractCreationResult(null);
      setContractSigningResult(null);
      setError(null);
      setLoading(false);
    }
  }, [isWalletReady]);

  // Set up event listeners for contract operations
  useEffect(() => {
    if (!isWalletReady) return;

    const handleContractPricingResponse = (data: any) => {
      if (data.publicKey === publicKey?.toString()) {
        setContractPricing(data.pricing);
        setLoading(false);
        setError(null);
      }
    };

    const handleContractPricingError = (data: any) => {
      if (data.publicKey === publicKey?.toString()) {
        setError(data.error);
        setLoading(false);
      }
    };

    const handleContractCreated = (data: any) => {
      if (data.publicKey === publicKey?.toString()) {
        setContractCreationResult(data);
        setLoading(false);
        setError(null);
      }
    };

    const handleContractCreationError = (data: any) => {
      if (data.publicKey === publicKey?.toString()) {
        setError(data.error);
        setLoading(false);
      }
    };

    const handleContractSigned = (data: any) => {
      if (data.publicKey === publicKey?.toString()) {
        setContractSigningResult(data);
        setLoading(false);
        setError(null);
      }
    };

    const handleContractSigningError = (data: any) => {
      if (data.publicKey === publicKey?.toString()) {
        setError(data.error);
        setLoading(false);
      }
    };

    // Add event listeners
    websocketService.on('contract_pricing_response', handleContractPricingResponse);
    websocketService.on('contract_pricing_error', handleContractPricingError);
    websocketService.on('contract_created', handleContractCreated);
    websocketService.on('contract_creation_error', handleContractCreationError);
    websocketService.on('contract_signed', handleContractSigned);
    websocketService.on('contract_signing_error', handleContractSigningError);

    // Cleanup function
    return () => {
      websocketService.off('contract_pricing_response', handleContractPricingResponse);
      websocketService.off('contract_pricing_error', handleContractPricingError);
      websocketService.off('contract_created', handleContractCreated);
      websocketService.off('contract_creation_error', handleContractCreationError);
      websocketService.off('contract_signed', handleContractSigned);
      websocketService.off('contract_signing_error', handleContractSigningError);
    };
  }, [isWalletReady, publicKey]);

  // Wallet-aware WebSocket operations
  const requestContractPricing = useCallback(async (contractData: any) => {
    if (!isWalletReady) {
      throw new Error('Wallet must be connected to request contract pricing');
    }

    try {
      setLoading(true);
      setError(null);
      setContractPricing(null);
      
      websocketService.requestContractPricing(contractData);
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
      throw error;
    }
  }, [isWalletReady]);

  const createContract = useCallback(async (contractData: any) => {
    if (!isWalletReady) {
      throw new Error('Wallet must be connected to create contracts');
    }

    try {
      setLoading(true);
      setError(null);
      setContractCreationResult(null);
      
      websocketService.createContract(contractData);
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
      throw error;
    }
  }, [isWalletReady]);

  const signContract = useCallback(async (contractId: string, signature: string) => {
    if (!isWalletReady) {
      throw new Error('Wallet must be connected to sign contracts');
    }

    try {
      setLoading(true);
      setError(null);
      setContractSigningResult(null);
      
      websocketService.signContract(contractId, signature);
    } catch (error: any) {
      setError(error.message);
      setLoading(false);
      throw error;
    }
  }, [isWalletReady]);

  const getBalance = useCallback(async () => {
    if (!isWalletReady) {
      throw new Error('Wallet must be connected to get balance');
    }

    try {
      websocketService.getBalance();
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, [isWalletReady]);

  const getAccountInfo = useCallback(async () => {
    if (!isWalletReady) {
      throw new Error('Wallet must be connected to get account info');
    }

    try {
      websocketService.getAccountInfo();
    } catch (error: any) {
      setError(error.message);
      throw error;
    }
  }, [isWalletReady]);

  // Clear error function
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Clear results function
  const clearResults = useCallback(() => {
    setContractPricing(null);
    setContractCreationResult(null);
    setContractSigningResult(null);
    setError(null);
  }, []);

  return {
    // State
    isWalletReady,
    loading,
    error,
    contractPricing,
    contractCreationResult,
    contractSigningResult,
    
    // Operations
    requestContractPricing,
    createContract,
    signContract,
    getBalance,
    getAccountInfo,
    
    // Utilities
    clearError,
    clearResults
  };
};

export default useWalletWebSocket;
