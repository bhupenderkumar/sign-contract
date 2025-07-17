@echo off
echo ========================================
echo   Solana Contract Testnet Deployment
echo ========================================
echo.

REM Set environment variables
set PATH=C:\Users\Bhupender.Kumar\.local\share\solana\install\active_release\bin;C:\Users\Bhupender.Kumar\.avm\bin;%PATH%

REM Navigate to contract directory
cd solana-contract\digital_contract

echo 🔧 Setting up Solana for testnet...
solana config set --url testnet

echo 💰 Checking balance...
solana balance

echo.
echo ⚠️  If balance is low, run: solana airdrop 2
echo.

echo 🔨 Building contract...
cargo build-sbf

if %errorlevel% neq 0 (
    echo ❌ Build failed!
    pause
    exit /b 1
)

echo 📋 Program ID: 7ow2v1f2EFNWQAVwn6aXih3kuXBP5FAX9ni48Uqva1LK

echo 🚀 Deploying to testnet...
solana program deploy target/deploy/digital_contract.so --program-id target/deploy/digital_contract-keypair.json

if %errorlevel% neq 0 (
    echo ❌ Deployment failed! You may need more SOL.
    echo Run: solana airdrop 2
    pause
    exit /b 1
)

echo ✅ Deployment successful!
echo.
echo 📍 Program ID: 7ow2v1f2EFNWQAVwn6aXih3kuXBP5FAX9ni48Uqva1LK
echo 🌐 Network: Testnet
echo 🔗 Explorer: https://explorer.solana.com/address/7ow2v1f2EFNWQAVwn6aXih3kuXBP5FAX9ni48Uqva1LK?cluster=testnet

echo.
echo 🧪 Verifying deployment...
solana program show 7ow2v1f2EFNWQAVwn6aXih3kuXBP5FAX9ni48Uqva1LK

echo.
echo ✅ Testnet deployment complete!
echo.
echo Next steps:
echo 1. Update your frontend environment to use testnet
echo 2. Test contract creation and signing
echo 3. Verify transactions on Solana Explorer
echo.
pause
