import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/components/ui/use-toast";
import { useWallet } from '@/contexts/WalletContext';
import { 
  Plus, 
  Search, 
  Filter, 
  FileText, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Users,
  Calendar,
  ArrowRight,
  RefreshCw
} from "lucide-react";

interface ContractSummary {
  contractId: string;
  title: string;
  description: string;
  status: string;
  parties: Array<{
    name: string;
    email: string;
    publicKey: string;
    hasSigned: boolean;
  }>;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  signingProgress: {
    signed: number;
    total: number;
    percentage: number;
  };
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { publicKey, connected, connect } = useWallet();
  
  const [contracts, setContracts] = useState<ContractSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (connected && publicKey) {
      fetchUserContracts();
    } else {
      setLoading(false);
    }
  }, [connected, publicKey]);

  const fetchUserContracts = async () => {
    if (!publicKey) return;
    
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/contracts/user/${publicKey.toString()}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.contracts) {
          setContracts(data.contracts);
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch your contracts",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error fetching contracts:', error);
      toast({
        title: "Error",
        description: "Network error occurred",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchUserContracts();
    setRefreshing(false);
    toast({
      title: "Refreshed",
      description: "Contract list updated",
      variant: "default",
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'partially_signed': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'fully_signed': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'active': return 'Active';
      case 'partially_signed': return 'Partially Signed';
      case 'fully_signed': return 'Fully Signed';
      case 'completed': return 'Completed';
      case 'expired': return 'Expired';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const getUserRole = (contract: ContractSummary) => {
    if (!publicKey) return 'Unknown';
    
    const userParty = contract.parties.find(party => party.publicKey === publicKey.toString());
    if (!userParty) return 'Unknown';
    
    const isCreator = contract.parties[0].publicKey === publicKey.toString();
    return isCreator ? 'Creator' : 'Signatory';
  };

  const needsUserSignature = (contract: ContractSummary) => {
    if (!publicKey) return false;
    
    const userParty = contract.parties.find(party => party.publicKey === publicKey.toString());
    return userParty && !userParty.hasSigned && ['active', 'partially_signed'].includes(contract.status);
  };

  const filteredContracts = contracts.filter(contract => {
    const matchesSearch = contract.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         contract.contractId.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || contract.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const contractsByCategory = {
    needsSignature: filteredContracts.filter(needsUserSignature),
    active: filteredContracts.filter(c => ['active', 'partially_signed'].includes(c.status) && !needsUserSignature(c)),
    completed: filteredContracts.filter(c => ['fully_signed', 'completed'].includes(c.status)),
    other: filteredContracts.filter(c => !['active', 'partially_signed', 'fully_signed', 'completed'].includes(c.status))
  };

  if (!connected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="container mx-auto px-6 py-8">
          <div className="text-center py-20">
            <h1 className="text-4xl font-bold mb-4">Contract Dashboard</h1>
            <p className="text-slate-400 mb-8">Connect your wallet to view and manage your contracts</p>
            <Button onClick={connect} className="bg-blue-600 hover:bg-blue-700">
              Connect Wallet
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-white">Contract Dashboard</h1>
            <p className="text-slate-400 mt-2">Manage all your digital contracts in one place</p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              onClick={handleRefresh}
              disabled={refreshing}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              onClick={() => navigate('/create-contract')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create Contract
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Search contracts by title or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-slate-800 border-slate-600 text-white"
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48 bg-slate-800 border-slate-600 text-white">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="partially_signed">Partially Signed</SelectItem>
              <SelectItem value="fully_signed">Fully Signed</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="expired">Expired</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Loading your contracts...</p>
          </div>
        ) : (
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="bg-slate-800 border-slate-700">
              <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
                Overview
              </TabsTrigger>
              <TabsTrigger value="needs-signature" className="data-[state=active]:bg-slate-700">
                Needs Signature ({contractsByCategory.needsSignature.length})
              </TabsTrigger>
              <TabsTrigger value="active" className="data-[state=active]:bg-slate-700">
                Active ({contractsByCategory.active.length})
              </TabsTrigger>
              <TabsTrigger value="completed" className="data-[state=active]:bg-slate-700">
                Completed ({contractsByCategory.completed.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <AlertCircle className="h-8 w-8 text-red-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-slate-400">Needs Signature</p>
                        <p className="text-2xl font-bold text-white">{contractsByCategory.needsSignature.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <Clock className="h-8 w-8 text-blue-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-slate-400">Active</p>
                        <p className="text-2xl font-bold text-white">{contractsByCategory.active.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <CheckCircle className="h-8 w-8 text-green-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-slate-400">Completed</p>
                        <p className="text-2xl font-bold text-white">{contractsByCategory.completed.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                
                <Card className="bg-slate-800 border-slate-700">
                  <CardContent className="p-6">
                    <div className="flex items-center">
                      <FileText className="h-8 w-8 text-purple-500" />
                      <div className="ml-4">
                        <p className="text-sm font-medium text-slate-400">Total</p>
                        <p className="text-2xl font-bold text-white">{contracts.length}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Contracts */}
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <CardTitle className="text-white">Recent Contracts</CardTitle>
                </CardHeader>
                <CardContent>
                  {filteredContracts.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                      <p className="text-slate-400">No contracts found</p>
                      <Button
                        onClick={() => navigate('/create-contract')}
                        className="mt-4 bg-blue-600 hover:bg-blue-700"
                      >
                        Create Your First Contract
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredContracts.slice(0, 5).map((contract) => (
                        <div
                          key={contract.contractId}
                          className="flex items-center justify-between p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors cursor-pointer"
                          onClick={() => navigate(`/contract/${contract.contractId}`)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="font-semibold text-white">{contract.title}</h3>
                              <Badge className={getStatusColor(contract.status)}>
                                {getStatusText(contract.status)}
                              </Badge>
                              {needsUserSignature(contract) && (
                                <Badge className="bg-red-100 text-red-800 border-red-200">
                                  Action Required
                                </Badge>
                              )}
                            </div>
                            <p className="text-slate-400 text-sm mb-2">{contract.description}</p>
                            <div className="flex items-center gap-4 text-xs text-slate-500">
                              <span>ID: {contract.contractId}</span>
                              <span>Role: {getUserRole(contract)}</span>
                              <span>
                                <Users className="h-3 w-3 inline mr-1" />
                                {contract.signingProgress.signed}/{contract.signingProgress.total} signed
                              </span>
                              <span>
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {new Date(contract.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          <ArrowRight className="h-5 w-5 text-slate-400" />
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Other tab contents would be similar but filtered by category */}
            <TabsContent value="needs-signature">
              <ContractList 
                contracts={contractsByCategory.needsSignature} 
                title="Contracts Requiring Your Signature"
                emptyMessage="No contracts require your signature"
                onContractClick={(id) => navigate(`/contract/${id}`)}
                getUserRole={getUserRole}
                needsUserSignature={needsUserSignature}
              />
            </TabsContent>

            <TabsContent value="active">
              <ContractList 
                contracts={contractsByCategory.active} 
                title="Active Contracts"
                emptyMessage="No active contracts"
                onContractClick={(id) => navigate(`/contract/${id}`)}
                getUserRole={getUserRole}
                needsUserSignature={needsUserSignature}
              />
            </TabsContent>

            <TabsContent value="completed">
              <ContractList 
                contracts={contractsByCategory.completed} 
                title="Completed Contracts"
                emptyMessage="No completed contracts"
                onContractClick={(id) => navigate(`/contract/${id}`)}
                getUserRole={getUserRole}
                needsUserSignature={needsUserSignature}
              />
            </TabsContent>
          </Tabs>
        )}
      </div>
    </div>
  );
};

// Helper component for contract lists
const ContractList: React.FC<{
  contracts: ContractSummary[];
  title: string;
  emptyMessage: string;
  onContractClick: (id: string) => void;
  getUserRole: (contract: ContractSummary) => string;
  needsUserSignature: (contract: ContractSummary) => boolean;
}> = ({ contracts, title, emptyMessage, onContractClick, getUserRole, needsUserSignature }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'partially_signed': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'fully_signed': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 border-gray-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending';
      case 'active': return 'Active';
      case 'partially_signed': return 'Partially Signed';
      case 'fully_signed': return 'Fully Signed';
      case 'completed': return 'Completed';
      case 'expired': return 'Expired';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {contracts.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="h-12 w-12 text-slate-500 mx-auto mb-4" />
            <p className="text-slate-400">{emptyMessage}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {contracts.map((contract) => (
              <div
                key={contract.contractId}
                className="flex items-center justify-between p-4 bg-slate-700 rounded-lg hover:bg-slate-600 transition-colors cursor-pointer"
                onClick={() => onContractClick(contract.contractId)}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-white">{contract.title}</h3>
                    <Badge className={getStatusColor(contract.status)}>
                      {getStatusText(contract.status)}
                    </Badge>
                    {needsUserSignature(contract) && (
                      <Badge className="bg-red-100 text-red-800 border-red-200">
                        Action Required
                      </Badge>
                    )}
                  </div>
                  <p className="text-slate-400 text-sm mb-2">{contract.description}</p>
                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>ID: {contract.contractId}</span>
                    <span>Role: {getUserRole(contract)}</span>
                    <span>
                      <Users className="h-3 w-3 inline mr-1" />
                      {contract.signingProgress.signed}/{contract.signingProgress.total} signed
                    </span>
                    <span>
                      <Calendar className="h-3 w-3 inline mr-1" />
                      {new Date(contract.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-5 w-5 text-slate-400" />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default Dashboard;
