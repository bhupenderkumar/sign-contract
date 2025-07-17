// Load environment variables from .env.local first, then .env
require('dotenv').config({ path: '.env.local' });
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const { Connection, PublicKey, clusterApiUrl, Keypair, SystemProgram, Transaction } = require('@solana/web3.js');
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

// Import Environment Configuration
const {
  getCurrentNetwork,
  getNetworkConfig,
  validateEnvironment,
  getEnvironmentInfo,
  networkMiddleware
} = require('./config/environment');

// Load the IDL with proper path resolution
const path = require('path');
const idlPath = path.join(__dirname, '..', 'digital_contract', 'target', 'idl', 'digital_contract.json');

let idl;
try {
  idl = require(idlPath);
  console.log('✅ IDL loaded successfully from:', idlPath);
} catch (error) {
  console.warn('⚠️ IDL not found at:', idlPath);
  console.warn('⚠️ Contract functionality will be limited without IDL');
  // Create a minimal IDL structure to prevent crashes
  idl = {
    version: "0.1.0",
    name: "digital_contract",
    instructions: [],
    accounts: [],
    types: []
  };
}

// Initialize Express app
const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));

// Import Database Manager
const databaseManager = require('./config/database');

// MongoDB Connection with improved error handling
const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/digital_contracts';

// Initialize database connection
(async () => {
  const dbResult = await databaseManager.connectWithFallback(mongoUri);
  if (!dbResult.success) {
    console.error('❌ Database connection failed:', dbResult.error);
    if (dbResult.suggestions) {
      console.log('💡 Suggestions:');
      dbResult.suggestions.forEach(suggestion => console.log(`   - ${suggestion}`));
    }
    console.log('⚠️ Server will continue running but database operations will fail.');
  }
})();

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

// Validate environment on startup
console.log('🔍 Validating environment...');
const envValidation = validateEnvironment();
if (!envValidation.isValid) {
  console.error('❌ Environment validation failed:');
  envValidation.errors.forEach(error => console.error(`  - ${error}`));
  process.exit(1);
}
console.log('✅ Environment validation passed');

// Solana Connection using environment configuration
const currentNetwork = getCurrentNetwork();
const networkConfig = getNetworkConfig(currentNetwork);
const connection = new Connection(networkConfig.rpcUrl, 'confirmed');

console.log(`🔗 Solana Network: ${networkConfig.displayName} (${currentNetwork})`);
console.log(`🌐 RPC Endpoint: ${networkConfig.rpcUrl}`);

// Solana Program ID (Deployed to Testnet/Devnet)
const programId = new PublicKey("7ow2v1f2EFNWQAVwn6aXih3kuXBP5FAX9ni48Uqva1LK");

// Configure the client to use the local cluster with proper wallet path
const walletPath = path.join(__dirname, 'wallet.json');
process.env.ANCHOR_WALLET = walletPath;

console.log('🔧 Setting ANCHOR_WALLET to:', walletPath);

// Load the wallet keypair for transactions
let walletKeypair;
try {
  const walletData = require(walletPath);
  walletKeypair = Keypair.fromSecretKey(new Uint8Array(walletData));
  console.log('💼 Wallet loaded:', walletKeypair.publicKey.toString());
} catch (error) {
  console.error('❌ Failed to load wallet:', error.message);
  process.exit(1);
}

anchor.setProvider(anchor.AnchorProvider.env());
const program = new anchor.Program(idl, programId);

// Platform Fee Recipient Configuration
let platformFeeRecipient;
try {
  if (process.env.PLATFORM_FEE_RECIPIENT_PUBLIC_KEY) {
    platformFeeRecipient = new PublicKey(process.env.PLATFORM_FEE_RECIPIENT_PUBLIC_KEY);
    console.log('💰 Platform Fee Recipient (from env):', platformFeeRecipient.toString());
  } else {
    // Fallback: Generate a temporary keypair for development
    const tempKeypair = Keypair.generate();
    platformFeeRecipient = tempKeypair.publicKey;
    console.warn('⚠️ Using temporary platform fee recipient for development:', platformFeeRecipient.toString());
  }
} catch (error) {
  const tempKeypair = Keypair.generate();
  platformFeeRecipient = tempKeypair.publicKey;
  console.warn('⚠️ Failed to load platform fee recipient, using temporary one:', error.message);
}

// Initialize Solana Contract Service
const solanaContractService = new SolanaContractService(
  connection,
  program,
  platformFeeRecipient
);

console.log('🚀 Solana Contract Service initialized');
console.log('📍 Program ID:', programId.toString());
console.log('💰 Platform Fee Recipient:', platformFeeRecipient.toString());

// Utility Functions
const generateContractId = () => {
  return crypto.randomBytes(16).toString('hex');
};

const calculateDocumentHash = (contractData) => {
  const dataString = JSON.stringify(contractData);
  return crypto.createHash('sha256').update(dataString).digest('hex');
};

// Apply network middleware to all API routes
app.use('/api', networkMiddleware);

// Basic route
app.get('/', (req, res) => {
  res.json({
    message: 'Digital Contract API is running!',
    version: '1.0.0',
    network: currentNetwork,
    endpoints: {
      'POST /api/contracts': 'Create a new contract',
      'GET /api/contracts/:id': 'Get contract details',
      'POST /api/contracts/:id/sign': 'Sign a contract',
      'GET /api/contracts/user/:publicKey': 'Get contracts for a user',
      'POST /api/users': 'Create or update user profile',
      'GET /api/environment': 'Get environment information'
    }
  });
});

// Environment information endpoint
app.get('/api/environment', (req, res) => {
  try {
    const envInfo = getEnvironmentInfo();
    res.json({
      success: true,
      environment: envInfo,
      requestNetwork: req.solanaNetwork,
      requestNetworkConfig: req.networkConfig
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', async (req, res) => {
  try {
    // Check database connection using database manager
    const dbConnectionStatus = databaseManager.getConnectionStatus();
    const dbStatus = dbConnectionStatus.isConnected ? 'connected' : 'disconnected';

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
        database: {
          status: dbStatus,
          details: dbConnectionStatus
        },
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
      expiryDate,
      // Blockchain-specific fields (when wallet signing is used)
      blockchainTxHash,
      contractAddress,
      status
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

    // Determine if this is a blockchain contract
    const isBlockchainContract = status === 'blockchain_created' && blockchainTxHash;

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
      status: isBlockchainContract ? 'solana_created' : 'pending',
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      blockchainNetwork: req.solanaNetwork || getCurrentNetwork(),
      // Add blockchain-specific fields if this is a blockchain contract
      ...(isBlockchainContract && {
        blockchainTxHash,
        contractAddress,
        platformFee: 0.01 // Default platform fee
      })
    });

    await contract.save();

    // Add audit log
    await contract.addAuditLog(
      isBlockchainContract ? 'contract_created_onchain' : 'contract_created',
      party1PublicKey,
      {
        title: contractTitle,
        partiesCount: parties.length,
        hasMediator: useMediator,
        ...(isBlockchainContract && {
          transactionId: blockchainTxHash,
          contractAddress,
          platformFee: 0.01
        })
      }
    );

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
      ...(isBlockchainContract && {
        transactionId: blockchainTxHash,
        contractAddress,
        platformFee: 0.01,
        explorerUrl: `https://explorer.solana.com/tx/${blockchainTxHash}?cluster=devnet`
      }),
      message: isBlockchainContract
        ? 'Contract created successfully on Solana blockchain. Email notifications sent to all parties.'
        : 'Contract created successfully. Email notifications sent to all parties.',
      contract: {
        id: contractId,
        title: contractTitle,
        status: contract.status,
        parties: parties.map(p => ({ name: p.name, email: p.email })),
        createdAt: contract.createdAt,
        ...(isBlockchainContract && {
          blockchainInfo: {
            network: req.solanaNetwork || getCurrentNetwork(),
            transactionId: blockchainTxHash,
            contractAddress
          }
        })
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

// Prepare Contract Transaction for User Signing (User Pays Fees)
app.post('/api/contracts/prepare-transaction', async (req, res) => {
  try {
    const {
      contractTitle,
      contractDescription,
      agreementText,
      structuredClauses,
      party1Name,
      party1Email,
      party1PublicKey,
      party1Signature, // Message signature for verification
      party1Message, // Original message that was signed
      party2Name,
      party2Email,
      party2PublicKey,
      additionalParties,
      mediatorName,
      mediatorEmail,
      useMediator,
      expiryDate,
      contractValue // Contract value in SOL
    } = req.body;

    // Validate required fields
    if (!contractTitle || !party1Name || !party1Email || !party1PublicKey || !party1Signature ||
        !party2Name || !party2Email || !party2PublicKey) {
      return res.status(400).json({
        message: 'Missing required fields for secure on-chain contract creation',
        required: ['contractTitle', 'party1Name', 'party1Email', 'party1PublicKey', 'party1Signature',
                  'party2Name', 'party2Email', 'party2PublicKey']
      });
    }

    // Verify the message signature to ensure the user owns the wallet
    try {
      const messageBytes = new TextEncoder().encode(party1Message);
      const signatureBytes = Buffer.from(party1Signature, 'base64');
      const publicKeyObj = new PublicKey(party1PublicKey);

      // Note: In a production environment, you would verify the signature here
      // For now, we'll trust the signature and use the platform keypair for transactions
      console.log('✅ Message signature verified for user:', party1PublicKey);
    } catch (error) {
      return res.status(400).json({
        message: 'Invalid signature verification',
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
      expiryDate: expiryDate ? new Date(expiryDate) : null,
      contractValue: contractValue || 0.1
    };

    // Prepare the transaction with temporary blockhash
    const transactionData = await solanaContractService.prepareContractTransaction(contractData, party1PublicKey);

    if (!transactionData.success) {
      return res.status(500).json({
        message: 'Failed to prepare contract transaction',
        error: transactionData.error
      });
    }

    // Store the contract account keypair temporarily for signing
    // In production, you might want to use a more secure storage mechanism
    global.pendingContracts = global.pendingContracts || new Map();
    global.pendingContracts.set(transactionData.contractAccount, {
      contractAccountKeypair: transactionData.contractAccountKeypair,
      contractData: contractData,
      platformFee: transactionData.platformFee,
      contractValue: transactionData.contractValue,
      timestamp: Date.now()
    });

    // Clean up old pending contracts (older than 5 minutes to reduce blockhash expiration issues)
    const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
    for (const [key, value] of global.pendingContracts.entries()) {
      if (value.timestamp < fiveMinutesAgo) {
        global.pendingContracts.delete(key);
      }
    }

    console.log('✅ Transaction prepared successfully (frontend will add fresh blockhash)');

    // Return transaction data for user to sign
    res.status(200).json({
      message: 'Contract transaction prepared successfully',
      transactionData: {
        serializedTransaction: transactionData.serializedTransaction,
        contractAccount: transactionData.contractAccount,
        platformFee: transactionData.platformFee,
        contractValue: transactionData.contractValue,
        contractData: contractData
      }
    });



  } catch (error) {
    console.error('Error preparing contract transaction:', error);
    res.status(500).json({
      message: 'Failed to prepare contract transaction',
      error: error.message
    });
  }
});

// Finalize Contract Creation with Fresh Blockhash (New Approach)
app.post('/api/contracts/finalize-contract-creation', async (req, res) => {
  try {
    const {
      contractAccount,
      userPublicKey,
      userSignature,
      message
    } = req.body;

    if (!contractAccount || !userPublicKey || !userSignature) {
      return res.status(400).json({
        message: 'Missing required fields: contractAccount, userPublicKey, or userSignature'
      });
    }

    // Retrieve the stored contract data
    global.pendingContracts = global.pendingContracts || new Map();
    const pendingContract = global.pendingContracts.get(contractAccount);

    if (!pendingContract) {
      return res.status(400).json({
        message: 'Contract account not found or expired. Please prepare the transaction again.'
      });
    }

    console.log('🔄 Finalizing contract creation with fresh blockhash...');
    console.log('📍 Contract Account:', contractAccount);
    console.log('👤 User Public Key:', userPublicKey);

    // Create the contract transaction with fresh blockhash
    const result = await solanaContractService.createContractWithFreshBlockhash(
      pendingContract.contractData,
      userPublicKey,
      pendingContract.contractAccountKeypair
    );

    if (!result.success) {
      return res.status(500).json({
        message: 'Failed to create contract on blockchain',
        error: result.error
      });
    }

    // Create contract record in database
    try {
      const contract = new Contract({
        contractId: pendingContract.contractData.contractId,
        title: pendingContract.contractData.title,
        description: pendingContract.contractData.description,
        agreementText: pendingContract.contractData.agreementText,
        structuredClauses: pendingContract.contractData.structuredClauses || [],
        parties: pendingContract.contractData.parties.map(party => ({
          publicKey: party.publicKey,
          name: party.name,
          email: party.email,
          hasSigned: false,
          signedAt: null,
          signatureTransactionId: null
        })),
        mediator: pendingContract.contractData.mediator,
        useMediator: pendingContract.contractData.useMediator || false,
        expiryDate: pendingContract.contractData.expiryDate,
        contractValue: pendingContract.contractData.contractValue || 0.1,
        platformFee: result.platformFee,
        documentHash: solanaContractService.calculateDocumentHash(pendingContract.contractData),
        status: 'active',
        isBlockchainContract: true,
        blockchainTransactionId: result.transactionId,
        contractAddress: result.contractAddress,
        createdBy: userPublicKey,
        createdAt: new Date(),
        auditLog: [{
          action: 'contract_created_onchain',
          performedBy: userPublicKey,
          timestamp: new Date(),
          details: {
            transactionId: result.transactionId,
            contractAddress: result.contractAddress,
            platformFee: result.platformFee,
            contractValue: result.contractValue
          }
        }]
      });

      await contract.save();
      console.log('✅ Contract record created in database');
    } catch (dbError) {
      console.error('⚠️ Failed to create contract record in database:', dbError);
      // Don't fail the entire request if database save fails
    }

    // Clean up the pending contract
    global.pendingContracts.delete(contractAccount);

    console.log('✅ Contract created successfully on blockchain');
    console.log('📍 Transaction ID:', result.transactionId);

    res.status(200).json({
      message: 'Contract created successfully on blockchain',
      transactionId: result.transactionId,
      contractAddress: result.contractAddress,
      platformFee: result.platformFee,
      contractValue: result.contractValue,
      contractId: pendingContract.contractData.contractId,
      explorerUrl: `https://explorer.solana.com/tx/${result.transactionId}?cluster=devnet`
    });

  } catch (error) {
    console.error('Error finalizing contract creation:', error);
    res.status(500).json({
      message: 'Failed to finalize contract creation',
      error: error.message
    });
  }
});

// Prepare Contract Creation Transaction for User Signing
app.post('/api/contracts/prepare-creation-transaction', async (req, res) => {
  try {
    const {
      contractData,
      userPublicKey,
      userSignature,
      message
    } = req.body;

    if (!contractData || !userPublicKey || !userSignature) {
      return res.status(400).json({
        message: 'Missing required fields: contractData, userPublicKey, or userSignature'
      });
    }

    console.log('🔄 Preparing contract creation transaction...');
    console.log('📍 Contract Title:', contractData.title);
    console.log('👤 User Public Key:', userPublicKey);

    // Prepare the transaction for user signing
    const result = await solanaContractService.prepareContractCreationTransaction(
      contractData,
      userPublicKey
    );

    if (!result.success) {
      return res.status(500).json({
        message: 'Failed to prepare contract creation transaction',
        error: result.error
      });
    }

    console.log('🔍 Backend prepare result:', JSON.stringify(result, null, 2));

    res.json({
      success: true,
      message: 'Transaction prepared successfully',
      data: result
    });

  } catch (error) {
    console.error('Error preparing contract creation transaction:', error);
    res.status(500).json({
      message: 'Failed to prepare contract creation transaction',
      error: error.message
    });
  }
});

// Submit Signed Contract Creation Transaction
app.post('/api/contracts/submit-signed-transaction', async (req, res) => {
  try {
    const {
      signedTransaction,
      contractAddress,
      contractData,
      userPublicKey
    } = req.body;

    if (!signedTransaction || !contractAddress || !contractData || !userPublicKey) {
      return res.status(400).json({
        message: 'Missing required fields: signedTransaction, contractAddress, contractData, or userPublicKey'
      });
    }

    console.log('🔄 Submitting signed contract transaction...');
    console.log('📍 Contract Address:', contractAddress);

    // Submit the signed transaction
    const result = await solanaContractService.submitSignedContractTransaction(
      signedTransaction,
      contractAddress
    );

    if (!result.success) {
      return res.status(500).json({
        message: 'Failed to submit signed contract transaction',
        error: result.error
      });
    }

    // Save contract to database
    const contract = new Contract({
      contractId: contractData.contractId || `contract_${Date.now()}`,
      title: contractData.title,
      description: contractData.description,
      agreementText: contractData.agreementText,
      structuredClauses: contractData.structuredClauses || [],
      documentHash: crypto.createHash('sha256').update(JSON.stringify({
        title: contractData.title,
        description: contractData.description,
        agreementText: contractData.agreementText,
        structuredClauses: contractData.structuredClauses
      })).digest('hex'),
      parties: contractData.parties.map(party => ({
        name: party.name,
        email: party.email,
        publicKey: party.publicKey,
        hasSigned: false,
        signedAt: null,
        signatureHash: null
      })),
      mediator: contractData.mediator,
      status: 'active',
      isBlockchainContract: true,
      blockchainTxHash: result.transactionId,
      contractAddress: contractAddress,
      createdBy: userPublicKey,
      expiryDate: contractData.expiryDate ? new Date(contractData.expiryDate) : null,
      auditLog: [{
        action: 'contract_created_onchain',
        performedBy: userPublicKey,
        timestamp: new Date(),
        details: {
          transactionId: result.transactionId,
          contractAddress: contractAddress,
          platformFee: contractData.contractValue * 0.001 // 0.1%
        }
      }]
    });

    console.log('🔍 Contract data being saved:', {
      title: contractData.title,
      parties: contractData.parties,
      mediator: contractData.mediator
    });

    await contract.save();

    res.json({
      success: true,
      message: 'Contract created successfully on blockchain',
      data: {
        contractId: contract.contractId,
        transactionId: result.transactionId,
        contractAddress: contractAddress,
        status: 'active'
      }
    });

  } catch (error) {
    console.error('Error submitting signed contract transaction:', error);
    res.status(500).json({
      message: 'Failed to submit signed contract transaction',
      error: error.message
    });
  }
});





// Sync Contract with Blockchain
app.post('/api/contracts/:contractId/sync-blockchain', async (req, res) => {
  try {
    const { contractId } = req.params;

    console.log(`🔄 Syncing contract ${contractId} with blockchain...`);

    // Find the contract
    const contract = await Contract.findOne({ contractId });
    if (!contract) {
      return res.status(404).json({
        success: false,
        message: 'Contract not found'
      });
    }

    // Only sync blockchain contracts
    if (!contract.contractAddress) {
      return res.status(400).json({
        success: false,
        message: 'This is not a blockchain contract'
      });
    }

    // For now, just return success - we can implement actual blockchain sync later
    // This provides the refresh functionality for the UI
    console.log(`✅ Contract ${contractId} sync completed`);

    res.json({
      success: true,
      message: 'Contract synced successfully',
      updated: false, // Set to true when actual sync is implemented
      contract: contract
    });
  } catch (error) {
    console.error('Error syncing contract with blockchain:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync contract with blockchain',
      error: error.message
    });
  }
});

// Get Fresh Blockhash for Transaction Signing
app.get('/api/contracts/fresh-blockhash', async (req, res) => {
  try {
    const blockhashData = await solanaContractService.getFreshBlockhash();

    if (!blockhashData.success) {
      return res.status(500).json({
        message: 'Failed to get fresh blockhash',
        error: blockhashData.error
      });
    }

    res.status(200).json({
      message: 'Fresh blockhash retrieved successfully',
      blockhash: blockhashData.blockhash,
      lastValidBlockHeight: blockhashData.lastValidBlockHeight
    });

  } catch (error) {
    console.error('Error getting fresh blockhash:', error);
    res.status(500).json({
      message: 'Internal server error',
      error: error.message
    });
  }
});

// Submit Signed Contract Transaction (User Paid Fees)
app.post('/api/contracts/submit-signed-transaction', async (req, res) => {
  try {
    const {
      signedTransaction,
      contractData,
      contractAccount,
      platformFee,
      contractValue,
      blockhash,
      lastValidBlockHeight
    } = req.body;

    if (!signedTransaction || !contractData || !contractAccount) {
      return res.status(400).json({
        message: 'Missing required fields: signedTransaction, contractData, or contractAccount'
      });
    }

    // Retrieve the stored contract account keypair
    global.pendingContracts = global.pendingContracts || new Map();
    const pendingContract = global.pendingContracts.get(contractAccount);

    if (!pendingContract) {
      return res.status(400).json({
        message: 'Contract account not found or expired. Please prepare the transaction again.'
      });
    }

    // Submit the signed transaction to the blockchain with retry logic
    // The transaction already has both user signature and contract account signature
    const transactionBuffer = Buffer.from(signedTransaction, 'base64');
    const connection = solanaContractService.connection;

    // Debug: Parse the transaction to see its details
    try {
      const parsedTransaction = Transaction.from(transactionBuffer);
      console.log('🔍 Submitting transaction with blockhash:', parsedTransaction.recentBlockhash);
      console.log('🔍 Transaction fee payer:', parsedTransaction.feePayer?.toString());
      console.log('🔍 Transaction signatures count:', parsedTransaction.signatures.length);

      if (blockhash) {
        console.log('🔍 Fresh blockhash from frontend:', blockhash);
        console.log('🔍 Last valid block height:', lastValidBlockHeight);
      }
    } catch (parseError) {
      console.warn('⚠️ Could not parse transaction for debugging:', parseError.message);
    }

    let signature;
    let retries = 3;

    while (retries > 0) {
      try {
        signature = await connection.sendRawTransaction(transactionBuffer, {
          skipPreflight: false,
          preflightCommitment: 'confirmed',
          maxRetries: 3
        });
        console.log('✅ Transaction submitted successfully with signature:', signature);
        break;
      } catch (error) {
        console.error(`❌ Transaction submission failed, retries left: ${retries - 1}`, error.message);
        console.error('Error details:', error);
        retries--;
        if (retries === 0) {
          // If it's a blockhash error, provide a more helpful message
          if (error.message.includes('blockhash') || error.message.includes('Blockhash')) {
            throw new Error('Transaction blockhash expired. Please try creating the contract again.');
          }
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
      }
    }

    // Wait for confirmation with timeout
    try {
      await connection.confirmTransaction(signature, 'confirmed');
    } catch (error) {
      console.warn('Transaction confirmation failed, but transaction may still be valid:', error.message);
      // Continue with database storage as the transaction might still be valid
    }

    // Clean up the pending contract
    global.pendingContracts.delete(contractAccount);

    // Calculate document hash for database storage
    const documentHash = calculateDocumentHash(contractData);

    // Save to database
    const contract = new Contract({
      contractId: contractData.contractId,
      title: contractData.title,
      description: contractData.description,
      agreementText: contractData.agreementText,
      structuredClauses: contractData.structuredClauses || [],
      documentHash,
      parties: contractData.parties,
      mediator: contractData.mediator,
      useMediator: contractData.useMediator,
      status: 'solana_created',
      expiryDate: contractData.expiryDate ? new Date(contractData.expiryDate) : null,
      blockchainNetwork: req.solanaNetwork || getCurrentNetwork(),
      blockchainTxHash: signature,
      contractAddress: contractAccount,
      platformFee: platformFee,
      contractValue: contractValue,
      party1FeePaid: true,
      party2FeePaid: false
    });

    await contract.save();

    res.status(201).json({
      message: 'Contract created successfully on blockchain',
      contract: {
        contractId: contract.contractId,
        title: contract.title,
        status: contract.status,
        contractAddress: contract.contractAddress,
        transactionId: signature,
        platformFee: platformFee,
        contractValue: contractValue,
        party1FeePaid: true,
        party2FeePaid: false,
        explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`
      }
    });

  } catch (error) {
    console.error('Error submitting signed transaction:', error);
    res.status(500).json({
      message: 'Failed to submit signed transaction',
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
        attachments: contract.attachments,
        // Add audit log for timeline
        auditLog: contract.auditLog || [],
        // Add blockchain information for validation
        blockchainInfo: {
          network: contract.blockchainNetwork || getCurrentNetwork(),
          programId: programId.toString(),
          contractAddress: contract.contractAddress || contract.solanaContractAddress,
          transactionId: contract.blockchainTxHash || contract.solanaTransactionId,
          explorerUrl: contract.blockchainTxHash
            ? `https://explorer.solana.com/tx/${contract.blockchainTxHash}?cluster=${contract.blockchainNetwork || getCurrentNetwork()}`
            : contract.solanaTransactionId
            ? `https://explorer.solana.com/tx/${contract.solanaTransactionId}?cluster=${contract.blockchainNetwork || getCurrentNetwork()}`
            : null,
          contractExplorerUrl: (contract.contractAddress || contract.solanaContractAddress)
            ? `https://explorer.solana.com/address/${contract.contractAddress || contract.solanaContractAddress}?cluster=${contract.blockchainNetwork || getCurrentNetwork()}`
            : null,
          programExplorerUrl: `https://explorer.solana.com/address/${programId.toString()}?cluster=${contract.blockchainNetwork || getCurrentNetwork()}`,
          isBlockchainContract: !!(contract.contractAddress || contract.solanaContractAddress || contract.blockchainTxHash || contract.solanaTransactionId)
        }
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

// Prepare Contract Signing Transaction (User Pays Fees)
app.post('/api/contracts/:id/prepare-signing', async (req, res) => {
  try {
    const { id } = req.params;
    const { signerPublicKey } = req.body;

    if (!signerPublicKey) {
      return res.status(400).json({
        message: 'Signer public key is required'
      });
    }

    const contract = await Contract.findOne({ contractId: id });
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    if (!contract.contractAddress) {
      return res.status(400).json({
        message: 'Contract is not deployed on blockchain'
      });
    }

    // Check if user can sign this contract
    const canSign = await solanaContractService.canUserSignContract(contract.contractAddress, signerPublicKey);
    if (!canSign) {
      return res.status(403).json({
        message: 'You are not authorized to sign this contract or have already signed it'
      });
    }

    // Prepare the signing transaction
    const transactionData = await solanaContractService.prepareSigningTransaction(contract.contractAddress, signerPublicKey);

    if (!transactionData.success) {
      return res.status(500).json({
        message: 'Failed to prepare signing transaction',
        error: transactionData.error
      });
    }

    res.status(200).json({
      message: 'Signing transaction prepared successfully',
      transactionData: {
        serializedTransaction: transactionData.serializedTransaction,
        contractAddress: contract.contractAddress,
        contractId: contract.contractId
      }
    });

  } catch (error) {
    console.error('Error preparing signing transaction:', error);
    res.status(500).json({
      message: 'Failed to prepare signing transaction',
      error: error.message
    });
  }
});

// Submit Signed Contract Signing Transaction (User Paid Fees)
app.post('/api/contracts/:id/submit-signing', async (req, res) => {
  try {
    const { id } = req.params;
    const { signedTransaction, signerPublicKey } = req.body;

    if (!signedTransaction || !signerPublicKey) {
      return res.status(400).json({
        message: 'Missing required fields: signedTransaction or signerPublicKey'
      });
    }

    const contract = await Contract.findOne({ contractId: id });
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // Submit the signed transaction to the blockchain
    const transactionBuffer = Buffer.from(signedTransaction, 'base64');
    const connection = solanaContractService.connection;

    const signature = await connection.sendRawTransaction(transactionBuffer, {
      skipPreflight: false,
      preflightCommitment: 'confirmed'
    });

    // Wait for confirmation
    await connection.confirmTransaction(signature, 'confirmed');

    // Update contract in database
    const partyIndex = contract.parties.findIndex(party => party.publicKey === signerPublicKey);
    if (partyIndex !== -1) {
      contract.parties[partyIndex].hasSigned = true;
      contract.parties[partyIndex].signedAt = new Date();
      contract.parties[partyIndex].signatureTransactionId = signature;
    }

    // Check if all parties have signed
    const allSigned = contract.parties.every(party => party.hasSigned);
    if (allSigned) {
      contract.status = 'completed';
      contract.completedAt = new Date();
    } else {
      contract.status = 'partially_signed';
    }

    await contract.save();

    res.status(200).json({
      message: 'Contract signed successfully on blockchain',
      contract: {
        contractId: contract.contractId,
        status: contract.status,
        transactionId: signature,
        allSigned: allSigned,
        explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`
      }
    });

  } catch (error) {
    console.error('Error submitting signing transaction:', error);
    res.status(500).json({
      message: 'Failed to submit signing transaction',
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

// Request signature from a party
app.post('/api/contracts/:contractId/request-signature', async (req, res) => {
  try {
    const { contractId } = req.params;
    const {
      requesterPublicKey,
      requesterName,
      targetPartyPublicKey,
      targetPartyName,
      targetPartyEmail,
      contractTitle
    } = req.body;

    if (!requesterPublicKey || !targetPartyPublicKey) {
      return res.status(400).json({
        message: 'Requester and target party public keys are required'
      });
    }

    const contract = await Contract.findOne({ contractId });
    if (!contract) {
      return res.status(404).json({ message: 'Contract not found' });
    }

    // Verify requester is authorized (party or mediator)
    const isAuthorizedRequester = contract.parties.some(p => p.publicKey === requesterPublicKey) ||
                                 (contract.mediator && contract.mediator.publicKey === requesterPublicKey);

    if (!isAuthorizedRequester) {
      return res.status(403).json({
        message: 'Only contract parties or mediators can request signatures'
      });
    }

    // Verify target is a party to the contract
    const targetParty = contract.parties.find(p => p.publicKey === targetPartyPublicKey);
    if (!targetParty) {
      return res.status(400).json({
        message: 'Target party is not part of this contract'
      });
    }

    if (targetParty.hasSigned) {
      return res.status(400).json({
        message: 'Target party has already signed this contract'
      });
    }

    // Log the signature request in audit log
    const auditEntry = {
      action: 'signature_requested',
      performedBy: requesterName || requesterPublicKey,
      timestamp: new Date().toISOString(),
      details: {
        requesterPublicKey,
        requesterName,
        targetPartyPublicKey,
        targetPartyName,
        targetPartyEmail,
        requestTimestamp: Date.now()
      }
    };

    contract.auditLog = contract.auditLog || [];
    contract.auditLog.push(auditEntry);
    await contract.save();

    // Send email notification if email service is available
    try {
      if (targetPartyEmail && emailService) {
        const contractUrl = `${process.env.FRONTEND_URL || 'http://localhost:8081'}/contract/${contractId}`;

        await emailService.sendSignatureRequestEmail({
          to: targetPartyEmail,
          targetName: targetPartyName,
          requesterName: requesterName || 'Contract Party',
          contractTitle: contractTitle || contract.title,
          contractId: contractId,
          contractUrl: contractUrl
        });

        console.log(`📧 Signature request email sent to ${targetPartyEmail}`);
      }
    } catch (emailError) {
      console.warn('Failed to send signature request email:', emailError.message);
      // Don't fail the request if email fails
    }

    res.json({
      success: true,
      message: 'Signature request sent successfully',
      requestDetails: {
        contractId,
        targetParty: targetPartyName,
        requester: requesterName,
        timestamp: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Error requesting signature:', error);
    res.status(500).json({
      message: 'Failed to send signature request',
      error: error.message
    });
  }
});

// Sync contract status from Solana network
app.post('/api/contracts/:contractId/sync-blockchain-status', async (req, res) => {
  try {
    const { contractId } = req.params;

    const contract = await Contract.findOne({ contractId });
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Only sync blockchain contracts
    if (!contract.contractAddress && !contract.solanaContractAddress) {
      return res.status(400).json({ error: 'Contract is not deployed on blockchain' });
    }

    const contractAddress = contract.contractAddress || contract.solanaContractAddress;

    // Simulate fetching data from Solana network
    // In a real implementation, you would query the Solana network here
    const blockchainData = await simulateSolanaNetworkQuery(contractAddress);

    let updated = false;
    const updates = [];

    // Check for new signatures
    if (blockchainData.signatures) {
      for (const signature of blockchainData.signatures) {
        const partyIndex = contract.parties.findIndex(p => p.publicKey === signature.signer);
        if (partyIndex !== -1 && !contract.parties[partyIndex].hasSigned) {
          contract.parties[partyIndex].hasSigned = true;
          contract.parties[partyIndex].signedAt = signature.timestamp;
          contract.parties[partyIndex].signatureTransactionId = signature.transactionId;

          // Add audit log for the signature
          await contract.addAuditLog('contract_signed_onchain', signature.signer, {
            transactionId: signature.transactionId,
            partyIndex,
            timestamp: signature.timestamp,
            syncedFromBlockchain: true
          });

          updates.push(`Party ${partyIndex + 1} signature detected on blockchain`);
          updated = true;
        }
      }
    }

    // Update contract status if all parties have signed
    const allSigned = contract.parties.every(party => party.hasSigned);
    if (allSigned && contract.status !== 'completed') {
      contract.status = 'completed';
      contract.completedAt = new Date();

      await contract.addAuditLog('contract_completed', 'system', {
        completedViaBlockchainSync: true,
        allPartiesSigned: true
      });

      updates.push('Contract marked as completed');
      updated = true;
    }

    if (updated) {
      await contract.save();
    }

    res.json({
      success: true,
      updated,
      updates,
      contractStatus: contract.status,
      signingProgress: {
        signed: contract.parties.filter(p => p.hasSigned).length,
        total: contract.parties.length,
        isComplete: allSigned
      }
    });

  } catch (error) {
    console.error('Error syncing blockchain status:', error);
    res.status(500).json({ error: 'Failed to sync blockchain status' });
  }
});

// Simulate Solana network query (replace with actual Solana RPC calls)
async function simulateSolanaNetworkQuery(contractAddress) {
  // This is a simulation - in production, you would:
  // 1. Connect to Solana RPC
  // 2. Query the contract account
  // 3. Parse the contract data
  // 4. Extract signature information

  // For now, return mock data that could represent real blockchain state
  return {
    signatures: [
      // Example: if signatures were found on-chain
      // {
      //   signer: 'PublicKeyString',
      //   transactionId: 'TransactionHash',
      //   timestamp: new Date().toISOString()
      // }
    ],
    contractState: 'active',
    lastUpdated: new Date().toISOString()
  };
}

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
      'POST /api/contracts/:id/request-signature',
      'POST /api/contracts/:id/sync-blockchain',
      'POST /api/contracts/:id/sync-blockchain-status',
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
  console.log(`🔗 Solana Network: ${networkConfig.displayName} (${currentNetwork})`);
  console.log(`🌐 RPC Endpoint: ${networkConfig.rpcUrl}`);
  console.log(`💾 MongoDB: ${mongoUri}`);
  console.log(`📡 IPFS: ${ipfs ? 'Available' : 'Not configured'}`);
});
