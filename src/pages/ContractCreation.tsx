import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Upload, Plus, X, Users, FileText, Shield, Wand2, Link } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Toaster } from "@/components/ui/toaster";
import { getDevConfig, isDevelopment } from '@/config/development';
import { useWallet } from '@/contexts/WalletContext';
import walletTransactionService from '@/services/walletTransactionService';
import CryptoJS from 'crypto-js';

interface ContractFormData {
  party1Name: string;
  party1Email: string;
  party1PublicKey: string;
  party2Name: string;
  party2Email: string;
  party2PublicKey: string;
  additionalParties: Array<{name: string; email: string; publicKey: string;}>;
  mediatorName: string;
  mediatorEmail: string;
  useMediator: boolean;
  contractTitle: string;
  contractDescription: string;
  agreementText: string;
  structuredClauses: string[];
  attachments: File[];
  acceptedTerms: boolean;
  useBlockchain: boolean;
}

const ContractCreation = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<ContractFormData>({
    party1Name: '',
    party1Email: '',
    party1PublicKey: '',
    party2Name: '',
    party2Email: '',
    party2PublicKey: '',
    additionalParties: [],
    mediatorName: '',
    mediatorEmail: '',
    useMediator: false,
    contractTitle: '',
    contractDescription: '',
    agreementText: '',
    structuredClauses: [],
    attachments: [],
    acceptedTerms: false,
    useBlockchain: true
  });
  const [newClause, setNewClause] = useState('');
  const [newPartyName, setNewPartyName] = useState('');
  const [newPartyEmail, setNewPartyEmail] = useState('');
  const [newPartyPublicKey, setNewPartyPublicKey] = useState('');
  const [activeTab, setActiveTab] = useState('text');
  const { toast } = useToast();
  const { publicKey, connected, signMessage, signTransaction } = useWallet();

  // Development auto-fill functionality
  const devConfig = getDevConfig();

  // Auto-fill form with sample data in development mode
  const handleAutoFill = () => {
    if (!devConfig) return;

    const sampleData = devConfig.sampleData;
    setFormData(prev => ({
      ...prev,
      ...sampleData
    }));

    toast({
      title: "Form Auto-Filled",
      description: "Development sample data has been loaded into the form.",
      variant: "default",
    });
  };

  // Load sample data on component mount in development
  useEffect(() => {
    if (isDevelopment && devConfig?.autoFillEnabled) {
      // Auto-fill after a short delay to let the component fully mount
      const timer = setTimeout(() => {
        handleAutoFill();
      }, 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleInputChange = (field: keyof ContractFormData, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const addParty = () => {
    if (newPartyName.trim() && newPartyEmail.trim() && newPartyPublicKey.trim()) {
      setFormData(prev => ({
        ...prev,
        additionalParties: [...prev.additionalParties, { name: newPartyName.trim(), email: newPartyEmail.trim(), publicKey: newPartyPublicKey.trim() }]
      }));
      setNewPartyName('');
      setNewPartyEmail('');
      setNewPartyPublicKey('');
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
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
      'image/jpeg',
      'image/png',
    ];
    const maxFileSize = 10 * 1024 * 1024; // 10 MB

    const newAttachments = files.filter(file => {
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid File Type",
          description: `File "${file.name}" has an unsupported type. Only PDF, Word, TXT, JPG, and PNG are allowed.`,
          variant: "destructive",
        });
        return false;
      }
      if (file.size > maxFileSize) {
        toast({
          title: "File Too Large",
          description: `File "${file.name}" is too large. Maximum size is 10MB.`,
          variant: "destructive",
        });
        return false;
      }
      return true;
    });

    setFormData(prev => ({
      ...prev,
      attachments: [...prev.attachments, ...newAttachments]
    }));
  };

  const removeFile = (index: number) => {
    setFormData(prev => ({
      ...prev,
      attachments: prev.attachments.filter((_, i) => i !== index)
    }));
  };

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const validatePublicKey = (key: string) => {
    // Basic validation: check if it's not empty and has a reasonable length
    return key.trim().length > 10; 
  };

  const validateForm = () => {
    if (!formData.contractTitle.trim()) {
      toast({
        title: "Validation Error",
        description: "Contract Title is required.",
        variant: "destructive",
      });
      return false;
    }

    // Party 1 Validation
    if (!formData.party1Name.trim()) {
      toast({
        title: "Validation Error",
        description: "First Party Name is required.",
        variant: "destructive",
      });
      return false;
    }
    if (!validateEmail(formData.party1Email)) {
      toast({
        title: "Validation Error",
        description: "First Party Email is invalid.",
        variant: "destructive",
      });
      return false;
    }
    if (!validatePublicKey(formData.party1PublicKey)) {
      toast({
        title: "Validation Error",
        description: "First Party Public Key is required and must be valid.",
        variant: "destructive",
      });
      return false;
    }

    // Party 2 Validation
    if (!formData.party2Name.trim()) {
      toast({
        title: "Validation Error",
        description: "Second Party Name is required.",
        variant: "destructive",
      });
      return false;
    }
    if (!validateEmail(formData.party2Email)) {
      toast({
        title: "Validation Error",
        description: "Second Party Email is invalid.",
        variant: "destructive",
      });
      return false;
    }
    if (!validatePublicKey(formData.party2PublicKey)) {
      toast({
        title: "Validation Error",
        description: "Second Party Public Key is required and must be valid.",
        variant: "destructive",
      });
      return false;
    }

    // Wallet Connection Validation (if blockchain is enabled)
    if (formData.useBlockchain && (!connected || !publicKey)) {
      toast({
        title: "Wallet Not Connected",
        description: "Please connect your wallet for blockchain deployment.",
        variant: "destructive",
      });
      return false;
    }

    // Additional Parties Validation
    for (const party of formData.additionalParties) {
      if (!party.name.trim()) {
        toast({
          title: "Validation Error",
          description: "Additional Party Name cannot be empty.",
          variant: "destructive",
        });
        return false;
      }
      if (!validateEmail(party.email)) {
        toast({
          title: "Validation Error",
          description: `Additional Party Email "${party.email}" is invalid.`,
          variant: "destructive",
        });
        return false;
      }
      if (!validatePublicKey(party.publicKey)) {
        toast({
          title: "Validation Error",
          description: `Additional Party Public Key for "${party.name}" is required and must be valid.`,
          variant: "destructive",
        });
        return false;
      }
    }

    // Mediator Validation (if used)
    if (formData.useMediator) {
      if (!formData.mediatorName.trim()) {
        toast({
          title: "Validation Error",
          description: "Mediator Name is required when mediator is included.",
          variant: "destructive",
        });
        return false;
      }
      if (!validateEmail(formData.mediatorEmail)) {
        toast({
          title: "Validation Error",
          description: "Mediator Email is invalid.",
          variant: "destructive",
        });
        return false;
      }
    }

    if (!formData.acceptedTerms) {
      toast({
        title: "Validation Error",
        description: "You must accept the platform terms and conditions.",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return; // Stop submission if validation fails
    }

    // Prepare the contract data for the backend API
    const contractData = {
      contractTitle: formData.contractTitle,
      contractDescription: formData.contractDescription,
      agreementText: formData.agreementText,
      structuredClauses: formData.structuredClauses,
      party1Name: formData.party1Name,
      party1Email: formData.party1Email,
      party1PublicKey: formData.party1PublicKey,
      party2Name: formData.party2Name,
      party2Email: formData.party2Email,
      party2PublicKey: formData.party2PublicKey,
      additionalParties: formData.additionalParties,
      mediatorName: formData.mediatorName,
      mediatorEmail: formData.mediatorEmail,
      useMediator: formData.useMediator,
      expiryDate: null, // Add expiry date if needed
    };

    console.log('📤 Sending contract data:', contractData);

    try {
      let response;

      if (formData.useBlockchain) {
        // For blockchain contracts, use secure wallet signing
        if (!connected || !publicKey) {
          toast({
            title: "Wallet Not Connected",
            description: "Please connect your wallet to deploy contracts to the blockchain.",
            variant: "destructive",
          });
          return;
        }

        // Create contract with secure wallet signing (production approach)
        const creationResult = await walletTransactionService.createContractSecurely(
          { publicKey, signMessage, signTransaction, connected } as any,
          { ...contractData, contractId: `contract_${Date.now()}` },
          '5KizKzo7nXQrdP7bQ4HehteE1nQtvCYPi3SY7ZgAox9d' // Platform fee recipient
        );

        if (!creationResult.success) {
          toast({
            title: "Blockchain Deployment Failed",
            description: creationResult.error || "Failed to deploy contract to blockchain",
            variant: "destructive",
          });
          return;
        }

        // Send contract data to backend with blockchain proof
        response = await fetch('http://localhost:3001/api/contracts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...contractData,
            blockchainTxHash: creationResult.transactionId,
            contractAddress: creationResult.contractAddress,
            status: 'blockchain_created'
          }),
        });
      } else {
        // Regular contract creation
        response = await fetch('http://localhost:3001/api/contracts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(contractData),
        });
      }

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Contract created successfully:', result);

        const successMessage = formData.useBlockchain
          ? `Contract ID: ${result.contractId}. Deployed to Solana Devnet! Transaction: ${result.transactionId?.substring(0, 8)}...`
          : `Contract ID: ${result.contractId}. ${result.message}`;

        toast({
          title: formData.useBlockchain ? "Contract Deployed to Blockchain!" : "Contract Created!",
          description: successMessage,
          variant: "default",
        });

        // Navigate back to home page
        navigate('/');
      } else {
        const errorData = await response.json();
        console.error('❌ Contract creation failed:', errorData);

        toast({
          title: "Failed to Create Contract",
          description: errorData.message || "An unknown error occurred.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error submitting contract:', error);
      toast({
        title: "Submission Error",
        description: "An error occurred while creating the contract. Please try again.",
        variant: "destructive",
      });
    }
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
    <><div>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <div className="container mx-auto px-6 py-8">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              onClick={() => navigate('/')}
              className="text-slate-300 hover:bg-slate-700 mr-4"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Home
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-white">Create Smart Contract</h1>
              <p className="text-slate-400 mt-2">Create secure, legally binding digital agreements</p>
            </div>
          </div>

          {/* Benefits Banner */}
          <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8 shadow-sm">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="flex items-center space-x-3">
                <Shield className="h-8 w-8 text-blue-400" />
                <div>
                  <h3 className="font-semibold text-white">Legally Binding</h3>
                  <p className="text-sm text-slate-400">Fully compliant digital signatures</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Users className="h-8 w-8 text-green-400" />
                <div>
                  <h3 className="font-semibold text-white">Multi-Party Support</h3>
                  <p className="text-sm text-slate-400">Add unlimited signatories</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="h-8 w-8 text-purple-400" />
                <div>
                  <h3 className="font-semibold text-white">Secure Storage</h3>
                  <p className="text-sm text-slate-400">Enterprise-grade document security</p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Form */}
          <form onSubmit={handleSubmit} className="max-w-4xl mx-auto">
            <div className="bg-white/5 border border-white/10 rounded-xl shadow-sm p-8 space-y-8">

              {/* Contract Information */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-white/20 pb-2">
                  <h2 className="text-2xl font-semibold text-white">Contract Information</h2>
                  {isDevelopment && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAutoFill}
                      className="bg-purple-600/20 border-purple-400/30 text-purple-300 hover:bg-purple-600/30 hover:text-purple-200"
                    >
                      <Wand2 className="h-4 w-4 mr-2" />
                      Auto-Fill Dev Data
                    </Button>
                  )}
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="contractTitle" className="text-slate-300 font-medium">
                      Contract Title *
                    </Label>
                    <Input
                      id="contractTitle"
                      value={formData.contractTitle}
                      onChange={(e) => handleInputChange('contractTitle', e.target.value)}
                      placeholder="e.g., Service Agreement, Partnership Contract"
                      className="bg-white/10 border-white/20 focus:border-blue-400 text-white"
                      required />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="contractDescription" className="text-slate-300 font-medium">
                      Brief Description
                    </Label>
                    <Input
                      id="contractDescription"
                      value={formData.contractDescription}
                      onChange={(e) => handleInputChange('contractDescription', e.target.value)}
                      placeholder="Short description of the contract purpose"
                      className="bg-white/10 border-white/20 focus:border-blue-400 text-white" />
                  </div>
                </div>
              </div>

              {/* Blockchain Deployment Section */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-white border-b border-white/20 pb-2">Deployment Options</h2>

                <div className="bg-white/5 rounded-lg p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <Link className="h-5 w-5 text-blue-400" />
                        <h3 className="font-medium text-white">Deploy to Solana Blockchain</h3>
                      </div>
                      <p className="text-sm text-slate-400">
                        Create a truly decentralized contract on Solana devnet with automatic fee deduction and immutable storage.
                      </p>
                    </div>
                    <Switch
                      checked={formData.useBlockchain}
                      onCheckedChange={(checked) => handleInputChange('useBlockchain', checked)}
                      className="data-[state=checked]:bg-blue-600"
                    />
                  </div>

                  {formData.useBlockchain && (
                    <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                      <div className="flex items-start space-x-3">
                        <Shield className="h-5 w-5 text-blue-400 mt-0.5" />
                        <div className="space-y-2">
                          <h4 className="font-medium text-blue-300">Blockchain Benefits</h4>
                          <ul className="text-sm text-blue-200 space-y-1">
                            <li>• Immutable contract storage on Solana</li>
                            <li>• Automatic platform fee deduction (0.01 SOL)</li>
                            <li>• Cryptographic proof of signatures</li>
                            <li>• Transparent transaction history</li>
                          </ul>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Party Information Section */}
              <div className="space-y-6">
                <h2 className="text-2xl font-semibold text-white border-b border-white/20 pb-2">Party Information</h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4 p-4 bg-white/5 rounded-lg">
                    <h3 className="font-medium text-white">First Party</h3>
                    <div className="space-y-2">
                      <Label htmlFor="party1Name" className="text-slate-300">Full Name *</Label>
                      <Input
                        id="party1Name"
                        value={formData.party1Name}
                        onChange={(e) => handleInputChange('party1Name', e.target.value)}
                        placeholder="Enter full name"
                        className="bg-white/10 border-white/20 focus:border-blue-400 text-white"
                        required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="party1Email" className="text-slate-300">Email Address *</Label>
                      <Input
                        id="party1Email"
                        type="email"
                        value={formData.party1Email}
                        onChange={(e) => handleInputChange('party1Email', e.target.value)}
                        placeholder="Enter email address"
                        className="bg-white/10 border-white/20 focus:border-blue-400 text-white"
                        required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="party1PublicKey" className="text-slate-300">Public Key *</Label>
                      <Input
                        id="party1PublicKey"
                        value={formData.party1PublicKey}
                        onChange={(e) => handleInputChange('party1PublicKey', e.target.value)}
                        placeholder="Enter public key"
                        className="bg-white/10 border-white/20 focus:border-blue-400 text-white"
                        required />
                    </div>
                    {formData.useBlockchain && (
                      <div className="space-y-2">
                        <div className="p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                          <div className="flex items-center space-x-2">
                            <Shield className="h-4 w-4 text-green-400" />
                            <span className="text-sm font-medium text-green-300">Wallet Signing Enabled</span>
                          </div>
                          <p className="text-xs text-green-200 mt-1">
                            Your connected wallet will be used to securely sign the blockchain transaction. No private key required.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 p-4 bg-white/5 rounded-lg">
                    <h3 className="font-medium text-white">Second Party</h3>
                    <div className="space-y-2">
                      <Label htmlFor="party2Name" className="text-slate-300">Full Name *</Label>
                      <Input
                        id="party2Name"
                        value={formData.party2Name}
                        onChange={(e) => handleInputChange('party2Name', e.target.value)}
                        placeholder="Enter full name"
                        className="bg-white/10 border-white/20 focus:border-blue-400 text-white"
                        required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="party2Email" className="text-slate-300">Email Address *</Label>
                      <Input
                        id="party2Email"
                        type="email"
                        value={formData.party2Email}
                        onChange={(e) => handleInputChange('party2Email', e.target.value)}
                        placeholder="Enter email address"
                        className="bg-white/10 border-white/20 focus:border-blue-400 text-white"
                        required />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="party2PublicKey" className="text-slate-300">Public Key *</Label>
                      <Input
                        id="party2PublicKey"
                        value={formData.party2PublicKey}
                        onChange={(e) => handleInputChange('party2PublicKey', e.target.value)}
                        placeholder="Enter public key"
                        className="bg-white/10 border-white/20 focus:border-blue-400 text-white"
                        required />
                    </div>
                  </div>
                </div>

                {/* Additional Parties */}
                <div className="space-y-4">
                  <h3 className="font-medium text-white">Additional Parties (Optional)</h3>

                  {formData.additionalParties.length > 0 && (
                    <div className="space-y-2">
                      {formData.additionalParties.map((party, index) => (
                        <div key={index} className="flex items-center justify-between bg-white/5 border border-white/20 rounded-lg p-3">
                          <div className="flex-1">
                            <span className="font-medium text-white">{party.name}</span>
                            <span className="text-slate-400 ml-2">({party.email})</span>
                            <p className="text-slate-400 text-sm">Public Key: {party.publicKey}</p>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeParty(index)}
                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
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
                      className="bg-white/10 border-white/20 focus:border-blue-400 text-white" />
                    <Input
                      type="email"
                      value={newPartyEmail}
                      onChange={(e) => setNewPartyEmail(e.target.value)}
                      placeholder="Email address"
                      className="bg-white/10 border-white/20 focus:border-blue-400 text-white" />
                    <Input
                      value={newPartyPublicKey}
                      onChange={(e) => setNewPartyPublicKey(e.target.value)}
                      placeholder="Public key"
                      className="bg-white/10 border-white/20 focus:border-blue-400 text-white" />
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
                      className="border-white/30" />
                    <Label htmlFor="useMediator" className="text-slate-300 font-medium">
                      Include a Mediator (Optional)
                    </Label>
                  </div>
                  <p className="text-sm text-slate-400">A mediator can help resolve disputes and ensure fair contract execution.</p>

                  {formData.useMediator && (
                    <div className="grid md:grid-cols-2 gap-4 p-4 bg-amber-500/10 border border-amber-400/20 rounded-lg">
                      <div className="space-y-2">
                        <Label htmlFor="mediatorName" className="text-slate-300">Mediator Name</Label>
                        <Input
                          id="mediatorName"
                          value={formData.mediatorName}
                          onChange={(e) => handleInputChange('mediatorName', e.target.value)}
                          placeholder="Enter mediator name"
                          className="bg-white/10 border-white/20 focus:border-blue-400 text-white" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="mediatorEmail" className="text-slate-300">Mediator Email</Label>
                        <Input
                          id="mediatorEmail"
                          type="email"
                          value={formData.mediatorEmail}
                          onChange={(e) => handleInputChange('mediatorEmail', e.target.value)}
                          placeholder="Enter mediator email"
                          className="bg-white/10 border-white/20 focus:border-blue-400 text-white" />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Agreement Section */}
              <div className="space-y-4">
                <h2 className="text-2xl font-semibold text-white border-b border-white/20 pb-2">Contract Terms</h2>

                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="grid w-full grid-cols-2 bg-slate-800/60">
                    <TabsTrigger value="text" className="text-slate-300">Write Contract Text</TabsTrigger>
                    <TabsTrigger value="structured" className="text-slate-300">Add Terms Separator</TabsTrigger>
                  </TabsList>

                  <TabsContent value="text" className="space-y-2">
                    <Label htmlFor="agreementText" className="text-slate-300 font-medium">
                      Contract Terms and Conditions
                    </Label>
                    <Textarea
                      id="agreementText"
                      value={formData.agreementText}
                      onChange={(e) => handleInputChange('agreementText', e.target.value)}
                      placeholder="Write your contract terms here..."
                      className="bg-white/10 border-white/20 focus:border-blue-400 text-white min-h-32" />
                    <p className="text-slate-400 text-sm">
                      Tip: Include specific details about deliverables, payment terms, deadlines, and responsibilities.
                    </p>
                  </TabsContent>

                  <TabsContent value="structured" className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newClause}
                        onChange={(e) => setNewClause(e.target.value)}
                        placeholder="Add a specific contract term or condition"
                        className="bg-white/10 border-white/20 focus:border-blue-400 text-white"
                        onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addClause())} />
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
                          <span className="text-slate-300 text-sm flex-1">{clause}</span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeClause(index)}
                            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
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
                <h2 className="text-2xl font-semibold text-white border-b border-white/20 pb-2">Supporting Documents</h2>

                <div className="border-2 border-dashed border-white/30 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <input
                    type="file"
                    multiple
                    onChange={handleFileUpload}
                    className="hidden"
                    id="fileUpload"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png" />
                  <Label htmlFor="fileUpload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-slate-300 font-medium">Upload Supporting Documents</p>
                    <p className="text-slate-400 text-sm">PDF, Word documents, images (Max 10MB per file)</p>
                  </Label>
                </div>

                {formData.attachments.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-slate-300 font-medium">Attached Files:</p>
                    {formData.attachments.map((file, index) => (
                      <div key={index} className="bg-white/5 border border-white/20 rounded-lg p-3 flex items-center justify-between">
                        <span className="text-slate-300 text-sm">{file.name}</span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFile(index)}
                          className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
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
                <h2 className="text-2xl font-semibold text-white border-b border-white/20 pb-2">Platform Terms</h2>
                <div className="bg-white/5 border border-white/20 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <ul className="space-y-2">
                    {termsAndConditions.map((term, index) => (
                      <li key={index} className="text-slate-300 text-sm flex items-start">
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
                    className="border-white/30"
                    required />
                  <Label htmlFor="acceptTerms" className="text-slate-300 font-medium">
                    I accept the platform terms and conditions *
                  </Label>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6 border-t border-white/20">
                <Button
                  type="submit"
                  size="lg"
                  className={`w-full font-semibold py-4 text-lg ${
                    formData.useBlockchain
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
                      : 'bg-blue-600 hover:bg-blue-700'
                  } text-white`}
                  disabled={
                    !formData.acceptedTerms ||
                    !formData.party1Name ||
                    !formData.party2Name ||
                    !formData.contractTitle ||
                    !formData.party1PublicKey ||
                    !formData.party2PublicKey ||
                    (formData.useBlockchain && (!connected || !publicKey))
                  }
                >
                  {formData.useBlockchain ? (
                    <>
                      <Link className="h-5 w-5 mr-2" />
                      Deploy Contract to Blockchain
                    </>
                  ) : (
                    'Create & Send Contract for Signatures'
                  )}
                </Button>
                <p className="text-sm text-slate-400 text-center mt-2">
                  {formData.useBlockchain
                    ? 'Contract will be deployed to Solana devnet with 0.01 SOL platform fee'
                    : 'All parties will receive email notifications to review and digitally sign the contract'
                  }
                </p>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div><Toaster /></>
  );
};

export default ContractCreation;