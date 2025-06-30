# 🌐 Network Environment Selection & Security Guide

This guide covers the comprehensive Solana network environment selection and security system implemented in SecureContract Pro.

## 🎯 Overview

The application now supports seamless switching between different Solana networks with proper security measures and environment validation:

- **Devnet**: Development network with free SOL via faucet
- **Testnet**: Testing network with free SOL via faucet  
- **Mainnet-Beta**: Production network using real SOL

## 🔧 Features Implemented

### ✅ Network Environment Selection
- **Visual Network Selector**: Prominent UI component showing current network
- **Environment Indicators**: Color-coded badges and warnings for different networks
- **Production Warnings**: Clear alerts when using mainnet-beta
- **Network Status Display**: Real-time connection status and RPC endpoint info

### ✅ Security Improvements
- **Removed Exposed API Keys**: Fixed hardcoded Resend API key in backend
- **Environment Variable Validation**: Comprehensive validation on startup
- **Secure Credential Management**: Proper environment-based configuration
- **Frontend Security Audit**: Removed sensitive data from client-side code

### ✅ Backend Environment Handling
- **Network Parameter Validation**: All API calls validate network parameters
- **Environment-Specific Configurations**: Different settings per network
- **Network Middleware**: Automatic network validation for all API routes
- **Environment Info Endpoint**: `/api/environment` for debugging

### ✅ Frontend-Backend Integration
- **Network Parameter Passing**: All API calls include network information
- **WebSocket Network Support**: Real-time updates include network context
- **Network-Aware API Service**: Automatic network parameter injection
- **Context Management**: React context for network state management

## 🚀 Quick Start

### 1. Environment Setup

Choose your target environment and run the setup script:

```bash
# For development (devnet)
./scripts/setup-environment.sh development

# For testnet
./scripts/setup-environment.sh testnet

# For production (mainnet-beta)
./scripts/setup-environment.sh production
```

### 2. Environment Configuration

The setup script will create appropriate `.env` files. Review and update:

```bash
# Frontend environment variables
VITE_SOLANA_CLUSTER=devnet          # devnet | testnet | mainnet-beta
VITE_API_URL=http://localhost:3001
VITE_BACKEND_URL=http://localhost:3001

# Backend environment variables  
SOLANA_CLUSTER=devnet               # Must match frontend
SOLANA_RPC_URL=https://api.devnet.solana.com
RESEND_API_KEY=your_api_key_here    # Required for email notifications
```

### 3. Start the Application

```bash
# Start backend
cd backend && npm run dev

# Start frontend (in another terminal)
npm run dev
```

## 🔒 Security Features

### Environment Variable Protection
- No sensitive data in frontend code
- Proper `.gitignore` configuration
- Environment-specific configuration files
- Secure secret generation for production

### Network Validation
- Frontend and backend network parameter validation
- Environment consistency checks
- Production network warnings
- Invalid network rejection

### API Security
- Network parameter validation middleware
- Request header validation
- Environment-specific CORS settings
- Rate limiting configuration

## 🎛️ Network Selector Usage

### In the UI
1. **Navigation Bar**: Network selector is prominently displayed
2. **Visual Indicators**: Color-coded network status
3. **Production Warnings**: Clear alerts for mainnet usage
4. **Environment Validator**: Real-time validation status

### Programmatic Usage
```typescript
import { useNetwork } from '@/contexts/NetworkContext';

function MyComponent() {
  const { currentNetwork, networkConfig, changeNetwork } = useNetwork();
  
  // Current network info
  console.log(currentNetwork); // 'devnet' | 'testnet' | 'mainnet-beta'
  console.log(networkConfig.displayName); // 'Devnet' | 'Testnet' | 'Mainnet'
  console.log(networkConfig.isProduction); // boolean
  
  // Change network
  await changeNetwork('testnet');
}
```

## 🧪 Testing

### Automated Testing
```bash
# Test environment configuration
./scripts/test-environment.sh

# Test specific network
curl "http://localhost:3001/api/environment?network=devnet"
```

### Manual Testing
1. **Network Switching**: Use the network selector in the UI
2. **API Validation**: Check that API calls include network parameters
3. **Environment Validation**: Verify the environment validator shows correct status
4. **Production Warnings**: Confirm warnings appear when switching to mainnet

## 📁 File Structure

```
src/
├── config/
│   └── environment.ts              # Network configurations
├── contexts/
│   └── NetworkContext.tsx          # Network state management
├── components/
│   ├── NetworkSelector.tsx         # Network selection UI
│   └── EnvironmentValidator.tsx    # Environment validation UI
└── services/
    └── apiService.ts               # Network-aware API calls

backend/
├── config/
│   └── environment.js              # Backend network configuration
└── services/
    ├── solanaService.js            # Network-aware Solana service
    └── websocketService.js         # Network-aware WebSocket service

scripts/
├── setup-environment.sh           # Environment setup script
└── test-environment.sh            # Testing script

# Environment files
.env.development.example            # Development configuration
.env.testnet.example               # Testnet configuration  
.env.production.example            # Production configuration
```

## ⚠️ Important Notes

### Production Deployment
- **Always validate environment**: Use the environment validator
- **Double-check network settings**: Ensure correct network configuration
- **Monitor API usage**: Set up proper monitoring for production
- **Backup configurations**: Keep secure backups of environment files

### Security Best Practices
- **Rotate API keys regularly**: Especially after any exposure
- **Use different keys per environment**: Never share keys between environments
- **Monitor for exposed secrets**: Use pre-commit hooks to scan for secrets
- **Regular security audits**: Review configurations periodically

### Network-Specific Considerations

#### Devnet
- Free SOL via `solana airdrop 2`
- Frequent resets possible
- Ideal for development and testing

#### Testnet  
- Free SOL via `solana airdrop 2`
- More stable than devnet
- Good for staging and integration testing

#### Mainnet-Beta
- **Real SOL required** for all transactions
- Production environment
- Requires careful monitoring and validation

## 🆘 Troubleshooting

### Common Issues

1. **Network Mismatch**: Frontend and backend on different networks
   - Solution: Check environment variables match

2. **Environment Validation Errors**: Missing required variables
   - Solution: Run setup script or manually configure `.env` files

3. **API Connection Issues**: Backend not responding
   - Solution: Verify backend is running and network parameters are correct

4. **WebSocket Connection Failures**: Real-time updates not working
   - Solution: Check network configuration and WebSocket endpoint

### Debug Information
- Use the DevPanel network tab for detailed network information
- Check the environment validator for configuration issues
- Monitor browser console for network-related errors
- Use the `/api/environment` endpoint for backend debugging

## 📞 Support

For issues related to network environment selection:
1. Check the environment validator in the UI
2. Run the test script: `./scripts/test-environment.sh`
3. Review the console logs for detailed error information
4. Ensure all environment variables are properly configured
