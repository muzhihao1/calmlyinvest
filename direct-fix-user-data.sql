-- 直接修复用户数据 - 完整解决方案
-- 账号: 27983958@qq.com
-- 密码: 123456

-- ================================================
-- 第一步：修复 risk_settings 表结构
-- ================================================

-- 检查当前 risk_settings 表结构
SELECT 'step 1: 检查 risk_settings 表结构' as step;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'risk_settings' 
AND table_schema = 'public';

-- 重新创建 risk_settings 表，确保结构正确
DROP TABLE IF EXISTS public.risk_settings CASCADE;

CREATE TABLE public.risk_settings (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    leverage_safe_threshold DECIMAL(10, 2) DEFAULT 1.0,
    leverage_warning_threshold DECIMAL(10, 2) DEFAULT 1.5,
    concentration_limit DECIMAL(10, 2) DEFAULT 20.0,
    industry_concentration_limit DECIMAL(10, 2) DEFAULT 60.0,
    min_cash_ratio DECIMAL(10, 2) DEFAULT 30.0,
    leverage_alerts BOOLEAN DEFAULT true,
    expiration_alerts BOOLEAN DEFAULT true,
    volatility_alerts BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 启用 RLS
ALTER TABLE public.risk_settings ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Users can view own risk settings" ON public.risk_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own risk settings" ON public.risk_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own risk settings" ON public.risk_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own risk settings" ON public.risk_settings
    FOR DELETE USING (auth.uid() = user_id);

-- ================================================
-- 第二步：创建/更新用户
-- ================================================

DO $$
DECLARE
    user_uuid UUID;
    portfolio_id INT;
BEGIN
    RAISE NOTICE 'step 2: 创建/更新用户账号';
    
    -- 查找现有用户或创建新用户
    SELECT id INTO user_uuid FROM auth.users WHERE email = '27983958@qq.com';
    
    IF user_uuid IS NULL THEN
        -- 创建新用户
        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            invited_at,
            confirmation_token,
            confirmation_sent_at,
            recovery_token,
            recovery_sent_at,
            email_change_token_new,
            email_change,
            email_change_sent_at,
            last_sign_in_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            created_at,
            updated_at,
            phone,
            phone_confirmed_at,
            phone_change,
            phone_change_token,
            phone_change_sent_at,
            email_change_token_current,
            email_change_confirm_status,
            banned_until,
            reauthentication_token,
            reauthentication_sent_at,
            is_sso_user,
            deleted_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            '27983958@qq.com',
            crypt('123456', gen_salt('bf')),
            NOW(),
            NOW(),
            '',
            NOW(),
            '',
            NULL,
            '',
            '',
            NULL,
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{}',
            FALSE,
            NOW(),
            NOW(),
            NULL,
            NULL,
            '',
            '',
            NULL,
            '',
            0,
            NULL,
            '',
            NULL,
            FALSE,
            NULL
        ) RETURNING id INTO user_uuid;
        
        RAISE NOTICE '✅ 新用户已创建: %', user_uuid;
    ELSE
        -- 更新现有用户密码
        UPDATE auth.users 
        SET encrypted_password = crypt('123456', gen_salt('bf')),
            updated_at = NOW()
        WHERE id = user_uuid;
        
        RAISE NOTICE '✅ 现有用户已更新: %', user_uuid;
    END IF;

    -- ================================================
    -- 第三步：清理现有数据
    -- ================================================
    
    RAISE NOTICE 'step 3: 清理现有数据';
    
    -- 删除现有数据（使用表别名避免歧义）
    DELETE FROM public.risk_metrics rm 
    WHERE rm.portfolio_id IN (
        SELECT p.id FROM public.portfolios p WHERE p.user_id = user_uuid
    );
    
    DELETE FROM public.option_holdings oh 
    WHERE oh.portfolio_id IN (
        SELECT p.id FROM public.portfolios p WHERE p.user_id = user_uuid
    );
    
    DELETE FROM public.stock_holdings sh 
    WHERE sh.portfolio_id IN (
        SELECT p.id FROM public.portfolios p WHERE p.user_id = user_uuid
    );
    
    DELETE FROM public.portfolios p WHERE p.user_id = user_uuid;
    DELETE FROM public.profiles pr WHERE pr.id = user_uuid;
    DELETE FROM public.risk_settings rs WHERE rs.user_id = user_uuid;
    
    RAISE NOTICE '✅ 现有数据已清理';

    -- ================================================
    -- 第四步：创建用户档案（使用正确的列名）
    -- ================================================
    
    RAISE NOTICE 'step 4: 创建用户档案';
    
    INSERT INTO public.profiles (id, username, display_name, created_at, updated_at)
    VALUES (user_uuid, '27983958@qq.com', '27983958@qq.com', NOW(), NOW())
    ON CONFLICT (id) DO UPDATE SET
        username = EXCLUDED.username,
        display_name = EXCLUDED.display_name,
        updated_at = NOW();
    
    RAISE NOTICE '✅ 用户档案已创建';

    -- ================================================
    -- 第五步：创建投资组合
    -- ================================================
    
    RAISE NOTICE 'step 5: 创建投资组合';
    
    INSERT INTO public.portfolios (user_id, name, total_equity, cash_balance, margin_used, created_at, updated_at)
    VALUES (user_uuid, '主账户', 44337.96, 14400.00, 40580.97, NOW(), NOW())
    RETURNING id INTO portfolio_id;
    
    RAISE NOTICE '✅ 投资组合已创建: %', portfolio_id;

    -- ================================================
    -- 第六步：插入股票持仓（使用正确的列名）
    -- ================================================
    
    RAISE NOTICE 'step 6: 插入股票持仓';
    
    INSERT INTO public.stock_holdings (portfolio_id, stock_symbol, company_name, shares, average_cost, current_price, beta, created_at, updated_at)
    VALUES 
        (portfolio_id, 'AMZN', 'Amazon.com Inc', 30, 222.31, 225.02, 1.33, NOW(), NOW()),
        (portfolio_id, 'CRWD', 'CrowdStrike Holdings Inc', 10, 480.00, 477.40, 1.52, NOW(), NOW()),
        (portfolio_id, 'PLTR', 'Palantir Technologies Inc', 38, 140.00, 141.95, 2.89, NOW(), NOW()),
        (portfolio_id, 'SHOP', 'Shopify Inc', 32, 115.00, 112.23, 1.85, NOW(), NOW()),
        (portfolio_id, 'TSLA', 'Tesla Inc', 40, 310.00, 312.75, 2.01, NOW(), NOW());
    
    RAISE NOTICE '✅ 股票持仓已插入';

    -- ================================================
    -- 第七步：插入期权持仓（使用正确的列名）
    -- ================================================
    
    RAISE NOTICE 'step 7: 插入期权持仓';
    
    INSERT INTO public.option_holdings (portfolio_id, option_symbol, underlying_symbol, option_type, strike_price, expiration_date, contracts, premium, current_price, created_at, updated_at)
    VALUES 
        (portfolio_id, 'MSFT240315P00400000', 'MSFT', 'PUT', 400.00, '2024-03-15', 2, 5.50, 4.80, NOW(), NOW()),
        (portfolio_id, 'NVDA240322P00900000', 'NVDA', 'PUT', 900.00, '2024-03-22', 1, 18.75, 22.30, NOW(), NOW()),
        (portfolio_id, 'QQQ240329P00440000', 'QQQ', 'PUT', 440.00, '2024-03-29', 3, 8.20, 7.95, NOW(), NOW()),
        (portfolio_id, 'QQQ240405P00435000', 'QQQ', 'PUT', 435.00, '2024-04-05', 2, 6.10, 5.85, NOW(), NOW());
    
    RAISE NOTICE '✅ 期权持仓已插入';

    -- ================================================
    -- 第八步：设置风险参数和指标（使用正确的列名）
    -- ================================================
    
    RAISE NOTICE 'step 8: 设置风险参数和指标';
    
    -- 插入风险设置
    INSERT INTO public.risk_settings (user_id, leverage_safe_threshold, leverage_warning_threshold, concentration_limit, industry_concentration_limit, min_cash_ratio)
    VALUES (user_uuid, 1.0, 1.5, 20.0, 60.0, 30.0);
    
    -- 插入风险指标（使用实际的列名）
    INSERT INTO public.risk_metrics (portfolio_id, portfolio_beta, sharpe_ratio, max_drawdown, var_95, concentration_risk, calculated_at)
    VALUES (portfolio_id, 1.85, 0.75, -12.5, -8.2, 15.2, NOW());
    
    RAISE NOTICE '✅ 风险参数和指标已设置';

END $$;

-- ================================================
-- 验证数据
-- ================================================

SELECT '=== 验证结果 ===' as verification;

-- 检查用户
SELECT 'Users:' as table_name, email, created_at 
FROM auth.users 
WHERE email = '27983958@qq.com';

-- 检查档案（使用正确的列名）
SELECT 'Profiles:' as table_name, username, display_name 
FROM public.profiles p 
JOIN auth.users u ON p.id = u.id 
WHERE u.email = '27983958@qq.com';

-- 检查投资组合
SELECT 'Portfolios:' as table_name, name, total_equity, cash_balance, margin_used
FROM public.portfolios po
JOIN auth.users u ON po.user_id = u.id 
WHERE u.email = '27983958@qq.com';

-- 检查股票持仓
SELECT 'Stock Holdings:' as table_name, stock_symbol, company_name, shares, average_cost, current_price
FROM public.stock_holdings sh
JOIN public.portfolios po ON sh.portfolio_id = po.id
JOIN auth.users u ON po.user_id = u.id 
WHERE u.email = '27983958@qq.com'
ORDER BY stock_symbol;

-- 检查期权持仓
SELECT 'Option Holdings:' as table_name, option_symbol, underlying_symbol, option_type, strike_price, contracts
FROM public.option_holdings oh
JOIN public.portfolios po ON oh.portfolio_id = po.id
JOIN auth.users u ON po.user_id = u.id 
WHERE u.email = '27983958@qq.com'
ORDER BY option_symbol;

-- 检查风险设置
SELECT 'Risk Settings:' as table_name, leverage_safe_threshold, leverage_warning_threshold, concentration_limit
FROM public.risk_settings rs
JOIN auth.users u ON rs.user_id = u.id 
WHERE u.email = '27983958@qq.com';

-- 检查风险指标（使用正确的列名）
SELECT 'Risk Metrics:' as table_name, portfolio_beta, sharpe_ratio, max_drawdown, var_95, concentration_risk
FROM public.risk_metrics rm
JOIN public.portfolios po ON rm.portfolio_id = po.id
JOIN auth.users u ON po.user_id = u.id 
WHERE u.email = '27983958@qq.com';

SELECT '✅ 所有数据验证完成！用户可以使用 27983958@qq.com / 123456 登录' as result; 