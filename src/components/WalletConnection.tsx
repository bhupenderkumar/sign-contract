
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Loader2 } from 'lucide-react';
import { useWallet } from '@/contexts/WalletContext';

export const WalletConnection = () => {
  const [publicKey, setPublicKey] = useState('');
  const { connectWallet, isLoading } = useWallet();

  const handleConnect = async () => {
    if (publicKey.trim()) {
      await connectWallet(publicKey.trim());
    }
  };

  const generateRandomKey = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < 44; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setPublicKey(result);
  };

  return (
    <Card className="bg-black/40 backdrop-blur-md border border-white/20 hover:bg-black/50 transition-all duration-300">
      <CardHeader className="text-center">
        <div className="mx-auto w-16 h-16 bg-gradient-to-r from-green-400 to-blue-500 rounded-full flex items-center justify-center mb-4">
          <Wallet className="h-8 w-8 text-white" />
        </div>
        <CardTitle className="text-2xl font-bold text-white">Connect Your Wallet</CardTitle>
        <p className="text-gray-300">
          Enter your public key to access your contract dashboard and view your portfolio
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="publicKey" className="text-sm font-medium text-gray-300">
            Public Key
          </label>
          <Input
            id="publicKey"
            type="text"
            placeholder="Enter your wallet public key..."
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            className="bg-white/10 border-white/20 text-white placeholder:text-gray-400 focus:border-green-400 focus:ring-green-400"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            onClick={handleConnect}
            disabled={!publicKey.trim() || isLoading}
            className="flex-1 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 text-white font-semibold"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Connecting...
              </>
            ) : (
              'Connect Wallet'
            )}
          </Button>
          <Button
            onClick={generateRandomKey}
            variant="outline"
            className="border-white/20 text-white hover:bg-white/10"
          >
            Demo Key
          </Button>
        </div>

        <div className="text-xs text-gray-400 text-center">
          Don't have a wallet? Use "Demo Key" to see a preview with sample data.
        </div>
      </CardContent>
    </Card>
  );
};
