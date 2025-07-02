#!/bin/bash

echo "Starting Digital Contract Platform Dependencies"
echo "============================================"

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Error: Docker is not installed"
    echo "Please install Docker from https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is available
if ! command -v docker-compose &> /dev/null && ! docker compose version &> /dev/null; then
    echo "Error: Docker Compose is not available"
    echo "Please install Docker Compose"
    exit 1
fi

# Check if Docker is running
if ! docker info &> /dev/null; then
    echo "Error: Docker is not running"
    echo "Please start Docker and try again"
    exit 1
fi

echo "Docker is available and running"
echo

# Determine which docker-compose command to use
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE="docker-compose"
else
    DOCKER_COMPOSE="docker compose"
fi

# Start the dependencies
echo "Starting dependencies with Docker Compose..."
$DOCKER_COMPOSE -f docker-compose.dev.yml up -d

if [ $? -ne 0 ]; then
    echo "Error: Failed to start dependencies"
    exit 1
fi

echo
echo "============================================"
echo "Dependencies are starting..."
echo
echo "Services:"
echo "- MongoDB:        http://localhost:27017"
echo "- MongoDB Admin:  http://localhost:8081 (admin/admin123)"
echo "- Redis:          http://localhost:6379"
echo "- Redis Admin:    http://localhost:8082"
echo "- IPFS API:       http://localhost:5001"
echo "- IPFS Gateway:   http://localhost:8080"
echo
echo "Waiting for services to be ready..."
sleep 10

# Check service health
echo "Checking service health..."
$DOCKER_COMPOSE -f docker-compose.dev.yml ps

echo
echo "Dependencies are ready!"
echo "You can now start the backend and frontend servers."
echo
echo "To stop dependencies: $DOCKER_COMPOSE -f docker-compose.dev.yml down"
echo "To view logs: $DOCKER_COMPOSE -f docker-compose.dev.yml logs -f"
echo
