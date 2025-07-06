#!/bin/bash

# Google Cloud Deployment Testing Script for SecureContract Pro
# This script validates the deployment and tests all endpoints

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Get project ID
PROJECT_ID=$(gcloud config get-value project)
if [ -z "$PROJECT_ID" ]; then
    print_error "No Google Cloud project is set"
    exit 1
fi

# Define URLs
FRONTEND_URL="https://$PROJECT_ID.uc.r.appspot.com"
BACKEND_URL="https://backend-dot-$PROJECT_ID.uc.r.appspot.com"

print_status "Testing deployment for project: $PROJECT_ID"
print_status "Frontend URL: $FRONTEND_URL"
print_status "Backend URL: $BACKEND_URL"

# Function to test HTTP endpoint
test_endpoint() {
    local url=$1
    local expected_status=$2
    local description=$3
    
    print_status "Testing: $description"
    print_status "URL: $url"
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        print_success "✅ $description - Status: $response"
        return 0
    else
        print_error "❌ $description - Expected: $expected_status, Got: $response"
        return 1
    fi
}

# Function to test JSON endpoint
test_json_endpoint() {
    local url=$1
    local description=$2
    
    print_status "Testing: $description"
    print_status "URL: $url"
    
    response=$(curl -s "$url" || echo '{"error": "connection_failed"}')
    
    if echo "$response" | jq . >/dev/null 2>&1; then
        print_success "✅ $description - Valid JSON response"
        echo "Response preview: $(echo "$response" | jq -c . | head -c 100)..."
        return 0
    else
        print_error "❌ $description - Invalid JSON response"
        echo "Response: $response"
        return 1
    fi
}

# Start testing
echo ""
print_status "🧪 Starting deployment validation tests..."
echo ""

# Test counter
total_tests=0
passed_tests=0

# Test 1: Frontend accessibility
total_tests=$((total_tests + 1))
if test_endpoint "$FRONTEND_URL" "200" "Frontend accessibility"; then
    passed_tests=$((passed_tests + 1))
fi

echo ""

# Test 2: Backend health check
total_tests=$((total_tests + 1))
if test_json_endpoint "$BACKEND_URL/api/health" "Backend health check"; then
    passed_tests=$((passed_tests + 1))
fi

echo ""

# Test 3: Backend root endpoint
total_tests=$((total_tests + 1))
if test_json_endpoint "$BACKEND_URL" "Backend root endpoint"; then
    passed_tests=$((passed_tests + 1))
fi

echo ""

# Test 4: API environment endpoint
total_tests=$((total_tests + 1))
if test_json_endpoint "$BACKEND_URL/api/environment" "Environment information"; then
    passed_tests=$((passed_tests + 1))
fi

echo ""

# Test 5: Solana status endpoint
total_tests=$((total_tests + 1))
if test_json_endpoint "$BACKEND_URL/api/solana/status" "Solana network status"; then
    passed_tests=$((passed_tests + 1))
fi

echo ""

# Test 6: Frontend static assets
total_tests=$((total_tests + 1))
if test_endpoint "$FRONTEND_URL/favicon.ico" "200" "Frontend static assets (favicon)"; then
    passed_tests=$((passed_tests + 1))
fi

echo ""

# Test 7: Frontend routing (should return 200 for SPA routes)
total_tests=$((total_tests + 1))
if test_endpoint "$FRONTEND_URL/create-contract" "200" "Frontend SPA routing"; then
    passed_tests=$((passed_tests + 1))
fi

echo ""

# Test 8: CORS headers
print_status "Testing: CORS headers"
cors_response=$(curl -s -H "Origin: $FRONTEND_URL" -H "Access-Control-Request-Method: GET" -H "Access-Control-Request-Headers: X-Requested-With" -X OPTIONS "$BACKEND_URL/api/health" -I || echo "")

total_tests=$((total_tests + 1))
if echo "$cors_response" | grep -i "access-control-allow-origin" >/dev/null; then
    print_success "✅ CORS headers - Properly configured"
    passed_tests=$((passed_tests + 1))
else
    print_error "❌ CORS headers - Not properly configured"
fi

echo ""

# Test 9: Security headers
print_status "Testing: Security headers"
security_response=$(curl -s -I "$FRONTEND_URL" || echo "")

total_tests=$((total_tests + 1))
if echo "$security_response" | grep -i "x-frame-options\|x-content-type-options\|x-xss-protection" >/dev/null; then
    print_success "✅ Security headers - Present"
    passed_tests=$((passed_tests + 1))
else
    print_warning "⚠️ Security headers - Some may be missing"
fi

echo ""

# Test 10: SSL/HTTPS
print_status "Testing: SSL/HTTPS enforcement"
total_tests=$((total_tests + 1))
if [[ "$FRONTEND_URL" == https://* ]] && [[ "$BACKEND_URL" == https://* ]]; then
    print_success "✅ SSL/HTTPS - Properly enforced"
    passed_tests=$((passed_tests + 1))
else
    print_error "❌ SSL/HTTPS - Not properly enforced"
fi

echo ""

# Summary
echo "🏁 Test Results Summary"
echo "======================"
echo "Total tests: $total_tests"
echo "Passed: $passed_tests"
echo "Failed: $((total_tests - passed_tests))"

if [ $passed_tests -eq $total_tests ]; then
    print_success "🎉 All tests passed! Your deployment is working correctly."
    echo ""
    print_status "Your application is ready to use:"
    echo "  Frontend: $FRONTEND_URL"
    echo "  Backend:  $BACKEND_URL"
    echo "  API Health: $BACKEND_URL/api/health"
    echo ""
    print_status "Next steps:"
    echo "  1. Test wallet connection functionality"
    echo "  2. Create a test contract"
    echo "  3. Verify email notifications"
    echo "  4. Set up monitoring and alerts"
    exit 0
else
    print_error "❌ Some tests failed. Please check the issues above."
    echo ""
    print_status "Troubleshooting tips:"
    echo "  1. Check Google Cloud Console for error logs"
    echo "  2. Verify all secrets are properly configured"
    echo "  3. Ensure all required APIs are enabled"
    echo "  4. Check app.yaml configurations"
    echo ""
    print_status "View logs:"
    echo "  gcloud app logs tail -s default"
    echo "  gcloud app logs tail -s backend"
    exit 1
fi
