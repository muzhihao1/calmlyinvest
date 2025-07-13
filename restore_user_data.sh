#!/bin/bash

# Supabase configuration
SUPABASE_URL="https://hsfthqchyupkbmazcuis.supabase.co"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzZnRocWNoeXVwa2JtYXpjdWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIzMzc3OTUsImV4cCI6MjA2NzkxMzc5NX0.Ox6XqMSiU6DDF9klIxLsvPvDAFLSoA1XTXqc8_xoWpI"

# User details
USER_ID="8e82d664-5ef9-47c1-a540-9af664860a7c"
USER_EMAIL="279838958@qq.com"

echo "=== Starting data restoration for user $USER_EMAIL ==="

# Step 1: Check if user exists
echo -e "\n1. Checking if user exists..."
USER_CHECK=$(curl -s -X GET \
  "$SUPABASE_URL/rest/v1/users?id=eq.$USER_ID" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY")

echo "User check response: $USER_CHECK"

# Step 2: Check existing portfolios for this user
echo -e "\n2. Checking existing portfolios..."
PORTFOLIO_CHECK=$(curl -s -X GET \
  "$SUPABASE_URL/rest/v1/portfolios?user_id=eq.$USER_ID" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY")

echo "Portfolio check response: $PORTFOLIO_CHECK"

# Step 3: Create or get portfolio
echo -e "\n3. Creating portfolio..."
PORTFOLIO_RESPONSE=$(curl -s -X POST \
  "$SUPABASE_URL/rest/v1/portfolios" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d '{
    "user_id": "'"$USER_ID"'",
    "name": "Main Portfolio",
    "total_equity": "44337.96",
    "cash_balance": "14387.18",
    "margin_used": "40580.97"
  }')

echo "Portfolio creation response: $PORTFOLIO_RESPONSE"

# Extract portfolio ID from response
PORTFOLIO_ID=$(echo $PORTFOLIO_RESPONSE | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)

if [ -z "$PORTFOLIO_ID" ]; then
  # If creation failed, try to get existing portfolio ID
  echo "Portfolio creation might have failed, checking for existing portfolio..."
  PORTFOLIO_ID=$(echo $PORTFOLIO_CHECK | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)
fi

echo "Portfolio ID: $PORTFOLIO_ID"

if [ -z "$PORTFOLIO_ID" ]; then
  echo "ERROR: Could not create or find portfolio. Exiting."
  exit 1
fi

# Step 4: Create stock holdings
echo -e "\n4. Creating stock holdings..."

# Stock data
declare -a stocks=(
  '{"portfolio_id": '"$PORTFOLIO_ID"', "symbol": "AMZN", "name": "Amazon.com Inc", "quantity": 50, "cost_price": "150.00", "current_price": "190.00", "beta": "1.14"}'
  '{"portfolio_id": '"$PORTFOLIO_ID"', "symbol": "CRWD", "name": "CrowdStrike Holdings", "quantity": 30, "cost_price": "180.00", "current_price": "360.00", "beta": "1.23"}'
  '{"portfolio_id": '"$PORTFOLIO_ID"', "symbol": "PLTR", "name": "Palantir Technologies", "quantity": 200, "cost_price": "25.00", "current_price": "32.00", "beta": "2.15"}'
  '{"portfolio_id": '"$PORTFOLIO_ID"', "symbol": "SHOP", "name": "Shopify Inc", "quantity": 40, "cost_price": "70.00", "current_price": "95.00", "beta": "1.89"}'
  '{"portfolio_id": '"$PORTFOLIO_ID"', "symbol": "TSLA", "name": "Tesla Inc", "quantity": 20, "cost_price": "200.00", "current_price": "390.00", "beta": "2.03"}'
)

for stock in "${stocks[@]}"; do
  echo "Creating stock: $stock"
  curl -s -X POST \
    "$SUPABASE_URL/rest/v1/stock_holdings" \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "$stock"
  echo ""
done

# Step 5: Create option holdings
echo -e "\n5. Creating option holdings..."

# Option data
declare -a options=(
  '{"portfolio_id": '"$PORTFOLIO_ID"', "option_symbol": "MSFT250321P00440000", "underlying_symbol": "MSFT", "option_type": "PUT", "direction": "SELL", "contracts": 2, "strike_price": "440.00", "expiration_date": "2025-03-21", "cost_price": "15.50", "current_price": "8.25", "delta_value": "-0.35"}'
  '{"portfolio_id": '"$PORTFOLIO_ID"', "option_symbol": "AAPL250418C00200000", "underlying_symbol": "AAPL", "option_type": "CALL", "direction": "BUY", "contracts": 5, "strike_price": "200.00", "expiration_date": "2025-04-18", "cost_price": "12.75", "current_price": "25.30", "delta_value": "0.65"}'
  '{"portfolio_id": '"$PORTFOLIO_ID"', "option_symbol": "GOOGL250620P00190000", "underlying_symbol": "GOOGL", "option_type": "PUT", "direction": "SELL", "contracts": 3, "strike_price": "190.00", "expiration_date": "2025-06-20", "cost_price": "18.25", "current_price": "12.40", "delta_value": "-0.42"}'
  '{"portfolio_id": '"$PORTFOLIO_ID"', "option_symbol": "NVDA250516C00130000", "underlying_symbol": "NVDA", "option_type": "CALL", "direction": "BUY", "contracts": 10, "strike_price": "130.00", "expiration_date": "2025-05-16", "cost_price": "8.90", "current_price": "15.75", "delta_value": "0.72"}'
)

for option in "${options[@]}"; do
  echo "Creating option: $option"
  curl -s -X POST \
    "$SUPABASE_URL/rest/v1/option_holdings" \
    -H "apikey: $SUPABASE_ANON_KEY" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -H "Content-Type: application/json" \
    -d "$option"
  echo ""
done

# Step 6: Create risk settings
echo -e "\n6. Creating risk settings..."
curl -s -X POST \
  "$SUPABASE_URL/rest/v1/risk_settings" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "'"$USER_ID"'",
    "leverage_safe_threshold": "1.0",
    "leverage_warning_threshold": "1.5",
    "concentration_limit": "20.0",
    "industry_concentration_limit": "60.0",
    "min_cash_ratio": "30.0",
    "leverage_alerts": true,
    "expiration_alerts": true,
    "volatility_alerts": false,
    "data_update_frequency": 5
  }'

echo -e "\n\n=== Data restoration complete ==="

# Step 7: Verify the data was created
echo -e "\n7. Verifying data creation..."

echo -e "\nPortfolios:"
curl -s -X GET \
  "$SUPABASE_URL/rest/v1/portfolios?user_id=eq.$USER_ID" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" | jq '.'

echo -e "\nStock Holdings:"
curl -s -X GET \
  "$SUPABASE_URL/rest/v1/stock_holdings?portfolio_id=eq.$PORTFOLIO_ID" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" | jq '.'

echo -e "\nOption Holdings:"
curl -s -X GET \
  "$SUPABASE_URL/rest/v1/option_holdings?portfolio_id=eq.$PORTFOLIO_ID" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" | jq '.'

echo -e "\nRisk Settings:"
curl -s -X GET \
  "$SUPABASE_URL/rest/v1/risk_settings?user_id=eq.$USER_ID" \
  -H "apikey: $SUPABASE_ANON_KEY" \
  -H "Authorization: Bearer $SUPABASE_ANON_KEY" | jq '.'