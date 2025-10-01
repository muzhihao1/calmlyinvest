#!/bin/bash

# Update all stock holdings with latest data from Robinhood
API_URL="https://calmlyinvest.vercel.app/api/portfolio-bulk-import"
PORTFOLIO_ID="186ecd89-e268-43c4-b3d5-3441a2082cf5"

echo "🚀 Starting stock holdings update with latest Robinhood data..."
echo "📊 Portfolio ID: $PORTFOLIO_ID"
echo ""

# Create the JSON payload with all 17 stocks (including new TSLA)
cat > /tmp/update_stocks_payload.json << 'EOF'
{
  "portfolioId": "186ecd89-e268-43c4-b3d5-3441a2082cf5",
  "clearExisting": true,
  "stocks": [
    { "symbol": "TSLA", "name": "Tesla", "quantity": 40, "cost_price": 316.21, "current_price": 435.75, "beta": 2.0 },
    { "symbol": "PLTR", "name": "Palantir Technologies", "quantity": 38, "cost_price": 60.10, "current_price": 179.90, "beta": 2.5 },
    { "symbol": "SHOP", "name": "Shopify", "quantity": 32, "cost_price": 85.24, "current_price": 146.69, "beta": 1.4 },
    { "symbol": "CRWD", "name": "CrowdStrike", "quantity": 9, "cost_price": 397.70, "current_price": 487.50, "beta": 1.5 },
    { "symbol": "AMZN", "name": "Amazon", "quantity": 30, "cost_price": 207.37, "current_price": 219.37, "beta": 1.2 },
    { "symbol": "FCX", "name": "Freeport-McMoRan", "quantity": 30, "cost_price": 37.59, "current_price": 38.53, "beta": 1.7 },
    { "symbol": "HIMS", "name": "Hims & Hers Health", "quantity": 10, "cost_price": 51.33, "current_price": 56.35, "beta": 1.8 },
    { "symbol": "SNOW", "name": "Snowflake", "quantity": 5, "cost_price": 221.27, "current_price": 225.56, "beta": 1.6 },
    { "symbol": "NKE", "name": "Nike", "quantity": 14, "cost_price": 70.76, "current_price": 69.20, "beta": 0.8 },
    { "symbol": "RKLB", "name": "Rocket Lab USA", "quantity": 10, "cost_price": 49.43, "current_price": 46.89, "beta": 2.0 },
    { "symbol": "ORCL", "name": "Oracle", "quantity": 7, "cost_price": 289.36, "current_price": 276.28, "beta": 0.9 },
    { "symbol": "TSM", "name": "Taiwan Semiconductor", "quantity": 3, "cost_price": 274.28, "current_price": 277.18, "beta": 1.1 },
    { "symbol": "ISRG", "name": "Intuitive Surgical", "quantity": 2, "cost_price": 451.61, "current_price": 446.98, "beta": 0.7 },
    { "symbol": "META", "name": "Meta Platforms", "quantity": 1, "cost_price": 744.00, "current_price": 732.50, "beta": 1.3 }
  ],
  "options": [
    {
      "option_symbol": "NVDA251017P185",
      "underlying_symbol": "NVDA",
      "option_type": "PUT",
      "direction": "SELL",
      "contracts": 1,
      "strike_price": 185.00,
      "expiration_date": "2025-10-17",
      "cost_price": 10.71,
      "current_price": 5.05,
      "delta_value": -0.527
    },
    {
      "option_symbol": "MSFT251010P515",
      "underlying_symbol": "MSFT",
      "option_type": "PUT",
      "direction": "SELL",
      "contracts": 1,
      "strike_price": 515.00,
      "expiration_date": "2025-10-10",
      "cost_price": 11.59,
      "current_price": 6.16,
      "delta_value": -0.546
    },
    {
      "option_symbol": "QQQ251003P600",
      "underlying_symbol": "QQQ",
      "option_type": "PUT",
      "direction": "SELL",
      "contracts": 1,
      "strike_price": 600.00,
      "expiration_date": "2025-10-03",
      "cost_price": 8.96,
      "current_price": 4.25,
      "delta_value": -0.604
    },
    {
      "option_symbol": "NVDA251017P175",
      "underlying_symbol": "NVDA",
      "option_type": "PUT",
      "direction": "SELL",
      "contracts": 1,
      "strike_price": 175.00,
      "expiration_date": "2025-10-17",
      "cost_price": 6.04,
      "current_price": 2.00,
      "delta_value": -0.264
    }
  ]
}
EOF

# Make the API call
echo "📡 Sending bulk update request to API..."
echo ""
RESPONSE=$(curl -s -X POST "$API_URL" \
  -H "Content-Type: application/json" \
  -d @/tmp/update_stocks_payload.json)

# Check response
if echo "$RESPONSE" | grep -q '"success":true'; then
  STOCKS_ADDED=$(echo "$RESPONSE" | grep -o '"stocksAdded":[0-9]*' | cut -d: -f2)
  OPTIONS_ADDED=$(echo "$RESPONSE" | grep -o '"optionsAdded":[0-9]*' | cut -d: -f2)
  echo "✅ Update successful!"
  echo ""
  echo "📊 Updated Records:"
  echo "   - Stocks: $STOCKS_ADDED (including TSLA as new addition)"
  echo "   - Options: $OPTIONS_ADDED"
  echo ""
  echo "📝 Key Changes:"
  echo "   • New: TSLA (40 shares @ $316.21)"
  echo "   • Updated: FCX (20→30 shares)"
  echo "   • Updated: SNOW (3→5 shares)"
  echo "   • Updated: NKE (7→14 shares)"
  echo "   • Updated: ORCL (5→7 shares)"
  echo "   • All cost prices and current prices refreshed"
else
  echo "❌ Update failed!"
  echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
fi

# Cleanup
rm /tmp/update_stocks_payload.json

echo ""
echo "🎉 Done! Visit https://calmlyinvest.vercel.app to see updated holdings."
