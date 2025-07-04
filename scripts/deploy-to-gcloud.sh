#!/bin/bash

# Digital Contract Platform - Google Cloud Deployment Script
# This script deploys the entire application to Google Cloud Platform

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ID=""
REGION="us-central1"
ZONE="us-central1-a"
CLUSTER_NAME="digital-contract-cluster"
MONGODB_INSTANCE="digital-contract-mongodb"
REDIS_INSTANCE="digital-contract-redis"
STORAGE_BUCKET=""

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

# Function to check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v gcloud &> /dev/null; then
        print_error "Google Cloud CLI is not installed. Please install it first."
        exit 1
    fi
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker is not installed. Please install it first."
        exit 1
    fi
    
    print_success "Prerequisites check passed"
}

# Function to get project configuration
get_project_config() {
    if [ -z "$PROJECT_ID" ]; then
        echo -n "Enter your Google Cloud Project ID: "
        read PROJECT_ID
    fi
    
    if [ -z "$STORAGE_BUCKET" ]; then
        STORAGE_BUCKET="${PROJECT_ID}-contract-storage"
    fi
    
    print_status "Using Project ID: $PROJECT_ID"
    print_status "Using Region: $REGION"
    print_status "Using Storage Bucket: $STORAGE_BUCKET"
}

# Function to enable required APIs
enable_apis() {
    print_status "Enabling required Google Cloud APIs..."
    
    gcloud services enable \
        cloudbuild.googleapis.com \
        run.googleapis.com \
        sql-component.googleapis.com \
        sqladmin.googleapis.com \
        redis.googleapis.com \
        storage.googleapis.com \
        secretmanager.googleapis.com \
        monitoring.googleapis.com \
        logging.googleapis.com \
        --project=$PROJECT_ID
    
    print_success "APIs enabled successfully"
}

# Function to create storage bucket
create_storage() {
    print_status "Creating Cloud Storage bucket..."
    
    if ! gsutil ls -b gs://$STORAGE_BUCKET &> /dev/null; then
        gsutil mb -p $PROJECT_ID -c STANDARD -l $REGION gs://$STORAGE_BUCKET
        gsutil cors set gcloud/cors.json gs://$STORAGE_BUCKET
        print_success "Storage bucket created: $STORAGE_BUCKET"
    else
        print_warning "Storage bucket already exists: $STORAGE_BUCKET"
    fi
}

# Function to create MongoDB instance
create_mongodb() {
    print_status "Creating Cloud SQL MongoDB instance..."
    
    # Note: Google Cloud SQL doesn't support MongoDB directly
    # We'll use MongoDB Atlas or deploy MongoDB on Compute Engine
    print_warning "MongoDB setup requires manual configuration with MongoDB Atlas"
    print_status "Please set up MongoDB Atlas and update the connection string in secrets"
}

# Function to create Redis instance
create_redis() {
    print_status "Creating Redis Memorystore instance..."
    
    if ! gcloud redis instances describe $REDIS_INSTANCE --region=$REGION --project=$PROJECT_ID &> /dev/null; then
        gcloud redis instances create $REDIS_INSTANCE \
            --size=1 \
            --region=$REGION \
            --redis-version=redis_6_x \
            --project=$PROJECT_ID
        print_success "Redis instance created: $REDIS_INSTANCE"
    else
        print_warning "Redis instance already exists: $REDIS_INSTANCE"
    fi
}

# Function to create secrets
create_secrets() {
    print_status "Creating secrets in Secret Manager..."
    
    # Create secrets (you'll need to update these with actual values)
    echo -n "mongodb://username:password@host:port/database" | gcloud secrets create mongo-uri --data-file=- --project=$PROJECT_ID || true
    echo -n "redis://redis-host:6379" | gcloud secrets create redis-url --data-file=- --project=$PROJECT_ID || true
    echo -n "$(openssl rand -base64 32)" | gcloud secrets create jwt-secret --data-file=- --project=$PROJECT_ID || true
    echo -n "$(openssl rand -base64 32)" | gcloud secrets create session-secret --data-file=- --project=$PROJECT_ID || true
    echo -n "[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64]" | gcloud secrets create platform-fee-key --data-file=- --project=$PROJECT_ID || true
    
    print_success "Secrets created successfully"
}

# Function to build and push Docker images
build_and_push_images() {
    print_status "Building and pushing Docker images..."
    
    # Configure Docker to use gcloud as a credential helper
    gcloud auth configure-docker --project=$PROJECT_ID
    
    # Build and push backend image
    print_status "Building backend image..."
    docker build -t gcr.io/$PROJECT_ID/digital-contract-backend:latest ./backend
    docker push gcr.io/$PROJECT_ID/digital-contract-backend:latest
    
    # Build and push frontend image
    print_status "Building frontend image..."
    docker build -f Dockerfile.production -t gcr.io/$PROJECT_ID/digital-contract-frontend:latest .
    docker push gcr.io/$PROJECT_ID/digital-contract-frontend:latest
    
    print_success "Docker images built and pushed successfully"
}

# Function to deploy to Cloud Run
deploy_cloud_run() {
    print_status "Deploying to Cloud Run..."
    
    # Update YAML files with project ID
    sed -i "s/PROJECT_ID/$PROJECT_ID/g" gcloud/cloud-run-backend.yaml
    sed -i "s/PROJECT_ID/$PROJECT_ID/g" gcloud/cloud-run-frontend.yaml
    
    # Deploy backend
    gcloud run services replace gcloud/cloud-run-backend.yaml \
        --region=$REGION \
        --project=$PROJECT_ID
    
    # Deploy frontend
    gcloud run services replace gcloud/cloud-run-frontend.yaml \
        --region=$REGION \
        --project=$PROJECT_ID
    
    # Allow unauthenticated access
    gcloud run services add-iam-policy-binding digital-contract-backend \
        --member="allUsers" \
        --role="roles/run.invoker" \
        --region=$REGION \
        --project=$PROJECT_ID
    
    gcloud run services add-iam-policy-binding digital-contract-frontend \
        --member="allUsers" \
        --role="roles/run.invoker" \
        --region=$REGION \
        --project=$PROJECT_ID
    
    print_success "Cloud Run services deployed successfully"
}

# Function to get service URLs
get_service_urls() {
    print_status "Getting service URLs..."
    
    BACKEND_URL=$(gcloud run services describe digital-contract-backend --region=$REGION --project=$PROJECT_ID --format="value(status.url)")
    FRONTEND_URL=$(gcloud run services describe digital-contract-frontend --region=$REGION --project=$PROJECT_ID --format="value(status.url)")
    
    print_success "Deployment completed successfully!"
    echo ""
    echo "Service URLs:"
    echo "Frontend: $FRONTEND_URL"
    echo "Backend: $BACKEND_URL"
    echo ""
    echo "Next steps:"
    echo "1. Update MongoDB connection string in Secret Manager"
    echo "2. Update Redis connection string in Secret Manager"
    echo "3. Configure custom domain (optional)"
    echo "4. Set up monitoring and alerting"
}

# Main deployment function
main() {
    print_status "Starting Google Cloud deployment..."
    
    check_prerequisites
    get_project_config
    enable_apis
    create_storage
    create_mongodb
    create_redis
    create_secrets
    build_and_push_images
    deploy_cloud_run
    get_service_urls
    
    print_success "Deployment script completed!"
}

# Run main function
main "$@"
