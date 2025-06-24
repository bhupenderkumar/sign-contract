
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle } from "lucide-react";

const benefits = [
  "No setup fees or hidden costs",
  "Blockchain-secured transactions",
  "24/7 customer support",
  "Cancel anytime"
];

export const CTASection = () => {
  return (
    <section className="py-20 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
      <div className="container mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-bold mb-6">
          Ready to Transform Your Contracts?
        </h2>
        <p className="text-xl mb-10 max-w-2xl mx-auto opacity-90">
          Join hundreds of businesses already using blockchain technology to streamline their contract management.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
          <Button size="lg" variant="secondary" className="bg-white text-blue-600 hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            Start Free Trial
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          
          <Button variant="outline" size="lg" className="border-2 border-white text-white hover:bg-white hover:text-blue-600 px-8 py-4 text-lg font-semibold rounded-xl transition-all duration-300">
            Schedule Demo
          </Button>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center justify-center text-sm opacity-90">
              <CheckCircle className="h-4 w-4 mr-2 text-green-300" />
              {benefit}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
