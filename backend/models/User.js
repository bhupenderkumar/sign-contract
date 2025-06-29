const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  
  // Solana Wallet Information
  publicKey: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    validate: {
      validator: function(v) {
        return v && v.length >= 32 && v.length <= 44; // Solana public key length
      },
      message: 'Invalid public key format'
    }
  },
  
  // Profile Information
  profilePicture: {
    type: String,
    default: null
  },
  bio: {
    type: String,
    maxlength: 500,
    default: ''
  },
  
  // Contact Information
  phone: {
    type: String,
    trim: true,
    default: null
  },
  organization: {
    type: String,
    trim: true,
    maxlength: 100,
    default: null
  },
  
  // Verification Status
  isEmailVerified: {
    type: Boolean,
    default: false
  },
  isWalletVerified: {
    type: Boolean,
    default: false
  },
  
  // User Preferences
  preferences: {
    emailNotifications: {
      contractCreated: { type: Boolean, default: true },
      contractSigned: { type: Boolean, default: true },
      contractCompleted: { type: Boolean, default: true },
      contractExpiring: { type: Boolean, default: true },
      contractDisputed: { type: Boolean, default: true }
    },
    language: {
      type: String,
      enum: ['en', 'es', 'fr', 'de', 'zh', 'ja'],
      default: 'en'
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  
  // Statistics
  stats: {
    contractsCreated: { type: Number, default: 0 },
    contractsSigned: { type: Number, default: 0 },
    contractsCompleted: { type: Number, default: 0 },
    totalFeePaid: { type: Number, default: 0 },
    lastActivity: { type: Date, default: Date.now }
  },
  
  // Account Status
  status: {
    type: String,
    enum: ['active', 'suspended', 'banned', 'inactive'],
    default: 'active'
  },
  
  // Security
  lastLogin: {
    type: Date,
    default: Date.now
  },
  loginHistory: [{
    timestamp: { type: Date, default: Date.now },
    ipAddress: String,
    userAgent: String
  }],
  
  // Timestamps
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
UserSchema.index({ email: 1 });
UserSchema.index({ publicKey: 1 });
UserSchema.index({ status: 1 });
UserSchema.index({ 'stats.lastActivity': -1 });

// Virtual for full name display
UserSchema.virtual('displayName').get(function() {
  return this.name || this.email.split('@')[0];
});

// Pre-save middleware
UserSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Instance methods
UserSchema.methods.updateStats = function(action, amount = 0) {
  switch(action) {
    case 'contract_created':
      this.stats.contractsCreated += 1;
      break;
    case 'contract_signed':
      this.stats.contractsSigned += 1;
      break;
    case 'contract_completed':
      this.stats.contractsCompleted += 1;
      break;
    case 'fee_paid':
      this.stats.totalFeePaid += amount;
      break;
  }
  this.stats.lastActivity = new Date();
  return this.save();
};

UserSchema.methods.addLoginHistory = function(ipAddress, userAgent) {
  this.loginHistory.push({
    timestamp: new Date(),
    ipAddress,
    userAgent
  });
  
  // Keep only last 10 login records
  if (this.loginHistory.length > 10) {
    this.loginHistory = this.loginHistory.slice(-10);
  }
  
  this.lastLogin = new Date();
  return this.save();
};

// Static methods
UserSchema.statics.findByPublicKey = function(publicKey) {
  return this.findOne({ publicKey });
};

UserSchema.statics.findActiveUsers = function() {
  return this.find({ status: 'active' });
};

UserSchema.statics.getTopUsers = function(limit = 10) {
  return this.find({ status: 'active' })
    .sort({ 'stats.contractsCompleted': -1 })
    .limit(limit);
};

module.exports = mongoose.model('User', UserSchema);
