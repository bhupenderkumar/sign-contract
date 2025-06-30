import React, { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ChevronDown, Globe, AlertTriangle, CheckCircle } from 'lucide-react';
import { 
  SolanaNetwork, 
  NetworkConfig, 
  NETWORK_CONFIGS, 
  getCurrentNetwork, 
  getNetworkConfig 
} from '@/config/environment';
import { useToast } from '@/components/ui/use-toast';

interface NetworkSelectorProps {
  onNetworkChange?: (network: SolanaNetwork) => void;
  showFullSelector?: boolean;
  className?: string;
}

export const NetworkSelector: React.FC<NetworkSelectorProps> = ({
  onNetworkChange,
  showFullSelector = true,
  className = ''
}) => {
  const [selectedNetwork, setSelectedNetwork] = useState<SolanaNetwork>(getCurrentNetwork());
  const [isChanging, setIsChanging] = useState(false);
  const { toast } = useToast();

  const currentConfig = getNetworkConfig(selectedNetwork);

  const handleNetworkChange = async (network: SolanaNetwork) => {
    if (network === selectedNetwork) return;

    setIsChanging(true);
    
    try {
      // Show warning for production networks
      if (NETWORK_CONFIGS[network].isProduction) {
        toast({
          title: "⚠️ Production Network Selected",
          description: "You are switching to a production network. Real SOL will be used for transactions.",
          variant: "destructive",
        });
      }

      setSelectedNetwork(network);
      
      // Call the callback if provided
      if (onNetworkChange) {
        await onNetworkChange(network);
      }

      toast({
        title: "Network Changed",
        description: `Switched to ${NETWORK_CONFIGS[network].displayName}`,
        variant: "default",
      });

    } catch (error) {
      console.error('Error changing network:', error);
      toast({
        title: "Network Change Failed",
        description: "Failed to switch networks. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsChanging(false);
    }
  };

  // Simple network indicator (for compact display)
  if (!showFullSelector) {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <div className={`w-2 h-2 rounded-full ${currentConfig.color}`} />
        <span className="text-sm font-medium text-slate-300">
          {currentConfig.displayName}
        </span>
        {currentConfig.isProduction && (
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-3 ${className}`}>
      {/* Network Status Indicator */}
      <div className="flex items-center space-x-2">
        <div className={`w-3 h-3 rounded-full ${currentConfig.color} animate-pulse`} />
        <span className="text-sm text-slate-400">Network:</span>
      </div>

      {/* Network Selector Dropdown */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isChanging}
            className="border-slate-600 text-slate-300 hover:bg-slate-700 min-w-[120px]"
          >
            <Globe className="h-4 w-4 mr-2" />
            {currentConfig.displayName}
            <ChevronDown className="h-4 w-4 ml-2" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {Object.entries(NETWORK_CONFIGS).map(([key, config]) => (
            <DropdownMenuItem
              key={key}
              onClick={() => handleNetworkChange(key as SolanaNetwork)}
              className="flex items-center justify-between"
            >
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${config.color}`} />
                <span>{config.displayName}</span>
                {config.isProduction && (
                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                )}
              </div>
              {selectedNetwork === key && (
                <CheckCircle className="h-4 w-4 text-green-500" />
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Production Warning Badge */}
      {currentConfig.isProduction && (
        <Badge variant="destructive" className="text-xs">
          LIVE
        </Badge>
      )}
    </div>
  );
};

// Network Status Component (for detailed display)
export const NetworkStatus: React.FC<{ className?: string }> = ({ className = '' }) => {
  const currentNetwork = getCurrentNetwork();
  const config = getNetworkConfig(currentNetwork);

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">Current Network:</span>
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${config.color}`} />
          <span className="text-sm font-medium text-white">{config.displayName}</span>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <span className="text-sm text-slate-400">RPC Endpoint:</span>
        <span className="text-xs text-slate-300 font-mono">
          {config.rpcUrl.replace('https://', '')}
        </span>
      </div>

      {config.isProduction && (
        <Alert className="border-yellow-500 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-200">
            You are connected to a production network. Real SOL will be used for transactions.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default NetworkSelector;
