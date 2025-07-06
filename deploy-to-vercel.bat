@echo off
setlocal enabledelayedexpansion

REM Deploy SecureContract Pro to Vercel
REM This script helps you deploy both frontend and backend to Vercel

echo 🚀 Starting Vercel deployment for SecureContract Pro...

REM Check if Vercel CLI is installed
where vercel >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Vercel CLI is not installed. Installing now...
    npm install -g vercel
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to install Vercel CLI
        pause
        exit /b 1
    )
    echo [SUCCESS] Vercel CLI installed successfully
)

REM Check if user is logged in to Vercel
echo [INFO] Checking Vercel authentication...
vercel whoami >nul 2>nul
if %errorlevel% neq 0 (
    echo [WARNING] You are not logged in to Vercel. Please log in...
    vercel login
    if %errorlevel% neq 0 (
        echo [ERROR] Failed to log in to Vercel
        pause
        exit /b 1
    )
)

REM Verify project structure
echo [INFO] Verifying project structure...

set "files=package.json vercel.json api\index.js api\package.json src\main.tsx backend\server.js"

for %%f in (%files%) do (
    if not exist "%%f" (
        echo [ERROR] Required file missing: %%f
        pause
        exit /b 1
    )
)

echo [SUCCESS] Project structure verified

REM Check environment variables
echo [INFO] Checking environment variables...
echo [WARNING] Make sure you have set these environment variables in Vercel:
echo   - MONGODB_URI
echo   - JWT_SECRET
echo   - RESEND_API_KEY
echo   - SOLANA_NETWORK
echo   - PLATFORM_FEE_RECIPIENT_PRIVATE_KEY
echo.

set /p "continue=Have you set all required environment variables in Vercel? (y/n): "
if /i not "%continue%"=="y" (
    echo [ERROR] Please set the environment variables in Vercel dashboard first
    echo [INFO] Visit: https://vercel.com/dashboard
    pause
    exit /b 1
)

REM Build the project locally to check for errors
echo [INFO] Building project locally to check for errors...
call npm run build:frontend

if %errorlevel% neq 0 (
    echo [ERROR] Frontend build failed. Please fix the errors before deploying.
    pause
    exit /b 1
)

echo [SUCCESS] Local build successful

REM Deploy to Vercel
echo [INFO] Deploying to Vercel...

if not exist ".vercel\project.json" (
    echo [INFO] First time deployment detected. Setting up project...
    vercel --prod
) else (
    echo [INFO] Deploying to existing project...
    vercel --prod
)

if %errorlevel% equ 0 (
    echo [SUCCESS] Deployment successful! 🎉
    echo.
    echo [SUCCESS] Deployment completed successfully!
    echo.
    echo Next steps:
    echo 1. Test your application thoroughly
    echo 2. Set up custom domain (optional)
    echo 3. Configure monitoring and alerts
    echo 4. Update CORS_ORIGIN if using custom domain
    echo.
) else (
    echo [ERROR] Deployment failed. Please check the error messages above.
    pause
    exit /b 1
)

pause
