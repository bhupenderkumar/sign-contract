#!/bin/bash

echo "Starting Digital Contract Platform - Development Mode"
echo "====================================================="

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "Error: Node.js is not installed"
    echo "Please install Node.js from https://nodejs.org/"
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "Error: npm is not installed"
    exit 1
fi

echo "Node.js version: $(node --version)"
echo "npm version: $(npm --version)"
echo

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install frontend dependencies"
        exit 1
    fi
fi

if [ ! -d "backend/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd backend
    npm install
    if [ $? -ne 0 ]; then
        echo "Error: Failed to install backend dependencies"
        exit 1
    fi
    cd ..
fi

echo
echo "Dependencies are ready"
echo

# Check if environment files exist
if [ ! -f ".env.local" ]; then
    echo "Warning: .env.local file not found in root directory"
    echo "Creating from template..."
    cp ".env.example" ".env.local" 2>/dev/null || echo "Template not found, please create .env.local manually"
fi

if [ ! -f "backend/.env.local" ]; then
    echo "Warning: backend/.env.local file not found"
    echo "Creating from template..."
    cp "backend/.env.local.example" "backend/.env.local" 2>/dev/null || echo "Template not found, please create backend/.env.local manually"
fi

echo "Environment files are ready"
echo

# Function to start backend
start_backend() {
    echo "Starting backend server..."
    cd backend
    npm run dev &
    BACKEND_PID=$!
    cd ..
    echo "Backend started with PID: $BACKEND_PID"
}

# Function to start frontend
start_frontend() {
    echo "Starting frontend development server..."
    npm run dev &
    FRONTEND_PID=$!
    echo "Frontend started with PID: $FRONTEND_PID"
}

# Function to cleanup on exit
cleanup() {
    echo
    echo "Shutting down servers..."
    if [ ! -z "$BACKEND_PID" ]; then
        kill $BACKEND_PID 2>/dev/null
        echo "Backend server stopped"
    fi
    if [ ! -z "$FRONTEND_PID" ]; then
        kill $FRONTEND_PID 2>/dev/null
        echo "Frontend server stopped"
    fi
    exit 0
}

# Set up signal handlers
trap cleanup SIGINT SIGTERM

# Start the applications
start_backend
sleep 3  # Wait for backend to start
start_frontend

echo
echo "====================================================="
echo "Digital Contract Platform is running..."
echo
echo "Backend:  http://localhost:3001"
echo "Frontend: http://localhost:5173"
echo
echo "Press Ctrl+C to stop all servers"
echo "====================================================="

# Wait for user to stop
wait
