# Google Cloud Deployment Guide for SecureContract Pro

This guide will help you deploy your SecureContract Pro application to Google Cloud Platform with both frontend and backend services.

## 🏗️ Architecture Overview

```
Google Cloud Platform
├── Frontend (App Engine)
│   ├── React Application (Static Files)
│   ├── Custom Domain Support
│   └── CDN Integration
├── Backend (App Engine/Cloud Run)
│   ├── Node.js API Server
│   ├── WebSocket Support
│   └── Auto-scaling
├── Database (MongoDB Atlas)
│   ├── Cloud-hosted MongoDB
│   └── Global Clusters
└── Secrets (Secret Manager)
    ├── API Keys
    ├── Database Credentials
    └── JWT Secrets
```

## 📋 Prerequisites

### 1. Google Cloud Account
- Create a Google Cloud account at [cloud.google.com](https://cloud.google.com)
- Create a new project or select an existing one
- Enable billing for your project

### 2. Install Google Cloud CLI
```bash
# On macOS
brew install google-cloud-sdk

# On Ubuntu/Debian
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# On Windows
# Download from: https://cloud.google.com/sdk/docs/install
```

### 3. Authenticate and Configure
```bash
# Login to Google Cloud
gcloud auth login

# Set your project ID
gcloud config set project YOUR_PROJECT_ID

# Verify configuration
gcloud config list
```

### 4. Required Services
- MongoDB Atlas account (recommended) or Google Cloud Firestore
- Resend account for email notifications
- Solana wallet with some SOL for contract deployment

## 🚀 Quick Deployment

### Option 1: Automated Deployment (Recommended)

1. **Setup Secrets**
   ```bash
   ./scripts/setup-gcloud-secrets.sh
   ```

2. **Deploy Application**
   ```bash
   ./scripts/deploy-to-gcloud.sh
   ```

3. **Choose deployment option:**
   - App Engine (Serverless, recommended)
   - Cloud Run (Container-based)

### Option 2: Manual Deployment

1. **Enable APIs**
   ```bash
   gcloud services enable appengine.googleapis.com
   gcloud services enable cloudbuild.googleapis.com
   gcloud services enable secretmanager.googleapis.com
   ```

2. **Build Application**
   ```bash
   npm ci
   cd backend && npm ci && cd ..
   npm run build:frontend
   ```

3. **Deploy Backend**
   ```bash
   gcloud app deploy backend/app.yaml
   ```

4. **Deploy Frontend**
   ```bash
   gcloud app deploy app.yaml
   ```

## 🔐 Environment Variables & Secrets

### Required Secrets (use Secret Manager)
```bash
# Database
mongodb-uri: "mongodb+srv://user:pass@cluster.mongodb.net/digital_contracts"

# Authentication
jwt-secret: "your-super-secret-jwt-key"
session-secret: "your-session-secret"

# Email Service
resend-api-key: "re_your_resend_api_key"

# Solana Configuration
platform-fee-private-key: "[1,2,3,...,64]"
```

### Environment Variables (in app.yaml)
```yaml
env_variables:
  NODE_ENV: "production"
  SOLANA_NETWORK: "devnet"
  CORS_ORIGIN: "https://your-project-id.uc.r.appspot.com"
```

## 📁 Project Structure for Google Cloud

```
/
├── app.yaml                    # Frontend App Engine config
├── backend/
│   ├── app.yaml               # Backend App Engine config
│   ├── Dockerfile.gcloud      # Cloud Run Dockerfile
│   └── server.js              # Backend application
├── cloudbuild.yaml            # Cloud Build configuration
├── cloudrun.yaml              # Cloud Run service config
├── scripts/
│   ├── setup-gcloud-secrets.sh
│   └── deploy-to-gcloud.sh
└── dist/                      # Built frontend (generated)
```

## 🌐 URLs After Deployment

### App Engine URLs
- **Frontend**: `https://YOUR_PROJECT_ID.uc.r.appspot.com`
- **Backend**: `https://backend-dot-YOUR_PROJECT_ID.uc.r.appspot.com`
- **API Health**: `https://backend-dot-YOUR_PROJECT_ID.uc.r.appspot.com/api/health`

### Custom Domain (Optional)
1. **Verify domain ownership**
   ```bash
   gcloud domains verify YOUR_DOMAIN.com
   ```

2. **Map custom domain**
   ```bash
   gcloud app domain-mappings create YOUR_DOMAIN.com
   ```

3. **Update DNS records** as instructed by Google Cloud

## 🔧 Configuration Files

### Frontend (app.yaml)
- Serves static React build files
- Handles routing for SPA
- Proxies API calls to backend
- Includes security headers

### Backend (backend/app.yaml)
- Node.js runtime configuration
- Auto-scaling settings
- Health check endpoints
- Secret Manager integration

### Cloud Build (cloudbuild.yaml)
- Automated build pipeline
- Multi-service deployment
- Environment variable injection
- Build optimization

## 📊 Monitoring & Logging

### Google Cloud Console
- **App Engine**: Monitor instances, traffic, errors
- **Cloud Logging**: View application logs
- **Cloud Monitoring**: Set up alerts and dashboards
- **Secret Manager**: Manage sensitive data

### Health Checks
- Frontend: `https://YOUR_PROJECT_ID.uc.r.appspot.com/`
- Backend: `https://backend-dot-YOUR_PROJECT_ID.uc.r.appspot.com/api/health`

## 💰 Cost Optimization

### App Engine Pricing
- **Frontend**: Free tier available, pay for traffic
- **Backend**: Free tier available, pay for instance hours
- **Estimated cost**: $10-50/month for moderate usage

### Cost-Saving Tips
1. Use automatic scaling with min_instances: 0
2. Optimize bundle size for faster loading
3. Use CDN for static assets
4. Monitor usage in Cloud Console

## 🔒 Security Best Practices

### Implemented Security Features
- HTTPS enforcement
- CORS configuration
- Security headers (XSS, CSRF protection)
- Secret Manager for sensitive data
- Rate limiting
- Input validation

### Additional Recommendations
1. Enable Cloud Armor for DDoS protection
2. Set up Cloud IAM roles properly
3. Regular security audits
4. Monitor access logs
5. Use VPC for network isolation

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   ```bash
   # Check build logs
   gcloud app logs tail -s default
   
   # Verify dependencies
   npm ci && npm run build:frontend
   ```

2. **Secret Access Issues**
   ```bash
   # Check secret permissions
   gcloud secrets get-iam-policy SECRET_NAME
   
   # Grant access to App Engine
   gcloud secrets add-iam-policy-binding SECRET_NAME \
     --member="serviceAccount:PROJECT_ID@appspot.gserviceaccount.com" \
     --role="roles/secretmanager.secretAccessor"
   ```

3. **Database Connection Issues**
   - Verify MongoDB Atlas IP whitelist (allow 0.0.0.0/0 for Google Cloud)
   - Check connection string format
   - Ensure database user has proper permissions

4. **CORS Issues**
   - Update CORS_ORIGIN in backend configuration
   - Verify frontend URL matches CORS settings

### Debug Commands
```bash
# View application logs
gcloud app logs tail -s default
gcloud app logs tail -s backend

# Check service status
gcloud app services list
gcloud app versions list

# Test API endpoints
curl https://backend-dot-YOUR_PROJECT_ID.uc.r.appspot.com/api/health
```

## 📞 Support

### Resources
- [Google Cloud Documentation](https://cloud.google.com/docs)
- [App Engine Documentation](https://cloud.google.com/appengine/docs)
- [Secret Manager Documentation](https://cloud.google.com/secret-manager/docs)

### Getting Help
1. Check Google Cloud Console for error messages
2. Review application logs
3. Verify all prerequisites are met
4. Test locally before deploying

## 🎉 Next Steps

After successful deployment:

1. **Test all functionality**
   - Wallet connection
   - Contract creation
   - Email notifications
   - File uploads

2. **Set up monitoring**
   - Create dashboards
   - Set up alerts
   - Monitor performance

3. **Configure custom domain** (optional)
4. **Set up CI/CD pipeline** with Cloud Build
5. **Implement backup strategy** for database

---

**🎊 Congratulations!** Your SecureContract Pro application is now running on Google Cloud Platform with enterprise-grade security, scalability, and reliability!
