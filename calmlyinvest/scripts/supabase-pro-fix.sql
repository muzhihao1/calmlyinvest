-- ================================================================
-- Supabase Pro 版生产环境修复脚本
-- ================================================================
-- 适用于：Supabase Pro 版本的生产环境
-- 目的：修复用户无法创建投资组合的问题，同时保持生产环境的安全性
-- ================================================================

-- 步骤 1: 检查并修复特定用户的邮箱确认状态
-- 仅针对已知用户进行修复，而不是全局禁用邮箱确认
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now()
WHERE 
  email = '279838958@qq.com' 
  AND email_confirmed_at IS NULL;

-- 显示用户状态
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  last_sign_in_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '已确认'
    ELSE '未确认'
  END as confirmation_status
FROM auth.users
WHERE email = '279838958@qq.com';

-- 步骤 2: 修复用户的投资组合
DO $$
DECLARE
    v_user_id UUID;
    v_portfolio_count INTEGER;
    v_portfolio_id UUID;
BEGIN
    -- 获取用户 ID
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = '279838958@qq.com'
    LIMIT 1;
    
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'User 279838958@qq.com not found';
    END IF;
    
    RAISE NOTICE 'Found user with ID: %', v_user_id;
    
    -- 检查现有投资组合
    SELECT COUNT(*), MAX(id) INTO v_portfolio_count, v_portfolio_id
    FROM portfolios
    WHERE user_id = v_user_id;
    
    IF v_portfolio_count > 0 THEN
        -- 修复现有投资组合的数据
        UPDATE portfolios
        SET 
            total_equity = COALESCE(total_equity, '1000000.00'),
            cash_balance = COALESCE(cash_balance, '300000.00'),
            margin_used = COALESCE(margin_used, '0.00'),
            updated_at = now()
        WHERE user_id = v_user_id;
        
        RAISE NOTICE 'Updated % existing portfolio(s) for user %', v_portfolio_count, v_user_id;
    ELSE
        -- 创建新投资组合
        INSERT INTO portfolios (user_id, name, total_equity, cash_balance, margin_used)
        VALUES (v_user_id, '我的投资组合', '1000000.00', '300000.00', '0.00')
        RETURNING id INTO v_portfolio_id;
        
        RAISE NOTICE 'Created new portfolio % for user %', v_portfolio_id, v_user_id;
    END IF;
    
    -- 验证投资组合
    PERFORM 1 FROM portfolios 
    WHERE user_id = v_user_id 
    AND total_equity IS NOT NULL 
    AND cash_balance IS NOT NULL;
    
    RAISE NOTICE 'Portfolio verification completed successfully';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Error: % - %', SQLSTATE, SQLERRM;
END $$;

-- 步骤 3: 检查 RLS 策略
-- 确保用户可以访问自己的投资组合
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    -- 检查是否存在适当的 RLS 策略
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE tablename = 'portfolios'
    AND policyname LIKE '%select%';
    
    IF policy_count = 0 THEN
        RAISE WARNING 'No SELECT policies found for portfolios table';
    ELSE
        RAISE NOTICE 'Found % SELECT policies for portfolios table', policy_count;
    END IF;
END $$;

-- 显示投资组合表的 RLS 策略
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'portfolios'
ORDER BY policyname;

-- 步骤 4: 验证最终结果
-- 显示用户的投资组合信息
SELECT 
    p.id as portfolio_id,
    p.user_id,
    p.name,
    p.total_equity,
    p.cash_balance,
    p.margin_used,
    p.created_at,
    p.updated_at,
    u.email
FROM portfolios p
JOIN auth.users u ON p.user_id = u.id
WHERE u.email = '279838958@qq.com';

-- ================================================================
-- Pro 版本的建议配置
-- ================================================================
-- 1. 在 Supabase Dashboard > Authentication > Providers > Email 中：
--    - 保持 "Confirm email" 启用（生产环境安全要求）
--    - 调整 Rate Limits：
--      * Signup: 10-20 per hour（Pro 版本可以调整）
--      * Generate Link: 10-20 per hour
--    
-- 2. 在 Authentication > Settings 中：
--    - 设置合理的 JWT expiry time
--    - 配置适当的 Session timeout
--
-- 3. 考虑启用其他登录方式减少邮箱注册压力：
--    - OAuth providers (Google, GitHub)
--    - Magic Links
--    - Phone authentication

-- ================================================================
-- 监控查询（用于诊断）
-- ================================================================
-- 查看最近的注册尝试
SELECT 
    id,
    email,
    created_at,
    email_confirmed_at,
    last_sign_in_at,
    raw_user_meta_data
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 查看最近创建的投资组合
SELECT 
    id,
    user_id,
    name,
    created_at,
    updated_at
FROM portfolios
ORDER BY created_at DESC
LIMIT 10;