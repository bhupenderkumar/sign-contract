#!/bin/bash

# Environment Setup Script for SecureContract Pro
# This script helps set up environment configurations for different networks

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

# Function to show usage
show_usage() {
    echo "Usage: $0 [environment]"
    echo ""
    echo "Environments:"
    echo "  development  - Set up for local development (devnet)"
    echo "  testnet      - Set up for testnet environment"
    echo "  production   - Set up for production (mainnet-beta)"
    echo ""
    echo "Example:"
    echo "  $0 development"
    echo "  $0 testnet"
    echo "  $0 production"
}

# Function to validate environment
validate_environment() {
    local env=$1
    case $env in
        development|testnet|production)
            return 0
            ;;
        *)
            print_error "Invalid environment: $env"
            show_usage
            exit 1
            ;;
    esac
}

# Function to setup environment files
setup_environment_files() {
    local env=$1
    
    print_info "Setting up environment files for $env..."
    
    # Copy appropriate environment file
    if [ -f ".env.$env.example" ]; then
        cp ".env.$env.example" ".env"
        print_status "Copied .env.$env.example to .env"
    else
        print_warning ".env.$env.example not found, using .env.example"
        cp ".env.example" ".env"
    fi
    
    # Copy backend environment file
    if [ -f ".env.$env.example" ]; then
        cp ".env.$env.example" "backend/.env"
        print_status "Copied .env.$env.example to backend/.env"
    else
        print_warning "Using .env.example for backend"
        cp ".env.example" "backend/.env"
    fi
}

# Function to configure Solana CLI
configure_solana_cli() {
    local env=$1
    
    print_info "Configuring Solana CLI for $env..."
    
    case $env in
        development)
            solana config set --url https://api.devnet.solana.com
            print_status "Solana CLI configured for devnet"
            ;;
        testnet)
            solana config set --url https://api.testnet.solana.com
            print_status "Solana CLI configured for testnet"
            ;;
        production)
            solana config set --url https://api.mainnet-beta.solana.com
            print_warning "Solana CLI configured for MAINNET-BETA (production)"
            print_warning "Real SOL will be used for transactions!"
            ;;
    esac
}

# Function to show network warnings
show_network_warnings() {
    local env=$1
    
    case $env in
        development)
            print_info "Development environment uses Solana devnet"
            print_info "Free SOL available via: solana airdrop 2"
            ;;
        testnet)
            print_warning "Testnet environment uses Solana testnet"
            print_info "Free SOL available via: solana airdrop 2"
            ;;
        production)
            print_error "PRODUCTION ENVIRONMENT - MAINNET-BETA"
            print_error "This uses REAL SOL for all transactions!"
            print_error "Ensure you have sufficient SOL balance"
            print_error "Double-check all configurations before deploying"
            ;;
    esac
}

# Function to validate required tools
validate_tools() {
    print_info "Validating required tools..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed"
        exit 1
    fi
    print_status "Node.js found: $(node --version)"
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed"
        exit 1
    fi
    print_status "npm found: $(npm --version)"
    
    # Check Solana CLI
    if ! command -v solana &> /dev/null; then
        print_warning "Solana CLI not found - install from https://docs.solana.com/cli/install-solana-cli-tools"
    else
        print_status "Solana CLI found: $(solana --version)"
    fi
    
    # Check Anchor (optional)
    if command -v anchor &> /dev/null; then
        print_status "Anchor found: $(anchor --version)"
    else
        print_warning "Anchor not found - needed for smart contract deployment"
    fi
}

# Function to generate secure secrets
generate_secrets() {
    local env=$1
    
    if [ "$env" != "development" ]; then
        print_info "Generating secure secrets for $env..."
        
        # Generate JWT secret
        JWT_SECRET=$(openssl rand -hex 32)
        SESSION_SECRET=$(openssl rand -hex 32)
        
        # Update .env files
        sed -i "s/your_jwt_secret_here_64_characters_minimum/$JWT_SECRET/g" .env
        sed -i "s/your_session_secret_here_64_characters_minimum/$SESSION_SECRET/g" .env
        sed -i "s/your_${env}_jwt_secret_here_64_characters_minimum/$JWT_SECRET/g" .env
        sed -i "s/your_${env}_session_secret_here_64_characters_minimum/$SESSION_SECRET/g" .env
        
        sed -i "s/your_jwt_secret_here_64_characters_minimum/$JWT_SECRET/g" backend/.env
        sed -i "s/your_session_secret_here_64_characters_minimum/$SESSION_SECRET/g" backend/.env
        sed -i "s/your_${env}_jwt_secret_here_64_characters_minimum/$JWT_SECRET/g" backend/.env
        sed -i "s/your_${env}_session_secret_here_64_characters_minimum/$SESSION_SECRET/g" backend/.env
        
        print_status "Generated secure JWT and session secrets"
    fi
}

# Main function
main() {
    echo "🚀 SecureContract Pro Environment Setup"
    echo "======================================"
    
    # Check if environment argument is provided
    if [ $# -eq 0 ]; then
        print_error "No environment specified"
        show_usage
        exit 1
    fi
    
    local environment=$1
    
    # Validate environment
    validate_environment "$environment"
    
    # Validate tools
    validate_tools
    
    # Show network warnings
    show_network_warnings "$environment"
    
    # Ask for confirmation for production
    if [ "$environment" = "production" ]; then
        echo ""
        read -p "Are you sure you want to set up PRODUCTION environment? (yes/no): " confirm
        if [ "$confirm" != "yes" ]; then
            print_info "Setup cancelled"
            exit 0
        fi
    fi
    
    # Setup environment files
    setup_environment_files "$environment"
    
    # Generate secrets for non-development environments
    generate_secrets "$environment"
    
    # Configure Solana CLI
    if command -v solana &> /dev/null; then
        configure_solana_cli "$environment"
    fi
    
    echo ""
    print_status "Environment setup complete for: $environment"
    echo ""
    print_info "Next steps:"
    echo "1. Review and update .env files with your specific values"
    echo "2. Update API keys, database URLs, and other secrets"
    echo "3. Run 'npm install' to install dependencies"
    echo "4. Run 'npm run dev' to start development server"
    
    if [ "$environment" != "development" ]; then
        echo "5. Deploy smart contracts to the appropriate network"
        echo "6. Update contract addresses in environment files"
    fi
}

# Run main function with all arguments
main "$@"
