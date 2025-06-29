import React, { useState, useEffect } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Wallet, 
  Copy, 
  ExternalLink, 
  RefreshCw, 
  LogOut,
  TrendingUp,
  Activity,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface TransactionHistory {
  signature: string;
  timestamp: number;
  type: 'contract_creation' | 'contract_signing' | 'transfer';
  amount?: number;
  status: 'confirmed' | 'pending' | 'failed';
}

export const WalletInfo: React.FC = () => {
  const { 
    publicKey, 
    balance, 
    disconnect, 
    wallet, 
    connection 
  } = useWallet();
  const { toast } = useToast();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [transactions, setTransactions] = useState<TransactionHistory[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);

  const handleCopyAddress = async () => {
    if (publicKey) {
      try {
        await navigator.clipboard.writeText(publicKey.toString());
        toast({
          title: "Address Copied!",
          description: "Wallet address has been copied to clipboard.",
          variant: "default",
        });
      } catch (error) {
        toast({
          title: "Copy Failed",
          description: "Failed to copy address to clipboard.",
          variant: "destructive",
        });
      }
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnect();
      toast({
        title: "Wallet Disconnected",
        description: "Your wallet has been disconnected successfully.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Disconnect Failed",
        description: "Failed to disconnect wallet.",
        variant: "destructive",
      });
    }
  };

  const refreshBalance = async () => {
    if (!publicKey || !connection) return;
    
    setIsRefreshing(true);
    try {
      // The balance will be automatically updated by the WalletContext
      await new Promise(resolve => setTimeout(resolve, 1000)); // Small delay for UX
      toast({
        title: "Balance Updated",
        description: "Wallet balance has been refreshed.",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Failed to refresh balance.",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  const fetchTransactionHistory = async () => {
    if (!publicKey || !connection) return;
    
    setIsLoadingTransactions(true);
    try {
      const signatures = await connection.getSignaturesForAddress(publicKey, { limit: 10 });
      const transactionHistory: TransactionHistory[] = signatures.map(sig => ({
        signature: sig.signature,
        timestamp: sig.blockTime || Date.now() / 1000,
        type: 'transfer', // Default type, could be enhanced with more logic
        status: sig.confirmationStatus === 'confirmed' ? 'confirmed' : 'pending'
      }));
      setTransactions(transactionHistory);
    } catch (error) {
      console.error('Error fetching transaction history:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  useEffect(() => {
    if (publicKey) {
      fetchTransactionHistory();
    }
  }, [publicKey]);

  const formatAddress = (address: string) => {
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleDateString();
  };

  const openInExplorer = (signature: string) => {
    const explorerUrl = `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
    window.open(explorerUrl, '_blank');
  };

  if (!publicKey) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Wallet className="h-8 w-8 text-blue-400" />
              <div>
                <CardTitle className="text-white">Wallet Connected</CardTitle>
                <CardDescription className="text-slate-300">
                  {wallet?.adapter.name || 'Unknown Wallet'}
                </CardDescription>
              </div>
            </div>
            <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-400/30">
              Connected
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Wallet Address */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-300">Wallet Address</label>
            <div className="flex items-center space-x-2 p-3 bg-white/5 border border-white/10 rounded-lg">
              <code className="flex-1 text-sm text-white font-mono">
                {publicKey.toString()}
              </code>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleCopyAddress}
                className="text-slate-300 hover:text-white hover:bg-white/10"
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Balance */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-slate-300">Balance</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={refreshBalance}
                disabled={isRefreshing}
                className="text-slate-300 hover:text-white hover:bg-white/10"
              >
                <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            <div className="p-3 bg-white/5 border border-white/10 rounded-lg">
              <div className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                <span className="text-xl font-semibold text-white">
                  {balance !== null ? `${balance.toFixed(4)} SOL` : 'Loading...'}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-2 pt-2">
            <Button
              variant="outline"
              onClick={handleDisconnect}
              className="flex-1 border-white/20 text-white hover:bg-white/10"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Disconnect
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Transaction History */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-white">Recent Transactions</CardTitle>
              <CardDescription className="text-slate-300">
                Your latest blockchain activity
              </CardDescription>
            </div>
            <Activity className="h-5 w-5 text-slate-400" />
          </div>
        </CardHeader>
        <CardContent>
          {isLoadingTransactions ? (
            <div className="text-center py-8">
              <RefreshCw className="h-8 w-8 animate-spin text-slate-400 mx-auto mb-2" />
              <p className="text-slate-400">Loading transactions...</p>
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-3">
              {transactions.map((tx, index) => (
                <div key={tx.signature} className="flex items-center justify-between p-3 bg-white/5 border border-white/10 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-2 h-2 rounded-full ${
                      tx.status === 'confirmed' ? 'bg-green-400' : 
                      tx.status === 'pending' ? 'bg-yellow-400' : 'bg-red-400'
                    }`} />
                    <div>
                      <p className="text-sm font-medium text-white">
                        {formatAddress(tx.signature)}
                      </p>
                      <p className="text-xs text-slate-400">
                        {formatTimestamp(tx.timestamp)}
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openInExplorer(tx.signature)}
                    className="text-slate-300 hover:text-white hover:bg-white/10"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Activity className="h-8 w-8 text-slate-400 mx-auto mb-2" />
              <p className="text-slate-400">No transactions found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
