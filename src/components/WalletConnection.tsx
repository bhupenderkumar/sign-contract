import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Wallet, Loader2, AlertCircle, CheckCircle2, ExternalLink } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { WalletMultiButton, WalletDisconnectButton, useWalletModal } from '@solana/wallet-adapter-react-ui';
import { useWallet as useSolanaWallet } from '@solana/wallet-adapter-react';

export const WalletConnection: React.FC = () => {
  const { connect, connecting, connected, wallet } = useWallet();
  const { select, wallets } = useSolanaWallet();
  const { setVisible } = useWalletModal();
  const { toast } = useToast();
  const [isConnecting, setIsConnecting] = useState(false);
  const [showAutoConnectInfo, setShowAutoConnectInfo] = useState(false);

  // Check if user has previously connected a wallet and show helpful info
  React.useEffect(() => {
    const storedWalletName = localStorage.getItem('walletName');
    const wasConnected = localStorage.getItem('walletConnected') === 'true';
    const autoConnectEnabled = localStorage.getItem('solana-wallet-adapter-auto-connect') !== 'false';

    // Show info if wallet should auto-connect but hasn't yet
    setShowAutoConnectInfo(storedWalletName && wasConnected && autoConnectEnabled && !connected);

    // Log wallet persistence status for debugging
    if (storedWalletName && wasConnected) {
      console.log('💾 Found stored wallet connection:', {
        walletName: storedWalletName,
        wasConnected,
        autoConnectEnabled,
        currentlyConnected: connected
      });
    }
  }, [connected]);

  const handleConnect = async () => {
    if (connected) return;

    setIsConnecting(true);
    try {
      await connect();
      toast({
        title: "Wallet Connected!",
        description: "Your wallet has been successfully connected.",
        variant: "default",
      });
    } catch (error) {
      console.error('Connection error:', error);
      // Don't show error toast if it's just opening the modal
      if (error.message !== 'No wallet selected. Please select a wallet first.') {
        toast({
          title: "Connection Failed",
          description: "Failed to connect wallet. Please try again.",
          variant: "destructive",
        });
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const handleShowModal = () => {
    setVisible(true);
  };

  const handleWalletSelect = async (walletName: string) => {
    const selectedWallet = wallets.find(w => w.adapter.name === walletName);
    if (selectedWallet) {
      try {
        select(selectedWallet.adapter.name);
        // Small delay to allow wallet selection to complete
        setTimeout(async () => {
          try {
            await connect();
          } catch (error) {
            console.error('Connection error after selection:', error);
          }
        }, 100);
      } catch (error) {
        console.error('Wallet selection error:', error);
        toast({
          title: "Wallet Selection Failed",
          description: "Failed to select wallet. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const supportedWallets = [
    {
      name: 'Phantom',
      description: 'A friendly Solana wallet built for DeFi & NFTs',
      icon: '👻',
      url: 'https://phantom.app/',
      popular: true,
      installed: wallets.find(w => w.adapter.name === 'Phantom')?.readyState === 'Installed'
    },
    {
      name: 'Solflare',
      description: 'Solflare is a secure Solana wallet',
      icon: '🔥',
      url: 'https://solflare.com/',
      popular: true,
      installed: wallets.find(w => w.adapter.name === 'Solflare')?.readyState === 'Installed'
    },
    {
      name: 'Torus',
      description: 'Login with your existing accounts',
      icon: '🌐',
      url: 'https://tor.us/',
      popular: false,
      installed: wallets.find(w => w.adapter.name === 'Torus')?.readyState === 'Installed'
    }
  ];

  if (connected) {
    return (
      <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-400" />
          </div>
          <CardTitle className="text-white">Wallet Connected</CardTitle>
          <CardDescription className="text-slate-300">
            Your wallet is successfully connected and ready to use
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Auto-Connect Info */}
      {showAutoConnectInfo && (
        <Card className="bg-blue-500/10 border-blue-500/20 backdrop-blur-sm">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <AlertCircle className="h-5 w-5 text-blue-400" />
              <div>
                <h3 className="text-blue-400 font-semibold">Auto-Connect Available</h3>
                <p className="text-slate-300 text-sm mt-1">
                  You previously connected {localStorage.getItem('walletName')}.
                  The wallet should auto-connect when you refresh the page.
                </p>
                <p className="text-slate-400 text-xs mt-2">
                  If auto-connect isn't working, try manually connecting below or use the debug panel.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Connection Card */}
      <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="flex items-center justify-center mb-4">
            <Wallet className="h-12 w-12 text-blue-400" />
          </div>
          <CardTitle className="text-white">Connect Your Wallet</CardTitle>
          <CardDescription className="text-slate-300">
            Connect your Solana wallet to create and sign digital contracts
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Solana Wallet Adapter Multi Button */}
          <div className="flex justify-center">
            <WalletMultiButton className="!bg-blue-600 hover:!bg-blue-700 !text-white !font-semibold !py-3 !px-6 !rounded-lg !transition-colors !border-0" />
          </div>

          {/* Alternative button to open wallet selection modal */}
          <div className="text-center">
            <p className="text-slate-400 text-sm mb-3">Or select a wallet:</p>
            <Button
              onClick={handleShowModal}
              disabled={connecting || isConnecting}
              variant="outline"
              className="bg-white/10 border-white/20 text-white hover:bg-white/20 font-semibold py-3 px-8"
              size="lg"
            >
              <Wallet className="h-4 w-4 mr-2" />
              Choose Wallet
            </Button>
          </div>

          {/* Show available wallets if any are detected */}
          {wallets.some(w => w.readyState === 'Installed') && (
            <div className="space-y-3">
              <p className="text-slate-400 text-sm text-center">Detected wallets:</p>
              <div className="flex flex-wrap gap-2 justify-center">
                {wallets
                  .filter(w => w.readyState === 'Installed')
                  .map((wallet) => (
                    <Button
                      key={wallet.adapter.name}
                      onClick={() => handleWalletSelect(wallet.adapter.name)}
                      disabled={connecting || isConnecting}
                      variant="outline"
                      className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                    >
                      {wallet.adapter.icon && (
                        <img
                          src={wallet.adapter.icon}
                          alt={wallet.adapter.name}
                          className="w-4 h-4 mr-2"
                        />
                      )}
                      {wallet.adapter.name}
                    </Button>
                  ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supported Wallets */}
      <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="text-white text-lg">Supported Wallets</CardTitle>
          <CardDescription className="text-slate-300">
            Choose from our supported Solana wallets
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {supportedWallets.map((wallet, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{wallet.icon}</span>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-medium text-white">{wallet.name}</h3>
                      {wallet.popular && (
                        <Badge variant="secondary" className="bg-blue-500/20 text-blue-300 border-blue-400/30">
                          Popular
                        </Badge>
                      )}
                      {wallet.installed && (
                        <Badge variant="secondary" className="bg-green-500/20 text-green-300 border-green-400/30">
                          Installed
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-400">{wallet.description}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {wallet.installed ? (
                    <Button
                      onClick={() => handleWalletSelect(wallet.name)}
                      disabled={connecting || isConnecting}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      {connecting || isConnecting ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Connect'
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.open(wallet.url, '_blank')}
                      className="text-slate-300 hover:text-white hover:bg-white/10"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Security Notice */}
      <Card className="bg-amber-500/10 border-amber-400/20 backdrop-blur-sm">
        <CardContent className="pt-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="h-5 w-5 text-amber-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-amber-300 mb-1">Security Notice</h3>
              <p className="text-sm text-amber-200/80">
                Only connect wallets you trust. Never share your private keys or seed phrases. 
                This application will never ask for your private keys.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletConnection;
