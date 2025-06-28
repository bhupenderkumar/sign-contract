
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, FileText, Calendar, Users, Download, Eye } from "lucide-react";

interface ContractInfo {
  id: string;
  title: string;
  status: 'pending' | 'signed' | 'completed' | 'expired';
  parties: string[];
  createdDate: string;
  lastUpdated: string;
  description: string;
}

export const ContractLookup = () => {
  const [contractId, setContractId] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null);
  const [error, setError] = useState('');

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contractId.trim()) {
      setError('Please enter a contract ID');
      return;
    }

    setIsSearching(true);
    setError('');
    
    // Simulate API call
    setTimeout(() => {
      // Mock contract data - in real implementation, this would fetch from blockchain/IPFS
      const mockContract: ContractInfo = {
        id: contractId,
        title: 'Service Agreement Contract',
        status: 'signed',
        parties: ['John Smith', 'ABC Corporation', 'Jane Doe'],
        createdDate: '2024-01-15',
        lastUpdated: '2024-01-20',
        description: 'Professional services agreement for web development project'
      };
      
      setContractInfo(mockContract);
      setIsSearching(false);
    }, 1500);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'signed': return 'bg-green-100 text-green-800 border-green-200';
      case 'completed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'expired': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Awaiting Signatures';
      case 'signed': return 'Fully Signed';
      case 'completed': return 'Completed';
      case 'expired': return 'Expired';
      default: return 'Unknown';
    }
  };

  return (
    <section className="py-20 px-6 bg-white">
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
                  className="border-slate-300 focus:border-blue-500"
                />
                <p className="text-sm text-slate-500">
                  You can find your contract ID in the email notification sent when the contract was created
                </p>
              </div>
              
              {error && (
                <p className="text-red-600 text-sm">{error}</p>
              )}
              
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700"
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
            </form>
          </CardContent>
        </Card>

        {/* Contract Results */}
        {contractInfo && (
          <Card className="border-slate-200 shadow-sm">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-slate-800 mb-2">{contractInfo.title}</CardTitle>
                  <p className="text-slate-600">{contractInfo.description}</p>
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
                    <span className="ml-2 font-mono text-sm">{contractInfo.id}</span>
                  </div>
                  
                  <div className="flex items-center text-slate-700">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="font-medium">Created:</span>
                    <span className="ml-2">{new Date(contractInfo.createdDate).toLocaleDateString()}</span>
                  </div>
                  
                  <div className="flex items-center text-slate-700">
                    <Calendar className="h-4 w-4 mr-2" />
                    <span className="font-medium">Last Updated:</span>
                    <span className="ml-2">{new Date(contractInfo.lastUpdated).toLocaleDateString()}</span>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start text-slate-700">
                    <Users className="h-4 w-4 mr-2 mt-1" />
                    <div>
                      <span className="font-medium">Parties:</span>
                      <ul className="ml-2 mt-1 space-y-1">
                        {contractInfo.parties.map((party, index) => (
                          <li key={index} className="text-sm">• {party}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <Eye className="h-4 w-4 mr-2" />
                  View Contract
                </Button>
                <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50">
                  <Download className="h-4 w-4 mr-2" />
                  Download PDF
                </Button>
                {contractInfo.status === 'pending' && (
                  <Button variant="outline" className="border-green-300 text-green-700 hover:bg-green-50">
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
    </section>
  );
};
