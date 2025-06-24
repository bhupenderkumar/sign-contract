
import { Card, CardContent } from "@/components/ui/card";
import { FileText, UserCheck, Zap } from "lucide-react";

const steps = [
  {
    step: "01",
    icon: FileText,
    title: "Create Contract",
    description: "Draft your contract with terms, payment amounts, and conditions using our intuitive interface."
  },
  {
    step: "02",
    icon: UserCheck,
    title: "Multi-Party Approval",
    description: "Both parties review and digitally sign the contract. All signatures are recorded on the blockchain."
  },
  {
    step: "03",
    icon: Zap,
    title: "Automatic Execution",
    description: "Upon completion, smart contracts automatically release payments and update contract status."
  }
];

export const HowItWorksSection = () => {
  return (
    <section className="py-20 px-6 bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            How It Works
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Simple, secure, and efficient contract management in three easy steps.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
          {/* Connection lines for desktop */}
          <div className="hidden md:block absolute top-24 left-1/4 right-1/4 h-0.5 bg-gradient-to-r from-blue-300 to-purple-300"></div>
          
          {steps.map((step, index) => (
            <Card key={index} className="relative bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mx-auto mb-6 relative z-10">
                  <step.icon className="h-8 w-8 text-white" />
                </div>
                <div className="text-sm font-bold text-blue-600 mb-2">{step.step}</div>
                <h3 className="text-2xl font-bold text-gray-900 mb-4">
                  {step.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
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
