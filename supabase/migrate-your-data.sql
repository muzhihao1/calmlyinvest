-- Step 2: Migrate existing data from integer to UUID tables

-- First, create a temporary mapping table for portfolio IDs
CREATE TEMP TABLE portfolio_id_mapping AS
SELECT 
    id as old_id,
    gen_random_uuid() as new_id
FROM portfolios;

-- Migrate portfolios data
INSERT INTO portfolios_new (id, user_id, name, total_equity, cash_balance, margin_used, created_at, updated_at)
SELECT 
    m.new_id as id,
    '8e82d664-5ef9-47c1-a540-9af664860a7c'::uuid as user_id,
    p.name,
    p.total_equity,
    p.cash_balance,
    p.margin_used,
    p.created_at,
    p.updated_at
FROM portfolios p
JOIN portfolio_id_mapping m ON p.id = m.old_id;

-- Migrate stock holdings with correct column names
INSERT INTO stock_holdings_new (portfolio_id, stock_symbol, stock_name, shares, cost_price, current_price, beta, created_at, updated_at)
SELECT 
    m.new_id as portfolio_id,
    sh.symbol as stock_symbol,
    sh.name as stock_name,
    sh.quantity as shares,
    sh.cost_price,
    sh.current_price,
    sh.beta,
    sh.created_at,
    sh.updated_at
FROM stock_holdings sh
JOIN portfolio_id_mapping m ON sh.portfolio_id = m.old_id;

-- Migrate option holdings
INSERT INTO option_holdings_new (portfolio_id, option_symbol, underlying_symbol, option_type, direction, contracts, strike_price, expiration_date, cost_price, current_price, delta_value, created_at, updated_at)
SELECT 
    m.new_id as portfolio_id,
    oh.option_symbol,
    oh.underlying_symbol,
    oh.option_type,
    oh.direction,
    oh.contracts,
    oh.strike_price,
    oh.expiration_date,
    oh.cost_price,
    oh.current_price,
    oh.delta_value,
    oh.created_at,
    oh.updated_at
FROM option_holdings oh
JOIN portfolio_id_mapping m ON oh.portfolio_id = m.old_id;

-- Migrate risk metrics
INSERT INTO risk_metrics_new (portfolio_id, leverage_ratio, portfolio_beta, max_concentration, margin_usage_ratio, risk_level, calculated_at)
SELECT 
    m.new_id as portfolio_id,
    rm.leverage_ratio,
    rm.portfolio_beta,
    rm.max_concentration,
    rm.margin_usage_ratio,
    rm.risk_level,
    rm.calculated_at
FROM risk_metrics rm
JOIN portfolio_id_mapping m ON rm.portfolio_id = m.old_id;

-- Migrate risk settings
INSERT INTO risk_settings_new (user_id, leverage_safe_threshold, leverage_warning_threshold, concentration_limit, industry_concentration_limit, min_cash_ratio, leverage_alerts, expiration_alerts, volatility_alerts, data_update_frequency, created_at, updated_at)
SELECT 
    '8e82d664-5ef9-47c1-a540-9af664860a7c'::uuid as user_id,
    rs.leverage_safe_threshold,
    rs.leverage_warning_threshold,
    rs.concentration_limit,
    rs.industry_concentration_limit,
    rs.min_cash_ratio,
    rs.leverage_alerts,
    rs.expiration_alerts,
    rs.volatility_alerts,
    rs.data_update_frequency,
    rs.created_at,
    rs.updated_at
FROM risk_settings rs
WHERE rs.user_id IN (SELECT id FROM users WHERE username = 'demo');

-- Migrate risk history
INSERT INTO risk_history_new (portfolio_id, leverage_ratio, portfolio_beta, max_concentration, margin_usage_ratio, remaining_liquidity, risk_level, stock_value, option_max_loss, total_equity, recorded_at)
SELECT 
    m.new_id as portfolio_id,
    rh.leverage_ratio,
    rh.portfolio_beta,
    rh.max_concentration,
    rh.margin_usage_ratio,
    rh.remaining_liquidity,
    rh.risk_level,
    rh.stock_value,
    rh.option_max_loss,
    rh.total_equity,
    rh.recorded_at
FROM risk_history rh
JOIN portfolio_id_mapping m ON rh.portfolio_id = m.old_id;

-- Verify migration results
SELECT 'Portfolios migrated: ' || COUNT(*) FROM portfolios_new;
SELECT 'Stock holdings migrated: ' || COUNT(*) FROM stock_holdings_new;
SELECT 'Option holdings migrated: ' || COUNT(*) FROM option_holdings_new;
SELECT 'Risk metrics migrated: ' || COUNT(*) FROM risk_metrics_new;
SELECT 'Risk settings migrated: ' || COUNT(*) FROM risk_settings_new;
SELECT 'Risk history migrated: ' || COUNT(*) FROM risk_history_new;