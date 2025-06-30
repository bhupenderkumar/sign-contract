import React, { useState } from 'react';
import { useWallet } from '@/contexts/WalletContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AlertCircle, CheckCircle2, RefreshCw, Trash2, Bug, Eye, EyeOff } from 'lucide-react';
import { debugWalletStorage, clearWalletStorage } from '@/utils/walletStorageUtils';

/**
 * Debug component for wallet connection issues
 * Helps troubleshoot auto-connection problems
 */
export const WalletDebug: React.FC = () => {
  const { 
    connected, 
    connecting, 
    publicKey, 
    wallet, 
    forceDisconnect,
    websocketConnected,
    balance 
  } = useWallet();
  
  const [showDebug, setShowDebug] = useState(false);
  const [storageData, setStorageData] = useState<Record<string, string | null>>({});

  const refreshStorageData = () => {
    const walletKeys = [
      'walletName',
      'walletConnected',
      'solana-wallet-adapter-auto-connect',
      'solana-wallet-adapter-wallet-name',
      'solana-wallet-adapter-selected-wallet'
    ];

    const data: Record<string, string | null> = {};
    walletKeys.forEach(key => {
      try {
        data[key] = localStorage.getItem(key);
      } catch (error) {
        data[key] = `ERROR: ${error.message}`;
      }
    });
    
    setStorageData(data);
    debugWalletStorage();
  };

  const handleClearStorage = () => {
    clearWalletStorage();
    refreshStorageData();
  };

  const handleForceDisconnect = async () => {
    try {
      await forceDisconnect();
      refreshStorageData();
    } catch (error) {
      console.error('Force disconnect error:', error);
    }
  };

  React.useEffect(() => {
    if (showDebug) {
      refreshStorageData();
    }
  }, [showDebug]);

  if (!showDebug) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setShowDebug(true)}
          variant="outline"
          size="sm"
          className="bg-black/50 border-white/20 text-white hover:bg-black/70"
        >
          <Bug className="h-4 w-4 mr-2" />
          Wallet Debug
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card className="bg-black/90 border-white/20 backdrop-blur-sm">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Bug className="h-5 w-5 text-yellow-400" />
              <CardTitle className="text-white text-sm">Wallet Debug</CardTitle>
            </div>
            <Button
              onClick={() => setShowDebug(false)}
              variant="ghost"
              size="sm"
              className="text-white hover:text-gray-300 p-1 h-auto"
            >
              <EyeOff className="h-4 w-4" />
            </Button>
          </div>
          <CardDescription className="text-slate-400 text-xs">
            Troubleshoot wallet connection issues
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 text-xs">
          {/* Wallet Status */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold">Wallet Status</h4>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Connected:</span>
                {connected ? (
                  <Badge variant="default" className="bg-green-600 text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Yes
                  </Badge>
                ) : (
                  <Badge variant="destructive" className="text-xs">
                    <AlertCircle className="h-3 w-3 mr-1" />
                    No
                  </Badge>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Connecting:</span>
                <Badge variant={connecting ? "default" : "secondary"} className="text-xs">
                  {connecting ? "Yes" : "No"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-300">WebSocket:</span>
                <Badge variant={websocketConnected ? "default" : "secondary"} className="text-xs">
                  {websocketConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-slate-300">Balance:</span>
                <span className="text-white text-xs">
                  {balance !== null ? `${balance} SOL` : 'N/A'}
                </span>
              </div>
            </div>
            
            {wallet && (
              <div className="bg-white/5 rounded p-2">
                <span className="text-slate-300">Wallet:</span>
                <span className="text-white ml-2">{wallet.adapter.name}</span>
              </div>
            )}
            
            {publicKey && (
              <div className="bg-white/5 rounded p-2">
                <span className="text-slate-300">Public Key:</span>
                <p className="text-white font-mono text-xs break-all mt-1">
                  {publicKey.toString()}
                </p>
              </div>
            )}
          </div>

          <Separator className="bg-white/20" />

          {/* LocalStorage Debug */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-semibold">LocalStorage</h4>
              <Button
                onClick={refreshStorageData}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white p-1 h-auto"
              >
                <RefreshCw className="h-3 w-3" />
              </Button>
            </div>
            
            <div className="space-y-1">
              {Object.entries(storageData).map(([key, value]) => (
                <div key={key} className="bg-white/5 rounded p-2">
                  <div className="text-slate-300 text-xs">{key}:</div>
                  <div className="text-white text-xs font-mono break-all">
                    {value || 'null'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Separator className="bg-white/20" />

          {/* Actions */}
          <div className="space-y-2">
            <h4 className="text-white font-semibold">Actions</h4>
            <div className="grid grid-cols-1 gap-2">
              <Button
                onClick={handleClearStorage}
                variant="outline"
                size="sm"
                className="bg-red-500/20 border-red-500/30 text-red-300 hover:bg-red-500/30 text-xs"
              >
                <Trash2 className="h-3 w-3 mr-2" />
                Clear All Storage
              </Button>
              
              <Button
                onClick={handleForceDisconnect}
                variant="outline"
                size="sm"
                className="bg-orange-500/20 border-orange-500/30 text-orange-300 hover:bg-orange-500/30 text-xs"
                disabled={!connected}
              >
                <AlertCircle className="h-3 w-3 mr-2" />
                Force Disconnect
              </Button>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-blue-500/10 border border-blue-500/20 rounded p-2">
            <h5 className="text-blue-400 font-semibold text-xs mb-1">Troubleshooting Tips:</h5>
            <ul className="text-slate-300 text-xs space-y-1">
              <li>• Try "Clear All Storage" if auto-connect fails</li>
              <li>• Check browser console for detailed errors</li>
              <li>• Ensure wallet extension is unlocked</li>
              <li>• Refresh page after clearing storage</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default WalletDebug;
