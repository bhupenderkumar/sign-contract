#!/bin/bash

# Digital Contract Platform - Production Build Script
# This script builds the application for production deployment

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BUILD_DIR="build"
DIST_DIR="dist"
BACKEND_DIR="backend"
FRONTEND_DIR="."

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

# Function to clean previous builds
clean_builds() {
    print_status "Cleaning previous builds..."
    
    # Clean frontend build
    if [ -d "$DIST_DIR" ]; then
        rm -rf "$DIST_DIR"
        print_status "Removed frontend dist directory"
    fi
    
    # Clean backend build artifacts
    if [ -d "$BACKEND_DIR/node_modules/.cache" ]; then
        rm -rf "$BACKEND_DIR/node_modules/.cache"
        print_status "Removed backend cache"
    fi
    
    print_success "Build cleanup completed"
}

# Function to install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    
    # Install frontend dependencies
    print_status "Installing frontend dependencies..."
    npm ci --production=false
    
    # Install backend dependencies
    print_status "Installing backend dependencies..."
    cd "$BACKEND_DIR"
    npm ci --production=false
    cd ..
    
    print_success "Dependencies installed successfully"
}

# Function to run tests
run_tests() {
    print_status "Running tests..."
    
    # Run frontend tests
    print_status "Running frontend tests..."
    npm test -- --watchAll=false --coverage --passWithNoTests
    
    # Run backend tests
    print_status "Running backend tests..."
    cd "$BACKEND_DIR"
    npm test -- --passWithNoTests
    cd ..
    
    print_success "All tests passed"
}

# Function to run linting
run_linting() {
    print_status "Running linting..."
    
    # Lint frontend
    print_status "Linting frontend..."
    npm run lint
    
    # Lint backend
    print_status "Linting backend..."
    cd "$BACKEND_DIR"
    if npm run | grep -q "lint"; then
        npm run lint
    else
        print_warning "Backend linting script not found, skipping..."
    fi
    cd ..
    
    print_success "Linting completed"
}

# Function to build frontend
build_frontend() {
    print_status "Building frontend for production..."
    
    # Set production environment
    export NODE_ENV=production
    
    # Build the frontend
    npm run build
    
    # Verify build output
    if [ ! -d "$DIST_DIR" ]; then
        print_error "Frontend build failed - dist directory not found"
        exit 1
    fi
    
    # Check if essential files exist
    if [ ! -f "$DIST_DIR/index.html" ]; then
        print_error "Frontend build failed - index.html not found"
        exit 1
    fi
    
    print_success "Frontend build completed successfully"
}

# Function to prepare backend
prepare_backend() {
    print_status "Preparing backend for production..."
    
    cd "$BACKEND_DIR"
    
    # Install only production dependencies
    npm ci --only=production
    
    # Remove development files
    rm -rf test tests __tests__ *.test.js *.spec.js coverage .nyc_output
    
    cd ..
    
    print_success "Backend preparation completed"
}

# Function to create build artifacts
create_artifacts() {
    print_status "Creating build artifacts..."
    
    # Create build directory
    mkdir -p "$BUILD_DIR"
    
    # Copy frontend build
    cp -r "$DIST_DIR" "$BUILD_DIR/frontend"
    
    # Copy backend files
    cp -r "$BACKEND_DIR" "$BUILD_DIR/backend"
    
    # Copy Docker files
    cp Dockerfile.production "$BUILD_DIR/"
    cp "$BACKEND_DIR/Dockerfile" "$BUILD_DIR/backend/"
    
    # Copy deployment files
    if [ -d "gcloud" ]; then
        cp -r gcloud "$BUILD_DIR/"
    fi
    
    # Create version file
    echo "Build Date: $(date)" > "$BUILD_DIR/version.txt"
    echo "Git Commit: $(git rev-parse HEAD 2>/dev/null || echo 'unknown')" >> "$BUILD_DIR/version.txt"
    echo "Git Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')" >> "$BUILD_DIR/version.txt"
    
    print_success "Build artifacts created in $BUILD_DIR"
}

# Function to validate build
validate_build() {
    print_status "Validating build..."
    
    # Check frontend build
    if [ ! -f "$BUILD_DIR/frontend/index.html" ]; then
        print_error "Build validation failed - frontend index.html missing"
        exit 1
    fi
    
    # Check backend files
    if [ ! -f "$BUILD_DIR/backend/server.js" ]; then
        print_error "Build validation failed - backend server.js missing"
        exit 1
    fi
    
    if [ ! -f "$BUILD_DIR/backend/package.json" ]; then
        print_error "Build validation failed - backend package.json missing"
        exit 1
    fi
    
    # Check Docker files
    if [ ! -f "$BUILD_DIR/Dockerfile.production" ]; then
        print_error "Build validation failed - frontend Dockerfile missing"
        exit 1
    fi
    
    if [ ! -f "$BUILD_DIR/backend/Dockerfile" ]; then
        print_error "Build validation failed - backend Dockerfile missing"
        exit 1
    fi
    
    print_success "Build validation passed"
}

# Function to create build summary
create_summary() {
    print_status "Creating build summary..."
    
    SUMMARY_FILE="$BUILD_DIR/build-summary.txt"
    
    cat > "$SUMMARY_FILE" << EOF
Digital Contract Platform - Production Build Summary
===================================================

Build Date: $(date)
Build Environment: Production
Git Commit: $(git rev-parse HEAD 2>/dev/null || echo 'unknown')
Git Branch: $(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo 'unknown')

Frontend Build:
- Framework: React + Vite
- Output Directory: $BUILD_DIR/frontend
- Build Size: $(du -sh "$BUILD_DIR/frontend" | cut -f1)

Backend Build:
- Runtime: Node.js
- Output Directory: $BUILD_DIR/backend
- Build Size: $(du -sh "$BUILD_DIR/backend" | cut -f1)

Total Build Size: $(du -sh "$BUILD_DIR" | cut -f1)

Next Steps:
1. Test the build locally using Docker
2. Deploy to staging environment
3. Run integration tests
4. Deploy to production

EOF
    
    print_success "Build summary created: $SUMMARY_FILE"
}

# Main build function
main() {
    print_status "Starting production build process..."
    
    clean_builds
    install_dependencies
    run_tests
    run_linting
    build_frontend
    prepare_backend
    create_artifacts
    validate_build
    create_summary
    
    print_success "Production build completed successfully!"
    print_status "Build artifacts are available in: $BUILD_DIR"
    
    # Display build summary
    if [ -f "$BUILD_DIR/build-summary.txt" ]; then
        echo ""
        cat "$BUILD_DIR/build-summary.txt"
    fi
}

# Handle script arguments
case "${1:-}" in
    --clean-only)
        clean_builds
        exit 0
        ;;
    --no-tests)
        print_warning "Skipping tests as requested"
        main() {
            print_status "Starting production build process (no tests)..."
            clean_builds
            install_dependencies
            run_linting
            build_frontend
            prepare_backend
            create_artifacts
            validate_build
            create_summary
            print_success "Production build completed successfully!"
        }
        main
        ;;
    --help)
        echo "Usage: $0 [OPTIONS]"
        echo ""
        echo "Options:"
        echo "  --clean-only    Only clean previous builds"
        echo "  --no-tests      Skip running tests"
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
