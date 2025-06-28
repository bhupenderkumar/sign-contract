
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative px-6 py-32 lg:py-40 overflow-hidden">
      {/* Glassmorphism background */}
      <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" />
      
      {/* Floating elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
      
      <div className="container mx-auto text-center relative z-10">
        <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-full text-white text-sm font-medium mb-8 hover:bg-white/20 transition-all duration-300">
          <span className="w-2 h-2 bg-green-400 rounded-full mr-2 animate-pulse"></span>
          Powered by Solana Blockchain
        </div>
        
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-6 leading-tight">
          Smart Contracts,
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400">
            {" "}Reimagined
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-300 mb-12 max-w-4xl mx-auto leading-relaxed">
          Revolutionary blockchain-based contract management. Create, sign, and execute agreements with 
          <span className="text-blue-400 font-semibold"> military-grade security</span> and 
          <span className="text-purple-400 font-semibold"> instant automation</span>.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <Button 
            size="lg" 
            onClick={() => navigate('/create-contract')}
            className="bg-gradient-to-r from-blue-600/80 to-purple-600/80 backdrop-blur-md border border-white/20 hover:from-blue-500/90 hover:to-purple-500/90 text-white px-10 py-6 text-lg font-semibold rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
          >
            Create New Smart Contract
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="border-2 border-white/30 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 hover:border-white/50 px-10 py-6 text-lg font-semibold rounded-2xl transition-all duration-300 hover:scale-105"
          >
            <Play className="mr-2 h-5 w-5" />
            Watch Demo
          </Button>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto text-center">
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
            <div className="text-3xl font-bold text-blue-400 mb-2">256-bit</div>
            <div className="text-gray-300">Encryption</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
            <div className="text-3xl font-bold text-purple-400 mb-2">Instant</div>
            <div className="text-gray-300">Execution</div>
          </div>
          <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-all duration-300">
            <div className="text-3xl font-bold text-cyan-400 mb-2">Zero</div>
            <div className="text-gray-300">Downtime</div>
          </div>
        </div>
      </div>
    </section>
  );
};
