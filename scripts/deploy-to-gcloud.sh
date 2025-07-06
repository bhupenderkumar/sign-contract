#!/bin/bash

# Google Cloud Deployment Script for SecureContract Pro
# This script deploys both frontend and backend to Google Cloud Platform

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
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

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Validate environment
validate_environment() {
    print_status "Validating deployment environment..."
    
    # Check if gcloud is installed
    if ! command_exists gcloud; then
        print_error "Google Cloud CLI is not installed"
        print_status "Install from: https://cloud.google.com/sdk/docs/install"
        exit 1
    fi
    
    # Check if user is authenticated
    if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
        print_error "You are not authenticated with Google Cloud"
        print_status "Run: gcloud auth login"
        exit 1
    fi
    
    # Check if project is set
    PROJECT_ID=$(gcloud config get-value project)
    if [ -z "$PROJECT_ID" ]; then
        print_error "No Google Cloud project is set"
        print_status "Run: gcloud config set project YOUR_PROJECT_ID"
        exit 1
    fi
    
    # Check if Node.js is installed
    if ! command_exists node; then
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check if npm is installed
    if ! command_exists npm; then
        print_error "npm is not installed"
        exit 1
    fi
    
    print_success "Environment validation passed"
    print_status "Project ID: $PROJECT_ID"
}

# Function to enable required APIs
enable_apis() {
    print_status "Enabling required Google Cloud APIs..."
    
    gcloud services enable appengine.googleapis.com --project="$PROJECT_ID"
    gcloud services enable cloudbuild.googleapis.com --project="$PROJECT_ID"
    gcloud services enable run.googleapis.com --project="$PROJECT_ID"
    gcloud services enable secretmanager.googleapis.com --project="$PROJECT_ID"
    
    print_success "APIs enabled successfully"
}

# Function to update configuration files with project ID
update_config_files() {
    print_status "Updating configuration files with project ID..."
    
    # Update app.yaml files
    if [ -f "app.yaml" ]; then
        sed -i.bak "s/YOUR_PROJECT_ID/$PROJECT_ID/g" app.yaml
        print_status "Updated app.yaml"
    fi
    
    if [ -f "backend/app.yaml" ]; then
        sed -i.bak "s/YOUR_PROJECT_ID/$PROJECT_ID/g" backend/app.yaml
        print_status "Updated backend/app.yaml"
    fi
    
    # Update Cloud Build configuration
    if [ -f "cloudbuild.yaml" ]; then
        sed -i.bak "s/YOUR_PROJECT_ID/$PROJECT_ID/g" cloudbuild.yaml
        print_status "Updated cloudbuild.yaml"
    fi
    
    # Update Cloud Run configuration
    if [ -f "cloudrun.yaml" ]; then
        sed -i.bak "s/PROJECT_ID/$PROJECT_ID/g" cloudrun.yaml
        print_status "Updated cloudrun.yaml"
    fi
    
    print_success "Configuration files updated"
}

# Function to build the application
build_application() {
    print_status "Building application for production..."
    
    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    npm ci
    
    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd backend
    npm ci
    cd ..
    
    # Build frontend with production environment variables
    print_status "Building React application..."
    export NODE_ENV=production
    export VITE_API_URL="https://backend-dot-$PROJECT_ID.uc.r.appspot.com"
    export VITE_BACKEND_URL="https://backend-dot-$PROJECT_ID.uc.r.appspot.com"
    export VITE_FRONTEND_URL="https://$PROJECT_ID.uc.r.appspot.com"
    export VITE_SOLANA_CLUSTER="devnet"
    
    npm run build:frontend
    
    print_success "Application built successfully!"
}

# Function to deploy to App Engine
deploy_to_app_engine() {
    print_status "Deploying to Google App Engine..."
    
    # Deploy backend first
    print_status "Deploying backend service..."
    gcloud app deploy backend/app.yaml --quiet --no-promote
    
    # Deploy frontend
    print_status "Deploying frontend service..."
    gcloud app deploy app.yaml --quiet --promote
    
    print_success "Deployed to App Engine successfully!"
    
    # Get the URLs
    FRONTEND_URL="https://$PROJECT_ID.uc.r.appspot.com"
    BACKEND_URL="https://backend-dot-$PROJECT_ID.uc.r.appspot.com"
    
    print_success "🎉 Deployment completed!"
    echo ""
    print_status "Your application URLs:"
    echo "  Frontend: $FRONTEND_URL"
    echo "  Backend:  $BACKEND_URL"
    echo "  API Health: $BACKEND_URL/api/health"
}

# Function to deploy to Cloud Run
deploy_to_cloud_run() {
    print_status "Deploying to Google Cloud Run..."
    
    # Build and push Docker image
    print_status "Building Docker image..."
    cd backend
    gcloud builds submit --tag gcr.io/$PROJECT_ID/securecontract-backend:latest .
    cd ..
    
    # Deploy to Cloud Run
    print_status "Deploying to Cloud Run..."
    gcloud run deploy securecontract-backend \
        --image gcr.io/$PROJECT_ID/securecontract-backend:latest \
        --platform managed \
        --region us-central1 \
        --allow-unauthenticated \
        --set-env-vars NODE_ENV=production,PORT=8080,SOLANA_NETWORK=devnet \
        --memory 2Gi \
        --cpu 1 \
        --max-instances 10 \
        --min-instances 1
    
    # Get Cloud Run URL
    BACKEND_URL=$(gcloud run services describe securecontract-backend --platform managed --region us-central1 --format 'value(status.url)')
    
    # Deploy frontend to App Engine with updated backend URL
    export VITE_API_URL="$BACKEND_URL"
    export VITE_BACKEND_URL="$BACKEND_URL"
    npm run build:frontend
    
    gcloud app deploy app.yaml --quiet --promote
    
    FRONTEND_URL="https://$PROJECT_ID.uc.r.appspot.com"
    
    print_success "🎉 Cloud Run deployment completed!"
    echo ""
    print_status "Your application URLs:"
    echo "  Frontend: $FRONTEND_URL"
    echo "  Backend:  $BACKEND_URL"
    echo "  API Health: $BACKEND_URL/api/health"
}

# Function to show deployment menu
show_menu() {
    echo ""
    echo "🚀 SecureContract Pro - Google Cloud Deployment"
    echo "=============================================="
    echo ""
    echo "Choose your deployment option:"
    echo "1) App Engine (Recommended - Serverless)"
    echo "2) Cloud Run (Container-based)"
    echo "3) Setup Secrets Only"
    echo "4) Enable APIs Only"
    echo "5) Exit"
    echo ""
}

# Main deployment function
main() {
    # Validate environment first
    validate_environment
    
    while true; do
        show_menu
        read -p "Enter your choice (1-5): " choice
        
        case $choice in
            1)
                enable_apis
                update_config_files
                build_application
                deploy_to_app_engine
                ;;
            2)
                enable_apis
                update_config_files
                build_application
                deploy_to_cloud_run
                ;;
            3)
                ./scripts/setup-gcloud-secrets.sh
                ;;
            4)
                enable_apis
                ;;
            5)
                print_success "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-5."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run the main function
main "$@"
