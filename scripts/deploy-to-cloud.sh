#!/bin/bash

# SecureContract Pro - Cloud Deployment Script
# This script helps deploy the application to various cloud platforms

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

# Function to validate environment
validate_environment() {
    print_status "Validating environment..."
    
    # Check Node.js version
    if command_exists node; then
        NODE_VERSION=$(node --version | cut -d'v' -f2)
        print_success "Node.js version: $NODE_VERSION"
    else
        print_error "Node.js is not installed"
        exit 1
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        print_success "npm version: $NPM_VERSION"
    else
        print_error "npm is not installed"
        exit 1
    fi
    
    # Check if package.json exists
    if [ ! -f "package.json" ]; then
        print_error "package.json not found. Please run this script from the project root."
        exit 1
    fi
}

# Function to build the application
build_application() {
    print_status "Building application for production..."
    
    # Install dependencies
    print_status "Installing dependencies..."
    npm ci --only=production
    
    # Build the application
    print_status "Building React application..."
    npm run build
    
    print_success "Application built successfully!"
}

# Function to deploy to Vercel
deploy_to_vercel() {
    print_status "Deploying to Vercel..."
    
    if ! command_exists vercel; then
        print_status "Installing Vercel CLI..."
        npm install -g vercel
    fi
    
    # Deploy to production
    vercel --prod --confirm
    
    print_success "Deployed to Vercel successfully!"
    print_status "Don't forget to configure your custom domain in the Vercel dashboard"
}

# Function to deploy to Netlify
deploy_to_netlify() {
    print_status "Deploying to Netlify..."
    
    if ! command_exists netlify; then
        print_status "Installing Netlify CLI..."
        npm install -g netlify-cli
    fi
    
    # Build and deploy
    netlify deploy --prod --dir=dist
    
    print_success "Deployed to Netlify successfully!"
    print_status "Don't forget to configure your custom domain in the Netlify dashboard"
}

# Function to deploy to AWS Amplify
deploy_to_amplify() {
    print_status "Deploying to AWS Amplify..."
    
    if ! command_exists aws; then
        print_error "AWS CLI is not installed. Please install it first."
        print_status "Visit: https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html"
        exit 1
    fi
    
    print_status "Please configure AWS Amplify through the AWS Console:"
    print_status "1. Go to AWS Amplify Console"
    print_status "2. Connect your GitHub repository"
    print_status "3. The amplify.yml file is already configured"
    print_status "4. Deploy and configure your custom domain"
}

# Function to create Docker production build
create_docker_build() {
    print_status "Creating Docker production build..."
    
    if ! command_exists docker; then
        print_error "Docker is not installed"
        exit 1
    fi
    
    # Build production Docker image
    docker build -f Dockerfile.production -t securecontract-pro:latest .
    
    print_success "Docker image built successfully!"
    print_status "You can now deploy this image to any Docker-compatible platform"
    print_status "Image name: securecontract-pro:latest"
}

# Function to deploy with Docker Compose
deploy_with_docker() {
    print_status "Deploying with Docker Compose..."
    
    # Check if .env.production exists
    if [ ! -f ".env.production" ]; then
        print_warning ".env.production not found. Creating from template..."
        cp .env.production.example .env.production
        print_warning "Please edit .env.production with your actual values before continuing"
        read -p "Press Enter after editing .env.production..."
    fi
    
    # Deploy with docker-compose
    docker-compose -f docker-compose.production.yml up -d
    
    print_success "Application deployed with Docker Compose!"
    print_status "Frontend: http://localhost"
    print_status "Backend API: http://localhost:3001"
    print_status "MongoDB: localhost:27017"
}

# Function to setup SSL certificates
setup_ssl() {
    print_status "Setting up SSL certificates..."
    
    if ! command_exists certbot; then
        print_status "Installing Certbot..."
        if command_exists apt-get; then
            sudo apt-get update
            sudo apt-get install -y certbot python3-certbot-nginx
        elif command_exists yum; then
            sudo yum install -y certbot python3-certbot-nginx
        else
            print_error "Please install Certbot manually"
            exit 1
        fi
    fi
    
    read -p "Enter your domain name (e.g., contracts.yourcompany.com): " DOMAIN
    
    # Get SSL certificate
    sudo certbot --nginx -d "$DOMAIN"
    
    print_success "SSL certificate configured for $DOMAIN"
}

# Function to show deployment options
show_menu() {
    echo ""
    echo "🚀 SecureContract Pro - Cloud Deployment Script"
    echo "=============================================="
    echo ""
    echo "Choose your deployment platform:"
    echo "1) Vercel (Recommended for frontend)"
    echo "2) Netlify"
    echo "3) AWS Amplify"
    echo "4) Docker Build (for any platform)"
    echo "5) Docker Compose (full stack)"
    echo "6) Setup SSL Certificates"
    echo "7) Exit"
    echo ""
}

# Main deployment function
main() {
    # Validate environment first
    validate_environment
    
    while true; do
        show_menu
        read -p "Enter your choice (1-7): " choice
        
        case $choice in
            1)
                build_application
                deploy_to_vercel
                ;;
            2)
                build_application
                deploy_to_netlify
                ;;
            3)
                build_application
                deploy_to_amplify
                ;;
            4)
                create_docker_build
                ;;
            5)
                deploy_with_docker
                ;;
            6)
                setup_ssl
                ;;
            7)
                print_success "Goodbye!"
                exit 0
                ;;
            *)
                print_error "Invalid option. Please choose 1-7."
                ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run the main function
main "$@"
