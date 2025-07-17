@echo off
echo ========================================
echo   Program ID Verification Script
echo ========================================
echo.

set PROGRAM_ID=7ow2v1f2EFNWQAVwn6aXih3kuXBP5FAX9ni48Uqva1LK

echo 🔍 Verifying Program ID Configuration...
echo.
echo 📍 Expected Program ID: %PROGRAM_ID%
echo.

echo 🔧 Backend Configuration:
echo ----------------------------------------
findstr /C:"7ow2v1f2EFNWQAVwn6aXih3kuXBP5FAX9ni48Uqva1LK" backend\server.js
if %errorlevel% equ 0 (
    echo ✅ Backend server.js - UPDATED
) else (
    echo ❌ Backend server.js - NOT FOUND
)

echo.
echo 🌐 Frontend Configuration:
echo ----------------------------------------
findstr /C:"7ow2v1f2EFNWQAVwn6aXih3kuXBP5FAX9ni48Uqva1LK" src\config\solana.ts
if %errorlevel% equ 0 (
    echo ✅ Frontend solana.ts - UPDATED
) else (
    echo ❌ Frontend solana.ts - NOT FOUND
)

echo.
echo 📋 Environment Files:
echo ----------------------------------------
findstr /C:"VITE_PROGRAM_ID=7ow2v1f2EFNWQAVwn6aXih3kuXBP5FAX9ni48Uqva1LK" .env
if %errorlevel% equ 0 (
    echo ✅ .env - UPDATED
) else (
    echo ❌ .env - NOT FOUND
)

findstr /C:"VITE_PROGRAM_ID=7ow2v1f2EFNWQAVwn6aXih3kuXBP5FAX9ni48Uqva1LK" .env.devnet
if %errorlevel% equ 0 (
    echo ✅ .env.devnet - UPDATED
) else (
    echo ❌ .env.devnet - NOT FOUND
)

echo.
echo 🔗 Solana Contract Configuration:
echo ----------------------------------------
findstr /C:"7ow2v1f2EFNWQAVwn6aXih3kuXBP5FAX9ni48Uqva1LK" solana-contract\digital_contract\Anchor.toml
if %errorlevel% equ 0 (
    echo ✅ Anchor.toml - UPDATED
) else (
    echo ❌ Anchor.toml - NOT FOUND
)

findstr /C:"7ow2v1f2EFNWQAVwn6aXih3kuXBP5FAX9ni48Uqva1LK" solana-contract\digital_contract\programs\digital_contract\src\lib.rs
if %errorlevel% equ 0 (
    echo ✅ lib.rs - UPDATED
) else (
    echo ❌ lib.rs - NOT FOUND
)

echo.
echo 🐳 Docker Configuration:
echo ----------------------------------------
findstr /C:"VITE_PROGRAM_ID=7ow2v1f2EFNWQAVwn6aXih3kuXBP5FAX9ni48Uqva1LK" docker-compose.yml
if %errorlevel% equ 0 (
    echo ✅ docker-compose.yml - UPDATED
) else (
    echo ❌ docker-compose.yml - NOT FOUND
)

echo.
echo 🔍 Deployment Verification:
echo ----------------------------------------
echo 📍 Program ID: %PROGRAM_ID%
echo 🌐 Network: Devnet
echo 🔗 Explorer: https://explorer.solana.com/address/%PROGRAM_ID%?cluster=devnet
echo 💰 Platform Fee Recipient: BcSXav3jcBKRbN6woZsqPMJGYrS2MXwVEdtUx1ZzD9Xo

echo.
echo ✅ Program ID verification complete!
echo.
echo 📋 Next Steps:
echo 1. Run: start-dev.bat (to start the application)
echo 2. Test contract creation with the new program ID
echo 3. Verify transactions on Solana Explorer
echo.
pause
