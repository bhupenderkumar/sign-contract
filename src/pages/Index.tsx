
import { HeroSection } from "@/components/HeroSection";
import { FeaturesSection } from "@/components/FeaturesSection";
import { HowItWorksSection } from "@/components/HowItWorksSection";
import { DynamicStatsTable } from "@/components/DynamicStatsTable";

import { ContractLookup } from "@/components/ContractLookup";
import { CTASection } from "@/components/CTASection";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <HeroSection />
      <FeaturesSection />
      <HowItWorksSection />
      <ContractLookup />
      
      <DynamicStatsTable />
      <CTASection />
    </div>
  );
};

export default Index;
