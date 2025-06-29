#!/bin/bash

# Production Deployment Script
# This script deploys the application to production environment

set -e

echo "🚀 Starting Production Deployment..."

# Check if required environment variables are set
if [ -z "$MONGO_URI" ] || [ -z "$SOLANA_CLUSTER" ]; then
    echo "❌ Required environment variables are not set."
    echo "Please set: MONGO_URI, SOLANA_CLUSTER"
    exit 1
fi

# Build frontend for production
echo "🔨 Building frontend for production..."
npm run build

# Build backend Docker image
echo "🐳 Building backend Docker image..."
cd backend
docker build -t digital-contract-backend:latest .
cd ..

# Build frontend Docker image for production
echo "🐳 Building frontend Docker image..."
docker build -f Dockerfile.frontend.prod -t digital-contract-frontend:latest .

# Deploy smart contract to mainnet (if specified)
if [ "$SOLANA_CLUSTER" = "mainnet-beta" ]; then
    echo "🔨 Deploying smart contract to mainnet..."
    ./scripts/deploy-contract.sh
fi

# Start production services
echo "🚀 Starting production services..."
docker-compose -f docker-compose.prod.yml up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 30

# Run health checks
echo "🔍 Running health checks..."
curl -f http://localhost/api/health || {
    echo "❌ Health check failed"
    exit 1
}

# Run database migrations if needed
echo "📊 Running database migrations..."
docker-compose -f docker-compose.prod.yml exec backend npm run migrate

echo "✅ Production deployment completed successfully!"
echo "🌐 Application is now live!"
