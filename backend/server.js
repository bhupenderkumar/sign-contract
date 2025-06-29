require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { Connection, PublicKey, clusterApiUrl, Keypair, SystemProgram } = require('@solana/web3.js');
const anchor = require('@project-serum/anchor');
const { create } = require('ipfs-http-client');
const crypto = require('crypto');
const http = require('http');

// Import Models
const Contract = require('./models/Contract');
const User = require('./models/User');

// Import Services
const emailService = require('./services/emailService');
const solanaService = require('./services/solanaService');
const websocketService = require('./services/websocketService');
const PDFService = require('./services/pdfService');
const SolanaContractService = require('./services/solanaContractService');

// Load the IDL
const idl = require("/home/bhupek/digitalcontract/sign-contract/solana-contract/digital_contract/target/idl/digital_contract.json");

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// MongoDB Connection
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/digital_contracts';
mongoose.connect(mongoUri, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// IPFS Client (optional, can be disabled if not available)
let ipfs = null;
try {
  if (process.env.IPFS_HOST) {
    ipfs = create({
      host: process.env.IPFS_HOST || 'localhost',
      port: process.env.IPFS_PORT || 5001,
      protocol: process.env.IPFS_PROTOCOL || 'http',
    });
  }
} catch (error) {
  console.warn('IPFS not available:', error.message);
}

// Solana Connection
const solanaCluster = process.env.SOLANA_CLUSTER || 'devnet';
const connection = new Connection(clusterApiUrl(solanaCluster), 'confirmed');

// Solana Program ID (Deployed to Devnet)
const programId = new PublicKey("4bmYTgHAoYfBBwoELVqUzc9n8DTfFvtt7CodYq78wzir");

// Configure the client to use the local cluster.
anchor.setProvider(anchor.AnchorProvider.env());
const program = new anchor.Program(idl, programId);

// Platform Fee Recipient Keypair
let platformFeeRecipientKeypair;
try {
  const privateKeyString = process.env.PLATFORM_FEE_RECIPIENT_PRIVATE_KEY;
  if (privateKeyString) {
    platformFeeRecipientKeypair = Keypair.fromSecretKey(Buffer.from(JSON.parse(privateKeyString)));
  } else {
    // Generate a temporary keypair for development
    platformFeeRecipientKeypair = Keypair.generate();
    console.warn('Using temporary platform fee recipient keypair for development');
  }
} catch (error) {
  platformFeeRecipientKeypair = Keypair.generate();
  console.warn('Failed to load platform fee recipient keypair, using temporary one:', error.message);
}

// Initialize Solana Contract Service
const solanaContractService = new SolanaContractService(
  connection,
  program,
  platformFeeRecipientKeypair.publicKey
);

console.log('🚀 Solana Contract Service initialized');
console.log('📍 Program ID:', programId.toString());
console.log('💰 Platform Fee Recipient:', platformFeeRecipientKeypair.publicKey.toString());

// Utility Functions
const generateContractId = () => {
  return crypto.randomBytes(16).toString('hex');
};

const calculateDocumentHash = (contractData) => {
  const dataString = JSON.stringify(contractData);
  return crypto.createHash('sha256').update(dataString).digest('hex');
};

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Digital Contract API is running!',
    version: '1.0.0',
    endpoints: {
      'POST /api/contracts': 'Create a new contract',
      'GET /api/contracts/:id': 'Get contract details',
      'POST /api/contracts/:id/sign': 'Sign a contract',
      'GET /api/contracts/user/:publicKey': 'Get contracts for a user',
      'POST /api/users': 'Create or update user profile'
    }
  });
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';

    // Check Solana connection
    let solanaStatus = 'disconnected';
    try {
      await connection.getVersion();
      solanaStatus = 'connected';
    } catch (error) {
      console.error('Solana connection error:', error.message);
    }

    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbStatus,
        solana: solanaStatus,
        ipfs: ipfs ? 'available' : 'unavailable'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// Contract Creation Endpoint
app.post('/api/contracts', async (req, res) => {
  try {
    const {
      contractTitle,
      contractDescription,
      agreementText,
      structuredClauses,
      party1Name,
      party1Email,
      party1PublicKey,
      party2Name,
      party2Email,
      party2PublicKey,
      additionalParties,
      mediatorName,
      mediatorEmail,
      useMediator,
      expiryDate
    } = req.body;

    // Validate required fields
    if (!contractTitle || !party1Name || !party1Email || !party1PublicKey ||
        !party2Name || !party2Email || !party2PublicKey) {
      return res.status(400).json({
        message: 'Missing required fields',
        required: ['contractTitle', 'party1Name', 'party1Email', 'party1PublicKey',
                  'party2Name', 'party2Email', 'party2PublicKey']
      });
    }

    // Prepare parties array
    const parties = [
      { name: party1Name, email: party1Email, publicKey: party1PublicKey },
      { name: party2Name, email: party2Email, publicKey: party2PublicKey }
    ];

    // Add additional parties if provided
    if (additionalParties && Array.isArray(additionalParties)) {
      parties.push(...additionalParties);
    }

    // Validate party count
    if (parties.length < 2 || parties.length > 10) {
      return res.status(400).json({
        message: 'Invalid number of parties. Must be between 2 and 10.'
      });
    }

    // Generate contract ID and document hash
    const contractId = generateContractId();
    const contractData = {
      contractTitle,
      contractDescription,
      agreementText,
      structuredClauses,
      parties,
      mediator: useMediator ? { name: mediatorName, email: mediatorEmail } : null,
      timestamp: new Date().toISOString()
    };
    const documentHash = calculateDocumentHash(contractData);

    // Create contract in database
    const contract = new Contract({
      contractId,
      title: contractTitle,
      description: contractDescription,
      agreementText,
      structuredClauses: structuredClauses || [],
      documentHash,
      parties,
      mediator: useMediator ? { name: mediatorName, email: mediatorEmail } : undefined,
      useMediator,
      status: 'pending',
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      blockchainNetwork: solanaCluster
    });

    await contract.save();

    // Add audit log
    await contract.addAuditLog('contract_created', party1PublicKey, {
      title: contractTitle,
      partiesCount: parties.length,
      hasMediator: useMediator
    });

    // Send email notifications to all parties
    try {
      // Send to party2 (and additional parties if any)
      const emailPromises = [];

      // Notify party2
      emailPromises.push(
        emailService.sendContractCreatedEmail(contract, party2Email, party2Name)
      );

      // Notify additional parties
      if (additionalParties && additionalParties.length > 0) {
        additionalParties.forEach(party => {
          emailPromises.push(
            emailService.sendContractCreatedEmail(contract, party.email, party.name)
          );
        });
      }

      // Notify mediator if present
      if (useMediator && mediatorEmail) {
        emailPromises.push(
          emailService.sendContractCreatedEmail(contract, mediatorEmail, mediatorName)
        );
      }

      await Promise.all(emailPromises);
      console.log('📧 Email notifications sent to all parties');
    } catch (emailError) {
      console.error('📧 Failed to send email notifications:', emailError);
      // Don't fail the contract creation if emails fail
    }

    res.status(201).json({
      success: true,
      contractId,
      documentHash,
      message: 'Contract created successfully. Email notifications sent to all parties.',
      contract: {
        id: contractId,
        title: contractTitle,
        status: contract.status,
        parties: parties.map(p => ({ name: p.name, email: p.email })),
        createdAt: contract.createdAt
      }
    });

  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({
      message: 'Failed to create contract',
      error: error.message
    });
  }
});

// Create Contract On-Chain (Solana Blockchain)
app.post('/api/contracts/create-onchain', async (req, res) => {
  try {
    const {
      contractTitle,
      contractDescription,
      agreementText,
      structuredClauses,
      party1Name,
      party1Email,
      party1PublicKey,
      party1PrivateKey, // Required for signing the transaction
      party2Name,
      party2Email,
      party2PublicKey,
      additionalParties,
      mediatorName,
      mediatorEmail,
      useMediator,
      expiryDate
    } = req.body;

    // Validate required fields
    if (!contractTitle || !party1Name || !party1Email || !party1PublicKey || !party1PrivateKey ||
        !party2Name || !party2Email || !party2PublicKey) {
      return res.status(400).json({
        message: 'Missing required fields for on-chain contract creation',
        required: ['contractTitle', 'party1Name', 'party1Email', 'party1PublicKey', 'party1PrivateKey',
                  'party2Name', 'party2Email', 'party2PublicKey']
      });
    }

    // Create creator keypair from private key
    let creatorKeypair;
    try {
      creatorKeypair = SolanaContractService.createKeypairFromPrivateKey(party1PrivateKey);

      // Verify the public key matches
      if (creatorKeypair.publicKey.toString() !== party1PublicKey) {
        return res.status(400).json({
          message: 'Private key does not match the provided public key'
        });
      }
    } catch (error) {
      return res.status(400).json({
        message: 'Invalid private key format',
        error: error.message
      });
    }

    // Prepare parties array
    const parties = [
      { name: party1Name, email: party1Email, publicKey: party1PublicKey },
      { name: party2Name, email: party2Email, publicKey: party2PublicKey }
    ];

    // Add additional parties if provided
    if (additionalParties && Array.isArray(additionalParties)) {
      parties.push(...additionalParties);
    }

    // Validate party count
    if (parties.length < 2 || parties.length > 10) {
      return res.status(400).json({
        message: 'Invalid number of parties. Must be between 2 and 10.'
      });
    }

    // Generate contract ID
    const contractId = SolanaContractService.generateContractId();

    // Prepare contract data for blockchain
    const contractData = {
      contractId,
      title: contractTitle,
      description: contractDescription,
      agreementText,
      structuredClauses: structuredClauses || [],
      parties,
      mediator: useMediator ? { name: mediatorName, email: mediatorEmail } : null,
      useMediator: useMediator || false,
      expiryDate: expiryDate ? new Date(expiryDate) : null
    };

    // Create contract on Solana blockchain
    const blockchainResult = await solanaContractService.createContract(contractData, creatorKeypair);

    if (!blockchainResult.success) {
      return res.status(500).json({
        message: 'Failed to create contract on blockchain',
        error: blockchainResult.error
      });
    }

    // Calculate document hash for database storage
    const documentHash = calculateDocumentHash(contractData);

    // Create contract in database with blockchain information
    const contract = new Contract({
      contractId,
      title: contractTitle,
      description: contractDescription,
      agreementText,
      structuredClauses: structuredClauses || [],
      documentHash,
      parties,
      mediator: useMediator ? { name: mediatorName, email: mediatorEmail } : undefined,
      useMediator,
      status: 'solana_created', // New status for blockchain contracts
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      blockchainNetwork: solanaCluster,
      blockchainTxHash: blockchainResult.transactionId,
      contractAddress: blockchainResult.contractAddress,
      platformFee: blockchainResult.platformFee
    });

    await contract.save();

    // Add audit log
    await contract.addAuditLog('contract_created_onchain', party1PublicKey, {
      title: contractTitle,
      partiesCount: parties.length,
      hasMediator: useMediator,
      transactionId: blockchainResult.transactionId,
      contractAddress: blockchainResult.contractAddress,
      platformFee: blockchainResult.platformFee
    });

    // Send email notifications to all parties
    try {
      const emailPromises = [];

      // Notify party2
      emailPromises.push(
        emailService.sendContractCreatedEmail(contract, party2Email, party2Name)
      );

      // Notify additional parties
      if (additionalParties && additionalParties.length > 0) {
        additionalParties.forEach(party => {
          emailPromises.push(
            emailService.sendContractCreatedEmail(contract, party.email, party.name)
          );
        });
      }

      // Notify mediator if present
      if (useMediator && mediatorEmail) {
        emailPromises.push(
          emailService.sendContractCreatedEmail(contract, mediatorEmail, mediatorName)
        );
      }

      await Promise.all(emailPromises);
      console.log('📧 Email notifications sent to all parties');
    } catch (emailError) {
      console.error('📧 Failed to send email notifications:', emailError);
      // Don't fail the contract creation if emails fail
    }

    res.status(201).json({
      success: true,
      contractId,
      documentHash,
      transactionId: blockchainResult.transactionId,
      contractAddress: blockchainResult.contractAddress,
      platformFee: blockchainResult.platformFee,
      explorerUrl: `https://explorer.solana.com/tx/${blockchainResult.transactionId}?cluster=devnet`,
      message: 'Contract created successfully on Solana blockchain. Email notifications sent to all parties.',
      contract: {
        id: contractId,
        title: contractTitle,
        status: contract.status,
        parties: parties.map(p => ({ name: p.name, email: p.email })),
        createdAt: contract.createdAt,
        blockchainInfo: {
          network: solanaCluster,
          transactionId: blockchainResult.transactionId,
          contractAddress: blockchainResult.contractAddress
        }
      }
    });

  } catch (error) {
    console.error('Error creating on-chain contract:', error);
    res.status(500).json({
      message: 'Failed to create on-chain contract',
      error: error.message
    });
  }
});

// Get Contract Details
app.get('/api/contracts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const contract = await Contract.findOne({ contractId: id });
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    res.json({
      success: true,
      contract: {
        contractId: contract.contractId,
        title: contract.title,
        description: contract.description,
        agreementText: contract.agreementText,
        structuredClauses: contract.structuredClauses,
        parties: contract.parties,
        mediator: contract.mediator,
        useMediator: contract.useMediator,
        status: contract.status,
        documentHash: contract.documentHash,
        solanaTransactionId: contract.solanaTransactionId,
        solanaContractAddress: contract.solanaContractAddress,
        createdAt: contract.createdAt,
        updatedAt: contract.updatedAt,
        expiryDate: contract.expiryDate,
        signingProgress: contract.signingProgress,
        isFullySigned: contract.isFullySigned,
        attachments: contract.attachments
      }
    });
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({
      message: 'Failed to fetch contract',
      error: error.message
    });
  }
});

// Get Contracts for a User
app.get('/api/contracts/user/:publicKey', async (req, res) => {
  try {
    const { publicKey } = req.params;
    const { status, limit = 20, offset = 0 } = req.query;

    const query = { 'parties.publicKey': publicKey };
    if (status) {
      query.status = status;
    }

    const contracts = await Contract.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Contract.countDocuments(query);

    res.json({
      success: true,
      contracts: contracts.map(contract => ({
        contractId: contract.contractId,
        title: contract.title,
        description: contract.description,
        status: contract.status,
        parties: contract.parties.map(p => ({ name: p.name, email: p.email, hasSigned: p.hasSigned })),
        createdAt: contract.createdAt,
        expiryDate: contract.expiryDate,
        signingProgress: contract.signingProgress,
        isFullySigned: contract.isFullySigned
      })),
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: (parseInt(offset) + parseInt(limit)) < total
      }
    });
  } catch (error) {
    console.error('Error fetching user contracts:', error);
    res.status(500).json({
      message: 'Failed to fetch contracts',
      error: error.message
    });
  }
});

// Download Contract PDF
app.get('/api/contracts/:id/download-pdf', async (req, res) => {
  try {
    const { id } = req.params;

    const contract = await Contract.findOne({ contractId: id });
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // Generate PDF
    const pdfBuffer = await PDFService.generateContractPDF({
      id: contract.contractId,
      title: contract.title,
      description: contract.description,
      amount: contract.amount,
      createdAt: contract.createdAt,
      dueDate: contract.expiryDate,
      status: contract.status,
      firstPartyName: contract.parties[0]?.name || 'Unknown',
      firstPartyEmail: contract.parties[0]?.email || 'Unknown',
      firstPartyWallet: contract.parties[0]?.publicKey || 'Unknown',
      secondPartyName: contract.parties[1]?.name || 'Unknown',
      secondPartyEmail: contract.parties[1]?.email || 'Unknown',
      secondPartyWallet: contract.parties[1]?.publicKey || 'Unknown',
      terms: contract.terms || [],
      firstPartySignature: contract.parties[0]?.hasSigned || false,
      firstPartySignedAt: contract.parties[0]?.signedAt,
      secondPartySignature: contract.parties[1]?.hasSigned || false,
      secondPartySignedAt: contract.parties[1]?.signedAt,
      blockchainTxHash: contract.blockchainTxHash
    });

    // Set response headers for PDF download
    const fileName = PDFService.getContractFileName(contract.contractId);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);

    // Send the PDF
    res.send(pdfBuffer);

    console.log(`📄 PDF generated and sent for contract ${contract.contractId}`);

  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({
      message: 'Failed to generate PDF',
      error: error.message
    });
  }
});

// Activate Contract Endpoint (for development/testing)
app.post('/api/contracts/:id/activate', async (req, res) => {
  try {
    const { id } = req.params;

    const contract = await Contract.findOne({ contractId: id });
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (contract.status !== 'pending') {
      return res.status(400).json({
        message: 'Contract can only be activated from pending status',
        currentStatus: contract.status
      });
    }

    contract.status = 'active';
    await contract.save();

    // Add audit log
    await contract.addAuditLog('contract_activated', 'system', {
      previousStatus: 'pending',
      newStatus: 'active'
    });

    res.json({
      success: true,
      message: 'Contract activated successfully',
      contract: {
        contractId: contract.contractId,
        status: contract.status,
        updatedAt: contract.updatedAt
      }
    });

  } catch (error) {
    console.error('Error activating contract:', error);
    res.status(500).json({
      message: 'Failed to activate contract',
      error: error.message
    });
  }
});

// Sign Contract Endpoint
app.post('/api/contracts/:id/sign', async (req, res) => {
  try {
    const { id } = req.params;
    const { signerPublicKey, transactionId } = req.body;

    if (!signerPublicKey) {
      return res.status(400).json({ message: 'Signer public key is required' });
    }

    const contract = await Contract.findOne({ contractId: id });
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // Check if contract is in a signable state
    if (!['active', 'partially_signed'].includes(contract.status)) {
      return res.status(400).json({
        message: 'Contract is not in a signable state',
        currentStatus: contract.status
      });
    }

    // Check if contract has expired
    if (contract.expiryDate && new Date() > contract.expiryDate) {
      contract.status = 'expired';
      await contract.save();
      return res.status(400).json({ message: 'Contract has expired' });
    }

    // Find the party in the contract
    const partyIndex = contract.parties.findIndex(party => party.publicKey === signerPublicKey);
    if (partyIndex === -1) {
      return res.status(403).json({ message: 'Unauthorized: You are not a party to this contract' });
    }

    // Check if already signed
    if (contract.parties[partyIndex].hasSigned) {
      return res.status(400).json({ message: 'You have already signed this contract' });
    }

    // Mark as signed
    contract.parties[partyIndex].hasSigned = true;
    contract.parties[partyIndex].signedAt = new Date();
    contract.parties[partyIndex].signatureTransactionId = transactionId;

    // Update contract status
    const allSigned = contract.parties.every(party => party.hasSigned);
    if (allSigned) {
      contract.status = 'fully_signed';
      contract.completedAt = new Date();
    } else {
      contract.status = 'partially_signed';
    }

    await contract.save();

    // Add audit log
    await contract.addAuditLog('contract_signed', signerPublicKey, {
      transactionId,
      partyIndex,
      allSigned
    });

    // Send email notifications
    try {
      const signerName = contract.parties[partyIndex].name;

      if (allSigned) {
        // Contract is fully signed - notify all parties
        const emailPromises = contract.parties.map(party =>
          emailService.sendContractCompletedEmail(contract, party.email, party.name)
        );

        // Also notify mediator if present
        if (contract.useMediator && contract.mediator?.email) {
          emailPromises.push(
            emailService.sendContractCompletedEmail(contract, contract.mediator.email, contract.mediator.name)
          );
        }

        await Promise.all(emailPromises);
        console.log('📧 Contract completion notifications sent to all parties');
      } else {
        // Contract is partially signed - notify other parties about the new signature
        const emailPromises = contract.parties
          .filter((party, index) => index !== partyIndex) // Don't notify the signer
          .map(party =>
            emailService.sendContractSignedEmail(contract, signerName, party.email, party.name)
          );

        // Also notify mediator if present
        if (contract.useMediator && contract.mediator?.email) {
          emailPromises.push(
            emailService.sendContractSignedEmail(contract, signerName, contract.mediator.email, contract.mediator.name)
          );
        }

        await Promise.all(emailPromises);
        console.log('📧 Signature notifications sent to remaining parties');
      }
    } catch (emailError) {
      console.error('📧 Failed to send email notifications:', emailError);
      // Don't fail the signing process if emails fail
    }

    res.json({
      success: true,
      message: allSigned ? 'Contract fully signed! All parties have been notified.' : 'Contract signed successfully. Other parties have been notified.',
      contract: {
        contractId: contract.contractId,
        status: contract.status,
        signingProgress: contract.signingProgress,
        isFullySigned: contract.isFullySigned,
        completedAt: contract.completedAt
      },
      txId: transactionId
    });

  } catch (error) {
    console.error('Error signing contract:', error);
    res.status(500).json({
      message: 'Failed to sign contract',
      error: error.message
    });
  }
});

// Sign Contract On-Chain (Solana Blockchain)
app.post('/api/contracts/:id/sign-onchain', async (req, res) => {
  try {
    const { id } = req.params;
    const { signerPublicKey, signerPrivateKey } = req.body;

    if (!signerPublicKey || !signerPrivateKey) {
      return res.status(400).json({
        message: 'Signer public key and private key are required for on-chain signing'
      });
    }

    const contract = await Contract.findOne({ contractId: id });
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // Check if this is a blockchain contract
    if (contract.status !== 'solana_created' && !contract.contractAddress) {
      return res.status(400).json({
        message: 'This contract was not created on the blockchain. Use the regular signing endpoint.',
        currentStatus: contract.status
      });
    }

    // Check if contract has expired
    if (contract.expiryDate && new Date() > contract.expiryDate) {
      contract.status = 'expired';
      await contract.save();
      return res.status(400).json({ message: 'Contract has expired' });
    }

    // Create signer keypair from private key
    let signerKeypair;
    try {
      signerKeypair = SolanaContractService.createKeypairFromPrivateKey(signerPrivateKey);

      // Verify the public key matches
      if (signerKeypair.publicKey.toString() !== signerPublicKey) {
        return res.status(400).json({
          message: 'Private key does not match the provided public key'
        });
      }
    } catch (error) {
      return res.status(400).json({
        message: 'Invalid private key format',
        error: error.message
      });
    }

    // Check if user can sign this contract on-chain
    const canSign = await solanaContractService.canUserSignContract(contract.contractAddress, signerPublicKey);
    if (!canSign) {
      return res.status(403).json({
        message: 'You are not authorized to sign this contract or have already signed it'
      });
    }

    // Sign the contract on Solana blockchain
    const blockchainResult = await solanaContractService.signContract(contract.contractAddress, signerKeypair);

    if (!blockchainResult.success) {
      return res.status(500).json({
        message: 'Failed to sign contract on blockchain',
        error: blockchainResult.error
      });
    }

    // Update database with signature information
    const partyIndex = contract.parties.findIndex(party => party.publicKey === signerPublicKey);
    if (partyIndex !== -1) {
      contract.parties[partyIndex].hasSigned = true;
      contract.parties[partyIndex].signedAt = new Date();
      contract.parties[partyIndex].signatureTransactionId = blockchainResult.transactionId;
    }

    // Check if contract is fully signed on-chain
    const isFullySigned = await solanaContractService.isContractFullySigned(contract.contractAddress);

    if (isFullySigned) {
      contract.status = 'fully_signed';
      contract.completedAt = new Date();
    } else {
      contract.status = 'partially_signed';
    }

    await contract.save();

    // Add audit log
    await contract.addAuditLog('contract_signed_onchain', signerPublicKey, {
      transactionId: blockchainResult.transactionId,
      partyIndex,
      allSigned: isFullySigned,
      contractAddress: contract.contractAddress
    });

    // Send email notifications
    try {
      const signerName = contract.parties[partyIndex]?.name || 'Unknown';

      if (isFullySigned) {
        // Contract is fully signed - notify all parties
        const emailPromises = contract.parties.map(party =>
          emailService.sendContractCompletedEmail(contract, party.email, party.name)
        );

        // Also notify mediator if present
        if (contract.useMediator && contract.mediator?.email) {
          emailPromises.push(
            emailService.sendContractCompletedEmail(contract, contract.mediator.email, contract.mediator.name)
          );
        }

        await Promise.all(emailPromises);
        console.log('📧 Contract completion notifications sent to all parties');
      } else {
        // Contract is partially signed - notify other parties about the new signature
        const emailPromises = contract.parties
          .filter((party, index) => index !== partyIndex) // Don't notify the signer
          .map(party =>
            emailService.sendContractSignedEmail(contract, signerName, party.email, party.name)
          );

        // Also notify mediator if present
        if (contract.useMediator && contract.mediator?.email) {
          emailPromises.push(
            emailService.sendContractSignedEmail(contract, signerName, contract.mediator.email, contract.mediator.name)
          );
        }

        await Promise.all(emailPromises);
        console.log('📧 Signature notifications sent to remaining parties');
      }
    } catch (emailError) {
      console.error('📧 Failed to send email notifications:', emailError);
      // Don't fail the signing process if emails fail
    }

    res.json({
      success: true,
      message: isFullySigned ?
        'Contract fully signed on blockchain! All parties have been notified.' :
        'Contract signed successfully on blockchain. Other parties have been notified.',
      contract: {
        contractId: contract.contractId,
        status: contract.status,
        signingProgress: contract.signingProgress,
        isFullySigned: contract.isFullySigned,
        completedAt: contract.completedAt,
        contractAddress: contract.contractAddress
      },
      blockchain: {
        transactionId: blockchainResult.transactionId,
        explorerUrl: `https://explorer.solana.com/tx/${blockchainResult.transactionId}?cluster=devnet`,
        network: contract.blockchainNetwork
      }
    });

  } catch (error) {
    console.error('Error signing contract on-chain:', error);
    res.status(500).json({
      message: 'Failed to sign contract on blockchain',
      error: error.message
    });
  }
});

// User Management Endpoints
app.post('/api/users', async (req, res) => {
  try {
    const { name, email, publicKey, organization, phone } = req.body;

    if (!name || !email || !publicKey) {
      return res.status(400).json({
        message: 'Missing required fields: name, email, publicKey'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ $or: [{ email }, { publicKey }] });

    if (user) {
      // Update existing user
      user.name = name;
      user.email = email;
      user.organization = organization || user.organization;
      user.phone = phone || user.phone;
      await user.save();
    } else {
      // Create new user
      user = new User({
        name,
        email,
        publicKey,
        organization,
        phone
      });
      await user.save();
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        publicKey: user.publicKey,
        organization: user.organization,
        stats: user.stats,
        createdAt: user.createdAt
      }
    });

  } catch (error) {
    console.error('Error managing user:', error);
    res.status(500).json({
      message: 'Failed to manage user',
      error: error.message
    });
  }
});

// Get User Profile
app.get('/api/users/:publicKey', async (req, res) => {
  try {
    const { publicKey } = req.params;

    const user = await User.findByPublicKey(publicKey);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        publicKey: user.publicKey,
        organization: user.organization,
        phone: user.phone,
        stats: user.stats,
        preferences: user.preferences,
        status: user.status,
        createdAt: user.createdAt,
        lastLogin: user.lastLogin
      }
    });

  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({
      message: 'Failed to fetch user',
      error: error.message
    });
  }
});

// Dispute Management Endpoints

// Raise a Dispute
app.post('/api/contracts/:id/disputes', async (req, res) => {
  try {
    const { id } = req.params;
    const { raisedBy, raisedByName, reason, description, evidence } = req.body;

    if (!raisedBy || !raisedByName || !reason || !description) {
      return res.status(400).json({
        message: 'Missing required fields: raisedBy, raisedByName, reason, description'
      });
    }

    const contract = await Contract.findOne({ contractId: id });
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // Check if the user is a party to the contract
    const isParty = contract.parties.some(party => party.publicKey === raisedBy);
    if (!isParty) {
      return res.status(403).json({ message: 'Only contract parties can raise disputes' });
    }

    // Check if contract is in a disputable state
    if (!['active', 'partially_signed', 'fully_signed', 'completed'].includes(contract.status)) {
      return res.status(400).json({
        message: 'Contract is not in a state where disputes can be raised',
        currentStatus: contract.status
      });
    }

    // Generate dispute ID
    const disputeId = `DISP-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create dispute
    const dispute = {
      disputeId,
      raisedBy,
      raisedByName,
      reason,
      description,
      status: 'open',
      evidence: evidence || [],
      createdAt: new Date()
    };

    contract.disputes.push(dispute);
    contract.status = 'disputed';
    await contract.save();

    // Add audit log
    await contract.addAuditLog('dispute_raised', raisedBy, {
      disputeId,
      reason,
      description: description.substring(0, 100) + '...'
    });

    // Send email notifications to all parties and mediator
    try {
      const emailPromises = [];

      // Notify all other parties
      contract.parties
        .filter(party => party.publicKey !== raisedBy)
        .forEach(party => {
          emailPromises.push(
            emailService.sendDisputeRaisedEmail(contract, dispute, party.email, party.name)
          );
        });

      // Notify mediator if present
      if (contract.useMediator && contract.mediator?.email) {
        emailPromises.push(
          emailService.sendDisputeRaisedEmail(contract, dispute, contract.mediator.email, contract.mediator.name)
        );
      }

      await Promise.all(emailPromises);
      console.log('📧 Dispute notifications sent to all parties');
    } catch (emailError) {
      console.error('📧 Failed to send dispute notifications:', emailError);
    }

    res.status(201).json({
      success: true,
      message: 'Dispute raised successfully. All parties have been notified.',
      dispute: {
        disputeId,
        status: dispute.status,
        createdAt: dispute.createdAt
      }
    });

  } catch (error) {
    console.error('Error raising dispute:', error);
    res.status(500).json({
      message: 'Failed to raise dispute',
      error: error.message
    });
  }
});

// Get Contract Disputes
app.get('/api/contracts/:id/disputes', async (req, res) => {
  try {
    const { id } = req.params;

    const contract = await Contract.findOne({ contractId: id });
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    res.json({
      success: true,
      disputes: contract.disputes
    });

  } catch (error) {
    console.error('Error fetching disputes:', error);
    res.status(500).json({
      message: 'Failed to fetch disputes',
      error: error.message
    });
  }
});

// Resolve a Dispute
app.post('/api/contracts/:id/disputes/:disputeId/resolve', async (req, res) => {
  try {
    const { id, disputeId } = req.params;
    const { resolvedBy, resolution } = req.body;

    if (!resolvedBy || !resolution) {
      return res.status(400).json({
        message: 'Missing required fields: resolvedBy, resolution'
      });
    }

    const contract = await Contract.findOne({ contractId: id });
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    const disputeIndex = contract.disputes.findIndex(d => d.disputeId === disputeId);
    if (disputeIndex === -1) {
      return res.status(404).json({ message: 'Dispute not found' });
    }

    const dispute = contract.disputes[disputeIndex];
    if (dispute.status !== 'open') {
      return res.status(400).json({
        message: 'Dispute is not in open status',
        currentStatus: dispute.status
      });
    }

    // Check if the resolver is authorized (mediator or contract party)
    const isMediator = contract.useMediator && contract.mediator?.email;
    const isParty = contract.parties.some(party => party.publicKey === resolvedBy);

    if (!isMediator && !isParty) {
      return res.status(403).json({ message: 'Unauthorized to resolve dispute' });
    }

    // Update dispute
    contract.disputes[disputeIndex].status = 'resolved';
    contract.disputes[disputeIndex].resolution = resolution;
    contract.disputes[disputeIndex].resolvedBy = resolvedBy;
    contract.disputes[disputeIndex].resolvedAt = new Date();

    // Check if all disputes are resolved
    const hasOpenDisputes = contract.disputes.some(d => d.status === 'open');
    if (!hasOpenDisputes) {
      contract.status = 'dispute_resolved';
    }

    await contract.save();

    // Add audit log
    await contract.addAuditLog('dispute_resolved', resolvedBy, {
      disputeId,
      resolution: resolution.substring(0, 100) + '...'
    });

    res.json({
      success: true,
      message: 'Dispute resolved successfully',
      dispute: contract.disputes[disputeIndex]
    });

  } catch (error) {
    console.error('Error resolving dispute:', error);
    res.status(500).json({
      message: 'Failed to resolve dispute',
      error: error.message
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Solana API endpoints
app.get('/api/solana/balance/:publicKey', async (req, res) => {
  try {
    const { publicKey } = req.params;
    const balance = await solanaService.getBalance(publicKey);

    res.json({
      success: true,
      publicKey,
      balance,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error getting balance:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/solana/account/:publicKey', async (req, res) => {
  try {
    const { publicKey } = req.params;
    const accountInfo = await solanaService.getAccountInfo(publicKey);

    res.json({
      success: true,
      publicKey,
      accountInfo,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error getting account info:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/solana/transaction/:signature', async (req, res) => {
  try {
    const { signature } = req.params;
    const transaction = await solanaService.getTransaction(signature);

    res.json({
      success: true,
      signature,
      transaction,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error getting transaction:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.get('/api/solana/status', (req, res) => {
  try {
    const status = solanaService.getConnectionStatus();
    const clientCount = websocketService.getClientCount();

    res.json({
      success: true,
      solana: status,
      websocket: {
        connectedClients: clientCount,
        clients: websocketService.getConnectedClients()
      },
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error getting Solana status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

app.post('/api/solana/clear-cache', (req, res) => {
  try {
    solanaService.clearCache();

    res.json({
      success: true,
      message: 'Cache cleared successfully',
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error clearing cache:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    message: 'Endpoint not found',
    availableEndpoints: [
      'GET /',
      'GET /api/health',
      'POST /api/contracts',
      'GET /api/contracts/:id',
      'POST /api/contracts/:id/sign',
      'GET /api/contracts/user/:publicKey',
      'POST /api/users',
      'GET /api/users/:publicKey',
      'GET /api/solana/balance/:publicKey',
      'GET /api/solana/account/:publicKey',
      'GET /api/solana/transaction/:signature',
      'GET /api/solana/status',
      'POST /api/solana/clear-cache'
    ]
  });
});

// Create HTTP server and initialize WebSocket
const server = http.createServer(app);
websocketService.initialize(server);

// Start the server
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 Digital Contract API Server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Solana Cluster: ${solanaCluster}`);
  console.log(`💾 MongoDB: ${mongoUri}`);
  console.log(`📡 IPFS: ${ipfs ? 'Available' : 'Not configured'}`);
});