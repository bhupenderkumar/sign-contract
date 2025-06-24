
import { Card, CardContent } from "@/components/ui/card";
import { FileText, UserCheck, Zap } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: FileText,
    title: "Draft Contract",
    description: "Create sophisticated contracts with advanced terms, multi-tier payment structures, and conditional logic using our AI-powered interface."
  },
  {
    step: "02",
    icon: UserCheck,
    title: "Cryptographic Approval",
    description: "All parties review and provide cryptographic signatures. Every interaction is recorded immutably on the Solana blockchain."
  },
  {
    step: "03",
    icon: Zap,
    title: "Autonomous Execution",
    description: "Smart contracts autonomously verify conditions and execute payments with sub-second finality and zero human intervention."
  }
];

export const HowItWorksSection = () => {
  return (
    <section className="py-32 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-black/10 backdrop-blur-sm" />
      
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
            How It
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400"> Works</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Three sophisticated steps to revolutionize your contract management workflow.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connection lines for desktop */}
          <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-400/30 via-purple-400/30 to-cyan-400/30"></div>
          
          {steps.map((step, index) => (
            <Card 
              key={index} 
              className="relative bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 group"
            >
              <CardContent className="p-10 text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-blue-500/20 via-purple-500/20 to-cyan-500/20 backdrop-blur-md border border-white/20 rounded-3xl flex items-center justify-center mx-auto mb-8 relative z-10 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <step.icon className="h-10 w-10 text-white" />
                </div>
                <div className="text-sm font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 mb-4 text-lg">{step.step}</div>
                <h3 className="text-2xl font-bold text-white mb-6 group-hover:text-blue-300 transition-colors duration-300">
                  {step.title}
                </h3>
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                  {step.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
