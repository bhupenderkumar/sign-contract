#!/bin/bash

# Digital Contract Platform - Docker Build Test Script
# This script tests Docker builds locally before deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="digital-contract"
BACKEND_IMAGE="$PROJECT_NAME-backend"
FRONTEND_IMAGE="$PROJECT_NAME-frontend"
NETWORK_NAME="$PROJECT_NAME-test-network"
BACKEND_CONTAINER="$PROJECT_NAME-backend-test"
FRONTEND_CONTAINER="$PROJECT_NAME-frontend-test"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to cleanup previous test resources
cleanup() {
    print_status "Cleaning up previous test resources..."
    
    # Stop and remove containers
    docker stop $BACKEND_CONTAINER $FRONTEND_CONTAINER 2>/dev/null || true
    docker rm $BACKEND_CONTAINER $FRONTEND_CONTAINER 2>/dev/null || true
    
    # Remove test network
    docker network rm $NETWORK_NAME 2>/dev/null || true
    
    # Remove test images
    docker rmi $BACKEND_IMAGE:test $FRONTEND_IMAGE:test 2>/dev/null || true
    
    print_success "Cleanup completed"
}

# Function to build Docker images
build_images() {
    print_status "Building Docker images for testing..."
    
    # Build backend image
    print_status "Building backend image..."
    docker build -t $BACKEND_IMAGE:test ./backend
    
    # Build frontend image
    print_status "Building frontend image..."
    docker build -f Dockerfile.production -t $FRONTEND_IMAGE:test .
    
    print_success "Docker images built successfully"
}

# Function to create test network
create_network() {
    print_status "Creating test network..."
    docker network create $NETWORK_NAME
    print_success "Test network created: $NETWORK_NAME"
}

# Function to start containers
start_containers() {
    print_status "Starting test containers..."
    
    # Start backend container
    print_status "Starting backend container..."
    docker run -d \
        --name $BACKEND_CONTAINER \
        --network $NETWORK_NAME \
        -p 3001:3001 \
        -e NODE_ENV=test \
        -e PORT=3001 \
        -e SOLANA_CLUSTER=devnet \
        $BACKEND_IMAGE:test
    
    # Start frontend container
    print_status "Starting frontend container..."
    docker run -d \
        --name $FRONTEND_CONTAINER \
        --network $NETWORK_NAME \
        -p 8080:8080 \
        -e NODE_ENV=production \
        $FRONTEND_IMAGE:test
    
    print_success "Test containers started"
}

# Function to wait for services
wait_for_services() {
    print_status "Waiting for services to be ready..."
    
    # Wait for backend
    print_status "Waiting for backend service..."
    for i in {1..30}; do
        if curl -f http://localhost:3001/api/health >/dev/null 2>&1; then
            print_success "Backend service is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Backend service failed to start"
            docker logs $BACKEND_CONTAINER
            exit 1
        fi
        sleep 2
    done
    
    # Wait for frontend
    print_status "Waiting for frontend service..."
    for i in {1..30}; do
        if curl -f http://localhost:8080 >/dev/null 2>&1; then
            print_success "Frontend service is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Frontend service failed to start"
            docker logs $FRONTEND_CONTAINER
            exit 1
        fi
        sleep 2
    done
}

# Function to run health checks
run_health_checks() {
    print_status "Running health checks..."
    
    # Backend health check
    print_status "Checking backend health..."
    BACKEND_HEALTH=$(curl -s http://localhost:3001/api/health)
    if echo "$BACKEND_HEALTH" | grep -q "ok\|healthy"; then
        print_success "Backend health check passed"
    else
        print_error "Backend health check failed"
        echo "Response: $BACKEND_HEALTH"
        exit 1
    fi
    
    # Frontend health check
    print_status "Checking frontend availability..."
    FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8080)
    if [ "$FRONTEND_RESPONSE" = "200" ]; then
        print_success "Frontend health check passed"
    else
        print_error "Frontend health check failed (HTTP $FRONTEND_RESPONSE)"
        exit 1
    fi
    
    print_success "All health checks passed"
}

# Function to run integration tests
run_integration_tests() {
    print_status "Running integration tests..."
    
    # Test API endpoints
    print_status "Testing API endpoints..."
    
    # Test health endpoint
    curl -f http://localhost:3001/api/health >/dev/null
    print_success "Health endpoint test passed"
    
    # Test CORS headers
    CORS_HEADERS=$(curl -s -I -X OPTIONS http://localhost:3001/api/health | grep -i "access-control")
    if [ -n "$CORS_HEADERS" ]; then
        print_success "CORS headers test passed"
    else
        print_warning "CORS headers not found (may be expected)"
    fi
    
    # Test frontend static files
    print_status "Testing frontend static files..."
    curl -f http://localhost:8080/favicon.ico >/dev/null 2>&1 || print_warning "Favicon not found"
    
    print_success "Integration tests completed"
}

# Function to show container logs
show_logs() {
    print_status "Container logs:"
    
    echo ""
    echo "=== Backend Logs ==="
    docker logs $BACKEND_CONTAINER --tail 20
    
    echo ""
    echo "=== Frontend Logs ==="
    docker logs $FRONTEND_CONTAINER --tail 20
}

# Function to show container stats
show_stats() {
    print_status "Container statistics:"
    docker stats --no-stream $BACKEND_CONTAINER $FRONTEND_CONTAINER
}

# Function to create test report
create_test_report() {
    print_status "Creating test report..."
    
    REPORT_FILE="docker-test-report.txt"
    
    cat > "$REPORT_FILE" << EOF
Digital Contract Platform - Docker Build Test Report
===================================================

Test Date: $(date)
Test Environment: Local Docker

Backend Container:
- Image: $BACKEND_IMAGE:test
- Container: $BACKEND_CONTAINER
- Port: 3001
- Status: $(docker inspect --format='{{.State.Status}}' $BACKEND_CONTAINER)

Frontend Container:
- Image: $FRONTEND_IMAGE:test
- Container: $FRONTEND_CONTAINER
- Port: 8080
- Status: $(docker inspect --format='{{.State.Status}}' $FRONTEND_CONTAINER)

Test Results:
- Image Build: PASSED
- Container Start: PASSED
- Health Checks: PASSED
- Integration Tests: PASSED

Resource Usage:
$(docker stats --no-stream $BACKEND_CONTAINER $FRONTEND_CONTAINER)

Next Steps:
1. Review logs for any warnings
2. Test with production-like data
3. Deploy to staging environment

EOF
    
    print_success "Test report created: $REPORT_FILE"
}

# Main test function
main() {
    print_status "Starting Docker build test..."
    
    cleanup
    build_images
    create_network
    start_containers
    wait_for_services
    run_health_checks
    run_integration_tests
    show_stats
    create_test_report
    
    print_success "Docker build test completed successfully!"
    print_status "Services are running at:"
    print_status "  Frontend: http://localhost:8080"
    print_status "  Backend:  http://localhost:3001"
    print_status ""
    print_status "To stop the test environment, run: $0 --cleanup"
}

# Handle script arguments
case "${1:-}" in
    --cleanup)
        cleanup
        exit 0
        ;;
    --logs)
        show_logs
        exit 0
        ;;
    --stats)
        show_stats
        exit 0
        ;;
    --help)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --cleanup       Stop and remove test containers"
        echo "  --logs          Show container logs"
        echo "  --stats         Show container statistics"
        echo "  --help          Show this help message"
        echo ""
        exit 0
        ;;
    "")
        main
        ;;
    *)
        print_error "Unknown option: $1"
        echo "Use --help for usage information"
        exit 1
        ;;
esac
