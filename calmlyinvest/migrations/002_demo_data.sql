-- Insert demo user (password: demo123)
-- Note: In production, passwords should be hashed
INSERT INTO users (username, password) 
VALUES ('demo', '$2a$10$YourHashedPasswordHere')
ON CONFLICT (username) DO NOTHING;

-- Get demo user ID
WITH demo_user AS (
    SELECT id FROM users WHERE username = 'demo' LIMIT 1
)
-- Insert demo portfolio
INSERT INTO portfolios (user_id, name, total_equity, cash_balance, margin_used)
SELECT id, 'Demo Portfolio', 50000.00, 15000.00, 35000.00
FROM demo_user
WHERE NOT EXISTS (
    SELECT 1 FROM portfolios WHERE user_id = (SELECT id FROM demo_user)
);

-- Insert demo risk settings
WITH demo_user AS (
    SELECT id FROM users WHERE username = 'demo' LIMIT 1
)
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
SELECT 
    id,
    1.0,
    1.5,
    20.0,
    60.0,
    30.0,
    true,
    true,
    false,
    5
FROM demo_user
ON CONFLICT (user_id) DO NOTHING;