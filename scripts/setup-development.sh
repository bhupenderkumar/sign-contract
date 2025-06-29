#!/bin/bash

# Development Environment Setup Script
# This script sets up the complete development environment

set -e

echo "🚀 Setting up Digital Contract Development Environment..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18 or higher is required. Current version: $(node -v)"
    exit 1
fi

# Create environment files
echo "📝 Creating environment files..."
if [ ! -f .env ]; then
    cp .env.example .env
    echo "✅ Created .env file from template"
fi

if [ ! -f backend/.env ]; then
    cp .env.example backend/.env
    echo "✅ Created backend/.env file from template"
fi

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
npm install

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Make scripts executable
echo "🔧 Making scripts executable..."
chmod +x scripts/*.sh

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d mongodb redis ipfs

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check if services are running
echo "🔍 Checking service status..."
docker-compose ps

# Install Solana CLI if not present
if ! command -v solana &> /dev/null; then
    echo "📥 Installing Solana CLI..."
    sh -c "$(curl -sSfL https://release.solana.com/v1.16.0/install)"
    export PATH="$HOME/.local/share/solana/install/active_release/bin:$PATH"
fi

# Install Anchor CLI if not present
if ! command -v anchor &> /dev/null; then
    echo "📥 Installing Anchor CLI..."
    if command -v cargo &> /dev/null; then
        cargo install --git https://github.com/coral-xyz/anchor avm --locked --force
        avm install latest
        avm use latest
    else
        echo "⚠️  Rust/Cargo not found. Please install Rust first to use Anchor CLI."
        echo "   Visit: https://rustup.rs/"
    fi
fi

# Generate Solana keypair if it doesn't exist
if [ ! -f ~/.config/solana/id.json ]; then
    echo "🔑 Generating Solana keypair..."
    solana-keygen new --no-bip39-passphrase
fi

# Set Solana to devnet
echo "🔧 Configuring Solana for devnet..."
solana config set --url https://api.devnet.solana.com

# Request airdrop
echo "💸 Requesting SOL airdrop for development..."
solana airdrop 2 || echo "⚠️  Airdrop failed, you may need to request manually"

# Build and deploy smart contract
echo "🔨 Building and deploying smart contract..."
if [ -d "solana-contract/digital_contract" ]; then
    cd solana-contract/digital_contract
    
    # Install dependencies
    npm install
    
    # Build the contract
    anchor build || echo "⚠️  Contract build failed, please check Anchor installation"
    
    cd ../..
fi

# Start backend in development mode
echo "🚀 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait for backend to start
sleep 5

# Test backend health
echo "🔍 Testing backend health..."
curl -f http://localhost:3001/api/health || echo "⚠️  Backend health check failed"

# Start frontend in development mode
echo "🚀 Starting frontend server..."
npm run dev &
FRONTEND_PID=$!

echo "✅ Development environment setup complete!"
echo ""
echo "🌐 Services running:"
echo "   Frontend: http://localhost:5173"
echo "   Backend:  http://localhost:3001"
echo "   MongoDB:  mongodb://localhost:27017"
echo "   Redis:    redis://localhost:6379"
echo "   IPFS:     http://localhost:5001"
echo ""
echo "📋 Next steps:"
echo "   1. Open http://localhost:5173 in your browser"
echo "   2. Connect your Solana wallet (Phantom recommended)"
echo "   3. Create and sign digital contracts"
echo ""
echo "🛑 To stop all services:"
echo "   docker-compose down"
echo "   kill $BACKEND_PID $FRONTEND_PID"
echo ""
echo "📚 Documentation: README.md"

# Keep script running to show logs
wait
