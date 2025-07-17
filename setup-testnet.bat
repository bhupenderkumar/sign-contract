@echo off
echo ========================================
echo   Testnet Environment Setup
echo ========================================
echo.

REM Copy testnet environment file
echo 📋 Setting up testnet environment...
copy .env.testnet .env

echo 🔧 Installing dependencies...
call npm install

echo 🔧 Installing backend dependencies...
cd backend
call npm install
cd ..

echo ✅ Environment setup complete!
echo.
echo 📍 Program ID: 7ow2v1f2EFNWQAVwn6aXih3kuXBP5FAX9ni48Uqva1LK
echo 🌐 Network: Testnet
echo 🔗 RPC: https://api.testnet.solana.com
echo.
echo Next steps:
echo 1. Run: deploy-testnet.bat (to deploy contract)
echo 2. Run: start-dev.bat (to start the application)
echo.
pause
