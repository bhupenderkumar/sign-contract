import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Settings,
  Database,
  Wallet,
  FileText,
  Copy,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  Zap,
  Users
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { useWallet } from '@/contexts/WalletContext';
import { getDevConfig, DEV_SAMPLE_KEYS } from '@/config/development';
import websocketService from '@/services/websocketService';
import apiService from '@/services/apiService';

export const DevPanel: React.FC = () => {
  const { toast } = useToast();
  const { publicKey, connected, balance, websocketConnected, solanaStatus } = useWallet();
  const [contractId, setContractId] = useState('');
  const [activateLoading, setActivateLoading] = useState(false);
  const [solanaStatusData, setSolanaStatusData] = useState<any>(null);
  const devConfig = getDevConfig();

  if (!devConfig) {
    return null; // Don't show in production
  }

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: `${label} copied to clipboard`,
      variant: "default",
    });
  };

  const testBackendHealth = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/health');
      const data = await response.json();
      
      toast({
        title: "Backend Health Check",
        description: `Status: ${data.status} | DB: ${data.services.database} | Solana: ${data.services.solana}`,
        variant: data.status === 'healthy' ? "default" : "destructive",
      });
    } catch (error) {
      toast({
        title: "Backend Error",
        description: "Failed to connect to backend",
        variant: "destructive",
      });
    }
  };

  const activateContract = async () => {
    if (!contractId.trim()) {
      toast({
        title: "Error",
        description: "Please enter a contract ID",
        variant: "destructive",
      });
      return;
    }

    setActivateLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/contracts/${contractId}/activate`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        toast({
          title: "Contract Activated",
          description: `Contract ${contractId} is now active and ready for signing`,
          variant: "default",
        });
      } else {
        const error = await response.json();
        toast({
          title: "Activation Failed",
          description: error.message || "Failed to activate contract",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to activate contract",
        variant: "destructive",
      });
    } finally {
      setActivateLoading(false);
    }
  };

  const testWebSocketConnection = async () => {
    try {
      if (!websocketService.isConnected()) {
        await websocketService.connect();
      }

      websocketService.ping();

      toast({
        title: "WebSocket Test",
        description: `Connection: ${websocketService.getConnectionState()} | Socket ID: ${websocketService.getSocketId()}`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "WebSocket Error",
        description: error.message || "Failed to test WebSocket connection",
        variant: "destructive",
      });
    }
  };

  const testSolanaStatus = async () => {
    try {
      const response = await apiService.getSolanaStatus();
      setSolanaStatusData(response);

      const healthyConnections = Object.values(response.solana || {}).filter((conn: any) => conn.healthy).length;
      const totalConnections = Object.keys(response.solana || {}).length;

      toast({
        title: "Solana Status",
        description: `${healthyConnections}/${totalConnections} connections healthy | ${response.websocket?.connectedClients || 0} WebSocket clients`,
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Solana Status Error",
        description: error.message || "Failed to get Solana status",
        variant: "destructive",
      });
    }
  };

  const clearSolanaCache = async () => {
    try {
      await apiService.clearSolanaCache();

      toast({
        title: "Cache Cleared",
        description: "Solana service cache has been cleared",
        variant: "default",
      });
    } catch (error) {
      toast({
        title: "Cache Clear Error",
        description: error.message || "Failed to clear cache",
        variant: "destructive",
      });
    }
  };

  const createSampleContract = async () => {
    try {
      const sampleData = {
        ...devConfig.sampleData,
        // Ensure all required fields are present
        additionalParties: devConfig.sampleData.additionalParties || [],
        expiryDate: null
      };

      console.log('🔧 Creating sample contract with data:', sampleData);

      const response = await fetch('http://localhost:3001/api/contracts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(sampleData),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Sample Contract Created",
          description: `Contract ID: ${result.contractId}`,
          variant: "default",
        });
        setContractId(result.contractId);
      } else {
        const error = await response.json();
        toast({
          title: "Creation Failed",
          description: error.message || "Failed to create sample contract",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create sample contract",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <Card className="w-80 bg-slate-900/95 border-slate-700 text-white backdrop-blur-sm">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center text-sm">
            <Settings className="h-4 w-4 mr-2" />
            Development Panel
          </CardTitle>
          <CardDescription className="text-slate-400 text-xs">
            Quick tools for development and testing
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Tabs defaultValue="wallet" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-slate-800">
              <TabsTrigger value="wallet" className="text-xs">Wallet</TabsTrigger>
              <TabsTrigger value="services" className="text-xs">Services</TabsTrigger>
              <TabsTrigger value="contracts" className="text-xs">Contracts</TabsTrigger>
              <TabsTrigger value="backend" className="text-xs">Backend</TabsTrigger>
            </TabsList>
            
            <TabsContent value="wallet" className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Status:</span>
                  <Badge variant={connected ? "default" : "destructive"} className="text-xs">
                    {connected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
                
                {connected && publicKey && (
                  <>
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400">Public Key:</span>
                      <div className="flex items-center gap-1">
                        <code className="text-xs bg-slate-800 px-1 rounded flex-1 truncate">
                          {publicKey.toString().slice(0, 20)}...
                        </code>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0"
                          onClick={() => copyToClipboard(publicKey.toString(), "Public Key")}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-slate-400">Balance:</span>
                      <span className="text-xs">{balance?.toFixed(4) || '0'} SOL</span>
                    </div>
                  </>
                )}
              </div>
              
              <div className="space-y-2">
                <span className="text-xs text-slate-400">Sample Keys:</span>
                {Object.entries(DEV_SAMPLE_KEYS).map(([name, key]) => (
                  <div key={name} className="flex items-center gap-1">
                    <code className="text-xs bg-slate-800 px-1 rounded flex-1 truncate">
                      {name}: {key.slice(0, 12)}...
                    </code>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => copyToClipboard(key, `${name} key`)}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="services" className="space-y-3">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">WebSocket:</span>
                  <Badge variant={websocketConnected ? "default" : "destructive"} className="text-xs">
                    {websocketConnected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Solana RPC:</span>
                  <Badge variant={solanaStatus ? "default" : "secondary"} className="text-xs">
                    {solanaStatus ? `${Object.values(solanaStatus).filter((conn: any) => conn.healthy).length}/${Object.keys(solanaStatus).length} Healthy` : "Unknown"}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  size="sm"
                  onClick={testWebSocketConnection}
                  className="text-xs bg-green-600 hover:bg-green-700"
                >
                  <Zap className="h-3 w-3 mr-1" />
                  Test WS
                </Button>

                <Button
                  size="sm"
                  onClick={testSolanaStatus}
                  className="text-xs bg-purple-600 hover:bg-purple-700"
                >
                  <Database className="h-3 w-3 mr-1" />
                  Solana Status
                </Button>
              </div>

              <Button
                size="sm"
                onClick={clearSolanaCache}
                className="w-full text-xs bg-orange-600 hover:bg-orange-700"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Clear Cache
              </Button>

              {solanaStatusData && (
                <div className="space-y-1">
                  <span className="text-xs text-slate-400">RPC Endpoints:</span>
                  <div className="space-y-1 max-h-20 overflow-y-auto">
                    {Object.entries(solanaStatusData.solana || {}).map(([index, conn]: [string, any]) => (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <span className="truncate flex-1">{conn.endpoint.split('//')[1]}</span>
                        <Badge variant={conn.healthy ? "default" : "destructive"} className="text-xs ml-1">
                          {conn.healthy ? "✓" : "✗"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            <TabsContent value="contracts" className="space-y-3">
              <Button
                size="sm"
                onClick={createSampleContract}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <FileText className="h-3 w-3 mr-1" />
                Create Sample Contract
              </Button>
              
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Activate Contract:</Label>
                <div className="flex gap-1">
                  <Input
                    value={contractId}
                    onChange={(e) => setContractId(e.target.value)}
                    placeholder="Contract ID"
                    className="text-xs h-8 bg-slate-800 border-slate-600"
                  />
                  <Button
                    size="sm"
                    onClick={activateContract}
                    disabled={activateLoading}
                    className="h-8 px-2"
                  >
                    {activateLoading ? (
                      <RefreshCw className="h-3 w-3 animate-spin" />
                    ) : (
                      <Zap className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="backend" className="space-y-3">
              <Button
                size="sm"
                onClick={testBackendHealth}
                className="w-full bg-green-600 hover:bg-green-700"
              >
                <Database className="h-3 w-3 mr-1" />
                Test Backend Health
              </Button>
              
              <div className="space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">API URL:</span>
                  <code className="bg-slate-800 px-1 rounded">localhost:3001</code>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Frontend:</span>
                  <code className="bg-slate-800 px-1 rounded">localhost:8082</code>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
