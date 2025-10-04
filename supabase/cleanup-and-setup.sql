-- 清理脚本：删除所有旧表和重新创建

-- 第1步：删除所有旧表（按依赖顺序）
DROP TABLE IF EXISTS risk_metrics CASCADE;
DROP TABLE IF EXISTS risk_settings CASCADE;
DROP TABLE IF EXISTS option_holdings CASCADE;
DROP TABLE IF EXISTS stock_holdings CASCADE;
DROP TABLE IF EXISTS portfolios CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;  -- 删除旧的users表

-- 第2步：删除旧触发器和函数
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

-- 第3步：重新创建所有表（使用UUID）
-- 创建用户配置文件表
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(255) UNIQUE,
  display_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建投资组合表
CREATE TABLE portfolios (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  total_equity DECIMAL(20, 2),
  cash_balance DECIMAL(20, 2),
  margin_used DECIMAL(20, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建股票持仓表
CREATE TABLE stock_holdings (
  id SERIAL PRIMARY KEY,
  portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE,
  symbol VARCHAR(20) NOT NULL,
  name VARCHAR(255),
  quantity INTEGER NOT NULL,
  cost_price DECIMAL(20, 2) NOT NULL,
  current_price DECIMAL(20, 2),
  beta DECIMAL(10, 2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建期权持仓表
CREATE TABLE option_holdings (
  id SERIAL PRIMARY KEY,
  portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE,
  option_symbol VARCHAR(50) NOT NULL,
  underlying_symbol VARCHAR(20) NOT NULL,
  option_type VARCHAR(10) CHECK (option_type IN ('CALL', 'PUT')),
  direction VARCHAR(10) CHECK (direction IN ('BUY', 'SELL')),
  contracts INTEGER NOT NULL,
  strike_price DECIMAL(20, 2) NOT NULL,
  expiration_date DATE NOT NULL,
  cost_price DECIMAL(20, 2) NOT NULL,
  current_price DECIMAL(20, 2),
  delta_value DECIMAL(10, 3),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建风险设置表
CREATE TABLE risk_settings (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  leverage_safe_threshold DECIMAL(10, 2) DEFAULT 1.0,
  leverage_warning_threshold DECIMAL(10, 2) DEFAULT 1.5,
  concentration_limit DECIMAL(10, 2) DEFAULT 20.0,
  industry_concentration_limit DECIMAL(10, 2) DEFAULT 60.0,
  min_cash_ratio DECIMAL(10, 2) DEFAULT 30.0,
  leverage_alerts BOOLEAN DEFAULT true,
  expiration_alerts BOOLEAN DEFAULT true,
  volatility_alerts BOOLEAN DEFAULT false,
  data_update_frequency INTEGER DEFAULT 5,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建风险指标表
CREATE TABLE risk_metrics (
  id SERIAL PRIMARY KEY,
  portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE,
  leverage_ratio DECIMAL(10, 2),
  risk_level VARCHAR(20),
  portfolio_beta DECIMAL(10, 2),
  max_concentration DECIMAL(10, 2),
  margin_usage_ratio DECIMAL(10, 2),
  remaining_liquidity DECIMAL(10, 2),
  stock_value DECIMAL(20, 2),
  option_value DECIMAL(20, 2),
  calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_stock_holdings_portfolio_id ON stock_holdings(portfolio_id);
CREATE INDEX idx_option_holdings_portfolio_id ON option_holdings(portfolio_id);
CREATE INDEX idx_risk_metrics_portfolio_id ON risk_metrics(portfolio_id);

-- 启用RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_metrics ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own portfolios" ON portfolios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own portfolios" ON portfolios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios" ON portfolios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios" ON portfolios
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own stock holdings" ON stock_holdings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM portfolios 
      WHERE portfolios.id = stock_holdings.portfolio_id 
      AND portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own stock holdings" ON stock_holdings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM portfolios 
      WHERE portfolios.id = stock_holdings.portfolio_id 
      AND portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own option holdings" ON option_holdings
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM portfolios 
      WHERE portfolios.id = option_holdings.portfolio_id 
      AND portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own option holdings" ON option_holdings
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM portfolios 
      WHERE portfolios.id = option_holdings.portfolio_id 
      AND portfolios.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view own risk settings" ON risk_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own risk settings" ON risk_settings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own risk metrics" ON risk_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM portfolios 
      WHERE portfolios.id = risk_metrics.portfolio_id 
      AND portfolios.user_id = auth.uid()
    )
  );

-- 第4步：创建新的触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
DECLARE
  v_portfolio_id INTEGER;
BEGIN
  -- 创建用户profile
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (new.id, new.email, split_part(new.email, '@', 1))
  ON CONFLICT (id) DO NOTHING;
  
  -- 为特定邮箱（您的账号）创建完整数据
  IF new.email = '279838958@qq.com' THEN
    -- 创建投资组合
    INSERT INTO public.portfolios (user_id, name, total_equity, cash_balance, margin_used)
    VALUES (new.id, 'Main Portfolio', 44337.96, 14387.18, 40580.97)
    RETURNING id INTO v_portfolio_id;
    
    -- 插入股票持仓
    INSERT INTO public.stock_holdings (portfolio_id, symbol, name, quantity, cost_price, current_price, beta) VALUES
    (v_portfolio_id, 'AMZN', 'Amazon.com Inc', 30, 222.31, 225.02, 1.33),
    (v_portfolio_id, 'CRWD', 'CrowdStrike Holdings', 10, 487.11, 478.45, 1.16),
    (v_portfolio_id, 'PLTR', 'Palantir Technologies', 38, 143.05, 142.10, 2.64),
    (v_portfolio_id, 'SHOP', 'Shopify Inc', 32, 115.16, 112.11, 2.63),
    (v_portfolio_id, 'TSLA', 'Tesla Inc', 40, 309.87, 313.51, 2.46);
    
    -- 插入期权持仓
    INSERT INTO public.option_holdings (portfolio_id, option_symbol, underlying_symbol, option_type, direction, contracts, strike_price, expiration_date, cost_price, current_price, delta_value) VALUES
    (v_portfolio_id, 'MSFT 250718P500', 'MSFT', 'PUT', 'SELL', -1, 500.00, '2025-07-18', 3.31, 2.52, -0.349),
    (v_portfolio_id, 'NVDA 250822P165', 'NVDA', 'PUT', 'SELL', -1, 165.00, '2025-08-22', 7.96, 7.55, -0.465),
    (v_portfolio_id, 'NVDA 250919P170', 'NVDA', 'PUT', 'SELL', -1, 170.00, '2025-09-19', 14.09, 13.62, -0.522),
    (v_portfolio_id, 'QQQ 250725P555', 'QQQ', 'PUT', 'SELL', -1, 555.00, '2025-07-25', 6.13, 6.60, -0.495);
  ELSE
    -- 其他用户创建默认空portfolio
    INSERT INTO public.portfolios (user_id, name, total_equity, cash_balance, margin_used)
    VALUES (new.id, 'Main Portfolio', 50000.00, 50000.00, 0.00);
  END IF;
  
  -- 创建默认风险设置
  INSERT INTO public.risk_settings (user_id)
  VALUES (new.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

DO $$
BEGIN
  RAISE NOTICE '✅ 数据库清理和重建完成！';
  RAISE NOTICE '📧 现在请创建您的账号：279838958@qq.com';
  RAISE NOTICE '🔑 密码：muzhihao12';
END $$;