# SecureContract Pro - Vercel Deployment

Deploy your complete SecureContract Pro application (frontend + backend) to Vercel with MongoDB integration.

## 🚀 Quick Deploy

### Prerequisites
- [Vercel Account](https://vercel.com)
- [MongoDB Atlas Account](https://mongodb.com/atlas)
- [Resend Account](https://resend.com) for emails
- Solana wallet with some SOL

### One-Click Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/sign-contract)

### Manual Deploy

1. **Clone and Setup**
   ```bash
   git clone https://github.com/your-username/sign-contract.git
   cd sign-contract
   npm install
   ```

2. **Run Deployment Script**
   
   **Linux/Mac:**
   ```bash
   ./deploy-to-vercel.sh
   ```
   
   **Windows:**
   ```cmd
   deploy-to-vercel.bat
   ```

## 📋 Environment Variables

Set these in your Vercel dashboard:

### Required
```env
MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/digital_contracts
JWT_SECRET=your-super-secret-jwt-key
RESEND_API_KEY=re_your_resend_api_key
SOLANA_NETWORK=devnet
PLATFORM_FEE_RECIPIENT_PRIVATE_KEY=[1,2,3,...,64]
```

### Optional
```env
REDIS_URL=redis://your-redis-url
CORS_ORIGIN=https://your-domain.com
RATE_LIMIT_MAX_REQUESTS=100
```

## 🏗️ Architecture

```
Vercel Deployment
├── Frontend (Static Site)
│   ├── React + Vite
│   ├── Tailwind CSS
│   └── Solana Wallet Integration
├── Backend (Serverless Functions)
│   ├── Express.js API
│   ├── MongoDB Integration
│   ├── Email Service
│   └── Solana Contract Service
└── Database (MongoDB Atlas)
```

## 📁 Project Structure

```
/
├── api/                    # Vercel Serverless Functions
│   ├── index.js           # Main API handler
│   └── package.json       # API dependencies
├── backend/               # Backend source code
│   ├── models/            # MongoDB models
│   ├── services/          # Business logic
│   └── server.js          # Express server
├── src/                   # Frontend React app
├── dist/                  # Built frontend (auto-generated)
├── vercel.json           # Vercel configuration
└── package.json          # Frontend dependencies
```

## 🔧 Configuration Files

### vercel.json
```json
{
  "version": 2,
  "buildCommand": "npm run vercel-build",
  "outputDirectory": "dist",
  "functions": {
    "api/index.js": {
      "runtime": "nodejs18.x",
      "maxDuration": 30
    }
  },
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/index.js"
    }
  ]
}
```

## 🗄️ Database Setup

### MongoDB Atlas
1. Create cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create database user
3. Whitelist Vercel IPs (or use 0.0.0.0/0)
4. Get connection string
5. Add to `MONGODB_URI` environment variable

### Collections Created Automatically
- `contracts` - Digital contracts
- `users` - User accounts
- `signatures` - Contract signatures

## 📧 Email Configuration

### Resend Setup
1. Sign up at [resend.com](https://resend.com)
2. Get API key
3. Add to `RESEND_API_KEY` environment variable

### Email Templates
- Contract creation notification
- Contract signing confirmation
- Contract completion notification

## 🔐 Security Features

- **CORS Protection**: Configured for your domain
- **Rate Limiting**: 100 requests per 15 minutes
- **Helmet.js**: Security headers
- **JWT Authentication**: Secure user sessions
- **Input Validation**: Joi schema validation
- **Environment Variables**: Sensitive data protection

## 🌐 Solana Integration

### Network Support
- **Devnet**: Development and testing
- **Testnet**: Pre-production testing
- **Mainnet**: Production deployment

### Features
- Wallet connection
- Contract deployment
- Transaction signing
- Balance checking
- Network switching

## 📊 Monitoring

### Vercel Analytics
- Function execution time
- Error rates
- Request volume
- Performance metrics

### Logs
```bash
# View deployment logs
vercel logs

# View function logs
vercel logs --follow
```

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build locally
   npm run build:frontend
   ```

2. **API Errors**
   ```bash
   # Test API endpoint
   curl https://your-app.vercel.app/api/health
   ```

3. **Database Connection**
   - Verify MongoDB URI format
   - Check IP whitelist
   - Confirm user permissions

4. **Environment Variables**
   - Check Vercel dashboard
   - Verify variable names
   - Ensure no trailing spaces

### Debug Commands
```bash
# Check Vercel status
vercel whoami

# List deployments
vercel ls

# View project info
vercel inspect

# Download deployment
vercel pull
```

## 🔄 CI/CD Pipeline

### Automatic Deployments
- **Push to main**: Deploys to production
- **Pull requests**: Creates preview deployments
- **Environment branches**: Custom deployment rules

### Manual Deployments
```bash
# Deploy to production
vercel --prod

# Deploy preview
vercel

# Deploy specific branch
vercel --target production
```

## 💰 Cost Optimization

### Vercel Pricing
- **Hobby**: Free (generous limits)
- **Pro**: $20/month (team features)
- **Enterprise**: Custom pricing

### MongoDB Atlas
- **M0**: Free tier (512MB)
- **M2**: $9/month (2GB)
- **M5**: $25/month (5GB)

### Optimization Tips
1. Use MongoDB connection pooling
2. Implement caching with Redis
3. Optimize bundle size
4. Use Vercel Edge Functions for static content

## 🔗 Useful Links

- [Vercel Documentation](https://vercel.com/docs)
- [MongoDB Atlas Docs](https://docs.atlas.mongodb.com/)
- [Resend Documentation](https://resend.com/docs)
- [Solana Documentation](https://docs.solana.com/)

## 📞 Support

If you encounter issues:
1. Check the troubleshooting section
2. Review Vercel function logs
3. Test locally first
4. Verify environment variables
5. Check service status pages
