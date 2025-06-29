#!/bin/bash

# Deploy Solana Smart Contract to Devnet
# This script builds and deploys the digital contract program

set -e

echo "🚀 Starting Solana Smart Contract Deployment..."

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "❌ Solana CLI is not installed. Please install it first:"
    echo "sh -c \"\$(curl -sSfL https://release.solana.com/v1.16.0/install)\""
    exit 1
fi

# Check if Anchor CLI is installed
if ! command -v anchor &> /dev/null; then
    echo "❌ Anchor CLI is not installed. Please install it first:"
    echo "cargo install --git https://github.com/coral-xyz/anchor avm --locked --force"
    exit 1
fi

# Set Solana cluster to devnet
echo "🔧 Setting Solana cluster to devnet..."
solana config set --url https://api.devnet.solana.com

# Check wallet balance
echo "💰 Checking wallet balance..."
BALANCE=$(solana balance)
echo "Current balance: $BALANCE"

# Request airdrop if balance is low
if [[ "$BALANCE" == "0 SOL" ]]; then
    echo "💸 Requesting airdrop..."
    solana airdrop 2
    sleep 5
fi

# Navigate to contract directory
cd solana-contract/digital_contract

# Build the program
echo "🔨 Building the smart contract..."
anchor build

# Generate program keypair if it doesn't exist
if [ ! -f "target/deploy/digital_contract-keypair.json" ]; then
    echo "🔑 Generating program keypair..."
    solana-keygen new --outfile target/deploy/digital_contract-keypair.json --no-bip39-passphrase
fi

# Get program ID
PROGRAM_ID=$(solana-keygen pubkey target/deploy/digital_contract-keypair.json)
echo "📋 Program ID: $PROGRAM_ID"

# Update program ID in lib.rs and Anchor.toml
echo "📝 Updating program ID in source files..."
sed -i "s/declare_id!(\".*\")/declare_id!(\"$PROGRAM_ID\")/" programs/digital_contract/src/lib.rs
sed -i "s/digital_contract = \".*\"/digital_contract = \"$PROGRAM_ID\"/" Anchor.toml

# Rebuild with correct program ID
echo "🔨 Rebuilding with correct program ID..."
anchor build

# Deploy the program
echo "🚀 Deploying to devnet..."
anchor deploy --provider.cluster devnet

# Verify deployment
echo "✅ Verifying deployment..."
solana program show $PROGRAM_ID

# Run tests
echo "🧪 Running tests..."
anchor test --skip-local-validator

echo "🎉 Deployment completed successfully!"
echo "📋 Program ID: $PROGRAM_ID"
echo "🌐 Explorer: https://explorer.solana.com/address/$PROGRAM_ID?cluster=devnet"

# Save program ID to environment file
echo "💾 Saving program ID to environment..."
cd ../../
echo "VITE_SOLANA_PROGRAM_ID=$PROGRAM_ID" >> .env.local
echo "SOLANA_PROGRAM_ID=$PROGRAM_ID" >> backend/.env.local

echo "✨ All done! Your smart contract is now live on Solana devnet."
