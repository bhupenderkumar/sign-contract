import React from 'react';
import { useWalletWebSocket } from '@/hooks/useWalletWebSocket';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle2, Wallet, DollarSign, FileText } from 'lucide-react';

/**
 * Demo component showing wallet-aware WebSocket operations
 * This component demonstrates how WebSocket calls are only made when wallet is connected
 */
export const WalletAwareDemo: React.FC = () => {
  const { connected, publicKey, balance } = useWallet();
  const {
    isWalletReady,
    loading,
    error,
    contractPricing,
    requestContractPricing,
    getBalance,
    clearError,
    clearResults
  } = useWalletWebSocket();

  // Sample contract data for demo
  const sampleContractData = {
    contractTitle: "Sample Service Agreement",
    contractDescription: "A demo contract for testing WebSocket functionality",
    useBlockchain: true,
    useMediator: false,
    structuredClauses: [
      "Service provider will deliver high-quality work",
      "Client will provide timely feedback",
      "Payment terms are net 30 days"
    ]
  };

  const handleRequestPricing = async () => {
    try {
      await requestContractPricing(sampleContractData);
    } catch (error) {
      console.error('Failed to request pricing:', error);
    }
  };

  const handleGetBalance = async () => {
    try {
      await getBalance();
    } catch (error) {
      console.error('Failed to get balance:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto bg-white/10 border-white/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white flex items-center space-x-2">
          <Wallet className="h-5 w-5" />
          <span>Wallet-Aware WebSocket Demo</span>
        </CardTitle>
        <CardDescription className="text-slate-300">
          This demo shows how WebSocket operations are only available when wallet is connected
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Wallet Status */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold">Wallet Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center space-x-2">
              <span className="text-slate-300">Connected:</span>
              {connected ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Yes
                </Badge>
              ) : (
                <Badge variant="destructive">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  No
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <span className="text-slate-300">WebSocket Ready:</span>
              {isWalletReady ? (
                <Badge variant="default" className="bg-green-600">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  Ready
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  Not Ready
                </Badge>
              )}
            </div>
          </div>
          
          {publicKey && (
            <div className="bg-white/5 rounded-lg p-3">
              <span className="text-slate-300 text-sm">Public Key:</span>
              <p className="text-white text-sm font-mono break-all mt-1">
                {publicKey.toString()}
              </p>
            </div>
          )}
          
          {balance !== null && (
            <div className="bg-white/5 rounded-lg p-3">
              <span className="text-slate-300 text-sm">Balance:</span>
              <p className="text-green-400 font-semibold mt-1">
                {balance} SOL
              </p>
            </div>
          )}
        </div>

        {/* WebSocket Operations */}
        <div className="space-y-3">
          <h3 className="text-white font-semibold">WebSocket Operations</h3>
          
          {!isWalletReady && (
            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-4 w-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm">
                  Connect your wallet to enable WebSocket operations
                </span>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              onClick={handleGetBalance}
              disabled={!isWalletReady || loading}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              {loading ? 'Loading...' : 'Get Balance'}
            </Button>
            
            <Button
              onClick={handleRequestPricing}
              disabled={!isWalletReady || loading}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20"
            >
              <FileText className="h-4 w-4 mr-2" />
              {loading ? 'Loading...' : 'Request Pricing'}
            </Button>
          </div>
        </div>

        {/* Results */}
        {contractPricing && (
          <div className="space-y-3">
            <h3 className="text-white font-semibold">Contract Pricing Result</h3>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <span className="text-slate-300">Base Fee:</span>
                  <span className="text-white ml-2">{contractPricing.baseFee} SOL</span>
                </div>
                <div>
                  <span className="text-slate-300">Complexity:</span>
                  <span className="text-white ml-2">{contractPricing.complexityMultiplier}x</span>
                </div>
                <div className="col-span-2 pt-2 border-t border-white/10">
                  <span className="text-slate-300">Total Fee:</span>
                  <span className="text-green-400 ml-2 font-semibold">
                    {contractPricing.totalFee} SOL
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3">
            <div className="flex items-start space-x-2">
              <AlertCircle className="h-4 w-4 text-red-400 mt-0.5" />
              <div className="flex-1">
                <span className="text-red-400 text-sm">{error}</span>
                <Button
                  onClick={clearError}
                  variant="ghost"
                  size="sm"
                  className="text-red-400 hover:text-red-300 ml-2 p-0 h-auto"
                >
                  Clear
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Clear Results */}
        {(contractPricing || error) && (
          <div className="pt-3 border-t border-white/20">
            <Button
              onClick={clearResults}
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-slate-300"
            >
              Clear All Results
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WalletAwareDemo;
