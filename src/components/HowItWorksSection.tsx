
import { Card, CardContent } from "@/components/ui/card";
import { FileText, UserCheck, Zap } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: FileText,
    title: "Create Contract",
    description: "Use our intuitive interface to create professional contracts. Input party information, terms, and upload supporting documents."
  },
  {
    step: "02",
    icon: UserCheck,
    title: "Review & Sign",
    description: "All parties can review the contract details and provide secure digital signatures. Track the signing process in real-time."
  },
  {
    step: "03",
    icon: Zap,
    title: "Automatic Execution",
    description: "Once signed, the contract is automatically executed according to the agreed terms, with all actions recorded securely."
  }
];

export const HowItWorksSection = () => {
  return (
    <section className="py-20 px-6 bg-slate-900/50">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Simple
            <span className="text-blue-400"> Process</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto">
            Get your contracts signed and executed in three straightforward steps.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <Card 
              key={index} 
              className="bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300"
            >
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-6">
                  <step.icon className="h-8 w-8 text-blue-400" />
                </div>
                <div className="text-sm font-bold text-blue-400 mb-3">{step.step}</div>
                <h3 className="text-xl font-bold text-white mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
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
