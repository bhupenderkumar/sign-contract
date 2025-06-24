
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Users, Zap, FileText, Bell, Smartphone } from "lucide-react";
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { CTASection } from "@/components/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <CTASection />
    </div>
  );
};

export default Index;
