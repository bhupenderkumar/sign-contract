@echo off
echo ========================================
echo   Devnet Environment Setup
echo ========================================
echo.

REM Copy devnet environment file
echo 📋 Setting up devnet environment...
copy .env.devnet .env

echo 🔧 Installing dependencies...
call npm install

echo 🔧 Installing backend dependencies...
cd backend
call npm install
cd ..

echo ✅ Environment setup complete!
echo.
echo 📍 Program ID: 7ow2v1f2EFNWQAVwn6aXih3kuXBP5FAX9ni48Uqva1LK
echo 🌐 Network: Devnet
echo 🔗 RPC: https://api.devnet.solana.com
echo 🔍 Explorer: https://explorer.solana.com/address/7ow2v1f2EFNWQAVwn6aXih3kuXBP5FAX9ni48Uqva1LK?cluster=devnet
echo 💰 Platform Fee Recipient: BcSXav3jcBKRbN6woZsqPMJGYrS2MXwVEdtUx1ZzD9Xo
echo.
echo ✅ Contract is already deployed to devnet!
echo.
echo Next steps:
echo 1. Run: start-dev.bat (to start the application)
echo 2. Test contract creation and signing
echo 3. Monitor transactions on Solana Explorer
echo.
pause
