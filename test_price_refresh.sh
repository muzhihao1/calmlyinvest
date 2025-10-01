#!/bin/bash

# Test script for price refresh endpoint
# Usage: ./test_price_refresh.sh

API_URL="https://calmlyinvest.vercel.app/api/portfolio-refresh-prices-simple"
PORTFOLIO_ID="186ecd89-e268-43c4-b3d5-3441a2082cf5"

# You need to provide a valid JWT token
# Get this from the browser's localStorage after logging in
# Or use the login endpoint to get a token

echo "Testing price refresh endpoint..."
echo "URL: ${API_URL}"
echo "Portfolio ID: ${PORTFOLIO_ID}"
echo ""
echo "Note: You need to provide a valid Bearer token"
echo "Get the token from browser localStorage after logging in"
echo ""
echo "Example usage:"
echo "curl -X POST \"${API_URL}?portfolioId=${PORTFOLIO_ID}\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer YOUR_JWT_TOKEN_HERE\""
echo ""

# Uncomment and add your token to test:
# TOKEN="your_jwt_token_here"
# curl -X POST "${API_URL}?portfolioId=${PORTFOLIO_ID}" \
#   -H "Content-Type: application/json" \
#   -H "Authorization: Bearer ${TOKEN}" \
#   | jq '.'
