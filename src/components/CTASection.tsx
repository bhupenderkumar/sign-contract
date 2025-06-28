
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

const benefits = [
  "No setup fees",
  "Enterprise security",
  "24/7 support",
  "Cancel anytime"
];

export const CTASection = () => {
  return (
    <section className="py-20 px-6 bg-slate-800/50">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
          Ready to Get
          <span className="text-blue-400"> Started?</span>
        </h2>
        <p className="text-xl text-gray-300 mb-12 max-w-2xl mx-auto">
          Join thousands of businesses that trust our platform for their contract management needs.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button 
            size="lg" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300"
          >
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <Button 
            variant="outline" 
            size="lg" 
            className="border-2 border-white/30 bg-transparent text-white hover:bg-white/10 px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300"
          >
            Schedule Demo
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {benefits.map((benefit, index) => (
            <div 
              key={index} 
              className="flex items-center justify-center text-sm text-gray-300 bg-white/5 border border-white/10 rounded-lg p-3"
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
