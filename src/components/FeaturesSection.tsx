
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, Zap, FileText, Bell, Smartphone } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Enterprise Security",
    description: "Bank-level encryption and security protocols to protect your sensitive contract data and ensure compliance with industry standards."
  },
  {
    icon: Users,
    title: "Multi-Party Collaboration",
    description: "Enable multiple parties to review, comment, and sign contracts with role-based permissions and approval workflows."
  },
  {
    icon: Zap,
    title: "Automated Execution",
    description: "Smart contracts automatically execute terms and conditions, reducing manual oversight and ensuring timely fulfillment."
  },
  {
    icon: FileText,
    title: "Document Management",
    description: "Centralized storage and version control for all contract documents with easy search and retrieval capabilities."
  },
  {
    icon: Bell,
    title: "Real-time Notifications",
    description: "Stay informed with instant notifications for contract status updates, approvals, deadlines, and renewals."
  },
  {
    icon: Smartphone,
    title: "Mobile Access",
    description: "Access and manage your contracts from anywhere with our responsive web interface and mobile-optimized experience."
  }
];

export const FeaturesSection = () => {
  return (
    <section className="py-20 px-6 bg-slate-800/50">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-white mb-6">
            Powerful Features for
            <span className="text-blue-400"> Modern Business</span>
          </h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Everything you need to manage contracts efficiently, securely, and professionally.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card 
              key={index} 
              className="bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all duration-300"
            >
              <CardContent className="p-6">
                <div className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-400 leading-relaxed">
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
