
import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { WalletProviderWrapper } from "@/contexts/WalletContext";
import { NetworkProvider } from "@/contexts/NetworkContext";

import BackendStatus from "./components/BackendStatus";
import Navigation from "./components/Navigation";
import Analytics, { trackPerformance } from "./components/Analytics";
import ErrorBoundary from "./components/ErrorBoundary";
import Index from "./pages/Index";
import ContractCreation from "./pages/ContractCreation";
import ContractDetails from "./pages/ContractDetails";
import Dashboard from "./pages/Dashboard";
import WebSocketDemo from "./pages/WebSocketDemo";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  // Initialize performance tracking
  React.useEffect(() => {
    trackPerformance();
  }, []);

  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <NetworkProvider>
          <WalletProviderWrapper>
            <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Analytics />
              <BackendStatus />
              <Navigation />
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/create-contract" element={<ContractCreation />} />
                <Route path="/contract/:id" element={<ContractDetails />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/websocket-demo" element={<WebSocketDemo />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
            </TooltipProvider>
          </WalletProviderWrapper>
        </NetworkProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
};

export default App;
