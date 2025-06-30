#!/bin/bash

# Local Environment Setup Script for SecureContract Pro
# This script helps set up .env.local files with actual values

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to prompt for input with default value
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " input
        if [ -z "$input" ]; then
            input="$default"
        fi
    else
        read -p "$prompt: " input
    fi
    
    eval "$var_name='$input'"
}

# Function to generate secure random string
generate_secret() {
    openssl rand -hex 32 2>/dev/null || echo "dev_secret_$(date +%s)_$(shuf -i 1000-9999 -n 1)"
}

# Function to setup frontend .env.local
setup_frontend_env() {
    print_info "Setting up frontend .env.local..."
    
    # Check if .env.local already exists
    if [ -f ".env.local" ]; then
        print_warning ".env.local already exists"
        read -p "Do you want to overwrite it? (y/N): " overwrite
        if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
            print_info "Skipping frontend .env.local setup"
            return
        fi
    fi
    
    # Get configuration values
    prompt_with_default "Backend URL" "http://localhost:3001" "BACKEND_URL"
    prompt_with_default "Solana Cluster (devnet/testnet/mainnet-beta)" "devnet" "SOLANA_CLUSTER"
    prompt_with_default "Google Analytics Tracking ID (optional)" "" "GA_TRACKING_ID"
    
    # Create .env.local file
    cat > .env.local << EOF
# Frontend Environment Configuration - Local Development
# This file contains actual values for local development
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

# Application Environment
NODE_ENV=development

# Frontend Configuration
VITE_API_URL=${BACKEND_URL}
VITE_BACKEND_URL=${BACKEND_URL}
VITE_SOLANA_CLUSTER=${SOLANA_CLUSTER}

# Analytics (Optional for development)
VITE_GA_TRACKING_ID=${GA_TRACKING_ID}

# Development Features
VITE_ENABLE_DEBUG=true
VITE_ENABLE_DEV_TOOLS=true

# Performance Monitoring (Optional)
VITE_ENABLE_PERFORMANCE_MONITORING=false

# Local Development URLs
VITE_FRONTEND_URL=http://localhost:5173
VITE_WEBSOCKET_URL=ws://localhost:3001

# Security Configuration
VITE_ENABLE_HTTPS=false

# Development Mode Flags
VITE_MOCK_WALLET=false
VITE_SKIP_WALLET_VALIDATION=false

# Local Storage Keys (for development)
VITE_STORAGE_PREFIX=securecontract_dev_

# API Configuration
VITE_API_TIMEOUT=30000
VITE_MAX_RETRIES=3

# Development Logging
VITE_LOG_LEVEL=debug
VITE_ENABLE_CONSOLE_LOGS=true
EOF

    print_status "Frontend .env.local created successfully"
}

# Function to setup backend .env.local
setup_backend_env() {
    print_info "Setting up backend .env.local..."
    
    # Check if backend/.env.local already exists
    if [ -f "backend/.env.local" ]; then
        print_warning "backend/.env.local already exists"
        read -p "Do you want to overwrite it? (y/N): " overwrite
        if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
            print_info "Skipping backend .env.local setup"
            return
        fi
    fi
    
    # Get configuration values
    prompt_with_default "Backend Port" "3001" "PORT"
    prompt_with_default "MongoDB URI" "mongodb://admin:password123@localhost:27017/digital_contracts?authSource=admin" "MONGO_URI"
    prompt_with_default "Redis URL" "redis://localhost:6379" "REDIS_URL"
    prompt_with_default "Solana Cluster (devnet/testnet/mainnet-beta)" "devnet" "SOLANA_CLUSTER"
    prompt_with_default "Solana RPC URL" "https://api.devnet.solana.com" "SOLANA_RPC_URL"
    prompt_with_default "Resend API Key" "" "RESEND_API_KEY"
    prompt_with_default "Frontend URL" "http://localhost:5173" "FRONTEND_URL"
    
    # Generate secure secrets
    JWT_SECRET=$(generate_secret)
    SESSION_SECRET=$(generate_secret)
    
    print_info "Generated secure JWT and session secrets"
    
    # Create backend/.env.local file
    mkdir -p backend
    cat > backend/.env.local << EOF
# Backend Environment Configuration - Local Development
# This file contains actual values for local development
# DO NOT COMMIT THIS FILE TO VERSION CONTROL

# Application Environment
NODE_ENV=development
PORT=${PORT}

# Database Configuration
MONGO_URI=${MONGO_URI}
REDIS_URL=${REDIS_URL}

# Solana Configuration - DEVELOPMENT
SOLANA_CLUSTER=${SOLANA_CLUSTER}
SOLANA_RPC_URL=${SOLANA_RPC_URL}

# Platform Fee Configuration (Development keypair)
# Generate a new keypair for development: solana-keygen new
# This is a sample development key - replace with your own
PLATFORM_FEE_RECIPIENT_PRIVATE_KEY=[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,37,38,39,40,41,42,43,44,45,46,47,48,49,50,51,52,53,54,55,56,57,58,59,60,61,62,63,64]

# Email Configuration (Development)
RESEND_API_KEY=${RESEND_API_KEY}

# Security Secrets (Generated)
JWT_SECRET=${JWT_SECRET}
SESSION_SECRET=${SESSION_SECRET}

# CORS Configuration
CORS_ORIGIN=${FRONTEND_URL}
FRONTEND_URL=${FRONTEND_URL}

# Development Features
ENABLE_SWAGGER=true
ENABLE_DEBUG_ROUTES=true
ENABLE_REQUEST_LOGGING=true
LOG_LEVEL=debug

# Development Monitoring
ENABLE_PERFORMANCE_MONITORING=false
ENABLE_ERROR_TRACKING=false

# Rate Limiting (Relaxed for development)
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=1000

# WebSocket Configuration
WEBSOCKET_CORS_ORIGIN=${FRONTEND_URL}
WEBSOCKET_TRANSPORTS=websocket,polling

# File Upload Configuration
MAX_FILE_SIZE=50mb
UPLOAD_DIR=./uploads

# IPFS Configuration (Optional)
IPFS_HOST=localhost
IPFS_PORT=5001
IPFS_PROTOCOL=http

# Development Database Settings
DB_DEBUG=true
DB_SLOW_QUERY_THRESHOLD=100

# Cache Configuration
CACHE_TTL=300
CACHE_MAX_SIZE=100

# Development Email Settings
EMAIL_FROM=noreply@localhost
EMAIL_REPLY_TO=support@localhost

# Solana Development Settings
SOLANA_COMMITMENT=confirmed
SOLANA_TIMEOUT=30000
SOLANA_MAX_RETRIES=3

# Local Development URLs
API_BASE_URL=http://localhost:${PORT}
FRONTEND_BASE_URL=${FRONTEND_URL}

# Development Security Settings
DISABLE_RATE_LIMITING=false
ALLOW_INSECURE_CONNECTIONS=true
SKIP_SSL_VERIFICATION=true

# Monitoring and Health Check
HEALTH_CHECK_INTERVAL=30000
ENABLE_METRICS=false

# Development Contract Settings
CONTRACT_PROGRAM_ID=4bmYTgHAoYfBBwoELVqUzc9n8DTfFvtt7CodYq78wzir
CONTRACT_DEPLOYMENT_NETWORK=${SOLANA_CLUSTER}

# Local Development Flags
ENABLE_MOCK_SERVICES=false
SKIP_BLOCKCHAIN_VALIDATION=false
ENABLE_TEST_ROUTES=true
EOF

    print_status "Backend .env.local created successfully"
}

# Function to validate setup
validate_setup() {
    print_info "Validating setup..."
    
    local errors=0
    
    # Check if files exist
    if [ ! -f ".env.local" ]; then
        print_error "Frontend .env.local not found"
        ((errors++))
    fi
    
    if [ ! -f "backend/.env.local" ]; then
        print_error "Backend .env.local not found"
        ((errors++))
    fi
    
    # Check if files are in .gitignore
    if ! grep -q ".env.local" .gitignore; then
        print_warning ".env.local not found in .gitignore"
    fi
    
    if [ $errors -eq 0 ]; then
        print_status "Setup validation passed"
        return 0
    else
        print_error "Setup validation failed with $errors errors"
        return 1
    fi
}

# Main function
main() {
    echo "🔧 SecureContract Pro Local Environment Setup"
    echo "============================================="
    
    print_info "This script will help you set up .env.local files for development"
    print_warning "These files will contain actual values and will NOT be committed to git"
    
    echo ""
    read -p "Do you want to continue? (y/N): " continue_setup
    if [ "$continue_setup" != "y" ] && [ "$continue_setup" != "Y" ]; then
        print_info "Setup cancelled"
        exit 0
    fi
    
    echo ""
    
    # Setup frontend environment
    setup_frontend_env
    
    echo ""
    
    # Setup backend environment
    setup_backend_env
    
    echo ""
    
    # Validate setup
    validate_setup
    
    echo ""
    print_status "Local environment setup complete!"
    echo ""
    print_info "Next steps:"
    echo "1. Review and update the .env.local files with your specific values"
    echo "2. Update the Resend API key in backend/.env.local"
    echo "3. Generate and update the Solana platform fee recipient keypair"
    echo "4. Run 'npm install' to install dependencies"
    echo "5. Run 'npm run dev' to start the development servers"
    echo ""
    print_warning "Remember: .env.local files are ignored by git and contain sensitive information"
}

# Run main function
main "$@"
