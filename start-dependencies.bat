@echo off
echo Starting Digital Contract Platform Dependencies
echo ============================================

REM Check if Docker is installed and running
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not installed or not in PATH
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if Docker is running
docker info >nul 2>&1
if %errorlevel% neq 0 (
    echo Error: Docker is not running
    echo Please start Docker Desktop and try again
    pause
    exit /b 1
)

echo Docker is available and running
echo.

REM Start the dependencies
echo Starting dependencies with Docker Compose...
docker-compose -f docker-compose.dev.yml up -d

if %errorlevel% neq 0 (
    echo Error: Failed to start dependencies
    pause
    exit /b 1
)

echo.
echo ============================================
echo Dependencies are starting...
echo.
echo Services:
echo - MongoDB:        http://localhost:27017
echo - MongoDB Admin:  http://localhost:8081 (admin/admin123)
echo - Redis:          http://localhost:6379
echo - Redis Admin:    http://localhost:8082
echo - IPFS API:       http://localhost:5001
echo - IPFS Gateway:   http://localhost:8080
echo.
echo Waiting for services to be ready...
timeout /t 10 /nobreak >nul

REM Check service health
echo Checking service health...
docker-compose -f docker-compose.dev.yml ps

echo.
echo Dependencies are ready!
echo You can now start the backend and frontend servers.
echo.
echo To stop dependencies: docker-compose -f docker-compose.dev.yml down
echo To view logs: docker-compose -f docker-compose.dev.yml logs -f
echo.
pause
