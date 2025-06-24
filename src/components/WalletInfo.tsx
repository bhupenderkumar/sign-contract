
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Wallet, LogOut, Copy, TrendingUp, Activity, Coins } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';
import { useToast } from '@/hooks/use-toast';

export const WalletInfo = () => {
  const { walletInfo, disconnectWallet } = useWallet();
  const { toast } = useToast();

  if (!walletInfo) return null;

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Public key copied to clipboard",
    });
  };

  const formatPublicKey = (key: string) => {
    return `${key.slice(0, 8)}...${key.slice(-8)}`;
  };

  return (
    <div className="space-y-6">
      {/* Main Wallet Card */}
      <Card className="bg-black/40 backdrop-blur-md border border-white/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl text-white">Wallet Connected</CardTitle>
              <p className="text-sm text-gray-300">Network: {walletInfo.network}</p>
            </div>
          </div>
          <Button
            onClick={disconnectWallet}
            variant="outline"
            size="sm"
            className="border-red-500/50 text-red-400 hover:bg-red-500/10"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Disconnect
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
            <div>
              <p className="text-sm text-gray-400">Public Key</p>
              <p className="text-white font-mono">{formatPublicKey(walletInfo.publicKey)}</p>
            </div>
            <Button
              onClick={() => copyToClipboard(walletInfo.publicKey)}
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-white"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-xs text-gray-400">
            Connected on {walletInfo.connectedAt.toLocaleDateString()} at{' '}
            {walletInfo.connectedAt.toLocaleTimeString()}
          </div>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-black/40 backdrop-blur-md border border-white/20 hover:bg-black/50 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <Coins className="h-5 w-5 text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Balance</p>
                <p className="text-2xl font-bold text-white">
                  {walletInfo.balance.toFixed(2)} SOL
                </p>
                <p className="text-xs text-green-400">+2.5% today</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-md border border-white/20 hover:bg-black/50 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Activity className="h-5 w-5 text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Transactions</p>
                <p className="text-2xl font-bold text-white">{walletInfo.transactions}</p>
                <p className="text-xs text-gray-400">All time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/40 backdrop-blur-md border border-white/20 hover:bg-black/50 transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-400">Staking Rewards</p>
                <p className="text-2xl font-bold text-white">
                  {walletInfo.stakingRewards.toFixed(2)} SOL
                </p>
                <p className="text-xs text-purple-400">+5.2% APY</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
