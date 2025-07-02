@echo off
echo Building Solana Contract for Digital Contract Platform
echo ====================================================

REM Check if Rust is installed
rustc --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Warning: Rust is not installed
    echo The Solana contract will use a mock IDL for development
    echo To build the actual contract, install Rust from https://rustup.rs/
    echo.
    goto :skip_build
)

REM Check if Solana CLI is installed
solana --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Warning: Solana CLI is not installed
    echo The Solana contract will use a mock IDL for development
    echo To build the actual contract, install Solana CLI from https://docs.solana.com/cli/install-solana-cli-tools
    echo.
    goto :skip_build
)

REM Check if Anchor is installed
anchor --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Warning: Anchor is not installed
    echo The Solana contract will use a mock IDL for development
    echo To build the actual contract, install Anchor from https://www.anchor-lang.com/docs/installation
    echo.
    goto :skip_build
)

echo All required tools are available
echo.

REM Navigate to Solana contract directory
cd solana-contract

REM Build the contract
echo Building Solana contract...
anchor build

if %errorlevel% neq 0 (
    echo Error: Failed to build Solana contract
    echo The backend will use a mock IDL for development
    cd ..
    goto :skip_build
)

echo Solana contract built successfully!
echo.

REM Copy IDL to backend
echo Copying IDL to backend...
copy target\idl\digital_contract.json ..\backend\idl\digital_contract.json

if %errorlevel% neq 0 (
    echo Warning: Failed to copy IDL file
    echo The backend will use a mock IDL for development
)

cd ..
goto :end

:skip_build
echo.
echo ====================================================
echo Solana Contract Build Skipped
echo ====================================================
echo.
echo The backend is configured to work without a built contract
echo using a mock IDL for development purposes.
echo.
echo To enable full Solana functionality:
echo 1. Install Rust: https://rustup.rs/
echo 2. Install Solana CLI: https://docs.solana.com/cli/install-solana-cli-tools
echo 3. Install Anchor: https://www.anchor-lang.com/docs/installation
echo 4. Run this script again
echo.

:end
echo ====================================================
echo Setup Complete!
echo ====================================================
echo.
echo You can now start the development servers:
echo - Backend: cd backend && npm start
echo - Frontend: npm run dev
echo.
echo Or use the automated scripts:
echo - Windows: start-dev.bat
echo - Linux: ./start-dev.sh
echo.
pause
