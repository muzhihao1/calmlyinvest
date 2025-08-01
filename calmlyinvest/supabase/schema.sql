-- 创建用户表（如果使用Supabase Auth，这个表是可选的）
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建投资组合表
CREATE TABLE IF NOT EXISTS portfolios (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
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
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
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

-- 插入您的账号数据（使用简单密码）
INSERT INTO users (id, username, password) VALUES 
(2, '279838958@qq.com', 'muzhihao12');

-- 插入您的投资组合
INSERT INTO portfolios (id, user_id, name, total_equity, cash_balance, margin_used) VALUES
(2, 2, 'Main Portfolio', 44337.96, 14387.18, 40580.97);

-- 插入您的股票持仓
INSERT INTO stock_holdings (portfolio_id, symbol, name, quantity, cost_price, current_price, beta) VALUES
(2, 'AMZN', 'Amazon.com Inc', 30, 222.31, 225.02, 1.33),
(2, 'CRWD', 'CrowdStrike Holdings', 10, 487.11, 478.45, 1.16),
(2, 'PLTR', 'Palantir Technologies', 38, 143.05, 142.10, 2.64),
(2, 'SHOP', 'Shopify Inc', 32, 115.16, 112.11, 2.63),
(2, 'TSLA', 'Tesla Inc', 40, 309.87, 313.51, 2.46);

-- 插入您的期权持仓
INSERT INTO option_holdings (portfolio_id, option_symbol, underlying_symbol, option_type, direction, contracts, strike_price, expiration_date, cost_price, current_price, delta_value) VALUES
(2, 'MSFT 250718P500', 'MSFT', 'PUT', 'SELL', -1, 500.00, '2025-07-18', 3.31, 2.52, -0.349),
(2, 'NVDA 250822P165', 'NVDA', 'PUT', 'SELL', -1, 165.00, '2025-08-22', 7.96, 7.55, -0.465),
(2, 'NVDA 250919P170', 'NVDA', 'PUT', 'SELL', -1, 170.00, '2025-09-19', 14.09, 13.62, -0.522),
(2, 'QQQ 250725P555', 'QQQ', 'PUT', 'SELL', -1, 555.00, '2025-07-25', 6.13, 6.60, -0.495);

-- 插入您的风险设置
INSERT INTO risk_settings (user_id) VALUES (2);