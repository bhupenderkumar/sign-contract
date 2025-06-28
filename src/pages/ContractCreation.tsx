
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Upload, Plus, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ContractFormData {
  party1Key: string;
  party2Key: string;
  mediatorKey: string;
  useMediator: boolean;
  agreementText: string;
  structuredClauses: string[];
  attachments: File[];
  acceptedTerms: boolean;
}

const ContractCreation = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ContractFormData>({
    party1Key: '',
    party2Key: '',
    mediatorKey: '',
    useMediator: false,
    agreementText: '',
    structuredClauses: [],
    attachments: [],
    acceptedTerms: false
  });
  const [newClause, setNewClause] = useState('');
  const [activeTab, setActiveTab] = useState('text');

  const handleInputChange = (field: keyof ContractFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addClause = () => {
    if (newClause.trim()) {
      setFormData(prev => ({
        ...prev,
        structuredClauses: [...prev.structuredClauses, newClause.trim()]
      }));
      setNewClause('');
    }
  };

  const removeClause = (index: number) => {
    setFormData(prev => ({
      ...prev,
      structuredClauses: prev.structuredClauses.filter((_, i) => i !== index)
    }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...files]
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Contract Data:', formData);
    // Here you would process the contract creation
    alert('Contract created successfully! (This is a demo)');
  };

  const termsAndConditions = [
    "All agreements are digitally signed and cryptographically secured",
    "IPFS-stored files are immutable and permanently accessible",
    "Smart contracts are permanent on the blockchain once deployed",
    "Mediator decisions (if applicable) are binding and final",
    "All parties must have valid public keys for signature verification",
    "Contract execution is automated based on predefined conditions",
    "Dispute resolution follows the agreed protocol in the contract",
    "Gas fees and transaction costs are responsibility of the initiating party"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 relative">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml,%3Csvg%20width%3D%2260%22%20height%3D%2260%22%20viewBox%3D%220%200%2060%2060%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3Cg%20fill%3D%22none%22%20fill-rule%3D%22evenodd%22%3E%3Cg%20fill%3D%22%239C92AC%22%20fill-opacity%3D%220.05%22%3E%3Ccircle%20cx%3D%2230%22%20cy%3D%2230%22%20r%3D%222%22/%3E%3C/g%3E%3C/g%3E%3C/svg%3E')] opacity-40"></div>
      
      <div className="relative z-10 container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-white hover:bg-white/10 mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <h1 className="text-4xl font-bold text-white">Create Smart Contract</h1>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-8 space-y-8">
            
            {/* Party Keys Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-white mb-4">Party Information</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="party1Key" className="text-white font-medium">
                    Public Key - Party 1 *
                  </Label>
                  <Input
                    id="party1Key"
                    value={formData.party1Key}
                    onChange={(e) => handleInputChange('party1Key', e.target.value)}
                    placeholder="Enter Party 1 public key"
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="party2Key" className="text-white font-medium">
                    Public Key - Party 2 *
                  </Label>
                  <Input
                    id="party2Key"
                    value={formData.party2Key}
                    onChange={(e) => handleInputChange('party2Key', e.target.value)}
                    placeholder="Enter Party 2 public key"
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                    required
                  />
                </div>
              </div>

              {/* Mediator Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="useMediator"
                    checked={formData.useMediator}
                    onCheckedChange={(checked) => handleInputChange('useMediator', checked as boolean)}
                    className="border-white/20"
                  />
                  <Label htmlFor="useMediator" className="text-white font-medium">
                    Use Mediator
                  </Label>
                </div>
                
                {formData.useMediator && (
                  <div className="space-y-2">
                    <Label htmlFor="mediatorKey" className="text-white font-medium">
                      Mediator Public Key
                    </Label>
                    <Input
                      id="mediatorKey"
                      value={formData.mediatorKey}
                      onChange={(e) => handleInputChange('mediatorKey', e.target.value)}
                      placeholder="Enter mediator public key"
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Terms & Conditions</h2>
              <div className="bg-white/5 border border-white/20 rounded-lg p-4 max-h-48 overflow-y-auto">
                <ul className="space-y-2">
                  {termsAndConditions.map((term, index) => (
                    <li key={index} className="text-gray-300 text-sm flex items-start">
                      <span className="text-blue-400 mr-2">•</span>
                      {term}
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="acceptTerms"
                  checked={formData.acceptedTerms}
                  onCheckedChange={(checked) => handleInputChange('acceptedTerms', checked as boolean)}
                  className="border-white/20"
                  required
                />
                <Label htmlFor="acceptTerms" className="text-white font-medium">
                  I accept the terms and conditions *
                </Label>
              </div>
            </div>

            {/* Agreement Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">Agreement Details</h2>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-white/10">
                  <TabsTrigger value="text" className="text-white">Text Input</TabsTrigger>
                  <TabsTrigger value="structured" className="text-white">Structured Add</TabsTrigger>
                </TabsList>
                
                <TabsContent value="text" className="space-y-2">
                  <Label htmlFor="agreementText" className="text-white font-medium">
                    Agreement Text
                  </Label>
                  <Textarea
                    id="agreementText"
                    value={formData.agreementText}
                    onChange={(e) => handleInputChange('agreementText', e.target.value)}
                    placeholder="Enter agreements here. Use &lt;/new&gt; to separate multiple entries."
                    className="bg-white/5 border-white/20 text-white placeholder:text-gray-400 min-h-32"
                  />
                  <p className="text-gray-400 text-sm">
                    Tip: Use &lt;/new&gt; to separate multiple agreement clauses
                  </p>
                </TabsContent>
                
                <TabsContent value="structured" className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newClause}
                      onChange={(e) => setNewClause(e.target.value)}
                      placeholder="Add agreement clause"
                      className="bg-white/5 border-white/20 text-white placeholder:text-gray-400"
                      onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addClause())}
                    />
                    <Button
                      type="button"
                      onClick={addClause}
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {formData.structuredClauses.map((clause, index) => (
                      <div key={index} className="bg-white/5 border border-white/20 rounded-lg p-3 flex items-center justify-between">
                        <span className="text-white text-sm">{clause}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeClause(index)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            {/* File Attachments */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-white">File Attachments</h2>
              
              <div className="border-2 border-dashed border-white/20 rounded-lg p-6 text-center">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="fileUpload"
                />
                <Label htmlFor="fileUpload" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-white font-medium">Click to upload files</p>
                  <p className="text-gray-400 text-sm">Or drag and drop files here</p>
                </Label>
              </div>
              
              {formData.attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-white font-medium">Attached Files:</p>
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="bg-white/5 border border-white/20 rounded-lg p-3 flex items-center justify-between">
                      <span className="text-white text-sm">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-400 hover:text-red-300 hover:bg-red-400/10"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <Button
                type="submit"
                size="lg"
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-4 text-lg"
                disabled={!formData.acceptedTerms || !formData.party1Key || !formData.party2Key}
              >
                Sign & Submit Contract
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContractCreation;
