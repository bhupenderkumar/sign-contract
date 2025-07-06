#!/bin/bash

# Deploy SecureContract Pro to Vercel
# This script helps you deploy both frontend and backend to Vercel

set -e

echo "🚀 Starting Vercel deployment for SecureContract Pro..."

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

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    print_error "Vercel CLI is not installed. Installing now..."
    npm install -g vercel
    print_success "Vercel CLI installed successfully"
fi

# Check if user is logged in to Vercel
print_status "Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    print_warning "You are not logged in to Vercel. Please log in..."
    vercel login
fi

# Verify project structure
print_status "Verifying project structure..."

required_files=(
    "package.json"
    "vercel.json"
    "api/index.js"
    "api/package.json"
    "src/main.tsx"
    "backend/server.js"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        print_error "Required file missing: $file"
        exit 1
    fi
done

print_success "Project structure verified"

# Check environment variables
print_status "Checking environment variables..."

required_env_vars=(
    "MONGODB_URI"
    "JWT_SECRET"
    "RESEND_API_KEY"
    "SOLANA_NETWORK"
    "PLATFORM_FEE_RECIPIENT_PRIVATE_KEY"
)

print_warning "Make sure you have set these environment variables in Vercel:"
for var in "${required_env_vars[@]}"; do
    echo "  - $var"
done

echo ""
read -p "Have you set all required environment variables in Vercel? (y/n): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    print_error "Please set the environment variables in Vercel dashboard first"
    print_status "Visit: https://vercel.com/dashboard"
    exit 1
fi

# Build the project locally to check for errors
print_status "Building project locally to check for errors..."
npm run build:frontend

if [ $? -ne 0 ]; then
    print_error "Frontend build failed. Please fix the errors before deploying."
    exit 1
fi

print_success "Local build successful"

# Deploy to Vercel
print_status "Deploying to Vercel..."

# Check if this is the first deployment
if [ ! -f ".vercel/project.json" ]; then
    print_status "First time deployment detected. Setting up project..."
    vercel --prod
else
    print_status "Deploying to existing project..."
    vercel --prod
fi

if [ $? -eq 0 ]; then
    print_success "Deployment successful! 🎉"
    
    # Get the deployment URL
    DEPLOYMENT_URL=$(vercel ls | grep "securecontract-pro" | head -1 | awk '{print $2}')
    
    if [ ! -z "$DEPLOYMENT_URL" ]; then
        print_success "Your app is live at: https://$DEPLOYMENT_URL"
        
        # Test the deployment
        print_status "Testing deployment..."
        
        # Test health endpoint
        if curl -s "https://$DEPLOYMENT_URL/api/health" > /dev/null; then
            print_success "API health check passed ✅"
        else
            print_warning "API health check failed ⚠️"
        fi
        
        # Test frontend
        if curl -s "https://$DEPLOYMENT_URL" > /dev/null; then
            print_success "Frontend is accessible ✅"
        else
            print_warning "Frontend check failed ⚠️"
        fi
    fi
    
    echo ""
    print_success "Deployment completed successfully!"
    echo ""
    echo "Next steps:"
    echo "1. Test your application thoroughly"
    echo "2. Set up custom domain (optional)"
    echo "3. Configure monitoring and alerts"
    echo "4. Update CORS_ORIGIN if using custom domain"
    echo ""
    
else
    print_error "Deployment failed. Please check the error messages above."
    exit 1
fi
