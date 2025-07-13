-- Fix user data for 279838958@qq.com
-- User UUID: 8e82d664-5ef9-47c1-a540-9af664860a7c

-- First, let's check if the user exists
SELECT * FROM auth.users WHERE email = '279838958@qq.com';

-- Create portfolio if it doesn't exist
INSERT INTO public.portfolios (user_id, name, total_equity, cash_balance, margin_used)
VALUES ('8e82d664-5ef9-47c1-a540-9af664860a7c', 'Main Portfolio', 44337.96, 14387.18, 40580.97)
ON CONFLICT (user_id, name) DO UPDATE
SET 
  total_equity = EXCLUDED.total_equity,
  cash_balance = EXCLUDED.cash_balance,
  margin_used = EXCLUDED.margin_used
RETURNING *;

-- Get the portfolio ID for subsequent inserts
WITH portfolio AS (
  SELECT id FROM public.portfolios 
  WHERE user_id = '8e82d664-5ef9-47c1-a540-9af664860a7c' 
  AND name = 'Main Portfolio'
  LIMIT 1
)
-- Insert stock holdings
INSERT INTO public.stock_holdings (portfolio_id, symbol, name, quantity, cost_price, current_price, beta)
SELECT 
  p.id,
  v.symbol,
  v.name,
  v.quantity,
  v.cost_price,
  v.current_price,
  v.beta
FROM portfolio p
CROSS JOIN (VALUES
  ('AMZN', 'Amazon.com Inc', 30, 222.31, 225.02, 1.33),
  ('CRWD', 'CrowdStrike Holdings', 10, 487.11, 478.45, 1.16),
  ('PLTR', 'Palantir Technologies', 38, 143.05, 142.10, 2.64),
  ('SHOP', 'Shopify Inc', 32, 115.16, 112.11, 2.63),
  ('TSLA', 'Tesla Inc', 40, 309.87, 313.51, 2.46)
) AS v(symbol, name, quantity, cost_price, current_price, beta)
ON CONFLICT DO NOTHING;

-- Insert option holdings
WITH portfolio AS (
  SELECT id FROM public.portfolios 
  WHERE user_id = '8e82d664-5ef9-47c1-a540-9af664860a7c' 
  AND name = 'Main Portfolio'
  LIMIT 1
)
INSERT INTO public.option_holdings (
  portfolio_id, option_symbol, underlying_symbol, option_type, 
  direction, contracts, strike_price, expiration_date, 
  cost_price, current_price, delta_value
)
SELECT 
  p.id,
  v.option_symbol,
  v.underlying_symbol,
  v.option_type,
  v.direction,
  v.contracts,
  v.strike_price,
  v.expiration_date::date,
  v.cost_price,
  v.current_price,
  v.delta_value
FROM portfolio p
CROSS JOIN (VALUES
  ('MSFT 250718P500', 'MSFT', 'PUT', 'SELL', -1, 500.00, '2025-07-18', 5.00, 1.00, -0.10),
  ('AAPL 260116C300', 'AAPL', 'CALL', 'BUY', 2, 300.00, '2026-01-16', 10.00, 18.00, 0.40),
  ('GOOGL 250815P2000', 'GOOGL', 'PUT', 'SELL', -1, 2000.00, '2025-08-15', 8.00, 2.00, -0.05),
  ('NVDA 251219C700', 'NVDA', 'CALL', 'BUY', 1, 700.00, '2025-12-19', 25.00, 45.00, 0.35)
) AS v(option_symbol, underlying_symbol, option_type, direction, contracts, strike_price, expiration_date, cost_price, current_price, delta_value)
ON CONFLICT DO NOTHING;

-- Ensure risk settings exist
INSERT INTO public.risk_settings (
  user_id, leverage_safe_threshold, leverage_warning_threshold,
  concentration_limit, industry_concentration_limit, min_cash_ratio,
  leverage_alerts, expiration_alerts, volatility_alerts,
  data_update_frequency
)
VALUES (
  '8e82d664-5ef9-47c1-a540-9af664860a7c',
  1.0, 1.5, 20.0, 60.0, 30.0,
  true, true, false, 5
)
ON CONFLICT (user_id) DO UPDATE
SET 
  leverage_safe_threshold = EXCLUDED.leverage_safe_threshold,
  leverage_warning_threshold = EXCLUDED.leverage_warning_threshold;

-- Verify the data
SELECT 'Portfolios:' as table_name, COUNT(*) as count 
FROM public.portfolios 
WHERE user_id = '8e82d664-5ef9-47c1-a540-9af664860a7c'
UNION ALL
SELECT 'Stock Holdings:', COUNT(*) 
FROM public.stock_holdings sh
JOIN public.portfolios p ON sh.portfolio_id = p.id
WHERE p.user_id = '8e82d664-5ef9-47c1-a540-9af664860a7c'
UNION ALL
SELECT 'Option Holdings:', COUNT(*) 
FROM public.option_holdings oh
JOIN public.portfolios p ON oh.portfolio_id = p.id
WHERE p.user_id = '8e82d664-5ef9-47c1-a540-9af664860a7c'
UNION ALL
SELECT 'Risk Settings:', COUNT(*) 
FROM public.risk_settings
WHERE user_id = '8e82d664-5ef9-47c1-a540-9af664860a7c';