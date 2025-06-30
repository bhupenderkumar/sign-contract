#!/bin/bash

# Environment Testing Script for SecureContract Pro
# This script tests the network environment selection and security features

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Function to test API endpoint
test_api_endpoint() {
    local endpoint=$1
    local description=$2
    
    print_info "Testing: $description"
    
    if curl -s -f "http://localhost:3001$endpoint" > /dev/null; then
        print_status "$description - OK"
        return 0
    else
        print_error "$description - FAILED"
        return 1
    fi
}

# Function to test network parameter passing
test_network_parameters() {
    local network=$1
    
    print_info "Testing network parameter: $network"
    
    # Test environment endpoint with network parameter
    local response=$(curl -s "http://localhost:3001/api/environment?network=$network" 2>/dev/null || echo "")
    
    if [ -n "$response" ]; then
        # Check if response contains the network
        if echo "$response" | grep -q "\"requestNetwork\":\"$network\""; then
            print_status "Network parameter $network - OK"
            return 0
        else
            print_warning "Network parameter $network - Response doesn't contain expected network"
            echo "Response: $response"
            return 1
        fi
    else
        print_error "Network parameter $network - No response"
        return 1
    fi
}

# Function to check environment variables
check_environment_variables() {
    print_info "Checking environment variables..."
    
    local required_vars=("VITE_API_URL" "VITE_SOLANA_CLUSTER")
    local missing_vars=()
    
    for var in "${required_vars[@]}"; do
        if [ -z "${!var}" ]; then
            missing_vars+=("$var")
        fi
    done
    
    if [ ${#missing_vars[@]} -eq 0 ]; then
        print_status "All required environment variables are set"
        return 0
    else
        print_error "Missing environment variables: ${missing_vars[*]}"
        return 1
    fi
}

# Function to test backend health
test_backend_health() {
    print_info "Testing backend health..."
    
    local response=$(curl -s "http://localhost:3001/api/health" 2>/dev/null || echo "")
    
    if [ -n "$response" ]; then
        if echo "$response" | grep -q "\"status\":\"healthy\""; then
            print_status "Backend health - OK"
            return 0
        else
            print_warning "Backend health - Not healthy"
            echo "Response: $response"
            return 1
        fi
    else
        print_error "Backend health - No response"
        return 1
    fi
}

# Function to test security features
test_security_features() {
    print_info "Testing security features..."
    
    # Check if sensitive information is not exposed
    local frontend_files=("src/config/development.ts" "src/services/apiService.ts")
    local security_issues=()
    
    for file in "${frontend_files[@]}"; do
        if [ -f "$file" ]; then
            # Check for exposed API keys or secrets
            if grep -q "re_[A-Za-z0-9]" "$file" 2>/dev/null; then
                security_issues+=("Potential API key in $file")
            fi
            
            # Check for hardcoded credentials
            if grep -qi "password\|secret\|key.*=" "$file" 2>/dev/null; then
                # Exclude safe patterns
                if ! grep -q "import.*key\|export.*key\|type.*key\|interface.*key" "$file"; then
                    security_issues+=("Potential hardcoded credentials in $file")
                fi
            fi
        fi
    done
    
    if [ ${#security_issues[@]} -eq 0 ]; then
        print_status "Security check - No issues found"
        return 0
    else
        print_warning "Security issues found:"
        for issue in "${security_issues[@]}"; do
            echo "  - $issue"
        done
        return 1
    fi
}

# Function to test network switching
test_network_switching() {
    print_info "Testing network switching functionality..."
    
    local networks=("devnet" "testnet" "mainnet-beta")
    local failed_tests=0
    
    for network in "${networks[@]}"; do
        if ! test_network_parameters "$network"; then
            ((failed_tests++))
        fi
    done
    
    if [ $failed_tests -eq 0 ]; then
        print_status "Network switching - All tests passed"
        return 0
    else
        print_error "Network switching - $failed_tests tests failed"
        return 1
    fi
}

# Main testing function
main() {
    echo "🧪 SecureContract Pro Environment Testing"
    echo "========================================"
    
    local total_tests=0
    local passed_tests=0
    
    # Test 1: Environment variables
    ((total_tests++))
    if check_environment_variables; then
        ((passed_tests++))
    fi
    
    echo ""
    
    # Test 2: Backend health
    ((total_tests++))
    if test_backend_health; then
        ((passed_tests++))
    fi
    
    echo ""
    
    # Test 3: API endpoints
    ((total_tests++))
    local api_tests=0
    local api_passed=0
    
    endpoints=(
        "/api/health:Health Check"
        "/api/environment:Environment Info"
        "/:Root Endpoint"
    )
    
    for endpoint_desc in "${endpoints[@]}"; do
        IFS=':' read -r endpoint desc <<< "$endpoint_desc"
        ((api_tests++))
        if test_api_endpoint "$endpoint" "$desc"; then
            ((api_passed++))
        fi
    done
    
    if [ $api_passed -eq $api_tests ]; then
        ((passed_tests++))
        print_status "API endpoints - All tests passed ($api_passed/$api_tests)"
    else
        print_error "API endpoints - Some tests failed ($api_passed/$api_tests)"
    fi
    
    echo ""
    
    # Test 4: Network switching
    ((total_tests++))
    if test_network_switching; then
        ((passed_tests++))
    fi
    
    echo ""
    
    # Test 5: Security features
    ((total_tests++))
    if test_security_features; then
        ((passed_tests++))
    fi
    
    echo ""
    echo "========================================"
    echo "Test Results: $passed_tests/$total_tests tests passed"
    
    if [ $passed_tests -eq $total_tests ]; then
        print_status "All tests passed! 🎉"
        exit 0
    else
        print_error "Some tests failed. Please review the issues above."
        exit 1
    fi
}

# Check if backend is running
if ! curl -s -f "http://localhost:3001/api/health" > /dev/null 2>&1; then
    print_error "Backend is not running on http://localhost:3001"
    print_info "Please start the backend server first:"
    print_info "  cd backend && npm run dev"
    exit 1
fi

# Run main function
main "$@"
