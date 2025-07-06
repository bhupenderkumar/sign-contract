#!/bin/bash

# Google Cloud Quick Start Script for SecureContract Pro
# This script helps you get started with Google Cloud deployment

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
echo "🚀 SecureContract Pro - Google Cloud Quick Start"
echo "=============================================="
echo ""
print_status "This script will help you deploy your application to Google Cloud Platform"
echo ""

# Check prerequisites
print_status "Checking prerequisites..."

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    print_error "Google Cloud CLI is not installed"
    echo ""
    print_status "Please install Google Cloud CLI first:"
    echo "  macOS: brew install google-cloud-sdk"
    echo "  Ubuntu: curl https://sdk.cloud.google.com | bash"
    echo "  Windows: Download from https://cloud.google.com/sdk/docs/install"
    echo ""
    exit 1
fi

# Check if user is authenticated
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    print_warning "You are not authenticated with Google Cloud"
    print_status "Let's authenticate you now..."
    gcloud auth login
fi

# Check if project is set
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    print_warning "No Google Cloud project is set"
    echo ""
    print_status "Available projects:"
    gcloud projects list --format="table(projectId,name,projectNumber)"
    echo ""
    read -p "Enter your project ID: " PROJECT_ID
    gcloud config set project "$PROJECT_ID"
fi

print_success "Prerequisites check completed"
print_status "Project ID: $PROJECT_ID"

# Create .env.gcloud file if it doesn't exist
if [ ! -f ".env.gcloud" ]; then
    print_status "Creating .env.gcloud file..."
    cp .env.gcloud.example .env.gcloud
    sed -i.bak "s/your-project-id/$PROJECT_ID/g" .env.gcloud
    print_success ".env.gcloud file created"
    print_warning "Please edit .env.gcloud with your actual values before continuing"
    
    read -p "Press Enter after editing .env.gcloud file..."
fi

# Show deployment options
echo ""
print_status "Choose what you want to do:"
echo "1) Setup secrets and deploy everything (recommended for first time)"
echo "2) Setup secrets only"
echo "3) Deploy application only"
echo "4) Show deployment guide"
echo "5) Exit"
echo ""

read -p "Enter your choice (1-5): " choice

case $choice in
    1)
        print_status "Setting up secrets and deploying application..."
        ./scripts/setup-gcloud-secrets.sh
        ./scripts/deploy-to-gcloud.sh
        ;;
    2)
        print_status "Setting up secrets only..."
        ./scripts/setup-gcloud-secrets.sh
        ;;
    3)
        print_status "Deploying application only..."
        ./scripts/deploy-to-gcloud.sh
        ;;
    4)
        print_status "Opening deployment guide..."
        if command -v code &> /dev/null; then
            code GOOGLE_CLOUD_DEPLOYMENT_GUIDE.md
        elif command -v nano &> /dev/null; then
            nano GOOGLE_CLOUD_DEPLOYMENT_GUIDE.md
        else
            cat GOOGLE_CLOUD_DEPLOYMENT_GUIDE.md
        fi
        ;;
    5)
        print_success "Goodbye!"
        exit 0
        ;;
    *)
        print_error "Invalid option"
        exit 1
        ;;
esac

echo ""
print_success "🎉 Quick start completed!"
echo ""
print_status "Useful commands:"
echo "  npm run gcloud:setup    - Setup secrets"
echo "  npm run gcloud:deploy   - Deploy application"
echo "  gcloud app logs tail    - View logs"
echo ""
print_status "Documentation:"
echo "  GOOGLE_CLOUD_DEPLOYMENT_GUIDE.md - Complete deployment guide"
echo ""
print_status "Your application will be available at:"
echo "  https://$PROJECT_ID.uc.r.appspot.com"
