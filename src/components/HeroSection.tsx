
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Zap, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative px-6 py-24 lg:py-32 overflow-hidden">
      {/* Clean background with subtle gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
      
      {/* Subtle background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div 
          className="w-full h-full" 
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
            backgroundSize: '40px 40px'
          }}
        ></div>
      </div>
      
      <div className="container mx-auto text-center relative z-10">
        {/* Professional status badge */}
        <div className="inline-flex items-center px-6 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full text-white text-sm font-medium mb-8">
          <span className="w-2 h-2 bg-green-500 rounded-full mr-3"></span>
          Trusted by businesses worldwide for secure contract management
        </div>
        
        {/* Clear, professional heading */}
        <div className="mb-6">
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-4 leading-tight">
            Digital Contract
          </h1>
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-blue-400 leading-tight">
            Management
          </h1>
        </div>
        
        {/* Clear value proposition */}
        <div className="mb-12 max-w-4xl mx-auto">
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed">
            Create, sign, and manage digital contracts with blockchain security. 
            Streamline your business agreements with automated execution and secure storage.
          </p>
          
          {/* Business benefits */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
              <Shield className="h-8 w-8 text-blue-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Secure & Legal</h3>
              <p className="text-gray-400 text-sm">Bank-level security with legally binding digital signatures</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
              <Zap className="h-8 w-8 text-green-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Fast & Efficient</h3>
              <p className="text-gray-400 text-sm">Reduce contract processing time from days to minutes</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-all duration-300">
              <Users className="h-8 w-8 text-purple-400 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-white mb-2">Multi-Party Support</h3>
              <p className="text-gray-400 text-sm">Support for multiple parties with optional mediation</p>
            </div>
          </div>
        </div>
        
        {/* Professional CTA buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
          <Button 
            size="lg" 
            onClick={() => navigate('/create-contract')}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 hover:scale-105"
          >
            Create Contract Now
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="border-2 border-white/30 bg-transparent text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300"
          >
            <Play className="mr-2 h-5 w-5" />
            Watch Demo
          </Button>
        </div>
        
        {/* Business metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-3xl mx-auto">
          <div className="text-center">
            <div className="text-3xl font-bold text-blue-400 mb-2">99.9%</div>
            <div className="text-gray-400">Uptime Guarantee</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-green-400 mb-2">256-bit</div>
            <div className="text-gray-400">Encryption Security</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-purple-400 mb-2">24/7</div>
            <div className="text-gray-400">Customer Support</div>
          </div>
        </div>
        
        {/* Simple process explanation */}
        <div className="mt-20 p-8 bg-white/5 border border-white/10 rounded-2xl">
          <h3 className="text-2xl font-bold text-white mb-6">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-500/20 rounded-full p-3 flex-shrink-0">
                <span className="text-blue-300 font-bold">1</span>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Create Contract</h4>
                <p className="text-gray-400 text-sm">Input party details, terms, and upload documents</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-green-500/20 rounded-full p-3 flex-shrink-0">
                <span className="text-green-300 font-bold">2</span>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Digital Signing</h4>
                <p className="text-gray-400 text-sm">All parties review and sign digitally</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-purple-500/20 rounded-full p-3 flex-shrink-0">
                <span className="text-purple-300 font-bold">3</span>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Automatic Execution</h4>
                <p className="text-gray-400 text-sm">Contract terms are automatically enforced</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
