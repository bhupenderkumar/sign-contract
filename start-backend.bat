@echo off
echo ========================================
echo Digital Contract Backend Startup
echo ========================================
echo.

cd backend

echo Checking MongoDB connection...
node test-mongodb.js
if %errorlevel% == 0 (
    echo.
    echo ✅ MongoDB is working! Starting backend server...
    npm run dev
) else (
    echo.
    echo ❌ MongoDB connection failed!
    echo.
    echo Choose an option:
    echo 1. Install MongoDB locally (recommended for development)
    echo 2. Use MongoDB Atlas (cloud database - easiest)
    echo 3. Continue with memory database (data will be lost on restart)
    echo 4. Exit and fix MongoDB manually
    echo.
    set /p choice="Enter your choice (1-4): "
    
    if "%choice%"=="1" (
        echo.
        echo Opening MongoDB download page...
        start https://www.mongodb.com/try/download/community
        echo.
        echo Please:
        echo 1. Download MongoDB Community Server
        echo 2. Install with "Complete" option
        echo 3. Check "Install MongoDB as a Service"
        echo 4. Check "Install MongoDB Compass"
        echo 5. Run this script again after installation
        echo.
        pause
    ) else if "%choice%"=="2" (
        echo.
        echo Opening MongoDB Atlas...
        start https://www.mongodb.com/atlas
        echo.
        echo Please:
        echo 1. Create a free MongoDB Atlas account
        echo 2. Create a new cluster (free M0 tier)
        echo 3. Create a database user
        echo 4. Get your connection string
        echo 5. Update MONGO_URI in backend/.env file
        echo 6. Run this script again
        echo.
        echo Example connection string:
        echo MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/digital_contracts
        echo.
        pause
    ) else if "%choice%"=="3" (
        echo.
        echo ⚠️ Starting with memory database fallback...
        echo ⚠️ All data will be lost when server restarts!
        echo.
        set MEMORY_DB_MODE=true
        npm run dev
    ) else (
        echo.
        echo Exiting... Please fix MongoDB connection and try again.
        echo.
        echo Quick fixes:
        echo - Check if MongoDB service is running: net start MongoDB
        echo - Install MongoDB: https://www.mongodb.com/try/download/community
        echo - Use MongoDB Atlas: https://www.mongodb.com/atlas
        echo.
        pause
    )
)

pause
