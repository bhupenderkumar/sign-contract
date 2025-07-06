#!/bin/bash

# GitHub Deployment Setup Script for SecureContract Pro
# This script configures GitHub Actions and Cloud Build integration

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Welcome message
echo ""
echo "🚀 SecureContract Pro - GitHub Deployment Setup"
echo "=============================================="
echo ""

# Check prerequisites
print_status "Checking prerequisites..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud CLI is not installed"
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_error "You are not authenticated with Google Cloud"
    print_status "Run: gcloud auth login"
    exit 1
fi

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    print_error "No Google Cloud project is set"
    print_status "Run: gcloud config set project YOUR_PROJECT_ID"
    exit 1
fi

print_success "Prerequisites check passed"
print_status "Project ID: $PROJECT_ID"

# Get GitHub repository information
echo ""
print_status "GitHub Repository Configuration"
echo "Current repository URL from git remote:"
REPO_URL=$(git remote get-url origin 2>/dev/null || echo "")
if [ -n "$REPO_URL" ]; then
    echo "  $REPO_URL"
    
    # Extract owner and repo name from URL
    if [[ $REPO_URL == *"github.com"* ]]; then
        GITHUB_OWNER=$(echo $REPO_URL | sed -n 's/.*github\.com[:/]\([^/]*\)\/.*/\1/p')
        GITHUB_REPO=$(echo $REPO_URL | sed -n 's/.*github\.com[:/][^/]*\/\([^/]*\)\.git.*/\1/p')
        if [ -z "$GITHUB_REPO" ]; then
            GITHUB_REPO=$(echo $REPO_URL | sed -n 's/.*github\.com[:/][^/]*\/\([^/]*\).*/\1/p')
        fi
        
        print_status "Detected GitHub owner: $GITHUB_OWNER"
        print_status "Detected GitHub repo: $GITHUB_REPO"
    fi
fi

read -p "GitHub username/organization [$GITHUB_OWNER]: " input_owner
GITHUB_OWNER=${input_owner:-$GITHUB_OWNER}

read -p "GitHub repository name [$GITHUB_REPO]: " input_repo
GITHUB_REPO=${input_repo:-$GITHUB_REPO}

if [ -z "$GITHUB_OWNER" ] || [ -z "$GITHUB_REPO" ]; then
    print_error "GitHub owner and repository name are required"
    exit 1
fi

print_success "GitHub repository: $GITHUB_OWNER/$GITHUB_REPO"

# Enable required APIs
print_status "Enabling required Google Cloud APIs..."
gcloud services enable cloudbuild.googleapis.com --project="$PROJECT_ID"
gcloud services enable appengine.googleapis.com --project="$PROJECT_ID"
gcloud services enable secretmanager.googleapis.com --project="$PROJECT_ID"
gcloud services enable sourcerepo.googleapis.com --project="$PROJECT_ID"

print_success "APIs enabled successfully"

# Create service account for GitHub Actions
print_status "Creating service account for GitHub Actions..."

SA_NAME="github-actions-sa"
SA_EMAIL="$SA_NAME@$PROJECT_ID.iam.gserviceaccount.com"

# Check if service account exists
if gcloud iam service-accounts describe "$SA_EMAIL" --project="$PROJECT_ID" &>/dev/null; then
    print_warning "Service account $SA_EMAIL already exists"
else
    gcloud iam service-accounts create "$SA_NAME" \
        --display-name="GitHub Actions Service Account" \
        --description="Service account for GitHub Actions deployments" \
        --project="$PROJECT_ID"
    
    print_success "Service account created: $SA_EMAIL"
fi

# Grant necessary roles to service account
print_status "Granting roles to service account..."

ROLES=(
    "roles/appengine.deployer"
    "roles/appengine.serviceAdmin"
    "roles/cloudbuild.builds.builder"
    "roles/secretmanager.secretAccessor"
    "roles/storage.admin"
    "roles/iam.serviceAccountUser"
)

for role in "${ROLES[@]}"; do
    gcloud projects add-iam-policy-binding "$PROJECT_ID" \
        --member="serviceAccount:$SA_EMAIL" \
        --role="$role" \
        --quiet
done

print_success "Roles granted to service account"

# Create and download service account key
print_status "Creating service account key..."
KEY_FILE="github-actions-key.json"

if [ -f "$KEY_FILE" ]; then
    print_warning "Key file $KEY_FILE already exists. Skipping key creation."
else
    gcloud iam service-accounts keys create "$KEY_FILE" \
        --iam-account="$SA_EMAIL" \
        --project="$PROJECT_ID"
    
    print_success "Service account key created: $KEY_FILE"
fi

# Update cloudbuild-trigger.yaml with repository information
print_status "Updating Cloud Build trigger configuration..."
sed -i.bak "s/bhupenderkumar/$GITHUB_OWNER/g" cloudbuild-trigger.yaml
sed -i.bak "s/sign-contract/$GITHUB_REPO/g" cloudbuild-trigger.yaml

print_success "Cloud Build trigger configuration updated"

# Create Cloud Build trigger
print_status "Creating Cloud Build trigger..."

# Check if trigger already exists
TRIGGER_NAME="securecontract-github-trigger"
if gcloud builds triggers describe "$TRIGGER_NAME" --project="$PROJECT_ID" &>/dev/null; then
    print_warning "Cloud Build trigger $TRIGGER_NAME already exists"
    read -p "Do you want to update it? (y/n): " update_trigger
    if [[ $update_trigger =~ ^[Yy]$ ]]; then
        gcloud builds triggers delete "$TRIGGER_NAME" --project="$PROJECT_ID" --quiet
        gcloud builds triggers create github \
            --repo-name="$GITHUB_REPO" \
            --repo-owner="$GITHUB_OWNER" \
            --branch-pattern="^main$" \
            --build-config="cloudbuild.yaml" \
            --name="$TRIGGER_NAME" \
            --description="Automated deployment for SecureContract Pro" \
            --project="$PROJECT_ID"
        print_success "Cloud Build trigger updated"
    fi
else
    gcloud builds triggers create github \
        --repo-name="$GITHUB_REPO" \
        --repo-owner="$GITHUB_OWNER" \
        --branch-pattern="^main$" \
        --build-config="cloudbuild.yaml" \
        --name="$TRIGGER_NAME" \
        --description="Automated deployment for SecureContract Pro" \
        --project="$PROJECT_ID"
    print_success "Cloud Build trigger created"
fi

# Display GitHub Secrets setup instructions
echo ""
print_success "🎉 GitHub deployment setup completed!"
echo ""
print_status "Next steps:"
echo ""
print_warning "1. Add the following secrets to your GitHub repository:"
echo "   Go to: https://github.com/$GITHUB_OWNER/$GITHUB_REPO/settings/secrets/actions"
echo ""
echo "   GCP_PROJECT_ID:"
echo "   $PROJECT_ID"
echo ""
echo "   GCP_SA_KEY:"
echo "   $(cat $KEY_FILE | base64 -w 0)"
echo ""
print_warning "2. Push your code to the main branch to trigger deployment:"
echo "   git add ."
echo "   git commit -m 'Setup GitHub deployment'"
echo "   git push origin main"
echo ""
print_warning "3. Monitor deployment:"
echo "   GitHub Actions: https://github.com/$GITHUB_OWNER/$GITHUB_REPO/actions"
echo "   Cloud Build: https://console.cloud.google.com/cloud-build/builds?project=$PROJECT_ID"
echo ""
print_status "Your application will be deployed to:"
echo "   Frontend: https://$PROJECT_ID.uc.r.appspot.com"
echo "   Backend:  https://backend-dot-$PROJECT_ID.uc.r.appspot.com"
echo ""
print_warning "Security reminder:"
echo "   - Delete the key file after adding it to GitHub secrets: rm $KEY_FILE"
echo "   - Never commit the key file to your repository"
echo "   - Regularly rotate service account keys"
