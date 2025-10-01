#!/bin/bash

# Update portfolio financial data via API
API_URL="https://calmlyinvest.vercel.app/api/portfolio-details-simple"
PORTFOLIO_ID="186ecd89-e268-43c4-b3d5-3441a2082cf5"

echo "🚀 Starting portfolio financial data update via API..."
echo "📊 Portfolio ID: $PORTFOLIO_ID"
echo ""

# Financial data from Robinhood account (as of 2025-10-01)
echo "📈 Financial Data to Update:"
echo "   Total Equity: 58,885.17 USD (Net Liquidation Value)"
echo "   Cash Balance: 14,137.43 USD"
echo "   Margin Used: 43,760.93 USD (Maintenance Margin)"
echo ""

# Create the JSON payload
cat > /tmp/portfolio_update.json << 'EOF'
{
  "portfolioId": "186ecd89-e268-43c4-b3d5-3441a2082cf5",
  "totalEquity": "58885.17",
  "cashBalance": "14137.43",
  "marginUsed": "43760.93"
}
EOF

# Note: This requires authentication token
echo "⚠️  Note: This API requires authentication"
echo "Please provide your auth token:"
echo ""
echo "To update via API, run:"
echo ""
echo "curl -X PUT \"$API_URL?portfolioId=$PORTFOLIO_ID\" \\"
echo "  -H \"Content-Type: application/json\" \\"
echo "  -H \"Authorization: Bearer YOUR_TOKEN_HERE\" \\"
echo "  -d @/tmp/portfolio_update.json"
echo ""
echo "📝 Payload saved to /tmp/portfolio_update.json"
echo ""
echo "Or use Supabase SQL Editor to run:"
echo ""
echo "UPDATE portfolios"
echo "SET"
echo "  total_equity = 58885.17,"
echo "  cash_balance = 14137.43,"
echo "  margin_used = 43760.93,"
echo "  updated_at = NOW()"
echo "WHERE id = '$PORTFOLIO_ID';"
echo ""
echo "🎉 Instructions generated!"
