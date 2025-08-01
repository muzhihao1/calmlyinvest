-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create portfolios table
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

-- Create stock_holdings table
CREATE TABLE IF NOT EXISTS stock_holdings (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE,
    symbol VARCHAR(20) NOT NULL,
    name VARCHAR(255),
    quantity INTEGER NOT NULL,
    cost_price DECIMAL(20, 4) NOT NULL,
    current_price DECIMAL(20, 4),
    beta DECIMAL(10, 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create option_holdings table
CREATE TABLE IF NOT EXISTS option_holdings (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE,
    option_symbol VARCHAR(50) NOT NULL,
    underlying_symbol VARCHAR(20) NOT NULL,
    option_type VARCHAR(4) CHECK (option_type IN ('CALL', 'PUT')),
    direction VARCHAR(4) CHECK (direction IN ('BUY', 'SELL')),
    contracts INTEGER NOT NULL,
    strike_price DECIMAL(20, 4) NOT NULL,
    expiration_date DATE NOT NULL,
    cost_price DECIMAL(20, 4) NOT NULL,
    current_price DECIMAL(20, 4),
    delta_value DECIMAL(10, 4),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create risk_metrics table
CREATE TABLE IF NOT EXISTS risk_metrics (
    id SERIAL PRIMARY KEY,
    portfolio_id INTEGER REFERENCES portfolios(id) ON DELETE CASCADE,
    leverage_ratio DECIMAL(10, 4),
    portfolio_beta DECIMAL(10, 4),
    max_concentration DECIMAL(10, 4),
    margin_usage_ratio DECIMAL(10, 4),
    risk_level VARCHAR(20),
    calculated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create risk_settings table
CREATE TABLE IF NOT EXISTS risk_settings (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    leverage_safe_threshold DECIMAL(10, 4) DEFAULT 1.0,
    leverage_warning_threshold DECIMAL(10, 4) DEFAULT 1.5,
    concentration_limit DECIMAL(10, 4) DEFAULT 20.0,
    industry_concentration_limit DECIMAL(10, 4) DEFAULT 60.0,
    min_cash_ratio DECIMAL(10, 4) DEFAULT 30.0,
    leverage_alerts BOOLEAN DEFAULT true,
    expiration_alerts BOOLEAN DEFAULT true,
    volatility_alerts BOOLEAN DEFAULT false,
    data_update_frequency INTEGER DEFAULT 5,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_stock_holdings_portfolio_id ON stock_holdings(portfolio_id);
CREATE INDEX idx_stock_holdings_symbol ON stock_holdings(symbol);
CREATE INDEX idx_option_holdings_portfolio_id ON option_holdings(portfolio_id);
CREATE INDEX idx_option_holdings_underlying ON option_holdings(underlying_symbol);
CREATE INDEX idx_option_holdings_expiration ON option_holdings(expiration_date);
CREATE INDEX idx_risk_metrics_portfolio_id ON risk_metrics(portfolio_id);
CREATE INDEX idx_risk_settings_user_id ON risk_settings(user_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_portfolios_updated_at BEFORE UPDATE ON portfolios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_stock_holdings_updated_at BEFORE UPDATE ON stock_holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_option_holdings_updated_at BEFORE UPDATE ON option_holdings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_settings_updated_at BEFORE UPDATE ON risk_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();