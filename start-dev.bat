@echo off
echo Starting Digital Contract Platform - Development Mode
echo =====================================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Node.js is not installed or not in PATH
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: npm is not installed or not in PATH
    pause
    exit /b 1
)

echo Node.js and npm are available
echo.

REM Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing frontend dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install frontend dependencies
        pause
        exit /b 1
    )
)

if not exist "backend\node_modules" (
    echo Installing backend dependencies...
    cd backend
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install backend dependencies
        pause
        exit /b 1
    )
    cd ..
)

echo.
echo Dependencies are ready
echo.

REM Check if environment files exist
if not exist ".env.local" (
    echo Warning: .env.local file not found in root directory
    echo Creating from template...
    copy ".env.example" ".env.local" >nul 2>&1
)

if not exist "backend\.env.local" (
    echo Warning: backend\.env.local file not found
    echo Creating from template...
    copy "backend\.env.local.example" "backend\.env.local" >nul 2>&1
)

echo Environment files are ready
echo.

REM Start the applications
echo Starting backend server...
start "Backend Server" cmd /k "cd backend && npm run dev"

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

echo Starting frontend development server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo =====================================================
echo Digital Contract Platform is starting...
echo.
echo Backend:  http://localhost:3001
echo Frontend: http://localhost:5173
echo.
echo Press any key to close this window...
pause >nul
