
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

const benefits = [
  "No setup fees or hidden costs",
  "Military-grade security",
  "24/7 AI-powered support",
  "Cancel anytime"
];

export const CTASection = () => {
  return (
    <section className="py-32 px-6 relative overflow-hidden">
      {/* Glassmorphism background with stronger effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-black/30 to-black/20 backdrop-blur-md" />
      
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-full h-full">
        <div className="absolute top-10 left-10 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-10 right-10 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-500"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-500/5 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>
      
      <div className="container mx-auto text-center relative z-10">
        <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
          Ready to Transform
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-cyan-400"> Everything?</span>
        </h2>
        <p className="text-xl text-gray-300 mb-12 max-w-3xl mx-auto">
          Join the revolution. Thousands of businesses are already using our platform to secure billions in contract value.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
          <Button 
            size="lg" 
            className="bg-gradient-to-r from-blue-600/80 via-purple-600/80 to-cyan-600/80 backdrop-blur-md border border-white/20 hover:from-blue-500/90 hover:via-purple-500/90 hover:to-cyan-500/90 text-white px-12 py-6 text-lg font-semibold rounded-2xl shadow-2xl hover:shadow-blue-500/25 transition-all duration-300 hover:scale-105 hover:-translate-y-1"
          >
            Start Your Journey
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="border-2 border-white/30 bg-white/5 backdrop-blur-md text-white hover:bg-white/10 hover:border-white/50 px-12 py-6 text-lg font-semibold rounded-2xl transition-all duration-300 hover:scale-105"
          >
            Schedule Private Demo
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="flex items-center justify-center text-sm text-gray-300 bg-white/5 backdrop-blur-md border border-white/10 rounded-xl p-4 hover:bg-white/10 hover:text-white transition-all duration-300"
            >
              <CheckCircle className="h-4 w-4 mr-2 text-green-400" />
              {benefit}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
