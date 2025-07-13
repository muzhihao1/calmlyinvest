-- Manual migration for user 279838958@qq.com (UUID: 8e82d664-5ef9-47c1-a540-9af664860a7c)

-- 1. Create portfolio
INSERT INTO portfolios (user_id, name, total_equity, cash_balance, margin_used)
VALUES ('8e82d664-5ef9-47c1-a540-9af664860a7c', '我的投资组合', 1000000, 300000, 700000)
ON CONFLICT (user_id, name) DO UPDATE 
SET total_equity = EXCLUDED.total_equity,
    cash_balance = EXCLUDED.cash_balance,
    margin_used = EXCLUDED.margin_used;

-- Get the portfolio ID
WITH portfolio AS (
  SELECT id FROM portfolios 
  WHERE user_id = '8e82d664-5ef9-47c1-a540-9af664860a7c' 
  AND name = '我的投资组合'
)
-- 2. Insert stock holdings
INSERT INTO stock_holdings (portfolio_id, symbol, name, quantity, cost_price, current_price, beta)
SELECT 
  p.id,
  v.symbol,
  v.name,
  v.quantity,
  v.cost_price,
  v.current_price,
  v.beta
FROM portfolio p,
(VALUES 
  ('AAPL', 'Apple Inc.', 100, 150.00, 175.00, 1.2),
  ('GOOGL', 'Alphabet Inc.', 50, 2500.00, 2800.00, 1.1),
  ('MSFT', 'Microsoft Corp.', 80, 300.00, 350.00, 0.9),
  ('TSLA', 'Tesla Inc.', 30, 700.00, 850.00, 1.8)
) AS v(symbol, name, quantity, cost_price, current_price, beta)
ON CONFLICT DO NOTHING;

-- 3. Insert option holdings
WITH portfolio AS (
  SELECT id FROM portfolios 
  WHERE user_id = '8e82d664-5ef9-47c1-a540-9af664860a7c' 
  AND name = '我的投资组合'
)
INSERT INTO option_holdings (portfolio_id, option_symbol, underlying_symbol, option_type, direction, contracts, strike_price, expiration_date, cost_price, current_price, delta_value)
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
FROM portfolio p,
(VALUES 
  ('SPY240315C00450000', 'SPY', 'CALL', 'BUY', 10, 450.00, '2024-03-15', 5.50, 8.25, 0.65),
  ('SPY240315P00420000', 'SPY', 'PUT', 'SELL', 5, 420.00, '2024-03-15', 3.75, 2.10, -0.25)
) AS v(option_symbol, underlying_symbol, option_type, direction, contracts, strike_price, expiration_date, cost_price, current_price, delta_value)
ON CONFLICT DO NOTHING;

-- 4. Insert risk settings
INSERT INTO risk_settings (user_id, leverage_safe_threshold, leverage_warning_threshold, concentration_limit, 
  industry_concentration_limit, min_cash_ratio, leverage_alerts, expiration_alerts, volatility_alerts, data_update_frequency)
VALUES ('8e82d664-5ef9-47c1-a540-9af664860a7c', 1.0, 1.5, 25.0, 60.0, 30.0, true, true, false, 5)
ON CONFLICT (user_id) DO NOTHING;

-- 5. Check results
SELECT 'Portfolio:' as table_name, COUNT(*) as count FROM portfolios WHERE user_id = '8e82d664-5ef9-47c1-a540-9af664860a7c'
UNION ALL
SELECT 'Stock Holdings:', COUNT(*) FROM stock_holdings WHERE portfolio_id IN (SELECT id FROM portfolios WHERE user_id = '8e82d664-5ef9-47c1-a540-9af664860a7c')
UNION ALL
SELECT 'Option Holdings:', COUNT(*) FROM option_holdings WHERE portfolio_id IN (SELECT id FROM portfolios WHERE user_id = '8e82d664-5ef9-47c1-a540-9af664860a7c')
UNION ALL
SELECT 'Risk Settings:', COUNT(*) FROM risk_settings WHERE user_id = '8e82d664-5ef9-47c1-a540-9af664860a7c';