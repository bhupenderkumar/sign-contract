#!/bin/bash

echo "Building Solana Contract for Digital Contract Platform"
echo "===================================================="

# Check if Rust is installed
if ! command -v rustc &> /dev/null; then
    echo "Warning: Rust is not installed"
    echo "The Solana contract will use a mock IDL for development"
    echo "To build the actual contract, install Rust from https://rustup.rs/"
    echo
    skip_build=true
fi

# Check if Solana CLI is installed
if ! command -v solana &> /dev/null; then
    echo "Warning: Solana CLI is not installed"
    echo "The Solana contract will use a mock IDL for development"
    echo "To build the actual contract, install Solana CLI from https://docs.solana.com/cli/install-solana-cli-tools"
    echo
    skip_build=true
fi

# Check if Anchor is installed
if ! command -v anchor &> /dev/null; then
    echo "Warning: Anchor is not installed"
    echo "The Solana contract will use a mock IDL for development"
    echo "To build the actual contract, install Anchor from https://www.anchor-lang.com/docs/installation"
    echo
    skip_build=true
fi

if [ "$skip_build" = true ]; then
    echo
    echo "===================================================="
    echo "Solana Contract Build Skipped"
    echo "===================================================="
    echo
    echo "The backend is configured to work without a built contract"
    echo "using a mock IDL for development purposes."
    echo
    echo "To enable full Solana functionality:"
    echo "1. Install Rust: https://rustup.rs/"
    echo "2. Install Solana CLI: https://docs.solana.com/cli/install-solana-cli-tools"
    echo "3. Install Anchor: https://www.anchor-lang.com/docs/installation"
    echo "4. Run this script again"
    echo
else
    echo "All required tools are available"
    echo

    # Navigate to Solana contract directory
    cd solana-contract

    # Build the contract
    echo "Building Solana contract..."
    anchor build

    if [ $? -ne 0 ]; then
        echo "Error: Failed to build Solana contract"
        echo "The backend will use a mock IDL for development"
        cd ..
    else
        echo "Solana contract built successfully!"
        echo

        # Copy IDL to backend
        echo "Copying IDL to backend..."
        cp target/idl/digital_contract.json ../backend/idl/digital_contract.json

        if [ $? -ne 0 ]; then
            echo "Warning: Failed to copy IDL file"
            echo "The backend will use a mock IDL for development"
        fi

        cd ..
    fi
fi

echo "===================================================="
echo "Setup Complete!"
echo "===================================================="
echo
echo "You can now start the development servers:"
echo "- Backend: cd backend && npm start"
echo "- Frontend: npm run dev"
echo
echo "Or use the automated scripts:"
echo "- Windows: start-dev.bat"
echo "- Linux: ./start-dev.sh"
echo
