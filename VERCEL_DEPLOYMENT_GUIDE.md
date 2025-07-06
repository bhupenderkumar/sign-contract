# Vercel Deployment Guide for SecureContract Pro

This guide will help you deploy both the frontend and backend of SecureContract Pro to Vercel in a single deployment.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **MongoDB Atlas**: Set up a MongoDB cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
3. **Resend Account**: Get API key from [resend.com](https://resend.com)
4. **Solana Wallet**: Have a Solana wallet with some SOL for contract deployment

## Step 1: Prepare Your Environment Variables

In your Vercel dashboard, add these environment variables:

### Required Environment Variables

```bash
# Application
NODE_ENV=production

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/digital_contracts?retryWrites=true&w=majority

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here

# Solana Configuration
SOLANA_NETWORK=devnet
SOLANA_RPC_URL=https://api.devnet.solana.com
PLATFORM_FEE_RECIPIENT_PRIVATE_KEY=[your,private,key,array]

# Email Service
RESEND_API_KEY=re_your_resend_api_key_here

# CORS
CORS_ORIGIN=https://your-app.vercel.app
```

### Optional Environment Variables

```bash
# Redis (for caching)
REDIS_URL=redis://your-redis-url

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=10485760
```

## Step 2: MongoDB Atlas Setup

1. Create a MongoDB Atlas account
2. Create a new cluster
3. Create a database user
4. Whitelist Vercel's IP addresses (or use 0.0.0.0/0 for all IPs)
5. Get your connection string and add it to `MONGODB_URI`

## Step 3: Deploy to Vercel

### Option A: Deploy via Vercel CLI

1. Install Vercel CLI:
   ```bash
   npm install -g vercel
   ```

2. Login to Vercel:
   ```bash
   vercel login
   ```

3. Deploy from your project root:
   ```bash
   vercel
   ```

4. Follow the prompts and set up your environment variables

### Option B: Deploy via GitHub Integration

1. Push your code to GitHub
2. Connect your GitHub repository to Vercel
3. Import your project in Vercel dashboard
4. Add environment variables in the Vercel dashboard
5. Deploy

## Step 4: Configure Domain (Optional)

1. In Vercel dashboard, go to your project settings
2. Add your custom domain
3. Update DNS records as instructed
4. Update `CORS_ORIGIN` environment variable with your domain

## Step 5: Test Your Deployment

1. Visit your deployed URL
2. Test contract creation
3. Test wallet connection
4. Test email notifications
5. Test Solana contract deployment

## Project Structure for Vercel

```
/
├── api/                    # Serverless functions
│   ├── index.js           # Main API handler
│   └── package.json       # API dependencies
├── backend/               # Backend source code
│   ├── models/
│   ├── services/
│   └── server.js
├── src/                   # Frontend source code
├── dist/                  # Built frontend (generated)
├── vercel.json           # Vercel configuration
└── package.json          # Frontend dependencies
```

## How It Works

1. **Frontend**: Built as a static site using Vite and served from `/dist`
2. **Backend**: Runs as serverless functions in `/api`
3. **Database**: MongoDB Atlas (cloud-hosted)
4. **File Storage**: Vercel's built-in storage or external service
5. **Email**: Resend API for notifications

## Environment-Specific Configuration

### Development
- Use local MongoDB or MongoDB Atlas
- Use `devnet` for Solana
- Use local environment variables

### Production
- Use MongoDB Atlas
- Use `devnet` or `mainnet-beta` for Solana
- Use Vercel environment variables

## Troubleshooting

### Common Issues

1. **MongoDB Connection Errors**
   - Check connection string format
   - Verify IP whitelist includes Vercel IPs
   - Ensure database user has correct permissions

2. **Solana Network Issues**
   - Verify RPC URL is correct
   - Check private key format
   - Ensure sufficient SOL balance

3. **Email Not Sending**
   - Verify Resend API key
   - Check email templates
   - Review Vercel function logs

4. **CORS Errors**
   - Update `CORS_ORIGIN` with correct domain
   - Check frontend API calls use correct URLs

### Debugging

1. **Check Vercel Function Logs**
   ```bash
   vercel logs
   ```

2. **Test API Endpoints**
   ```bash
   curl https://your-app.vercel.app/api/health
   ```

3. **Monitor Performance**
   - Use Vercel Analytics
   - Check function execution time
   - Monitor database connections

## Security Considerations

1. **Environment Variables**: Never commit sensitive data to Git
2. **CORS**: Restrict to your domain only
3. **Rate Limiting**: Enabled by default
4. **HTTPS**: Enforced by Vercel
5. **Private Keys**: Store securely in environment variables

## Scaling Considerations

1. **Database**: MongoDB Atlas auto-scales
2. **Functions**: Vercel auto-scales serverless functions
3. **Storage**: Consider external storage for large files
4. **Caching**: Implement Redis for better performance

## Cost Optimization

1. **Vercel**: Free tier includes generous limits
2. **MongoDB**: Use M0 cluster for development
3. **Resend**: Free tier includes email sending
4. **Solana**: Use devnet for testing (free)

## Support

If you encounter issues:
1. Check Vercel documentation
2. Review function logs
3. Test locally first
4. Check environment variables
5. Verify all services are properly configured
