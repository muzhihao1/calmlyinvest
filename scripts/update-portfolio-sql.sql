-- SQL script to update portfolio for user 279838958@qq.com
-- Run this in Supabase SQL Editor

-- Step 1: Find the user ID
WITH user_info AS (
  SELECT id FROM auth.users WHERE email = '279838958@qq.com'
)

-- Step 2: Update or create portfolio
INSERT INTO portfolios (user_id, name, total_equity, cash_balance, margin_used)
SELECT 
  id,
  '主账户',
  44338.00,
  14400.00,
  40580.97
FROM user_info
ON CONFLICT (user_id) DO UPDATE SET
  total_equity = EXCLUDED.total_equity,
  cash_balance = EXCLUDED.cash_balance,
  margin_used = EXCLUDED.margin_used,
  updated_at = NOW();

-- Step 3: Get portfolio ID
WITH portfolio_info AS (
  SELECT p.id as portfolio_id
  FROM portfolios p
  JOIN auth.users u ON p.user_id = u.id
  WHERE u.email = '279838958@qq.com'
  LIMIT 1
)

-- Step 4: Delete existing holdings
DELETE FROM stock_holdings 
WHERE portfolio_id IN (SELECT portfolio_id FROM portfolio_info);

DELETE FROM option_holdings 
WHERE portfolio_id IN (SELECT portfolio_id FROM portfolio_info);

-- Step 5: Insert new stock holdings
WITH portfolio_info AS (
  SELECT p.id as portfolio_id
  FROM portfolios p
  JOIN auth.users u ON p.user_id = u.id
  WHERE u.email = '279838958@qq.com'
  LIMIT 1
)
INSERT INTO stock_holdings (portfolio_id, symbol, name, quantity, cost_price, current_price)
SELECT 
  portfolio_id,
  symbol,
  name,
  quantity,
  cost_price,
  current_price
FROM portfolio_info
CROSS JOIN (VALUES
  ('AMZN', 'Amazon.com Inc', 30, 220.00, 224.95),
  ('CRWD', 'CrowdStrike Holdings', 10, 480.00, 477.40),
  ('PLTR', 'Palantir Technologies', 38, 140.00, 141.95),
  ('SHOP', 'Shopify Inc', 32, 115.00, 112.23),
  ('TSLA', 'Tesla Inc', 40, 310.00, 312.75)
) AS holdings(symbol, name, quantity, cost_price, current_price);

-- Step 6: Insert new option holdings
WITH portfolio_info AS (
  SELECT p.id as portfolio_id
  FROM portfolios p
  JOIN auth.users u ON p.user_id = u.id
  WHERE u.email = '279838958@qq.com'
  LIMIT 1
)
INSERT INTO option_holdings (
  portfolio_id, option_symbol, underlying_symbol, option_type, 
  direction, contracts, strike_price, expiration_date, 
  cost_price, current_price, delta_value
)
SELECT 
  portfolio_id,
  option_symbol,
  underlying_symbol,
  option_type,
  direction,
  contracts,
  strike_price,
  expiration_date::date,
  cost_price,
  current_price,
  delta_value
FROM portfolio_info
CROSS JOIN (VALUES
  ('MSFT250718P00500000', 'MSFT', 'PUT', 'SELL', 1, 500.00, '2025-07-18', 3.30, 2.52, -0.349),
  ('NVDA250822P00165000', 'NVDA', 'PUT', 'SELL', 1, 165.00, '2025-08-22', 8.00, 7.55, -0.465),
  ('NVDA250919P00170000', 'NVDA', 'PUT', 'SELL', 1, 170.00, '2025-09-19', 14.00, 13.62, -0.522),
  ('QQQ250725P00555000', 'QQQ', 'PUT', 'SELL', 1, 555.00, '2025-07-25', 7.00, 6.60, -0.495)
) AS options(
  option_symbol, underlying_symbol, option_type, direction, 
  contracts, strike_price, expiration_date, cost_price, 
  current_price, delta_value
);

-- Verify the update
SELECT 
  'Updated portfolio for user 279838958@qq.com' as status,
  (SELECT COUNT(*) FROM stock_holdings WHERE portfolio_id IN (
    SELECT p.id FROM portfolios p JOIN auth.users u ON p.user_id = u.id WHERE u.email = '279838958@qq.com'
  )) as stock_count,
  (SELECT COUNT(*) FROM option_holdings WHERE portfolio_id IN (
    SELECT p.id FROM portfolios p JOIN auth.users u ON p.user_id = u.id WHERE u.email = '279838958@qq.com'
  )) as option_count;