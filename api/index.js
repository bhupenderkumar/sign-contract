// Vercel serverless function wrapper for the backend
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const mongoose = require('mongoose');
const { createServer } = require('http');
const { Server } = require('socket.io');

// Import services
const emailService = require('../backend/services/emailService');
const pdfService = require('../backend/services/pdfService');
const solanaService = require('../backend/services/solanaService');
const solanaContractService = require('../backend/services/solanaContractService');

// Import models
const Contract = require('../backend/models/Contract');
const User = require('../backend/models/User');

// Environment configuration
const config = {
  port: process.env.PORT || 3001,
  mongoUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/digital_contracts',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  solanaNetwork: process.env.SOLANA_NETWORK || 'devnet',
  solanaRpcUrl: process.env.SOLANA_RPC_URL || 'https://api.devnet.solana.com',
  resendApiKey: process.env.RESEND_API_KEY,
  redisUrl: process.env.REDIS_URL,
  environment: process.env.NODE_ENV || 'development'
};

// Create Express app
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "https:"]
    }
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// CORS configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? ['https://your-domain.vercel.app', 'https://your-custom-domain.com']
    : ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-solana-network']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (config.environment !== 'test') {
  app.use(morgan('combined'));
}

// MongoDB connection
let isConnected = false;

const connectToDatabase = async () => {
  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(config.mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    isConnected = true;
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
};

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: config.environment,
    network: config.solanaNetwork
  });
});

// Contract routes
app.post('/api/contracts', async (req, res) => {
  try {
    await connectToDatabase();
    
    const {
      title,
      description,
      terms,
      firstPartyEmail,
      secondPartyEmail,
      amount,
      currency,
      dueDate,
      network
    } = req.body;

    // Validate required fields
    if (!title || !description || !terms || !firstPartyEmail || !secondPartyEmail) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Create contract in database
    const contract = new Contract({
      title,
      description,
      terms,
      firstPartyEmail,
      secondPartyEmail,
      amount: amount || 0,
      currency: currency || 'SOL',
      dueDate: dueDate ? new Date(dueDate) : null,
      network: network || config.solanaNetwork,
      status: 'pending',
      createdAt: new Date()
    });

    const savedContract = await contract.save();

    // Generate PDF
    const pdfBuffer = await pdfService.generateContractPDF(savedContract);
    
    // Send email to second party
    await emailService.sendContractNotification(
      secondPartyEmail,
      savedContract,
      pdfBuffer
    );

    res.status(201).json({
      success: true,
      contract: savedContract,
      message: 'Contract created and notification sent'
    });

  } catch (error) {
    console.error('Error creating contract:', error);
    res.status(500).json({ 
      error: 'Failed to create contract',
      details: error.message 
    });
  }
});

app.get('/api/contracts/:id', async (req, res) => {
  try {
    await connectToDatabase();
    
    const contract = await Contract.findById(req.params.id);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    res.json(contract);
  } catch (error) {
    console.error('Error fetching contract:', error);
    res.status(500).json({ 
      error: 'Failed to fetch contract',
      details: error.message 
    });
  }
});

app.get('/api/contracts', async (req, res) => {
  try {
    await connectToDatabase();
    
    const { email, status, page = 1, limit = 10 } = req.query;
    
    let query = {};
    if (email) {
      query.$or = [
        { firstPartyEmail: email },
        { secondPartyEmail: email }
      ];
    }
    if (status) {
      query.status = status;
    }

    const contracts = await Contract.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Contract.countDocuments(query);

    res.json({
      contracts,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (error) {
    console.error('Error fetching contracts:', error);
    res.status(500).json({ 
      error: 'Failed to fetch contracts',
      details: error.message 
    });
  }
});

// Solana routes
app.post('/api/solana/sign-contract', async (req, res) => {
  try {
    const { contractId, publicKey, signature, network } = req.body;

    if (!contractId || !publicKey || !signature) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    await connectToDatabase();
    
    const contract = await Contract.findById(contractId);
    if (!contract) {
      return res.status(404).json({ error: 'Contract not found' });
    }

    // Deploy to Solana if not already deployed
    let solanaContractAddress = contract.solanaContractAddress;
    if (!solanaContractAddress) {
      const deployResult = await solanaContractService.deployContract(
        contract,
        network || config.solanaNetwork
      );
      solanaContractAddress = deployResult.contractAddress;
      
      contract.solanaContractAddress = solanaContractAddress;
      contract.solanaNetwork = network || config.solanaNetwork;
    }

    // Update contract with signature
    if (!contract.signatures) {
      contract.signatures = [];
    }
    
    contract.signatures.push({
      publicKey,
      signature,
      timestamp: new Date(),
      network: network || config.solanaNetwork
    });

    // Check if both parties have signed
    const uniqueSigners = new Set(contract.signatures.map(s => s.publicKey));
    if (uniqueSigners.size >= 2) {
      contract.status = 'signed';
      contract.signedAt = new Date();
    }

    await contract.save();

    res.json({
      success: true,
      contract,
      solanaContractAddress,
      message: 'Contract signed successfully'
    });

  } catch (error) {
    console.error('Error signing contract:', error);
    res.status(500).json({ 
      error: 'Failed to sign contract',
      details: error.message 
    });
  }
});

app.get('/api/solana/price', async (req, res) => {
  try {
    const price = await solanaService.getSolanaPrice();
    res.json({ price });
  } catch (error) {
    console.error('Error fetching Solana price:', error);
    res.status(500).json({ 
      error: 'Failed to fetch Solana price',
      details: error.message 
    });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({ 
    error: 'Internal server error',
    details: config.environment === 'development' ? error.message : undefined
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

// Export for Vercel
module.exports = app;
