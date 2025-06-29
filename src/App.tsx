
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProviderWrapper } from "@/contexts/WalletContext";

import BackendStatus from "./components/BackendStatus";
import Navigation from "./components/Navigation";
import { DevPanel } from "./components/DevPanel";
import Index from "./pages/Index";
import ContractCreation from "./pages/ContractCreation";
import ContractDetails from "./pages/ContractDetails";
import Dashboard from "./pages/Dashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <WalletProviderWrapper>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <BackendStatus />
          <Navigation />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/create-contract" element={<ContractCreation />} />
            <Route path="/contract/:id" element={<ContractDetails />} />
            <Route path="/dashboard" element={<Dashboard />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
          <DevPanel />
        </BrowserRouter>
      </TooltipProvider>
    </WalletProviderWrapper>
  </QueryClientProvider>
);

export default App;
