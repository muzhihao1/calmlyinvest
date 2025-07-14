-- 直接SQL更新脚本 - 在Supabase SQL编辑器中运行此脚本
-- Direct SQL update for user 279838958@qq.com

-- 1. 首先查看用户信息
SELECT id, email FROM auth.users WHERE email = '279838958@qq.com';

-- 2. 获取用户ID后，更新或创建portfolio
-- 注意：将下面的 'USER_ID_HERE' 替换为上面查询得到的实际用户ID
DO $$
DECLARE
    v_user_id UUID;
    v_portfolio_id UUID;
BEGIN
    -- 获取用户ID
    SELECT id INTO v_user_id FROM auth.users WHERE email = '279838958@qq.com';
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User 279838958@qq.com not found';
    END IF;
    
    -- 检查是否已有portfolio
    SELECT id INTO v_portfolio_id FROM portfolios WHERE user_id = v_user_id LIMIT 1;
    
    IF v_portfolio_id IS NULL THEN
        -- 创建新的portfolio
        INSERT INTO portfolios (user_id, name, total_equity, cash_balance, margin_used)
        VALUES (v_user_id, '主账户', 44338.00, 14400.00, 40580.97)
        RETURNING id INTO v_portfolio_id;
        
        RAISE NOTICE 'Created new portfolio with ID: %', v_portfolio_id;
    ELSE
        -- 更新现有portfolio
        UPDATE portfolios 
        SET total_equity = 44338.00, 
            cash_balance = 14400.00, 
            margin_used = 40580.97,
            updated_at = NOW()
        WHERE id = v_portfolio_id;
        
        RAISE NOTICE 'Updated existing portfolio ID: %', v_portfolio_id;
    END IF;
    
    -- 清除现有持仓
    DELETE FROM stock_holdings WHERE portfolio_id = v_portfolio_id;
    DELETE FROM option_holdings WHERE portfolio_id = v_portfolio_id;
    
    -- 添加股票持仓
    INSERT INTO stock_holdings (portfolio_id, symbol, name, quantity, cost_price, current_price) VALUES
    (v_portfolio_id, 'AMZN', 'Amazon.com Inc', 30, 220.00, 224.95),
    (v_portfolio_id, 'CRWD', 'CrowdStrike Holdings', 10, 480.00, 477.40),
    (v_portfolio_id, 'PLTR', 'Palantir Technologies', 38, 140.00, 141.95),
    (v_portfolio_id, 'SHOP', 'Shopify Inc', 32, 115.00, 112.23),
    (v_portfolio_id, 'TSLA', 'Tesla Inc', 40, 310.00, 312.75);
    
    -- 添加期权持仓
    INSERT INTO option_holdings (
        portfolio_id, option_symbol, underlying_symbol, option_type, 
        direction, contracts, strike_price, expiration_date, 
        cost_price, current_price, delta_value
    ) VALUES
    (v_portfolio_id, 'MSFT250718P00500000', 'MSFT', 'PUT', 'SELL', 1, 500.00, '2025-07-18', 3.30, 2.52, -0.349),
    (v_portfolio_id, 'NVDA250822P00165000', 'NVDA', 'PUT', 'SELL', 1, 165.00, '2025-08-22', 8.00, 7.55, -0.465),
    (v_portfolio_id, 'NVDA250919P00170000', 'NVDA', 'PUT', 'SELL', 1, 170.00, '2025-09-19', 14.00, 13.62, -0.522),
    (v_portfolio_id, 'QQQ250725P00555000', 'QQQ', 'PUT', 'SELL', 1, 555.00, '2025-07-25', 7.00, 6.60, -0.495);
    
    RAISE NOTICE 'Successfully updated portfolio for user 279838958@qq.com';
END $$;

-- 3. 验证更新结果
SELECT 
    'Portfolio' as type,
    p.id,
    p.name,
    p.total_equity,
    p.cash_balance,
    p.margin_used
FROM portfolios p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = '279838958@qq.com';

-- 查看股票持仓
SELECT 
    'Stock' as type,
    sh.symbol,
    sh.quantity,
    sh.current_price,
    (sh.quantity * sh.current_price::numeric) as market_value
FROM stock_holdings sh
JOIN portfolios p ON sh.portfolio_id = p.id
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = '279838958@qq.com';

-- 查看期权持仓
SELECT 
    'Option' as type,
    oh.underlying_symbol,
    oh.strike_price,
    oh.option_type,
    oh.expiration_date
FROM option_holdings oh
JOIN portfolios p ON oh.portfolio_id = p.id
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = '279838958@qq.com';