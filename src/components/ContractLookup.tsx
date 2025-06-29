import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, FileText, Calendar, Users, Download, Eye, Link, Wallet } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { useWallet } from '@/contexts/WalletContext';
import { getDevConfig, isDevelopment } from '@/config/development';

interface Attachment {
  fileName: string;
  ipfsHash: string;
}

interface ContractInfo {
  contractId: string;
  contractTitle: string;
  contractDescription: string;
  party1Name: string;
  party1Email: string;
  party1PublicKey: string;
  party2Name: string;
  party2Email: string;
  party2PublicKey: string;
  additionalParties: Array<{name: string; email: string; publicKey: string;}>;
  mediatorName?: string;
  mediatorEmail?: string;
  useMediator: boolean;
  agreementText: string;
  structuredClauses: string[];
  attachments: Attachment[];
  solanaTransactionId?: string;
  status: 'pending' | 'active' | 'partially_signed' | 'fully_signed' | 'ipfs_uploaded' | 'solana_created' | 'signed' | 'completed' | 'expired' | 'solana_failed';
  createdAt: string;
  updatedAt?: string;
  documentHash?: string;
}

export const ContractLookup = () => {
  const [contractId, setContractId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [error, setError] = useState('');
  const { toast } = useToast();
  const { publicKey, connected, connect } = useWallet();
  const devConfig = getDevConfig();

  // Development helper to load sample contract
  const loadSampleContract = () => {
    if (!devConfig) return;

    const sampleContract = devConfig.utils.getSampleContractLookup();
    setContractInfo(sampleContract);
    setContractId(sampleContract.contractId);
    setError('');

    toast({
      title: "Sample Contract Loaded",
      description: "Development sample contract data has been loaded.",
      variant: "default",
    });
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractId.trim()) {
      setError('Please enter a contract ID');
      return;
    }

    setIsSearching(true);
    setError('');
    setContractInfo(null);
    
    try {
      console.log('🔍 Searching for contract:', contractId.trim());
      const response = await fetch(`http://localhost:3001/api/contracts/${contractId.trim()}`);

      console.log('📡 Response status:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('📄 Contract data received:', data);

        if (data.success && data.contract) {
          // Transform the API response to match our interface
          const transformedData: ContractInfo = {
            contractId: data.contract.contractId,
            contractTitle: data.contract.title,
            contractDescription: data.contract.description,
            party1Name: data.contract.parties[0]?.name || '',
            party1Email: data.contract.parties[0]?.email || '',
            party1PublicKey: data.contract.parties[0]?.publicKey || '',
            party2Name: data.contract.parties[1]?.name || '',
            party2Email: data.contract.parties[1]?.email || '',
            party2PublicKey: data.contract.parties[1]?.publicKey || '',
            additionalParties: data.contract.parties.slice(2) || [],
            mediatorName: data.contract.mediator?.name || '',
            mediatorEmail: data.contract.mediator?.email || '',
            useMediator: data.contract.useMediator || false,
            agreementText: data.contract.agreementText || '',
            structuredClauses: data.contract.structuredClauses || [],
            attachments: data.contract.attachments || [],
            status: data.contract.status,
            createdAt: data.contract.createdAt,
            updatedAt: data.contract.updatedAt,
            documentHash: data.contract.documentHash
          };

          setContractInfo(transformedData);

          toast({
            title: "Contract Found!",
            description: `Loaded contract: ${data.contract.title}`,
            variant: "default",
          });
        } else {
          setError('Invalid response format from server');
          console.error('❌ Invalid response format:', data);
        }
      } else {
        const errorData = await response.json();
        const errorMessage = errorData.message || 'Contract not found';
        setError(errorMessage);
        console.error('❌ API Error:', errorData);

        toast({
          title: "Contract Not Found",
          description: errorMessage,
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error('❌ Search error:', err);
      const errorMessage = 'Failed to search for contract. Please check your connection.';
      setError(errorMessage);

      toast({
        title: "Search Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'ipfs_uploaded': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'solana_created': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'signed': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      case 'solana_failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pending Creation';
      case 'ipfs_uploaded': return 'IPFS Uploaded';
      case 'solana_created': return 'Solana Contract Created';
      case 'signed': return 'Fully Signed';
      case 'completed': return 'Completed';
      case 'expired': return 'Expired';
      case 'solana_failed': return 'Solana Creation Failed';
      default: return 'Unknown';
    }
  };

  const handleSignContract = async (contractId: string) => {
    // Check if wallet is connected
    if (!connected || !publicKey) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet to sign the contract.",
        variant: "destructive",
      });
      try {
        await connect();
      } catch (error) {
        console.error('Failed to connect wallet:', error);
        return;
      }
    }

    try {
      // Generate a mock transaction ID for now (in real implementation, this would come from Solana transaction)
      const mockTransactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      const response = await fetch(`http://localhost:3001/api/contracts/${contractId}/sign`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signerPublicKey: publicKey?.toString() || '',
          transactionId: mockTransactionId
        }),
      });

      if (response.ok) {
        const result = await response.json();
        toast({
          title: "Contract Signed!",
          description: `Transaction ID: ${result.txId}`,
          variant: "default",
        });
        // Optionally, re-fetch contract info to update status
        if (contractInfo) {
          setContractInfo({ ...contractInfo, status: result.contract.status });
        }
      } else {
        const errorData = await response.json();
        toast({
          title: "Failed to Sign Contract",
          description: errorData.message || "An unknown error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error signing contract:', error);
      toast({
        title: "Signing Error",
        description: "An error occurred while signing the contract. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadPDF = async (contractId: string) => {
    try {
      toast({
        title: "Generating PDF",
        description: "Please wait while we generate your contract PDF...",
      });

      const response = await fetch(`http://localhost:3001/api/contracts/${contractId}/download-pdf`);

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
      link.download = `contract_${contractId}_${Date.now()}.pdf`;

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

  return (
      <><section className="py-20 px-6 bg-white">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-800 mb-4">
            Find Your Contract
          </h2>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Enter your contract ID to view status, download documents, and track progress
          </p>
        </div>

        {/* Search Form */}
        <Card className="mb-8 border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center text-slate-800">
              <Search className="h-5 w-5 mr-2" />
              Contract Lookup
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="contractId" className="text-slate-700">
                  Contract ID or Reference Number
                </Label>
                <Input
                  id="contractId"
                  value={contractId}
                  onChange={(e) => setContractId(e.target.value)}
                  placeholder="Enter your contract ID (e.g., CON-2024-001234)"
                  className="border-slate-300 focus:border-blue-500" />
                <p className="text-sm text-slate-500">
                  You can find your contract ID in the email notification sent when the contract was created
                </p>
              </div>

              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}

              <div className="flex gap-3">
                <Button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={isSearching}
                >
                  {isSearching ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Find Contract
                    </>
                  )}
                </Button>

                {devConfig && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={loadSampleContract}
                    className="bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    Load Sample
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Contract Results */}
        {contractInfo && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-slate-800 mb-2">{contractInfo.contractTitle}</CardTitle>
                  <p className="text-slate-600">{contractInfo.contractDescription}</p>
                </div>
                <div className={`px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(contractInfo.status)}`}>
                  {getStatusText(contractInfo.status)}
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Contract Details */}
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center text-slate-700">
                    <FileText className="h-4 w-4 mr-2" />
                    <span className="font-medium">Contract ID:</span>
                    <span className="ml-2 font-mono text-sm">{contractInfo.contractId}</span>
                  </div>

                  <div className="flex items-center text-slate-700">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="font-medium">Created:</span>
                    <span className="ml-2">{new Date(contractInfo.createdAt).toLocaleDateString()}</span>
                  </div>

                  <div className="flex items-center text-slate-700">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="font-medium">Last Updated:</span>
                    <span className="ml-2">{new Date(contractInfo.updatedAt).toLocaleDateString()}</span>
                  </div>
                  {contractInfo.solanaTransactionId && (
                    <div className="flex items-center text-slate-700">
                      <Link className="h-4 w-4 mr-2" />
                      <span className="font-medium">Solana TX ID:</span>
                      <a
                        href={`https://explorer.solana.com/tx/${contractInfo.solanaTransactionId}?cluster=devnet`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-2 text-blue-600 hover:underline text-sm font-mono"
                      >
                        {contractInfo.solanaTransactionId.substring(0, 10)}...
                      </a>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-slate-700">Party 1:</h4>
                    <p className="text-sm text-slate-600">Name: {contractInfo.party1Name}</p>
                    <p className="text-sm text-slate-600">Email: {contractInfo.party1Email}</p>
                    <p className="text-sm text-slate-600">Public Key: {contractInfo.party1PublicKey}</p>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium text-slate-700">Party 2:</h4>
                    <p className="text-sm text-slate-600">Name: {contractInfo.party2Name}</p>
                    <p className="text-sm text-slate-600">Email: {contractInfo.party2Email}</p>
                    <p className="text-sm text-slate-600">Public Key: {contractInfo.party2PublicKey}</p>
                  </div>
                  {contractInfo.additionalParties && contractInfo.additionalParties.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-slate-700">Additional Parties:</h4>
                      {contractInfo.additionalParties.map((party, index) => (
                        <div key={index} className="text-sm text-slate-600">
                          <p>Name: {party.name}</p>
                          <p>Email: {party.email}</p>
                          <p>Public Key: {party.publicKey}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  {contractInfo.useMediator && contractInfo.mediatorName && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-slate-700">Mediator:</h4>
                      <p className="text-sm text-slate-600">Name: {contractInfo.mediatorName}</p>
                      <p className="text-sm text-slate-600">Email: {contractInfo.mediatorEmail}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Agreement Text */}
              {contractInfo.agreementText && (
                <div className="space-y-2">
                  <h3 className="font-medium text-slate-700">Agreement Text:</h3>
                  <p className="text-sm text-slate-600 whitespace-pre-wrap">{contractInfo.agreementText}</p>
                </div>
              )}

              {/* Structured Clauses */}
              {contractInfo.structuredClauses && contractInfo.structuredClauses.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-slate-700">Structured Clauses:</h3>
                  <ul className="list-disc list-inside text-sm text-slate-600">
                    {contractInfo.structuredClauses.map((clause, index) => (
                      <li key={index}>{clause}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Attachments */}
              {contractInfo.attachments && contractInfo.attachments.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-medium text-slate-700">Attachments:</h3>
                  <ul className="list-disc list-inside text-sm text-slate-600">
                    {contractInfo.attachments.map((attachment, index) => (
                      <li key={index}>
                        <a
                          href={`https://ipfs.io/ipfs/${attachment.ipfsHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:underline"
                        >
                          {attachment.fileName} (IPFS)
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Eye className="h-4 w-4 mr-2" />
                  View Contract
                </Button>
                <Button
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  onClick={() => handleDownloadPDF(contractInfo.contractId)}
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                {contractInfo.status === 'solana_created' && (
                  <Button
                    variant="outline"
                    className="border-green-300 text-green-700 hover:bg-green-50"
                    onClick={() => handleSignContract(contractInfo.contractId)}
                  >
                    Sign Contract
                  </Button>
                )}
              </div>

              {/* Security Notice */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                <p className="text-sm text-slate-700">
                  <span className="font-medium">🔒 Secure Storage:</span> This contract is stored securely using enterprise-grade encryption and distributed storage technology, ensuring permanent accessibility and tamper-proof records.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Help Section */}
        <Card className="mt-8 bg-slate-50 border-slate-200">
          <CardContent className="p-6">
            <h3 className="font-semibold text-slate-800 mb-3">Need Help?</h3>
            <div className="grid md:grid-cols-2 gap-4 text-sm text-slate-600">
              <div>
                <p className="font-medium text-slate-700 mb-1">Can't find your contract?</p>
                <p>Check your email for the contract ID, or contact the person who created the contract.</p>
              </div>
              <div>
                <p className="font-medium text-slate-700 mb-1">Need to make changes?</p>
                <p>Contact all parties involved to create an amendment or new version of the contract.</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </section><Toaster /></>
  );
};