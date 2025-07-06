# 🚨 Quick Deployment Fix Guide

Based on the error you encountered, here's how to fix the deployment issues and get your app deployed quickly.

## 🔍 Issue Analysis

**Error**: `PERMISSION_DENIED: Permission denied to enable service [secretmanager.googleapis.com]`

**Possible Causes**:
1. Google Cloud project doesn't have billing enabled
2. Your account doesn't have the required IAM permissions
3. Project ID might be incorrect
4. APIs need to be enabled manually first

## 🚀 Quick Fix Solutions

### Option 1: Enable Billing & APIs (Recommended)

1. **Go to Google Cloud Console**: https://console.cloud.google.com
2. **Select your project**: `477101295240`
3. **Enable billing**:
   - Go to Billing → Link a billing account
   - You need a valid payment method (even for free tier)
4. **Enable required APIs manually**:
   - Go to APIs & Services → Library
   - Search and enable these APIs:
     - App Engine Admin API
     - Cloud Build API
     - Secret Manager API
     - Cloud Resource Manager API

### Option 2: Use GitHub Deployment (Easier!)

Since you want to deploy from GitHub anyway, let's skip the local setup and go straight to GitHub deployment:

1. **Create a new Google Cloud project with billing enabled**
2. **Use the GitHub deployment method** (no local gcloud needed)
3. **Deploy directly from GitHub**

## 🎯 Recommended Approach: GitHub Deployment

Let's set up GitHub deployment which doesn't require local gcloud CLI:

### Step 1: Create New Project (if needed)
```bash
# Go to: https://console.cloud.google.com
# Create new project with billing enabled
# Note the project ID
```

### Step 2: Enable APIs in Console
Go to Google Cloud Console → APIs & Services → Library and enable:
- App Engine Admin API
- Cloud Build API  
- Secret Manager API
- Cloud Resource Manager API

### Step 3: Create Service Account
```bash
# In Google Cloud Console:
# IAM & Admin → Service Accounts → Create Service Account
# Name: github-actions-sa
# Grant roles:
#   - App Engine Deployer
#   - App Engine Service Admin
#   - Cloud Build Service Account
#   - Secret Manager Secret Accessor
#   - Storage Admin
```

### Step 4: Download Service Account Key
```bash
# In Service Accounts → Actions → Create Key → JSON
# Download the JSON file
```

### Step 5: Add GitHub Secrets
Go to: `https://github.com/bhupenderkumar/sign-contract/settings/secrets/actions`

Add these secrets:
- `GCP_PROJECT_ID`: Your new project ID
- `GCP_SA_KEY`: Contents of the JSON file (copy-paste entire JSON)

### Step 6: Create Secrets in Google Cloud Console
Go to Secret Manager in Google Cloud Console and create:

1. **mongodb-uri**
   ```
   mongodb+srv://username:password@cluster.mongodb.net/digital_contracts
   ```

2. **jwt-secret**
   ```
   your-super-secret-jwt-key-change-this
   ```

3. **resend-api-key**
   ```
   re_your_resend_api_key_here
   ```

4. **platform-fee-private-key**
   ```
   [1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64]
   ```

### Step 7: Update Configuration Files
Update these files with your project ID:

**app.yaml**:
```yaml
# Replace YOUR_PROJECT_ID with your actual project ID
env_variables:
  VITE_API_URL: "https://backend-dot-YOUR_ACTUAL_PROJECT_ID.uc.r.appspot.com"
  VITE_BACKEND_URL: "https://backend-dot-YOUR_ACTUAL_PROJECT_ID.uc.r.appspot.com"
  VITE_FRONTEND_URL: "https://YOUR_ACTUAL_PROJECT_ID.uc.r.appspot.com"
```

**backend/app.yaml**:
```yaml
# Replace YOUR_PROJECT_ID with your actual project ID
env_variables:
  CORS_ORIGIN: "https://YOUR_ACTUAL_PROJECT_ID.uc.r.appspot.com"
  MONGODB_URI: "projects/YOUR_ACTUAL_PROJECT_ID/secrets/mongodb-uri/versions/latest"
  JWT_SECRET: "projects/YOUR_ACTUAL_PROJECT_ID/secrets/jwt-secret/versions/latest"
  RESEND_API_KEY: "projects/YOUR_ACTUAL_PROJECT_ID/secrets/resend-api-key/versions/latest"
  PLATFORM_FEE_RECIPIENT_PRIVATE_KEY: "projects/YOUR_ACTUAL_PROJECT_ID/secrets/platform-fee-private-key/versions/latest"
```

### Step 8: Deploy via GitHub
```bash
git add .
git commit -m "Setup Google Cloud deployment"
git push origin main
```

## 🔧 Alternative: Fix Current Project

If you want to use the current project (477101295240):

### 1. Enable Billing
- Go to Google Cloud Console
- Billing → Link billing account
- Add payment method

### 2. Check IAM Permissions
Your account (rajus9231@gmail.com) needs these roles:
- Project Editor or Owner
- App Engine Admin
- Service Account Admin

### 3. Enable APIs Manually
Go to APIs & Services → Library and enable:
- App Engine Admin API
- Cloud Build API
- Secret Manager API

### 4. Try the Script Again
```bash
./scripts/setup-gcloud-secrets.sh
```

## 🎯 Fastest Solution

**For immediate deployment**, I recommend:

1. **Create a new Google Cloud project** with billing enabled
2. **Use GitHub deployment** (no local setup needed)
3. **Follow the GitHub deployment guide**

This way you can deploy from any machine without installing gcloud CLI locally.

## 📞 Need Help?

If you're still having issues:

1. **Check billing**: Ensure your Google Cloud project has billing enabled
2. **Verify permissions**: Make sure your account has Owner or Editor role
3. **Use GitHub method**: It's easier and doesn't require local gcloud setup

## 🚀 Quick Commands

```bash
# Check current gcloud config (if installed)
gcloud config list

# Check project permissions
gcloud projects get-iam-policy PROJECT_ID

# Enable APIs manually
gcloud services enable appengine.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable secretmanager.googleapis.com
```

**Recommendation**: Use the GitHub deployment method - it's more reliable and works from any machine! 🎯
