import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { useWallet } from '@/contexts/WalletContext';
import Breadcrumbs from '@/components/Breadcrumbs';
import walletTransactionService from '@/services/walletTransactionService';
import {
  ArrowLeft,
  FileText,
  Users,
  Clock,
  CheckCircle,
  AlertCircle,
  Shield,
  Copy,
  ExternalLink,
  Download,
  MessageSquare,
  Flag,
  Send,
  RefreshCw
} from "lucide-react";

interface ContractDetails {
  contractId: string;
  title: string;
  description: string;
  agreementText: string;
  structuredClauses: string[];
  parties: Array<{
    name: string;
    email: string;
    publicKey: string;
    hasSigned: boolean;
    signedAt?: string;
    signatureTransactionId?: string;
  }>;
  mediator?: {
    name: string;
    email: string;
  };
  useMediator: boolean;
  status: string;
  documentHash: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  auditLog: Array<{
    action: string;
    performedBy: string;
    timestamp: string;
    details: any;
  }>;
  blockchainInfo?: {
    network: string;
    programId: string;
    contractAddress?: string;
    transactionId?: string;
    explorerUrl?: string;
    contractExplorerUrl?: string;
    programExplorerUrl?: string;
    isBlockchainContract: boolean;
  };
}

const ContractDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { publicKey, connected, connect, signTransaction } = useWallet();
  
  const [contract, setContract] = useState<ContractDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState('');
  const [showDisputeModal, setShowDisputeModal] = useState(false);
  const [disputeForm, setDisputeForm] = useState({
    reason: '',
    description: '',
    evidence: ''
  });
  const [submittingDispute, setSubmittingDispute] = useState(false);
  const [isSyncingBlockchain, setIsSyncingBlockchain] = useState(false);

  useEffect(() => {
    if (id) {
      fetchContractDetails();
    }
  }, [id]);

  const fetchContractDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`http://localhost:3001/api/contracts/${id}`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.contract) {
          setContract(data.contract);
        } else {
          setError('Contract not found');
        }
      } else {
        setError('Failed to fetch contract details');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching contract:', err);
    } finally {
      setLoading(false);
    }
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
      case 'pending': return 'Pending Activation';
      case 'active': return 'Active - Awaiting Signatures';
      case 'partially_signed': return 'Partially Signed';
      case 'fully_signed': return 'Fully Signed';
      case 'completed': return 'Completed';
      case 'expired': return 'Expired';
      case 'cancelled': return 'Cancelled';
      default: return status;
    }
  };

  const canUserSign = () => {
    if (!contract || !connected || !publicKey) return false;
    
    const userParty = contract.parties.find(party => party.publicKey === publicKey.toString());
    return userParty && !userParty.hasSigned && ['active', 'partially_signed'].includes(contract.status);
  };

  const handleSign = async () => {
    if (!contract || !connected || !publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to sign the contract.",
        variant: "destructive",
      });
      return;
    }

    setSigning(true);
    try {
      // Use secure wallet signing (production-ready approach)
      const signingResult = await walletTransactionService.signContractSecurely(
        { publicKey, signMessage, signTransaction, connected } as any,
        contract.contractId
      );

      if (!signingResult.success) {
        toast({
          title: "Signing Failed",
          description: signingResult.error || "Failed to sign contract",
          variant: "destructive",
        });
        return;
      }

      // Send the signature proof to backend
      const response = await fetch(`http://localhost:3001/api/contracts/${contract.contractId}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signerPublicKey: publicKey.toString(),
          transactionId: signingResult.transactionId,
          signatureProof: true // Indicates this was signed with wallet
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Contract Signed Successfully!",
          description: "Your signature has been cryptographically verified and recorded.",
          variant: "default",
        });

        // Refresh contract details
        await fetchContractDetails();
      } else {
        const errorData = await response.json();
        toast({
          title: "Signing Failed",
          description: errorData.message || "Failed to record signature",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error signing contract:', error);
      toast({
        title: "Error",
        description: "An error occurred while signing the contract",
        variant: "destructive",
      });
    } finally {
      setSigning(false);
    }
  };

  const copyContractId = () => {
    if (contract) {
      navigator.clipboard.writeText(contract.contractId);
      toast({
        title: "Copied!",
        description: "Contract ID copied to clipboard",
        variant: "default",
      });
    }
  };

  const handleDownloadPDF = async () => {
    if (!contract) return;

    try {
      toast({
        title: "Generating PDF",
        description: "Please wait while we generate your contract PDF...",
      });

      const response = await fetch(`http://localhost:3001/api/contracts/${contract.contractId}/download-pdf`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate PDF');
      }

      // Get the PDF blob
      const blob = await response.blob();

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `contract_${contract.contractId}_${Date.now()}.pdf`;

      // Trigger download
      document.body.appendChild(link);
      link.click();

      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: "PDF Downloaded",
        description: "Your contract PDF has been downloaded successfully.",
      });

    } catch (error) {
      console.error('Error downloading PDF:', error);
      toast({
        title: "Download Failed",
        description: error instanceof Error ? error.message : "Failed to download PDF",
        variant: "destructive",
      });
    }
  };

  const handleRaiseDispute = async () => {
    if (!contract || !connected || !publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to raise a dispute.",
        variant: "destructive",
      });
      return;
    }

    if (!disputeForm.reason.trim() || !disputeForm.description.trim()) {
      toast({
        title: "Missing Information",
        description: "Please provide both reason and description for the dispute.",
        variant: "destructive",
      });
      return;
    }

    setSubmittingDispute(true);
    try {
      const response = await fetch(`http://localhost:3001/api/contracts/${contract.contractId}/disputes`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          raisedBy: publicKey.toString(),
          raisedByName: getUserName(),
          reason: disputeForm.reason,
          description: disputeForm.description,
          evidence: disputeForm.evidence ? [disputeForm.evidence] : []
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Dispute Raised Successfully",
          description: "Your dispute has been submitted and all parties have been notified.",
          variant: "default",
        });

        // Reset form and close modal
        setDisputeForm({ reason: '', description: '', evidence: '' });
        setShowDisputeModal(false);

        // Refresh contract details
        await fetchContractDetails();
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to Raise Dispute",
          description: errorData.message || "Failed to submit dispute",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error raising dispute:', error);
      toast({
        title: "Error",
        description: "An error occurred while raising the dispute",
        variant: "destructive",
      });
    } finally {
      setSubmittingDispute(false);
    }
  };

  const getUserName = () => {
    if (!contract || !publicKey) return 'Unknown';
    const party = contract.parties.find(p => p.publicKey === publicKey.toString());
    return party?.name || 'Unknown';
  };

  const handleSyncBlockchainStatus = async () => {
    if (!contract?.blockchainInfo?.isBlockchainContract) {
      toast({
        title: "Not a Blockchain Contract",
        description: "This contract is not deployed on the blockchain.",
        variant: "destructive",
      });
      return;
    }

    setIsSyncingBlockchain(true);
    try {
      const response = await fetch(`http://localhost:3001/api/contracts/${id}/sync-blockchain-status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const result = await response.json();
        if (result.updated) {
          toast({
            title: "Blockchain Status Updated",
            description: `Found ${result.updates.length} updates from blockchain: ${result.updates.join(', ')}`,
            variant: "default",
          });
          // Refresh contract data to show updates
          fetchContract();
        } else {
          toast({
            title: "No Updates Found",
            description: "Contract is already up to date with blockchain status.",
            variant: "default",
          });
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to sync blockchain status');
      }
    } catch (error) {
      console.error('Error syncing blockchain status:', error);
      toast({
        title: "Sync Error",
        description: error.message || "Failed to sync with blockchain. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSyncingBlockchain(false);
    }
  };

  const canRaiseDispute = () => {
    if (!contract || !connected || !publicKey) return false;

    // Check if user is a party to the contract
    const isParty = contract.parties.some(party => party.publicKey === publicKey.toString());
    if (!isParty) return false;

    // Check if contract is in a disputable state
    const disputableStates = ['active', 'partially_signed', 'fully_signed', 'completed'];
    return disputableStates.includes(contract.status);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading contract details...</p>
        </div>
      </div>
    );
  }

  if (error || !contract) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="container mx-auto px-6 py-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-slate-300 hover:bg-slate-700 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          
          <Card className="bg-red-50 border-red-200">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-red-800 mb-2">Contract Not Found</h2>
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="container mx-auto px-6 py-8">
        {/* Breadcrumbs */}
        <div className="mb-6">
          <Breadcrumbs
            items={[
              { label: 'Home', path: '/' },
              { label: 'Dashboard', path: '/dashboard' },
              { label: contract.title, path: `/contract/${contract.contractId}`, isActive: true }
            ]}
          />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-slate-300 hover:bg-slate-700 mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-white">{contract.title}</h1>
              <p className="text-slate-400 mt-2">{contract.description}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="flex items-center justify-end gap-2 mb-2">
              <Badge className={`${getStatusColor(contract.status)}`}>
                {getStatusText(contract.status)}
              </Badge>
              {contract.blockchainInfo?.isBlockchainContract && (
                <Badge className="bg-blue-600/20 text-blue-300 border-blue-600/30">
                  <Shield className="h-3 w-3 mr-1" />
                  Blockchain
                </Badge>
              )}
            </div>
            <div className="flex items-center justify-end gap-2 text-slate-400 text-sm mb-2">
              <span>ID: {contract.contractId}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={copyContractId}
                className="h-6 w-6 p-0"
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadPDF}
              className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
            >
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        {canUserSign() && (
          <div className="mb-6">
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-blue-800">Your Signature Required</h3>
                    <p className="text-blue-600 text-sm">This contract is waiting for your digital signature.</p>
                  </div>
                  <Button
                    onClick={connected ? handleSign : connect}
                    disabled={signing}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {signing ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Signing...
                      </>
                    ) : connected ? (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Sign Contract
                      </>
                    ) : (
                      <>
                        <Shield className="h-4 w-4 mr-2" />
                        Connect Wallet to Sign
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Dispute Button */}
        {canRaiseDispute() && (
          <div className="mb-6">
            <Card className="bg-red-50 border-red-200">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-red-800">Having Issues?</h3>
                    <p className="text-red-600 text-sm">If there are problems with this contract, you can raise a dispute.</p>
                  </div>
                  <Button
                    onClick={() => setShowDisputeModal(true)}
                    variant="outline"
                    className="border-red-300 text-red-700 hover:bg-red-50"
                  >
                    <Flag className="h-4 w-4 mr-2" />
                    Raise Dispute
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-slate-800 border-slate-700">
            <TabsTrigger value="overview" className="data-[state=active]:bg-slate-700">
              <FileText className="h-4 w-4 mr-2" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="parties" className="data-[state=active]:bg-slate-700">
              <Users className="h-4 w-4 mr-2" />
              Parties & Signatures
            </TabsTrigger>
            <TabsTrigger value="blockchain" className="data-[state=active]:bg-slate-700">
              <Shield className="h-4 w-4 mr-2" />
              Blockchain
            </TabsTrigger>
            <TabsTrigger value="timeline" className="data-[state=active]:bg-slate-700">
              <Clock className="h-4 w-4 mr-2" />
              Timeline
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Contract Agreement</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="prose prose-invert max-w-none">
                  <div className="whitespace-pre-wrap text-slate-300">
                    {contract.agreementText}
                  </div>
                </div>
                
                {contract.structuredClauses && contract.structuredClauses.length > 0 && (
                  <div className="mt-6">
                    <h4 className="text-lg font-semibold text-white mb-3">Contract Clauses</h4>
                    <div className="space-y-2">
                      {contract.structuredClauses.map((clause, index) => (
                        <div key={index} className="bg-slate-700 p-3 rounded-lg">
                          <span className="text-slate-400 text-sm">Clause {index + 1}:</span>
                          <p className="text-slate-300 mt-1">{clause || 'No clause text available'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="parties" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white">Contract Parties</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contract.parties && contract.parties.length > 0 ? (
                  contract.parties.map((party, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-700 rounded-lg">
                      <div>
                        <h4 className="font-semibold text-white">{party.name || 'Unknown Party'}</h4>
                        <p className="text-slate-400 text-sm">{party.email || 'No email provided'}</p>
                        <p className="text-slate-500 text-xs font-mono">{party.publicKey || 'No public key'}</p>
                      </div>
                      <div className="text-right">
                        {party.hasSigned ? (
                          <div>
                            <Badge className="bg-green-100 text-green-800 border-green-200 mb-1">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Signed
                            </Badge>
                            {party.signedAt && (
                            <p className="text-slate-400 text-xs">
                              {new Date(party.signedAt).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      ) : (
                        <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">
                          <Clock className="h-3 w-3 mr-1" />
                          Pending
                        </Badge>
                      )}
                    </div>
                  </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-slate-500 mx-auto mb-4" />
                    <p className="text-slate-400">No parties information available</p>
                  </div>
                )}

                {contract.useMediator && contract.mediator && (
                  <div className="mt-6 p-4 bg-purple-900/20 border border-purple-700 rounded-lg">
                    <h4 className="font-semibold text-purple-300 mb-2">Mediator</h4>
                    <p className="text-white">{contract.mediator.name}</p>
                    <p className="text-slate-400 text-sm">{contract.mediator.email}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="timeline" className="space-y-6">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-blue-400" />
                  Contract Timeline & Audit Log
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {contract.auditLog && contract.auditLog.length > 0 ? (
                    <div className="relative">
                      {/* Timeline line */}
                      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-slate-600"></div>

                      {contract.auditLog.map((entry, index) => {
                        const getActionIcon = (action: string) => {
                          if (action.includes('created')) return <FileText className="h-4 w-4 text-green-400" />;
                          if (action.includes('signed')) return <CheckCircle className="h-4 w-4 text-blue-400" />;
                          if (action.includes('blockchain') || action.includes('onchain')) return <Shield className="h-4 w-4 text-purple-400" />;
                          if (action.includes('dispute')) return <AlertCircle className="h-4 w-4 text-red-400" />;
                          return <Clock className="h-4 w-4 text-slate-400" />;
                        };

                        const getActionColor = (action: string) => {
                          if (action.includes('created')) return 'border-green-400 bg-green-400/10';
                          if (action.includes('signed')) return 'border-blue-400 bg-blue-400/10';
                          if (action.includes('blockchain') || action.includes('onchain')) return 'border-purple-400 bg-purple-400/10';
                          if (action.includes('dispute')) return 'border-red-400 bg-red-400/10';
                          return 'border-slate-400 bg-slate-400/10';
                        };

                        const formatActionTitle = (action: string) => {
                          const actionMap: { [key: string]: string } = {
                            'contract_created': 'Contract Created',
                            'contract_created_onchain': 'Contract Deployed to Blockchain',
                            'contract_signed': 'Contract Signed',
                            'contract_signed_onchain': 'Contract Signed on Blockchain',
                            'dispute_raised': 'Dispute Raised',
                            'dispute_resolved': 'Dispute Resolved',
                            'contract_completed': 'Contract Completed'
                          };
                          return actionMap[action] || action?.replace(/_/g, ' ').toUpperCase() || 'Unknown Action';
                        };

                        return (
                          <div key={index} className="relative flex items-start space-x-4 pb-6">
                            {/* Timeline dot */}
                            <div className={`relative z-10 flex items-center justify-center w-8 h-8 rounded-full border-2 ${getActionColor(entry.action)}`}>
                              {getActionIcon(entry.action)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <h4 className="text-white font-semibold text-sm">
                                      {formatActionTitle(entry.action)}
                                    </h4>
                                    <p className="text-slate-400 text-sm mt-1">
                                      Performed by: <span className="text-slate-300">{entry.performedBy || 'System'}</span>
                                    </p>
                                    <p className="text-slate-500 text-xs mt-1">
                                      {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : 'Unknown time'}
                                    </p>
                                  </div>
                                </div>

                                {/* Action details */}
                                {entry.details && Object.keys(entry.details).length > 0 && (
                                  <div className="mt-3 pt-3 border-t border-slate-600">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                                      {Object.entries(entry.details).map(([key, value]) => (
                                        <div key={key} className="flex justify-between">
                                          <span className="text-slate-400 capitalize">{key.replace(/_/g, ' ')}:</span>
                                          <span className="text-slate-300 font-mono">
                                            {typeof value === 'string' && value.length > 20
                                              ? `${value.substring(0, 20)}...`
                                              : String(value)
                                            }
                                          </span>
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="h-16 w-16 text-slate-500 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-slate-300 mb-2">No Timeline Events</h3>
                      <p className="text-slate-400">Contract events and signatures will appear here as they happen.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="blockchain" className="space-y-6">
              <Card className="bg-slate-800 border-slate-700">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-white flex items-center">
                      <Shield className="h-5 w-5 mr-2 text-blue-400" />
                      Blockchain Information
                    </CardTitle>
                    {contract.blockchainInfo?.isBlockchainContract && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleSyncBlockchainStatus}
                        disabled={isSyncingBlockchain}
                        className="bg-blue-600/20 border-blue-600/30 text-blue-300 hover:bg-blue-600/30"
                      >
                        {isSyncingBlockchain ? (
                          <>
                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-300 mr-2"></div>
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="h-3 w-3 mr-2" />
                            Sync from Blockchain
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="space-y-6">
                  {contract.blockchainInfo?.isBlockchainContract ? (
                    <>
                      {/* Network Information */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <Label className="text-slate-400 text-sm">Network</Label>
                        <div className="flex items-center mt-1">
                          <Badge className="bg-blue-600/20 text-blue-300 border-blue-600/30">
                            Solana {contract.blockchainInfo.network}
                          </Badge>
                        </div>
                      </div>

                      <div>
                        <Label className="text-slate-400 text-sm">Program ID</Label>
                        <div className="flex items-center mt-1 space-x-2">
                          <code className="bg-slate-700 px-3 py-2 rounded text-green-400 text-sm font-mono flex-1">
                            {contract.blockchainInfo.programId}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              navigator.clipboard.writeText(contract.blockchainInfo.programId);
                              toast({
                                title: "Copied!",
                                description: "Program ID copied to clipboard",
                                variant: "default",
                              });
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>

                      {contract.blockchainInfo.contractAddress && (
                        <div>
                          <Label className="text-slate-400 text-sm">Contract Address</Label>
                          <div className="flex items-center mt-1 space-x-2">
                            <code className="bg-slate-700 px-3 py-2 rounded text-green-400 text-sm font-mono flex-1">
                              {contract.blockchainInfo.contractAddress}
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(contract.blockchainInfo.contractAddress);
                                toast({
                                  title: "Copied!",
                                  description: "Contract address copied to clipboard",
                                  variant: "default",
                                });
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="space-y-4">
                      {contract.blockchainInfo.transactionId && (
                        <div>
                          <Label className="text-slate-400 text-sm">Transaction ID</Label>
                          <div className="flex items-center mt-1 space-x-2">
                            <code className="bg-slate-700 px-3 py-2 rounded text-green-400 text-sm font-mono flex-1">
                              {contract.blockchainInfo.transactionId.length > 20
                                ? `${contract.blockchainInfo.transactionId.substring(0, 20)}...`
                                : contract.blockchainInfo.transactionId
                              }
                            </code>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                navigator.clipboard.writeText(contract.blockchainInfo.transactionId);
                                toast({
                                  title: "Copied!",
                                  description: "Transaction ID copied to clipboard",
                                  variant: "default",
                                });
                              }}
                              className="h-8 w-8 p-0"
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      )}

                      <div>
                        <Label className="text-slate-400 text-sm">Blockchain Explorer</Label>
                        <div className="mt-1 space-y-2">
                          {contract.blockchainInfo.explorerUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(contract.blockchainInfo.explorerUrl, '_blank')}
                              className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 mr-2"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Transaction
                            </Button>
                          )}
                          {contract.blockchainInfo.contractExplorerUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(contract.blockchainInfo.contractExplorerUrl, '_blank')}
                              className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600 mr-2"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Contract
                            </Button>
                          )}
                          {contract.blockchainInfo.programExplorerUrl && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(contract.blockchainInfo.programExplorerUrl, '_blank')}
                              className="bg-slate-700 border-slate-600 text-slate-300 hover:bg-slate-600"
                            >
                              <ExternalLink className="h-4 w-4 mr-2" />
                              View Program
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Validation Information */}
                  <div className="border-t border-slate-700 pt-6">
                    <h4 className="text-lg font-semibold text-white mb-4">Validation Information</h4>
                    <div className="bg-slate-700/50 rounded-lg p-4 space-y-3">
                      <div className="flex items-center text-green-400">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span className="font-medium">Contract deployed on Solana blockchain</span>
                      </div>
                      <div className="flex items-center text-green-400">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span className="font-medium">Immutable and tamper-proof</span>
                      </div>
                      <div className="flex items-center text-green-400">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        <span className="font-medium">Cryptographically secured</span>
                      </div>
                      <div className="text-slate-400 text-sm mt-3">
                        You can verify this contract on the Solana {contract.blockchainInfo.network} network using the Program ID above.
                        All transactions and signatures are permanently recorded on the blockchain.
                      </div>
                    </div>
                  </div>
                    </>
                  ) : (
                    /* Non-Blockchain Contract Information */
                    <div className="text-center py-12">
                      <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-700 rounded-full mb-4">
                        <Shield className="h-8 w-8 text-slate-400" />
                      </div>
                      <h3 className="text-lg font-medium text-slate-300 mb-2">Regular Contract</h3>
                      <p className="text-slate-400 mb-6">
                        This contract is stored in our database but not deployed on the blockchain.
                      </p>

                      {/* Show Program ID for reference */}
                      <div className="bg-slate-700/50 rounded-lg p-4 mb-6">
                        <h4 className="text-sm font-medium text-slate-300 mb-2">Available Blockchain Program</h4>
                        <div className="flex items-center justify-center space-x-2">
                          <code className="bg-slate-700 px-3 py-2 rounded text-green-400 text-sm font-mono">
                            {contract.blockchainInfo?.programId || 'Program ID not available'}
                          </code>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (contract.blockchainInfo?.programId) {
                                navigator.clipboard.writeText(contract.blockchainInfo.programId);
                                toast({
                                  title: "Copied!",
                                  description: "Program ID copied to clipboard",
                                  variant: "default",
                                });
                              }
                            }}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                        <p className="text-xs text-slate-500 mt-2">
                          Solana {contract.blockchainInfo?.network || 'devnet'} Program ID
                        </p>
                      </div>

                      <div className="text-left bg-slate-700/30 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-slate-300 mb-3">To deploy this contract on blockchain:</h4>
                        <ol className="text-sm text-slate-400 space-y-2">
                          <li className="flex items-start">
                            <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">1</span>
                            Create a new contract with "Deploy to Solana Blockchain" enabled
                          </li>
                          <li className="flex items-start">
                            <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">2</span>
                            Connect your wallet during contract creation
                          </li>
                          <li className="flex items-start">
                            <span className="bg-blue-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs mr-2 mt-0.5">3</span>
                            Complete the blockchain deployment process
                          </li>
                        </ol>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
        </Tabs>
      </div>

      {/* Dispute Modal */}
      <Dialog open={showDisputeModal} onOpenChange={setShowDisputeModal}>
        <DialogContent className="sm:max-w-[500px] bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center">
              <Flag className="h-5 w-5 mr-2 text-red-400" />
              Raise a Dispute
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="dispute-reason" className="text-slate-300">
                Dispute Reason *
              </Label>
              <Select
                value={disputeForm.reason}
                onValueChange={(value) => setDisputeForm(prev => ({ ...prev, reason: value }))}
              >
                <SelectTrigger className="bg-slate-700 border-slate-600 text-white">
                  <SelectValue placeholder="Select a reason for the dispute" />
                </SelectTrigger>
                <SelectContent className="bg-slate-700 border-slate-600">
                  <SelectItem value="breach_of_contract">Breach of Contract</SelectItem>
                  <SelectItem value="payment_issues">Payment Issues</SelectItem>
                  <SelectItem value="delivery_problems">Delivery Problems</SelectItem>
                  <SelectItem value="quality_concerns">Quality Concerns</SelectItem>
                  <SelectItem value="timeline_delays">Timeline Delays</SelectItem>
                  <SelectItem value="miscommunication">Miscommunication</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispute-description" className="text-slate-300">
                Description *
              </Label>
              <Textarea
                id="dispute-description"
                value={disputeForm.description}
                onChange={(e) => setDisputeForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Please provide a detailed description of the issue..."
                className="bg-slate-700 border-slate-600 text-white min-h-[100px]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="dispute-evidence" className="text-slate-300">
                Evidence (Optional)
              </Label>
              <Textarea
                id="dispute-evidence"
                value={disputeForm.evidence}
                onChange={(e) => setDisputeForm(prev => ({ ...prev, evidence: e.target.value }))}
                placeholder="Any supporting evidence, links, or additional information..."
                className="bg-slate-700 border-slate-600 text-white"
              />
            </div>

            <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3">
              <p className="text-yellow-300 text-sm">
                <strong>Note:</strong> Raising a dispute will notify all parties and may pause contract execution.
                Please ensure you have attempted to resolve the issue directly before proceeding.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setShowDisputeModal(false);
                setDisputeForm({ reason: '', description: '', evidence: '' });
              }}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={handleRaiseDispute}
              disabled={submittingDispute || !disputeForm.reason || !disputeForm.description}
              className="bg-red-600 hover:bg-red-700"
            >
              {submittingDispute ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Submitting...
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Submit Dispute
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ContractDetails;
