import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import WalletConnection from '@/components/WalletConnection';
import WalletAwareDemo from '@/components/WalletAwareDemo';
import { useWallet } from '@/contexts/WalletContext';

/**
 * Demo page showing wallet-aware WebSocket functionality
 * This page demonstrates how WebSocket calls are only made when wallet is connected
 */
const WebSocketDemo: React.FC = () => {
  const navigate = useNavigate();
  const { connected } = useWallet();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-white hover:text-blue-300 hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <h1 className="text-3xl font-bold text-white">
            WebSocket Demo
          </h1>
          
          <div className="w-24" /> {/* Spacer for centering */}
        </div>

        {/* Description */}
        <div className="max-w-4xl mx-auto mb-8">
          <div className="bg-white/10 border border-white/20 rounded-lg p-6 backdrop-blur-sm">
            <h2 className="text-xl font-semibold text-white mb-3">
              Wallet-Aware WebSocket Operations
            </h2>
            <p className="text-slate-300 mb-4">
              This demo shows how WebSocket calls are properly contextualized with wallet connection. 
              All WebSocket operations that require wallet context (like pricing requests, balance queries, 
              and contract operations) are only available when a wallet is connected and the public key is available.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="bg-white/5 rounded-lg p-3">
                <h3 className="text-blue-400 font-semibold mb-2">✅ Wallet-Dependent Operations</h3>
                <ul className="text-slate-300 space-y-1">
                  <li>• Contract pricing requests</li>
                  <li>• Balance queries</li>
                  <li>• Contract creation</li>
                  <li>• Contract signing</li>
                </ul>
              </div>
              <div className="bg-white/5 rounded-lg p-3">
                <h3 className="text-green-400 font-semibold mb-2">🔓 Wallet-Independent Operations</h3>
                <ul className="text-slate-300 space-y-1">
                  <li>• WebSocket connection</li>
                  <li>• Health checks (ping/pong)</li>
                  <li>• Solana network status</li>
                  <li>• Transaction lookups</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto space-y-8">
          {/* Wallet Connection Section */}
          {!connected && (
            <div>
              <h2 className="text-2xl font-semibold text-white mb-4">
                Step 1: Connect Your Wallet
              </h2>
              <WalletConnection />
            </div>
          )}

          {/* Demo Section */}
          <div>
            <h2 className="text-2xl font-semibold text-white mb-4">
              {connected ? 'WebSocket Operations Demo' : 'Step 2: Try WebSocket Operations'}
            </h2>
            <WalletAwareDemo />
          </div>

          {/* Code Example */}
          <div className="bg-white/10 border border-white/20 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white mb-4">
              Implementation Example
            </h3>
            <div className="bg-black/30 rounded-lg p-4 overflow-x-auto">
              <pre className="text-green-400 text-sm">
{`// ✅ Correct: Wallet-aware WebSocket usage
const { isWalletReady, requestContractPricing } = useWalletWebSocket();

const handlePricing = async () => {
  if (!isWalletReady) {
    throw new Error('Wallet must be connected');
  }
  
  // This will only execute when wallet is connected
  await requestContractPricing(contractData);
};

// ❌ Incorrect: Direct WebSocket calls without wallet context
websocketService.requestContractPricing(contractData); // No wallet context!`}
              </pre>
            </div>
            <p className="text-slate-300 text-sm mt-3">
              The <code className="text-blue-400">useWalletWebSocket</code> hook ensures all operations 
              have proper wallet context and prevents calls when the wallet is not connected.
            </p>
          </div>

          {/* Benefits */}
          <div className="bg-white/10 border border-white/20 rounded-lg p-6 backdrop-blur-sm">
            <h3 className="text-xl font-semibold text-white mb-4">
              Benefits of Wallet-Aware WebSocket Operations
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-green-400 rounded-full mt-2"></div>
                  <div>
                    <h4 className="text-green-400 font-semibold">Better Security</h4>
                    <p className="text-slate-300 text-sm">
                      Operations only execute with proper wallet authentication
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-400 rounded-full mt-2"></div>
                  <div>
                    <h4 className="text-blue-400 font-semibold">Proper Context</h4>
                    <p className="text-slate-300 text-sm">
                      Backend receives wallet public key with every request
                    </p>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-purple-400 rounded-full mt-2"></div>
                  <div>
                    <h4 className="text-purple-400 font-semibold">Better UX</h4>
                    <p className="text-slate-300 text-sm">
                      Clear feedback when wallet connection is required
                    </p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-yellow-400 rounded-full mt-2"></div>
                  <div>
                    <h4 className="text-yellow-400 font-semibold">Error Prevention</h4>
                    <p className="text-slate-300 text-sm">
                      Prevents invalid operations before they reach the backend
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WebSocketDemo;
