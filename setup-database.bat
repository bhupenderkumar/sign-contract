@echo off
echo ========================================
echo Digital Contract Database Setup
echo ========================================
echo.

echo Checking if MongoDB is already installed...
where mongod >nul 2>&1
if %errorlevel% == 0 (
    echo MongoDB is already installed!
    echo Starting MongoDB service...
    net start MongoDB
    if %errorlevel% == 0 (
        echo MongoDB service started successfully!
        echo You can now run your backend server.
        pause
        exit /b 0
    ) else (
        echo Failed to start MongoDB service. Trying manual start...
        mongod --dbpath "C:\data\db" --logpath "C:\data\log\mongod.log" --install --serviceName "MongoDB"
        net start MongoDB
    )
) else (
    echo MongoDB is not installed.
    echo.
    echo Options:
    echo 1. Download and install MongoDB Community Server
    echo 2. Use MongoDB Atlas (cloud database)
    echo 3. Use alternative database setup
    echo.
    set /p choice="Enter your choice (1-3): "
    
    if "%choice%"=="1" (
        echo Opening MongoDB download page...
        start https://www.mongodb.com/try/download/community
        echo.
        echo Please download and install MongoDB Community Server.
        echo Make sure to:
        echo - Choose "Complete" installation
        echo - Check "Install MongoDB as a Service"
        echo - Check "Install MongoDB Compass"
        echo.
        echo After installation, run this script again.
        pause
    ) else if "%choice%"=="2" (
        echo Opening MongoDB Atlas...
        start https://www.mongodb.com/atlas
        echo.
        echo Please:
        echo 1. Create a free MongoDB Atlas account
        echo 2. Create a new cluster (free tier)
        echo 3. Get your connection string
        echo 4. Update the MONGO_URI in backend/.env file
        echo.
        pause
    ) else if "%choice%"=="3" (
        echo Setting up alternative database configuration...
        echo Creating in-memory database fallback...
        
        echo Creating database fallback configuration...
        echo module.exports = { > backend\config\database-fallback.js
        echo   useInMemoryDB: true, >> backend\config\database-fallback.js
        echo   mongoUri: 'mongodb://localhost:27017/digital_contracts_fallback' >> backend\config\database-fallback.js
        echo }; >> backend\config\database-fallback.js
        
        echo Alternative database setup complete!
        echo Your app will use a fallback configuration.
        pause
    ) else (
        echo Invalid choice. Please run the script again.
        pause
    )
)

echo.
echo Setup complete! You can now start your backend server.
pause
