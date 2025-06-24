
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, Zap, FileText, Bell, Smartphone } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Blockchain Security",
    description: "Contracts stored securely on Solana blockchain with immutable records and cryptographic protection."
  },
  {
    icon: Users,
    title: "Multi-Party Approval",
    description: "Streamlined workflow requiring both producer and consumer signatures before contract execution."
  },
  {
    icon: Zap,
    title: "Automatic Payments",
    description: "Smart contracts automatically release payments upon completion, eliminating manual processing."
  },
  {
    icon: FileText,
    title: "IPFS Integration",
    description: "Contract documents stored on IPFS with on-chain references for distributed, secure file management."
  },
  {
    icon: Bell,
    title: "Real-time Notifications",
    description: "Stay updated with instant notifications for contract updates, approvals, and payment releases."
  },
  {
    icon: Smartphone,
    title: "User-Friendly Interface",
    description: "Intuitive dashboard for managing all your agreements, tracking status, and handling approvals."
  }
];

export const FeaturesSection = () => {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="container mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-gray-900 mb-6">
            Why Choose Our Platform?
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Built on cutting-edge blockchain technology to revolutionize how contracts are created and managed.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <Card key={index} className="group hover:shadow-xl transition-all duration-300 hover:-translate-y-2 border-0 shadow-lg">
              <CardContent className="p-8">
                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                  <feature.icon className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-4">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
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
