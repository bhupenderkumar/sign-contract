
import { Button } from "@/components/ui/button";
import { ArrowRight, Play } from "lucide-react";

export const HeroSection = () => {
  return (
    <section className="relative px-6 py-20 lg:py-32 overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 to-purple-600/10" />
      
      <div className="container mx-auto text-center relative z-10">
        <div className="inline-flex items-center px-4 py-2 bg-blue-100 rounded-full text-blue-700 text-sm font-medium mb-8 animate-fade-in">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          Powered by Solana Blockchain
        </div>
        
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-tight animate-fade-in">
          Smart Contracts,
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
            {" "}Simplified
          </span>
        </h1>
        
        <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-3xl mx-auto leading-relaxed animate-fade-in">
          Create, sign, and manage contract agreements on the blockchain. 
          Secure, transparent, and automated payments with multi-party approval workflows.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center animate-fade-in">
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            Get Started Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <Button variant="outline" size="lg" className="border-2 border-gray-300 hover:border-blue-500 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300 hover:bg-blue-50">
            <Play className="mr-2 h-5 w-5" />
            Watch Demo
          </Button>
        </div>
        
        <div className="mt-16 text-sm text-gray-500 animate-fade-in">
          Trusted by forward-thinking businesses • No setup fees • Cancel anytime
        </div>
      </div>
    </section>
  );
};
