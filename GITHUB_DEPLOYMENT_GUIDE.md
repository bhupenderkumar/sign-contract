# 🚀 GitHub Deployment Guide for SecureContract Pro

Deploy your SecureContract Pro application to Google Cloud Platform directly from GitHub with automated CI/CD pipelines. This approach allows you to work from different machines and deploy with simple git pushes.

## 🏗️ Deployment Architecture

```
GitHub Repository
├── main branch → Staging (Devnet)
├── production branch → Production (Mainnet-Beta)
└── feature branches → No deployment

Google Cloud Platform
├── Staging Environment
│   ├── Frontend: https://PROJECT_ID.uc.r.appspot.com
│   ├── Backend: https://backend-dot-PROJECT_ID.uc.r.appspot.com
│   └── Solana: Devnet
└── Production Environment
    ├── Frontend: https://PROJECT_ID.uc.r.appspot.com
    ├── Backend: https://backend-dot-PROJECT_ID.uc.r.appspot.com
    └── Solana: Mainnet-Beta
```

## 🚀 Quick Setup (5 Steps)

### 1. **Run GitHub Setup Script**
```bash
./scripts/setup-github-deployment.sh
```

### 2. **Add GitHub Secrets**
Go to your repository settings: `https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions`

Add these secrets:
- `GCP_PROJECT_ID`: Your Google Cloud project ID
- `GCP_SA_KEY`: Service account key (provided by setup script)

### 3. **Setup Google Cloud Secrets**
```bash
./scripts/setup-gcloud-secrets.sh
```

### 4. **Push to Deploy**
```bash
git add .
git commit -m "Setup GitHub deployment"
git push origin main  # Deploys to staging
```

### 5. **Deploy to Production** (when ready)
```bash
git checkout -b production
git push origin production  # Deploys to production
```

## 📁 New Files Created

### GitHub Actions Workflows
- `.github/workflows/deploy-to-gcloud.yml` - Main deployment workflow
- `.github/workflows/deploy-production.yml` - Production deployment workflow

### Environment-Specific Configurations
- `app.staging.yaml` - Frontend staging configuration
- `app.production.yaml` - Frontend production configuration
- `backend/app.staging.yaml` - Backend staging configuration
- `backend/app.production.yaml` - Backend production configuration

### Setup Scripts
- `scripts/setup-github-deployment.sh` - GitHub integration setup
- `cloudbuild-trigger.yaml` - Cloud Build trigger configuration

## 🔄 Deployment Workflows

### Automatic Staging Deployment
**Trigger:** Push to `main` branch
**Environment:** Staging (Devnet)
**Process:**
1. Run tests and linting
2. Build frontend with staging environment variables
3. Deploy backend to App Engine
4. Deploy frontend to App Engine
5. Run deployment tests
6. Comment on PR with deployment URLs

### Manual Production Deployment
**Trigger:** Push to `production` branch or manual workflow dispatch
**Environment:** Production (Mainnet-Beta)
**Process:**
1. Require confirmation for production deployment
2. Run comprehensive tests
3. Build frontend with production environment variables
4. Deploy backend to App Engine (production config)
5. Deploy frontend to App Engine (production config)
6. Run production tests
7. Create GitHub release
8. Send deployment notifications

## 🌐 Environment Differences

### Staging Environment
- **Solana Network:** Devnet (free SOL via faucet)
- **Debug Mode:** Enabled
- **Logging:** Debug level
- **Scaling:** 0-5 instances
- **Purpose:** Testing and development

### Production Environment
- **Solana Network:** Mainnet-Beta (real SOL required)
- **Debug Mode:** Disabled
- **Logging:** Info level
- **Scaling:** 1-20 instances
- **Purpose:** Live application

## 🔐 Security & Secrets Management

### GitHub Secrets Required
```
GCP_PROJECT_ID=your-google-cloud-project-id
GCP_SA_KEY=base64-encoded-service-account-key
```

### Google Cloud Secrets (managed automatically)
- `mongodb-uri` - Database connection string
- `jwt-secret` - JWT signing secret
- `resend-api-key` - Email service API key
- `platform-fee-private-key` - Solana wallet private key

## 📊 Monitoring & Observability

### GitHub Actions
- **Workflow Status:** View in Actions tab
- **Deployment Logs:** Detailed logs for each step
- **PR Comments:** Automatic deployment status updates

### Google Cloud Console
- **App Engine:** Monitor instances and traffic
- **Cloud Build:** View build history and logs
- **Cloud Logging:** Centralized application logs
- **Cloud Monitoring:** Performance metrics and alerts

## 🧪 Testing Strategy

### Automated Tests (on every push)
- ESLint code quality checks
- Frontend build validation
- Backend dependency checks
- Deployment smoke tests

### Manual Testing Checklist
After deployment, test:
- [ ] Frontend loads correctly
- [ ] Backend API responds
- [ ] Wallet connection works
- [ ] Contract creation functions
- [ ] Email notifications send
- [ ] Network switching (staging vs production)

## 🚨 Troubleshooting

### Common Issues

1. **GitHub Actions Failing**
   ```bash
   # Check workflow logs in GitHub Actions tab
   # Verify secrets are correctly set
   # Ensure Google Cloud APIs are enabled
   ```

2. **Service Account Permissions**
   ```bash
   # Re-run setup script to fix permissions
   ./scripts/setup-github-deployment.sh
   ```

3. **Build Failures**
   ```bash
   # Test build locally
   npm ci
   npm run build:frontend
   
   # Check for environment variable issues
   ```

4. **Deployment Timeouts**
   - App Engine deployments can take 5-10 minutes
   - Check Google Cloud Console for detailed logs
   - Verify all required secrets are accessible

### Debug Commands
```bash
# View GitHub Actions logs
# Go to: https://github.com/YOUR_USERNAME/YOUR_REPO/actions

# View Google Cloud logs
gcloud app logs tail -s default
gcloud app logs tail -s backend

# Test deployment manually
curl https://YOUR_PROJECT_ID.uc.r.appspot.com/api/health
```

## 🔄 Workflow Commands

### Deploy to Staging
```bash
git add .
git commit -m "Your changes"
git push origin main
```

### Deploy to Production
```bash
# Method 1: Push to production branch
git checkout production
git merge main
git push origin production

# Method 2: Manual workflow dispatch
# Go to GitHub Actions → Deploy to Production → Run workflow
```

### Rollback Deployment
```bash
# List versions
gcloud app versions list

# Promote previous version
gcloud app services set-traffic default --splits=PREVIOUS_VERSION=1
gcloud app services set-traffic backend --splits=PREVIOUS_VERSION=1
```

## 📈 Scaling & Performance

### Automatic Scaling
- **Staging:** 0-5 instances (cost-optimized)
- **Production:** 1-20 instances (performance-optimized)
- **Scaling Triggers:** CPU utilization, request throughput

### Performance Optimization
- CDN for static assets
- Gzip compression
- Browser caching headers
- Optimized Docker images

## 💰 Cost Management

### Estimated Costs
- **Staging:** $5-15/month (minimal usage)
- **Production:** $20-100/month (depends on traffic)
- **Free Tier:** 28 instance hours/day included

### Cost Optimization Tips
1. Use staging environment for development
2. Set appropriate scaling limits
3. Monitor usage in Google Cloud Console
4. Use Cloud Build efficiently

## 🎯 Best Practices

### Development Workflow
1. **Feature Development:** Work on feature branches
2. **Testing:** Push to main for staging deployment
3. **Production:** Only deploy tested, stable code
4. **Monitoring:** Watch deployment logs and metrics

### Security Best Practices
1. **Secrets:** Never commit secrets to repository
2. **Access:** Use least-privilege service accounts
3. **Monitoring:** Set up alerts for unusual activity
4. **Updates:** Regularly rotate secrets and keys

### Git Workflow
```bash
# Feature development
git checkout -b feature/new-feature
git commit -m "Add new feature"
git push origin feature/new-feature

# Create PR to main for staging deployment
# After testing in staging, merge to production
```

## 🎉 Success! You're Ready

Your GitHub deployment is now configured with:

- ✅ **Automated CI/CD** from GitHub to Google Cloud
- ✅ **Environment Separation** (staging vs production)
- ✅ **Security Best Practices** with secrets management
- ✅ **Monitoring & Logging** for observability
- ✅ **Scalable Infrastructure** with auto-scaling
- ✅ **Cost Optimization** with appropriate resource limits

**Next Steps:**
1. Push your code to trigger the first deployment
2. Test your staging environment thoroughly
3. Deploy to production when ready
4. Set up monitoring alerts
5. Configure custom domain (optional)

**Happy Deploying! 🚀**
