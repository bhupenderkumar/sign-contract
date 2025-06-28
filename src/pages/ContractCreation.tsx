
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, Upload, Plus, X, Users, FileText, Shield } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ContractFormData {
  party1Name: string;
  party1Email: string;
  party2Name: string;
  party2Email: string;
  additionalParties: Array<{name: string; email: string}>;
  mediatorName: string;
  mediatorEmail: string;
  useMediator: boolean;
  contractTitle: string;
  contractDescription: string;
  agreementText: string;
  structuredClauses: string[];
  attachments: File[];
  acceptedTerms: boolean;
}

const ContractCreation = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ContractFormData>({
    party1Name: '',
    party1Email: '',
    party2Name: '',
    party2Email: '',
    additionalParties: [],
    mediatorName: '',
    mediatorEmail: '',
    useMediator: false,
    contractTitle: '',
    contractDescription: '',
    agreementText: '',
    structuredClauses: [],
    attachments: [],
    acceptedTerms: false
  });
  const [newClause, setNewClause] = useState('');
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyEmail, setNewPartyEmail] = useState('');
  const [activeTab, setActiveTab] = useState('text');

  const handleInputChange = (field: keyof ContractFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addParty = () => {
    if (newPartyName.trim() && newPartyEmail.trim()) {
      setFormData(prev => ({
        ...prev,
        additionalParties: [...prev.additionalParties, { name: newPartyName.trim(), email: newPartyEmail.trim() }]
      }));
      setNewPartyName('');
      setNewPartyEmail('');
    }
  };

  const removeParty = (index: number) => {
    setFormData(prev => ({
      ...prev,
      additionalParties: prev.additionalParties.filter((_, i) => i !== index)
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
    alert('Contract created successfully! All parties will receive email notifications to review and sign.');
  };

  const termsAndConditions = [
    "All parties will receive email notifications for contract review and signing",
    "Digital signatures are legally binding and secure",
    "Contract documents are stored securely with enterprise-grade encryption", 
    "All parties must agree to the terms before the contract becomes active",
    "Mediator decisions (if applicable) are binding and final",
    "Contract execution follows the agreed timeline and conditions",
    "All parties have equal access to contract documents and status updates",
    "Dispute resolution follows standard legal procedures unless otherwise specified"
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="flex items-center mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/')}
            className="text-slate-700 hover:bg-slate-200 mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Home
          </Button>
          <div>
            <h1 className="text-4xl font-bold text-slate-800">Create Smart Contract</h1>
            <p className="text-slate-600 mt-2">Create secure, legally binding digital agreements</p>
          </div>
        </div>

        {/* Benefits Banner */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="flex items-center space-x-3">
              <Shield className="h-8 w-8 text-blue-600" />
              <div>
                <h3 className="font-semibold text-slate-800">Legally Binding</h3>
                <p className="text-sm text-slate-600">Fully compliant digital signatures</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Users className="h-8 w-8 text-green-600" />
              <div>
                <h3 className="font-semibold text-slate-800">Multi-Party Support</h3>
                <p className="text-sm text-slate-600">Add unlimited signatories</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <FileText className="h-8 w-8 text-purple-600" />
              <div>
                <h3 className="font-semibold text-slate-800">Secure Storage</h3>
                <p className="text-sm text-slate-600">Enterprise-grade document security</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Form */}
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-8 space-y-8">
            
            {/* Contract Information */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-slate-800 border-b border-slate-200 pb-2">Contract Information</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="contractTitle" className="text-slate-700 font-medium">
                    Contract Title *
                  </Label>
                  <Input
                    id="contractTitle"
                    value={formData.contractTitle}
                    onChange={(e) => handleInputChange('contractTitle', e.target.value)}
                    placeholder="e.g., Service Agreement, Partnership Contract"
                    className="border-slate-300 focus:border-blue-500"
                    required
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="contractDescription" className="text-slate-700 font-medium">
                    Brief Description
                  </Label>
                  <Input
                    id="contractDescription"
                    value={formData.contractDescription}
                    onChange={(e) => handleInputChange('contractDescription', e.target.value)}
                    placeholder="Short description of the contract purpose"
                    className="border-slate-300 focus:border-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Party Information Section */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold text-slate-800 border-b border-slate-200 pb-2">Party Information</h2>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-medium text-slate-800">First Party</h3>
                  <div className="space-y-2">
                    <Label htmlFor="party1Name" className="text-slate-700">Full Name *</Label>
                    <Input
                      id="party1Name"
                      value={formData.party1Name}
                      onChange={(e) => handleInputChange('party1Name', e.target.value)}
                      placeholder="Enter full name"
                      className="border-slate-300 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="party1Email" className="text-slate-700">Email Address *</Label>
                    <Input
                      id="party1Email"
                      type="email"
                      value={formData.party1Email}
                      onChange={(e) => handleInputChange('party1Email', e.target.value)}
                      placeholder="Enter email address"
                      className="border-slate-300 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
                
                <div className="space-y-4 p-4 bg-slate-50 rounded-lg">
                  <h3 className="font-medium text-slate-800">Second Party</h3>
                  <div className="space-y-2">
                    <Label htmlFor="party2Name" className="text-slate-700">Full Name *</Label>
                    <Input
                      id="party2Name"
                      value={formData.party2Name}
                      onChange={(e) => handleInputChange('party2Name', e.target.value)}
                      placeholder="Enter full name"
                      className="border-slate-300 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="party2Email" className="text-slate-700">Email Address *</Label>
                    <Input
                      id="party2Email"
                      type="email"
                      value={formData.party2Email}
                      onChange={(e) => handleInputChange('party2Email', e.target.value)}
                      placeholder="Enter email address"
                      className="border-slate-300 focus:border-blue-500"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Additional Parties */}
              <div className="space-y-4">
                <h3 className="font-medium text-slate-800">Additional Parties (Optional)</h3>
                
                {formData.additionalParties.length > 0 && (
                  <div className="space-y-2">
                    {formData.additionalParties.map((party, index) => (
                      <div key={index} className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-3">
                        <div className="flex-1">
                          <span className="font-medium text-slate-800">{party.name}</span>
                          <span className="text-slate-600 ml-2">({party.email})</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeParty(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <Input
                    value={newPartyName}
                    onChange={(e) => setNewPartyName(e.target.value)}
                    placeholder="Additional party name"
                    className="border-slate-300 focus:border-blue-500"
                  />
                  <Input
                    type="email"
                    value={newPartyEmail}
                    onChange={(e) => setNewPartyEmail(e.target.value)}
                    placeholder="Email address"
                    className="border-slate-300 focus:border-blue-500"
                  />
                  <Button
                    type="button"
                    onClick={addParty}
                    className="bg-blue-600 hover:bg-blue-700 px-6"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Mediator Section */}
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="useMediator"
                    checked={formData.useMediator}
                    onCheckedChange={(checked) => handleInputChange('useMediator', checked as boolean)}
                    className="border-slate-300"
                  />
                  <Label htmlFor="useMediator" className="text-slate-700 font-medium">
                    Include a Mediator (Optional)
                  </Label>
                </div>
                <p className="text-sm text-slate-600">A mediator can help resolve disputes and ensure fair contract execution.</p>
                
                {formData.useMediator && (
                  <div className="grid md:grid-cols-2 gap-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                    <div className="space-y-2">
                      <Label htmlFor="mediatorName" className="text-slate-700">Mediator Name</Label>
                      <Input
                        id="mediatorName"
                        value={formData.mediatorName}
                        onChange={(e) => handleInputChange('mediatorName', e.target.value)}
                        placeholder="Enter mediator name"
                        className="border-slate-300 focus:border-blue-500"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="mediatorEmail" className="text-slate-700">Mediator Email</Label>
                      <Input
                        id="mediatorEmail"
                        type="email"
                        value={formData.mediatorEmail}
                        onChange={(e) => handleInputChange('mediatorEmail', e.target.value)}
                        placeholder="Enter mediator email"
                        className="border-slate-300 focus:border-blue-500"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Agreement Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-800 border-b border-slate-200 pb-2">Contract Terms</h2>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                  <TabsTrigger value="text" className="text-slate-700">Write Contract Text</TabsTrigger>
                  <TabsTrigger value="structured" className="text-slate-700">Add Terms Separately</TabsTrigger>
                </TabsList>
                
                <TabsContent value="text" className="space-y-2">
                  <Label htmlFor="agreementText" className="text-slate-700 font-medium">
                    Contract Terms and Conditions
                  </Label>
                  <Textarea
                    id="agreementText"
                    value={formData.agreementText}
                    onChange={(e) => handleInputChange('agreementText', e.target.value)}
                    placeholder="Write your contract terms here. Be specific about obligations, timelines, payment terms, and other important details."
                    className="border-slate-300 focus:border-blue-500 min-h-32"
                  />
                  <p className="text-slate-500 text-sm">
                    Tip: Include specific details about deliverables, payment terms, deadlines, and responsibilities.
                  </p>
                </TabsContent>
                
                <TabsContent value="structured" className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      value={newClause}
                      onChange={(e) => setNewClause(e.target.value)}
                      placeholder="Add a specific contract term or condition"
                      className="border-slate-300 focus:border-blue-500"
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
                      <div key={index} className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                        <span className="text-slate-800 text-sm flex-1">{clause}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeClause(index)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
              <h2 className="text-2xl font-semibold text-slate-800 border-b border-slate-200 pb-2">Supporting Documents</h2>
              
              <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                <input
                  type="file"
                  multiple
                  onChange={handleFileUpload}
                  className="hidden"
                  id="fileUpload"
                  accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png"
                />
                <Label htmlFor="fileUpload" className="cursor-pointer">
                  <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-700 font-medium">Upload Supporting Documents</p>
                  <p className="text-slate-500 text-sm">PDF, Word documents, images (Max 10MB per file)</p>
                </Label>
              </div>
              
              {formData.attachments.length > 0 && (
                <div className="space-y-2">
                  <p className="text-slate-700 font-medium">Attached Files:</p>
                  {formData.attachments.map((file, index) => (
                    <div key={index} className="bg-slate-50 border border-slate-200 rounded-lg p-3 flex items-center justify-between">
                      <span className="text-slate-800 text-sm">{file.name}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Terms & Conditions */}
            <div className="space-y-4">
              <h2 className="text-2xl font-semibold text-slate-800 border-b border-slate-200 pb-2">Platform Terms</h2>
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 max-h-48 overflow-y-auto">
                <ul className="space-y-2">
                  {termsAndConditions.map((term, index) => (
                    <li key={index} className="text-slate-700 text-sm flex items-start">
                      <span className="text-blue-600 mr-2">•</span>
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
                  className="border-slate-300"
                  required
                />
                <Label htmlFor="acceptTerms" className="text-slate-700 font-medium">
                  I accept the platform terms and conditions *
                </Label>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6 border-t border-slate-200">
              <Button
                type="submit"
                size="lg"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 text-lg"
                disabled={!formData.acceptedTerms || !formData.party1Name || !formData.party2Name || !formData.contractTitle}
              >
                Create & Send Contract for Signatures
              </Button>
              <p className="text-sm text-slate-600 text-center mt-2">
                All parties will receive email notifications to review and digitally sign the contract
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ContractCreation;
