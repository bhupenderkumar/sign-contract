const mongoose = require('mongoose');

const PartySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  publicKey: {
    type: String,
    required: true,
    trim: true,
    validate: {
      validator: function(v) {
        return v && v.length >= 32 && v.length <= 44; // Solana public key length
      },
      message: 'Invalid public key format'
    }
  },
  hasSigned: {
    type: Boolean,
    default: false
  },
  signedAt: {
    type: Date,
    default: null
  },
  signatureTransactionId: {
    type: String,
    default: null
  }
});

const AttachmentSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimeType: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  ipfsHash: {
    type: String,
    default: null
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  }
});

const ContractSchema = new mongoose.Schema({
  // Contract Identification
  contractId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  
  // Basic Contract Information
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    trim: true,
    maxlength: 500
  },
  
  // Contract Content
  agreementText: {
    type: String,
    required: true,
    maxlength: 10000
  },
  structuredClauses: [{
    type: String,
    maxlength: 1000
  }],
  
  // Document Hash for Blockchain
  documentHash: {
    type: String,
    required: true,
    index: true
  },
  
  // Parties Information
  parties: [PartySchema],
  
  // Mediator Information (Optional)
  mediator: {
    name: {
      type: String,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    publicKey: {
      type: String,
      trim: true
    }
  },
  useMediator: {
    type: Boolean,
    default: false
  },
  
  // Blockchain Information
  solanaTransactionId: {
    type: String,
    index: true
  },
  solanaContractAddress: {
    type: String,
    index: true
  },
  blockchainNetwork: {
    type: String,
    enum: ['devnet', 'testnet', 'mainnet-beta'],
    default: 'devnet'
  },
  
  // Contract Status
  status: {
    type: String,
    enum: ['draft', 'pending', 'ipfs_uploaded', 'solana_created', 'active', 'partially_signed', 'fully_signed', 'completed', 'cancelled', 'expired', 'disputed', 'dispute_resolved', 'solana_failed'],
    default: 'draft',
    index: true
  },
  
  // File Attachments
  attachments: [AttachmentSchema],
  
  // IPFS Information
  ipfsHash: {
    type: String,
    index: true
  },
  ipfsMetadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  expiryDate: {
    type: Date,
    index: true
  },
  completedAt: {
    type: Date
  },
  
  // Platform Information
  platformFeesPaid: {
    type: Boolean,
    default: false
  },
  platformFeesAmount: {
    type: Number,
    default: 0.01 // 0.01 SOL
  },
  
  // Dispute Information
  disputes: [{
    disputeId: {
      type: String,
      required: true
    },
    raisedBy: {
      type: String,
      required: true
    },
    raisedByName: {
      type: String,
      required: true
    },
    reason: {
      type: String,
      required: true,
      maxlength: 1000
    },
    description: {
      type: String,
      required: true,
      maxlength: 5000
    },
    status: {
      type: String,
      enum: ['open', 'under_review', 'resolved', 'rejected'],
      default: 'open'
    },
    resolution: {
      type: String,
      maxlength: 5000
    },
    resolvedBy: {
      type: String
    },
    resolvedAt: {
      type: Date
    },
    createdAt: {
      type: Date,
      default: Date.now
    },
    evidence: [{
      type: {
        type: String,
        enum: ['document', 'image', 'text', 'link']
      },
      content: String,
      filename: String,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],

  // Audit Trail
  auditLog: [{
    action: {
      type: String,
      required: true
    },
    performedBy: {
      type: String,
      required: true
    },
    timestamp: {
      type: Date,
      default: Date.now
    },
    details: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better query performance
ContractSchema.index({ 'parties.email': 1 });
ContractSchema.index({ 'parties.publicKey': 1 });
ContractSchema.index({ status: 1, createdAt: -1 });
ContractSchema.index({ expiryDate: 1 });

// Virtual for checking if contract is fully signed
ContractSchema.virtual('isFullySigned').get(function() {
  return this.parties.every(party => party.hasSigned);
});

// Virtual for getting signing progress
ContractSchema.virtual('signingProgress').get(function() {
  const signedCount = this.parties.filter(party => party.hasSigned).length;
  return {
    signed: signedCount,
    total: this.parties.length,
    percentage: Math.round((signedCount / this.parties.length) * 100)
  };
});

// Pre-save middleware to update timestamps and status
ContractSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  
  // Auto-update status based on signing progress
  if (this.isFullySigned && this.status === 'active') {
    this.status = 'fully_signed';
    this.completedAt = new Date();
  } else if (this.parties.some(party => party.hasSigned) && this.status === 'active') {
    this.status = 'partially_signed';
  }
  
  // Check for expiry
  if (this.expiryDate && new Date() > this.expiryDate && this.status === 'active') {
    this.status = 'expired';
  }
  
  next();
});

// Instance method to add audit log entry
ContractSchema.methods.addAuditLog = function(action, performedBy, details = {}) {
  this.auditLog.push({
    action,
    performedBy,
    details,
    timestamp: new Date()
  });
  return this.save();
};

// Static method to find contracts by party
ContractSchema.statics.findByParty = function(publicKey) {
  return this.find({
    'parties.publicKey': publicKey
  });
};

// Static method to find expiring contracts
ContractSchema.statics.findExpiring = function(days = 7) {
  const futureDate = new Date();
  futureDate.setDate(futureDate.getDate() + days);
  
  return this.find({
    expiryDate: { $lte: futureDate, $gte: new Date() },
    status: { $in: ['active', 'partially_signed'] }
  });
};

module.exports = mongoose.model('Contract', ContractSchema);
