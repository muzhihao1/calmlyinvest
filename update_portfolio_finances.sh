#!/bin/bash

# Update portfolio financial data for CalmlyInvest
PORTFOLIO_ID="186ecd89-e268-43c4-b3d5-3441a2082cf5"

echo "🚀 Starting portfolio financial data update..."
echo "📊 Portfolio ID: $PORTFOLIO_ID"

# Financial data from Robinhood account (as of 2025-10-01)
TOTAL_EQUITY="58885.17"       # Net Liquidation Value
CASH_BALANCE="14137.43"       # Cash
MARGIN_USED="43760.93"        # Maintenance Margin

echo ""
echo "📈 Financial Data to Update:"
echo "   Total Equity: $TOTAL_EQUITY USD"
echo "   Cash Balance: $CASH_BALANCE USD"
echo "   Margin Used: $MARGIN_USED USD"
echo ""

# Using Supabase direct SQL update
cat > /tmp/update_portfolio.sql << EOF
UPDATE portfolios
SET
  total_equity = $TOTAL_EQUITY,
  cash_balance = $CASH_BALANCE,
  margin_used = $MARGIN_USED,
  updated_at = NOW()
WHERE id = '$PORTFOLIO_ID';
EOF

echo "📝 Generated SQL update script"
echo "⚠️  Note: Execute this SQL in Supabase SQL Editor or use Supabase CLI"
echo ""
cat /tmp/update_portfolio.sql
echo ""
echo "✅ Script generated at /tmp/update_portfolio.sql"
echo "🎉 Done! Please execute the SQL in Supabase dashboard."
