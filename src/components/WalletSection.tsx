
import { useWallet } from '@/contexts/WalletContext';
import { WalletConnection } from './WalletConnection';
import { WalletInfo } from './WalletInfo';

export const WalletSection = () => {
  const { isConnected } = useWallet();

  return (
    <section className="py-20 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-black/10 backdrop-blur-sm" />
      
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-12">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Wallet
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-blue-400"> Integration</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            {isConnected 
              ? "Your wallet is connected. View your portfolio and contract activity below."
              : "Connect your wallet to access advanced contract features and view your portfolio"
            }
          </p>
        </div>

        <div className="max-w-4xl mx-auto">
          {isConnected ? <WalletInfo /> : <WalletConnection />}
        </div>
      </div>
    </section>
  );
};
