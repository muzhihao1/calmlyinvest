-- Restore data for user 279838958@qq.com
-- User UUID: 8e82d664-5ef9-47c1-a540-9af664860a7c

-- Note: This SQL should be executed in Supabase SQL Editor with proper permissions
-- or using a service role key that bypasses RLS

-- Step 1: Check if user exists in auth.users
SELECT id, email FROM auth.users WHERE id = '8e82d664-5ef9-47c1-a540-9af664860a7c';

-- Step 2: Check and create portfolio
-- First check if portfolio already exists
SELECT * FROM portfolios WHERE user_id = '8e82d664-5ef9-47c1-a540-9af664860a7c' AND name = 'Main Portfolio';

-- Create portfolio (using INSERT instead of UPSERT since there's no unique constraint on user_id,name)
INSERT INTO portfolios (user_id, name, total_equity, cash_balance, margin_used)
SELECT 
  '8e82d664-5ef9-47c1-a540-9af664860a7c'::uuid,
  'Main Portfolio',
  44337.96,
  14387.18,
  40580.97
WHERE NOT EXISTS (
  SELECT 1 FROM portfolios 
  WHERE user_id = '8e82d664-5ef9-47c1-a540-9af664860a7c' 
  AND name = 'Main Portfolio'
);

-- Get the portfolio ID for subsequent operations
DO $$
DECLARE 
  v_portfolio_id INTEGER;
BEGIN
  -- Get portfolio ID
  SELECT id INTO v_portfolio_id 
  FROM portfolios 
  WHERE user_id = '8e82d664-5ef9-47c1-a540-9af664860a7c' 
  AND name = 'Main Portfolio'
  LIMIT 1;
  
  IF v_portfolio_id IS NULL THEN
    RAISE NOTICE 'Portfolio not found!';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Using portfolio ID: %', v_portfolio_id;
  
  -- Step 3: Clear existing holdings (optional - uncomment if needed)
  -- DELETE FROM stock_holdings WHERE portfolio_id = v_portfolio_id;
  -- DELETE FROM option_holdings WHERE portfolio_id = v_portfolio_id;
  
  -- Step 4: Insert stock holdings
  INSERT INTO stock_holdings (portfolio_id, symbol, name, quantity, cost_price, current_price, beta)
  VALUES
    (v_portfolio_id, 'AMZN', 'Amazon.com Inc', 50, 150.00, 190.00, 1.14),
    (v_portfolio_id, 'CRWD', 'CrowdStrike Holdings', 30, 180.00, 360.00, 1.23),
    (v_portfolio_id, 'PLTR', 'Palantir Technologies', 200, 25.00, 32.00, 2.15),
    (v_portfolio_id, 'SHOP', 'Shopify Inc', 40, 70.00, 95.00, 1.89),
    (v_portfolio_id, 'TSLA', 'Tesla Inc', 20, 200.00, 390.00, 2.03)
  ON CONFLICT DO NOTHING;
  
  -- Step 5: Insert option holdings
  INSERT INTO option_holdings (
    portfolio_id, option_symbol, underlying_symbol, option_type, 
    direction, contracts, strike_price, expiration_date, 
    cost_price, current_price, delta_value
  )
  VALUES
    (v_portfolio_id, 'MSFT250321P00440000', 'MSFT', 'PUT', 'SELL', 2, 440.00, '2025-03-21', 15.50, 8.25, -0.35),
    (v_portfolio_id, 'AAPL250418C00200000', 'AAPL', 'CALL', 'BUY', 5, 200.00, '2025-04-18', 12.75, 25.30, 0.65),
    (v_portfolio_id, 'GOOGL250620P00190000', 'GOOGL', 'PUT', 'SELL', 3, 190.00, '2025-06-20', 18.25, 12.40, -0.42),
    (v_portfolio_id, 'NVDA250516C00130000', 'NVDA', 'CALL', 'BUY', 10, 130.00, '2025-05-16', 8.90, 15.75, 0.72)
  ON CONFLICT DO NOTHING;
  
END $$;

-- Step 6: Create or update risk settings
INSERT INTO risk_settings (
  user_id, 
  leverage_safe_threshold, 
  leverage_warning_threshold,
  concentration_limit, 
  industry_concentration_limit, 
  min_cash_ratio,
  leverage_alerts, 
  expiration_alerts, 
  volatility_alerts,
  data_update_frequency
)
VALUES (
  '8e82d664-5ef9-47c1-a540-9af664860a7c'::uuid,
  1.0, 
  1.5, 
  20.0, 
  60.0, 
  30.0,
  true, 
  true, 
  false, 
  5
)
ON CONFLICT (user_id) DO UPDATE
SET 
  leverage_safe_threshold = EXCLUDED.leverage_safe_threshold,
  leverage_warning_threshold = EXCLUDED.leverage_warning_threshold,
  concentration_limit = EXCLUDED.concentration_limit,
  industry_concentration_limit = EXCLUDED.industry_concentration_limit,
  min_cash_ratio = EXCLUDED.min_cash_ratio,
  leverage_alerts = EXCLUDED.leverage_alerts,
  expiration_alerts = EXCLUDED.expiration_alerts,
  volatility_alerts = EXCLUDED.volatility_alerts,
  data_update_frequency = EXCLUDED.data_update_frequency;

-- Step 7: Verify the data
SELECT 'Verification Results:' as info;

-- Check portfolio
SELECT 
  'Portfolio' as table_name,
  COUNT(*) as count,
  string_agg(name || ' (ID: ' || id || ')', ', ') as details
FROM portfolios 
WHERE user_id = '8e82d664-5ef9-47c1-a540-9af664860a7c'
GROUP BY table_name;

-- Check stock holdings
SELECT 
  'Stock Holdings' as table_name,
  COUNT(*) as count,
  string_agg(symbol || ' (' || quantity || ' shares)', ', ') as details
FROM stock_holdings sh
JOIN portfolios p ON sh.portfolio_id = p.id
WHERE p.user_id = '8e82d664-5ef9-47c1-a540-9af664860a7c'
GROUP BY table_name;

-- Check option holdings  
SELECT 
  'Option Holdings' as table_name,
  COUNT(*) as count,
  string_agg(option_symbol || ' (' || contracts || ' contracts)', ', ') as details
FROM option_holdings oh
JOIN portfolios p ON oh.portfolio_id = p.id
WHERE p.user_id = '8e82d664-5ef9-47c1-a540-9af664860a7c'
GROUP BY table_name;

-- Check risk settings
SELECT 
  'Risk Settings' as table_name,
  COUNT(*) as count,
  'Safe: ' || leverage_safe_threshold || ', Warning: ' || leverage_warning_threshold as details
FROM risk_settings
WHERE user_id = '8e82d664-5ef9-47c1-a540-9af664860a7c'
GROUP BY table_name, leverage_safe_threshold, leverage_warning_threshold;

-- Show portfolio summary
SELECT 
  p.id as portfolio_id,
  p.name as portfolio_name,
  p.total_equity,
  p.cash_balance,
  p.margin_used,
  COUNT(DISTINCT sh.id) as stock_count,
  COUNT(DISTINCT oh.id) as option_count
FROM portfolios p
LEFT JOIN stock_holdings sh ON sh.portfolio_id = p.id
LEFT JOIN option_holdings oh ON oh.portfolio_id = p.id
WHERE p.user_id = '8e82d664-5ef9-47c1-a540-9af664860a7c'
GROUP BY p.id, p.name, p.total_equity, p.cash_balance, p.margin_used;