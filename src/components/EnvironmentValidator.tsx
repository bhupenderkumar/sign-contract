import React, { useEffect, useState } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, CheckCircle, RefreshCw, Shield, Globe } from 'lucide-react';
import { useNetwork } from '@/contexts/NetworkContext';
import { validateEnvironment, getEnvironmentInfo } from '@/config/environment';
import { useToast } from '@/components/ui/use-toast';

interface EnvironmentValidatorProps {
  showDetails?: boolean;
  className?: string;
}

export const EnvironmentValidator: React.FC<EnvironmentValidatorProps> = ({
  showDetails = false,
  className = ''
}) => {
  const { currentNetwork, networkConfig, environmentValid, environmentErrors } = useNetwork();
  const [backendStatus, setBackendStatus] = useState<any>(null);
  const [isChecking, setIsChecking] = useState(false);
  const { toast } = useToast();

  const checkBackendEnvironment = async () => {
    setIsChecking(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/environment`);
      const data = await response.json();
      setBackendStatus(data);
      
      if (!data.success) {
        toast({
          title: "Backend Environment Error",
          description: "Backend environment validation failed",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Failed to check backend environment:', error);
      setBackendStatus({ success: false, error: 'Failed to connect to backend' });
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkBackendEnvironment();
  }, [currentNetwork]);

  const frontendValidation = validateEnvironment();
  const hasErrors = !environmentValid || !frontendValidation.isValid || (backendStatus && !backendStatus.success);

  if (!showDetails && !hasErrors) {
    return null; // Don't show anything if everything is valid and details not requested
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Environment Status Summary */}
      <Card className="border-slate-600 bg-slate-800/50">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2 text-white">
            <Shield className="h-5 w-5" />
            <span>Environment Status</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={checkBackendEnvironment}
              disabled={isChecking}
              className="ml-auto"
            >
              <RefreshCw className={`h-4 w-4 ${isChecking ? 'animate-spin' : ''}`} />
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {/* Network Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Globe className="h-4 w-4 text-slate-400" />
              <span className="text-sm text-slate-300">Network:</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${networkConfig.color}`} />
              <Badge variant={networkConfig.isProduction ? "destructive" : "default"}>
                {networkConfig.displayName}
              </Badge>
              {networkConfig.isProduction && (
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
              )}
            </div>
          </div>

          {/* Frontend Validation */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Frontend Config:</span>
            <div className="flex items-center space-x-2">
              {frontendValidation.isValid ? (
                <CheckCircle className="h-4 w-4 text-green-500" />
              ) : (
                <AlertTriangle className="h-4 w-4 text-red-500" />
              )}
              <Badge variant={frontendValidation.isValid ? "default" : "destructive"}>
                {frontendValidation.isValid ? "Valid" : "Invalid"}
              </Badge>
            </div>
          </div>

          {/* Backend Validation */}
          <div className="flex items-center justify-between">
            <span className="text-sm text-slate-300">Backend Config:</span>
            <div className="flex items-center space-x-2">
              {backendStatus ? (
                backendStatus.success ? (
                  <CheckCircle className="h-4 w-4 text-green-500" />
                ) : (
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                )
              ) : (
                <RefreshCw className="h-4 w-4 text-slate-400 animate-spin" />
              )}
              <Badge variant={backendStatus?.success ? "default" : "destructive"}>
                {backendStatus ? (backendStatus.success ? "Valid" : "Invalid") : "Checking..."}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error Details */}
      {hasErrors && (
        <Alert className="border-red-500 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-500" />
          <AlertDescription className="text-red-200">
            <div className="space-y-2">
              <div className="font-medium">Environment Configuration Issues:</div>
              
              {/* Frontend Errors */}
              {!frontendValidation.isValid && (
                <div>
                  <div className="text-sm font-medium">Frontend:</div>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                    {frontendValidation.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Environment Context Errors */}
              {!environmentValid && (
                <div>
                  <div className="text-sm font-medium">Environment Context:</div>
                  <ul className="list-disc list-inside text-sm space-y-1 ml-2">
                    {environmentErrors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Backend Errors */}
              {backendStatus && !backendStatus.success && (
                <div>
                  <div className="text-sm font-medium">Backend:</div>
                  <div className="text-sm ml-2">{backendStatus.error}</div>
                </div>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Production Warning */}
      {networkConfig.isProduction && (
        <Alert className="border-yellow-500 bg-yellow-500/10">
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
          <AlertDescription className="text-yellow-200">
            <div className="font-medium">Production Network Active</div>
            <div className="text-sm mt-1">
              You are connected to {networkConfig.displayName}. Real SOL will be used for all transactions.
              Ensure you have sufficient balance and double-check all operations.
            </div>
          </AlertDescription>
        </Alert>
      )}

      {/* Detailed Environment Info */}
      {showDetails && backendStatus?.success && (
        <Card className="border-slate-600 bg-slate-800/50">
          <CardHeader className="pb-3">
            <CardTitle className="text-white text-sm">Environment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-slate-400">Frontend Network:</span>
                <div className="font-mono text-slate-300">{currentNetwork}</div>
              </div>
              <div>
                <span className="text-slate-400">Backend Network:</span>
                <div className="font-mono text-slate-300">
                  {backendStatus.requestNetwork || 'Unknown'}
                </div>
              </div>
              <div>
                <span className="text-slate-400">RPC Endpoint:</span>
                <div className="font-mono text-slate-300 truncate">
                  {networkConfig.rpcUrl.replace('https://', '')}
                </div>
              </div>
              <div>
                <span className="text-slate-400">Environment:</span>
                <div className="font-mono text-slate-300">
                  {backendStatus.environment?.nodeEnv || 'Unknown'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnvironmentValidator;
