-- 使用Supabase Auth后的数据库架构
-- Supabase会自动创建auth.users表，所以我们不需要创建users表

-- 创建用户配置文件表（关联auth.users）
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username VARCHAR(255) UNIQUE,
  display_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建投资组合表
CREATE TABLE IF NOT EXISTS portfolios (
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
CREATE TABLE IF NOT EXISTS stock_holdings (
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
CREATE TABLE IF NOT EXISTS option_holdings (
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
CREATE TABLE IF NOT EXISTS risk_settings (
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
CREATE TABLE IF NOT EXISTS risk_metrics (
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

-- 启用Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_metrics ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- Profiles表：用户只能看到和修改自己的profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Portfolios表：用户只能看到自己的投资组合
CREATE POLICY "Users can view own portfolios" ON portfolios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own portfolios" ON portfolios
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios" ON portfolios
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios" ON portfolios
  FOR DELETE USING (auth.uid() = user_id);

-- Stock holdings表：通过portfolio关联检查权限
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

-- Option holdings表：通过portfolio关联检查权限
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

-- Risk settings表：用户只能看到自己的设置
CREATE POLICY "Users can view own risk settings" ON risk_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own risk settings" ON risk_settings
  FOR ALL USING (auth.uid() = user_id);

-- Risk metrics表：通过portfolio关联检查权限
CREATE POLICY "Users can view own risk metrics" ON risk_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM portfolios 
      WHERE portfolios.id = risk_metrics.portfolio_id 
      AND portfolios.user_id = auth.uid()
    )
  );

-- 创建触发器：新用户注册时自动创建profile和默认portfolio
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- 创建用户profile
  INSERT INTO public.profiles (id, username, display_name)
  VALUES (new.id, new.email, split_part(new.email, '@', 1));
  
  -- 创建默认portfolio
  INSERT INTO public.portfolios (user_id, name, total_equity, cash_balance, margin_used)
  VALUES (new.id, 'Main Portfolio', 50000.00, 50000.00, 0.00);
  
  -- 创建默认风险设置
  INSERT INTO public.risk_settings (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();