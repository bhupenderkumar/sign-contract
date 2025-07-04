# 🚀 Digital Contract Platform - Google Cloud Deployment Guide

This comprehensive guide will help you deploy your Solana Digital Contract Platform to Google Cloud Platform (GCP) with production-ready configurations.

## 📋 Prerequisites

### Required Tools
- [Google Cloud CLI](https://cloud.google.com/sdk/docs/install)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/)
- [Node.js 18+](https://nodejs.org/)
- [Git](https://git-scm.com/)

### Google Cloud Setup
1. Create a Google Cloud Project
2. Enable billing for your project
3. Install and authenticate Google Cloud CLI:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

## 🏗️ Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Cloud Run     │    │   Cloud Run     │    │  Cloud Storage  │
│   (Frontend)    │◄──►│   (Backend)     │◄──►│   (Files)       │
│   React + Nginx │    │   Node.js API   │    │   IPFS Alt      │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Load Balancer  │    │ Secret Manager  │    │   Monitoring    │
│   (Optional)    │    │   (Secrets)     │    │   & Logging     │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│ MongoDB Atlas   │    │ Redis Memory    │    │   Alerting      │
│   (Database)    │    │   (Cache)       │    │   (Email/Slack) │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🔧 Step-by-Step Deployment

### Step 1: Prepare Your Environment

1. **Clone and setup the repository:**
   ```bash
   git clone https://github.com/your-username/solana-contract.git
   cd solana-contract
   ```

2. **Install dependencies:**
   ```bash
   npm install
   cd backend && npm install && cd ..
   ```

3. **Set your Google Cloud Project ID:**
   ```bash
   export PROJECT_ID="your-project-id"
   gcloud config set project $PROJECT_ID
   ```

### Step 2: Build and Test Locally

1. **Build for production:**
   ```bash
   # On Linux/Mac
   ./scripts/build-production.sh
   
   # On Windows
   bash scripts/build-production.sh
   ```

2. **Test Docker builds locally:**
   ```bash
   # On Linux/Mac
   ./scripts/test-docker-build.sh
   
   # On Windows
   bash scripts/test-docker-build.sh
   ```

### Step 3: Deploy to Google Cloud

1. **Run the deployment script:**
   ```bash
   # On Linux/Mac
   ./scripts/deploy-to-gcloud.sh
   
   # On Windows
   bash scripts/deploy-to-gcloud.sh
   ```

2. **Follow the prompts to:**
   - Enter your Project ID
   - Confirm region selection
   - Wait for services to be created

### Step 4: Configure Secrets

1. **Update MongoDB connection:**
   ```bash
   echo -n "your-mongodb-connection-string" | gcloud secrets versions add mongo-uri --data-file=-
   ```

2. **Update Redis connection:**
   ```bash
   echo -n "your-redis-connection-string" | gcloud secrets versions add redis-url --data-file=-
   ```

3. **Update platform fee private key:**
   ```bash
   echo -n "your-solana-private-key-array" | gcloud secrets versions add platform-fee-key --data-file=-
   ```

### Step 5: Set Up Monitoring

1. **Create notification channels:**
   ```bash
   gcloud alpha monitoring channels create --channel-content-from-file=gcloud/monitoring-config.yaml
   ```

2. **Set up log-based metrics:**
   ```bash
   gcloud logging metrics create contract_creation_count --description="Contract creation count" --log-filter='jsonPayload.event="contract_created"'
   ```

## 🔐 Security Configuration

### Environment Variables
- All sensitive data stored in Google Secret Manager
- No hardcoded secrets in code or Docker images
- Proper CORS configuration for cross-origin requests

### Network Security
- Cloud Run services with proper IAM policies
- VPC connector for private database access (optional)
- HTTPS enforced for all external traffic

### Container Security
- Non-root user in Docker containers
- Minimal base images (Alpine Linux)
- Security updates applied during build

## 📊 Monitoring and Alerting

### Key Metrics Monitored
- Request rate and response time
- Error rates and availability
- Memory and CPU usage
- Contract creation and signing events
- Platform fee collection

### Alert Conditions
- High error rate (>5%)
- High response time (>2s)
- High memory usage (>80%)
- Service unavailability

## 🚀 CI/CD Pipeline

The GitHub Actions workflow automatically:
1. Runs tests on pull requests
2. Builds and deploys on main branch pushes
3. Updates Cloud Run services
4. Runs health checks
5. Sends deployment notifications

### Required GitHub Secrets
```
GCP_PROJECT_ID=your-project-id
GCP_SA_KEY=your-service-account-key-json
```

## 🔄 Maintenance and Updates

### Regular Tasks
1. **Monitor application health**
2. **Review logs and metrics**
3. **Update dependencies**
4. **Backup database**
5. **Review security alerts**

### Scaling
- Cloud Run automatically scales based on traffic
- Adjust min/max instances in deployment configuration
- Monitor costs and optimize resource allocation

## 🆘 Troubleshooting

### Common Issues

1. **Build Failures:**
   ```bash
   # Check build logs
   docker build --no-cache -t test-image .
   ```

2. **Deployment Failures:**
   ```bash
   # Check Cloud Run logs
   gcloud logs read --service=digital-contract-backend --limit=50
   ```

3. **Service Unavailable:**
   ```bash
   # Check service status
   gcloud run services describe digital-contract-backend --region=us-central1
   ```

### Health Check Endpoints
- Backend: `https://your-backend-url/api/health`
- Frontend: `https://your-frontend-url/`

## 💰 Cost Optimization

### Estimated Monthly Costs (USD)
- Cloud Run (Backend): $20-50
- Cloud Run (Frontend): $10-30
- Cloud Storage: $5-15
- Redis Memorystore: $30-60
- MongoDB Atlas: $57+ (M10 cluster)
- **Total: ~$122-212/month**

### Cost Reduction Tips
1. Use Cloud Run min instances = 0 for development
2. Implement proper caching strategies
3. Optimize Docker image sizes
4. Use appropriate machine types
5. Set up budget alerts

## 🔗 Useful Commands

```bash
# View service URLs
gcloud run services list --platform=managed

# View logs
gcloud logs read --service=digital-contract-backend --limit=100

# Update service
gcloud run services update digital-contract-backend --region=us-central1

# Scale service
gcloud run services update digital-contract-backend --min-instances=1 --max-instances=10

# Delete service
gcloud run services delete digital-contract-backend --region=us-central1
```

## 📞 Support

For deployment issues:
1. Check the troubleshooting section
2. Review Google Cloud documentation
3. Check application logs
4. Contact your development team

---

**Next Steps:**
1. Complete the deployment following this guide
2. Test all functionality in production
3. Set up monitoring dashboards
4. Configure custom domain (optional)
5. Implement backup strategies
