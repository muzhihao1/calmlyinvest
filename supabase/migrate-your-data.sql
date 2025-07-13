-- 为您的账号创建Supabase用户和迁移数据的脚本
-- 注意：需要先在Supabase Auth中创建用户账号

-- 假设您已经通过Supabase Auth创建了账号，获得了user ID
-- 请将下面的 'YOUR_SUPABASE_USER_ID' 替换为实际的用户ID

DO $$
DECLARE
  v_user_id UUID := 'YOUR_SUPABASE_USER_ID'; -- 替换为您的实际用户ID
  v_portfolio_id INTEGER;
BEGIN
  -- 创建用户profile
  INSERT INTO profiles (id, username, display_name)
  VALUES (v_user_id, '279838958@qq.com', 'muzhihao')
  ON CONFLICT (id) DO NOTHING;
  
  -- 创建投资组合
  INSERT INTO portfolios (user_id, name, total_equity, cash_balance, margin_used)
  VALUES (v_user_id, 'Main Portfolio', 44337.96, 14387.18, 40580.97)
  RETURNING id INTO v_portfolio_id;
  
  -- 插入股票持仓
  INSERT INTO stock_holdings (portfolio_id, symbol, name, quantity, cost_price, current_price, beta) VALUES
  (v_portfolio_id, 'AMZN', 'Amazon.com Inc', 30, 222.31, 225.02, 1.33),
  (v_portfolio_id, 'CRWD', 'CrowdStrike Holdings', 10, 487.11, 478.45, 1.16),
  (v_portfolio_id, 'PLTR', 'Palantir Technologies', 38, 143.05, 142.10, 2.64),
  (v_portfolio_id, 'SHOP', 'Shopify Inc', 32, 115.16, 112.11, 2.63),
  (v_portfolio_id, 'TSLA', 'Tesla Inc', 40, 309.87, 313.51, 2.46);
  
  -- 插入期权持仓
  INSERT INTO option_holdings (portfolio_id, option_symbol, underlying_symbol, option_type, direction, contracts, strike_price, expiration_date, cost_price, current_price, delta_value) VALUES
  (v_portfolio_id, 'MSFT 250718P500', 'MSFT', 'PUT', 'SELL', -1, 500.00, '2025-07-18', 3.31, 2.52, -0.349),
  (v_portfolio_id, 'NVDA 250822P165', 'NVDA', 'PUT', 'SELL', -1, 165.00, '2025-08-22', 7.96, 7.55, -0.465),
  (v_portfolio_id, 'NVDA 250919P170', 'NVDA', 'PUT', 'SELL', -1, 170.00, '2025-09-19', 14.09, 13.62, -0.522),
  (v_portfolio_id, 'QQQ 250725P555', 'QQQ', 'PUT', 'SELL', -1, 555.00, '2025-07-25', 6.13, 6.60, -0.495);
  
  -- 创建风险设置（如果不存在）
  INSERT INTO risk_settings (user_id)
  VALUES (v_user_id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RAISE NOTICE 'Data migration completed successfully for user %', v_user_id;
END $$;