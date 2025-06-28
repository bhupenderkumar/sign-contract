
import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Shield, Zap, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";

export const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <section className="relative px-6 py-32 lg:py-40 overflow-hidden">
      {/* Enhanced Glassmorphism background */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-lg" />
      
      {/* Enhanced floating elements with more movement */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-500/15 rounded-full blur-3xl animate-pulse delay-1000"></div>
      <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      
      {/* Animated grid overlay */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent animate-pulse"></div>
        <div 
          className="w-full h-full" 
          style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)`,
            backgroundSize: '50px 50px'
          }}
        ></div>
      </div>
      
      <div className="container mx-auto text-center relative z-10">
        {/* Enhanced status badge with animation */}
        <div className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-white/10 to-white/5 backdrop-blur-xl border border-white/30 rounded-full text-white text-sm font-medium mb-12 hover:bg-white/20 transition-all duration-500 group hover:scale-105">
          <div className="flex items-center mr-3">
            <span className="w-3 h-3 bg-green-400 rounded-full animate-pulse mr-2"></span>
            <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse delay-300 mr-1"></span>
            <span className="w-1 h-1 bg-green-200 rounded-full animate-pulse delay-500"></span>
          </div>
          <span className="group-hover:text-green-300 transition-colors duration-300">
            Powered by Advanced Blockchain Technology
          </span>
        </div>
        
        {/* Enhanced main heading with staggered animation */}
        <div className="mb-8">
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold text-white mb-2 leading-tight">
            <span className="inline-block animate-fade-in">Smart</span>{" "}
            <span className="inline-block animate-fade-in delay-200">Contracts,</span>
          </h1>
          <div className="text-5xl md:text-7xl lg:text-8xl font-bold leading-tight">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400 animate-fade-in delay-400">
              Reimagined
            </span>
          </div>
        </div>
        
        {/* Enhanced description with better structure */}
        <div className="mb-16 max-w-5xl mx-auto">
          <p className="text-xl md:text-2xl text-gray-300 mb-8 leading-relaxed animate-fade-in delay-600">
            Create, sign, and execute blockchain-powered agreements with unprecedented security and automation.
          </p>
          
          {/* Key benefits cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 animate-fade-in delay-800">
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/10 hover:border-white/30 transition-all duration-500 hover:scale-105 group">
              <Shield className="h-8 w-8 text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-lg font-semibold text-white mb-2">Military-Grade Security</h3>
              <p className="text-gray-400 text-sm">256-bit encryption with immutable blockchain records</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/10 hover:border-white/30 transition-all duration-500 hover:scale-105 group">
              <Zap className="h-8 w-8 text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-lg font-semibold text-white mb-2">Instant Execution</h3>
              <p className="text-gray-400 text-sm">Automated contract fulfillment without delays</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/20 rounded-2xl p-6 hover:bg-white/10 hover:border-white/30 transition-all duration-500 hover:scale-105 group">
              <Users className="h-8 w-8 text-cyan-400 mx-auto mb-3 group-hover:scale-110 transition-transform duration-300" />
              <h3 className="text-lg font-semibold text-white mb-2">Multi-Party Support</h3>
              <p className="text-gray-400 text-sm">Support for parties with optional mediation</p>
            </div>
          </div>
        </div>
        
        {/* Enhanced CTA buttons with better animations */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20 animate-fade-in delay-1000">
          <Button 
            size="lg" 
            onClick={() => navigate('/create-contract')}
            className="bg-gradient-to-r from-blue-600/90 via-purple-600/90 to-cyan-600/90 backdrop-blur-xl border-2 border-white/30 hover:from-blue-500 hover:via-purple-500 hover:to-cyan-500 hover:border-white/50 text-white px-12 py-6 text-lg font-semibold rounded-2xl shadow-2xl hover:shadow-blue-500/30 transition-all duration-500 hover:scale-110 hover:-translate-y-2 group relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <span className="relative z-10 flex items-center">
              Create Smart Contract Now
              <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
            </span>
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="border-2 border-white/40 bg-white/5 backdrop-blur-xl text-white hover:bg-white/15 hover:border-white/60 px-12 py-6 text-lg font-semibold rounded-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-1 group"
          >
            <Play className="mr-3 h-6 w-6 group-hover:scale-110 transition-transform duration-300" />
            Watch Demo
          </Button>
        </div>
        
        {/* Enhanced stats section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto animate-fade-in delay-1200">
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 hover:bg-white/15 hover:border-white/30 transition-all duration-500 hover:scale-105 hover:-translate-y-2 group">
            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-300 mb-3 group-hover:scale-110 transition-transform duration-300">256-bit</div>
            <div className="text-gray-300 text-lg font-medium">Encryption Standard</div>
            <div className="text-gray-500 text-sm mt-2">Bank-level security</div>
          </div>
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 hover:bg-white/15 hover:border-white/30 transition-all duration-500 hover:scale-105 hover:-translate-y-2 group">
            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-purple-300 mb-3 group-hover:scale-110 transition-transform duration-300">Instant</div>
            <div className="text-gray-300 text-lg font-medium">Contract Execution</div>
            <div className="text-gray-500 text-sm mt-2">No waiting periods</div>
          </div>
          <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 rounded-3xl p-8 hover:bg-white/15 hover:border-white/30 transition-all duration-500 hover:scale-105 hover:-translate-y-2 group">
            <div className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-300 mb-3 group-hover:scale-110 transition-transform duration-300">100%</div>
            <div className="text-gray-300 text-lg font-medium">Uptime Guarantee</div>
            <div className="text-gray-500 text-sm mt-2">Always available</div>
          </div>
        </div>
        
        {/* Process preview section */}
        <div className="mt-24 p-8 bg-gradient-to-r from-white/5 to-white/10 backdrop-blur-xl border border-white/20 rounded-3xl animate-fade-in delay-1400">
          <h3 className="text-2xl font-bold text-white mb-6">How It Works</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-500/20 rounded-full p-3 flex-shrink-0">
                <span className="text-blue-300 font-bold">1</span>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Input Details</h4>
                <p className="text-gray-400 text-sm">Enter party keys, terms, and attachments</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-purple-500/20 rounded-full p-3 flex-shrink-0">
                <span className="text-purple-300 font-bold">2</span>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Digital Signing</h4>
                <p className="text-gray-400 text-sm">Cryptographic signatures from all parties</p>
              </div>
            </div>
            <div className="flex items-start space-x-4">
              <div className="bg-cyan-500/20 rounded-full p-3 flex-shrink-0">
                <span className="text-cyan-300 font-bold">3</span>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Automatic Execution</h4>
                <p className="text-gray-400 text-sm">Smart contract fulfills terms instantly</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
