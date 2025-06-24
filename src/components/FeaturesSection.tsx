
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, Zap, FileText, Bell, Smartphone } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Quantum-Safe Security",
    description: "Military-grade encryption with immutable blockchain records. Your contracts are protected by the most advanced cryptographic protocols."
  },
  {
    icon: Users,
    title: "Multi-Signature Workflow",
    description: "Sophisticated approval system requiring cryptographic signatures from all parties before contract execution begins."
  },
  {
    icon: Zap,
    title: "Lightning Execution",
    description: "Smart contracts execute automatically upon completion, releasing payments instantly without human intervention or delays."
  },
  {
    icon: FileText,
    title: "Distributed Storage",
    description: "Contract documents distributed across IPFS with blockchain references for ultimate redundancy and accessibility."
  },
  {
    icon: Bell,
    title: "Real-time Intelligence",
    description: "Advanced notification system with instant updates for contract status, approvals, and payment releases."
  },
  {
    icon: Smartphone,
    title: "Intuitive Interface",
    description: "Clean, modern dashboard designed for power users who demand both sophistication and simplicity."
  }
];

export const FeaturesSection = () => {
  return (
    <section className="py-32 px-6 relative">
      <div className="absolute inset-0 bg-black/10 backdrop-blur-sm" />
      
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl md:text-6xl font-bold text-white mb-8">
            Advanced
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400"> Features</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Built with cutting-edge blockchain technology for the next generation of contract management.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="group bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-blue-500/10"
            >
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-500/20 backdrop-blur-md border border-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-6 transition-all duration-300">
                  <feature.icon className="h-8 w-8 text-blue-300" />
                </div>
                <h3 className="text-xl font-bold text-white mb-4 group-hover:text-blue-300 transition-colors duration-300">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed group-hover:text-gray-300 transition-colors duration-300">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};
