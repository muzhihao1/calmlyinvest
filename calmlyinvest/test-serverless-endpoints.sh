#!/bin/bash

# Test script for Vercel Serverless Functions
# Usage: ./test-serverless-endpoints.sh [local|production]

# Set base URL based on environment
if [ "$1" = "production" ]; then
  BASE_URL="https://calmlyinvest.vercel.app"
else
  BASE_URL="http://localhost:3000"
fi

echo "Testing endpoints at: $BASE_URL"
echo "================================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to test endpoint
test_endpoint() {
  local method=$1
  local endpoint=$2
  local expected_status=$3
  local data=$4
  local headers=$5
  
  echo -n "Testing $method $endpoint... "
  
  if [ -n "$data" ]; then
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      -H "Content-Type: application/json" \
      ${headers:+-H "$headers"} \
      -d "$data" \
      "$BASE_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}" -X "$method" \
      ${headers:+-H "$headers"} \
      "$BASE_URL$endpoint")
  fi
  
  status_code=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | head -n -1)
  
  if [ "$status_code" = "$expected_status" ]; then
    echo -e "${GREEN}✓${NC} (Status: $status_code)"
  else
    echo -e "${RED}✗${NC} (Expected: $expected_status, Got: $status_code)"
    echo "Response: $body"
  fi
}

echo "1. Testing Health & Debug Endpoints"
echo "-----------------------------------"
test_endpoint "GET" "/api/health" "200"
test_endpoint "GET" "/api/debug/env" "200"

echo ""
echo "2. Testing Guest Mode"
echo "--------------------"
# Test with guest mode header
test_endpoint "GET" "/api/portfolios/guest-user" "200" "" "X-Guest-User: true"
test_endpoint "GET" "/api/portfolio/demo-portfolio-1" "200" "" "X-Guest-User: true"
test_endpoint "GET" "/api/portfolio/demo-portfolio-1/stocks" "200" "" "X-Guest-User: true"
test_endpoint "GET" "/api/portfolio/demo-portfolio-1/risk" "200" "" "X-Guest-User: true"

echo ""
echo "3. Testing Authentication Required Endpoints (should fail without auth)"
echo "---------------------------------------------------------------------"
test_endpoint "GET" "/api/portfolios/123" "401"
test_endpoint "POST" "/api/portfolios" "401" '{"name":"Test Portfolio"}'
test_endpoint "GET" "/api/portfolio/123" "401"

echo ""
echo "4. Testing Portfolio CRUD (with demo auth token)"
echo "-----------------------------------------------"
# Note: Replace with actual auth token for authenticated tests
AUTH_TOKEN="Bearer demo-token"

# Create portfolio
echo "Creating test portfolio..."
test_endpoint "POST" "/api/portfolios" "401" \
  '{"name":"Test Portfolio","totalEquity":"100000","cashBalance":"50000","marginUsed":"0"}' \
  "Authorization: $AUTH_TOKEN"

echo ""
echo "5. Testing Stock Holdings Endpoints"
echo "----------------------------------"
# Test stock quote
test_endpoint "GET" "/api/stock/quote/AAPL" "401" "" "Authorization: $AUTH_TOKEN"

echo ""
echo "6. Testing Risk Endpoints"
echo "------------------------"
test_endpoint "GET" "/api/user/guest-user/risk-settings" "401" "" "Authorization: $AUTH_TOKEN"

echo ""
echo "7. Testing Error Handling"
echo "------------------------"
# Test non-existent endpoints
test_endpoint "GET" "/api/nonexistent" "404"
test_endpoint "POST" "/api/portfolio/invalid-id/stocks" "401"

echo ""
echo "================================="
echo "Test Summary"
echo "================================="
echo "All basic connectivity tests completed."
echo ""
echo "For full authentication tests, you need to:"
echo "1. Login to get a valid JWT token"
echo "2. Replace AUTH_TOKEN in this script with the actual token"
echo "3. Run the script again"
echo ""
echo "Manual tests required:"
echo "- Login flow with actual credentials"
echo "- Create/update/delete operations with real auth"
echo "- Market data refresh functionality"
echo "- CSV import functionality"