-- ================================================================
-- Supabase 禁用邮箱确认脚本
-- ================================================================
-- 功能：禁用新用户注册时的邮箱确认要求，允许用户注册后直接登录
-- 警告：仅适合开发环境，生产环境应启用邮箱确认以确保安全
-- 
-- 使用方法：
-- 1. 登录 Supabase Dashboard
-- 2. 进入 SQL Editor
-- 3. 复制粘贴并运行此脚本
-- ================================================================

-- 步骤 1: 禁用邮箱确认配置
-- 这会让新注册的用户自动确认邮箱
UPDATE auth.config 
SET 
  mailer_autoconfirm = true,
  security_update_password_require_reauthentication = false
WHERE id = 'default';

-- 验证配置已更新
SELECT 
  id,
  mailer_autoconfirm,
  security_update_password_require_reauthentication
FROM auth.config
WHERE id = 'default';

-- 步骤 2: 创建自动确认邮箱的函数
CREATE OR REPLACE FUNCTION auth.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- 自动确认邮箱
  IF NEW.email_confirmed_at IS NULL THEN
    UPDATE auth.users 
    SET 
      email_confirmed_at = now(),
      updated_at = now()
    WHERE id = NEW.id;
  END IF;
  
  -- 记录日志（可选）
  RAISE LOG 'User % created with email % - auto-confirmed', NEW.id, NEW.email;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 步骤 3: 创建触发器
-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 创建新触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION auth.handle_new_user();

-- 步骤 4: 确认所有现有未确认的用户
-- 这会让所有已注册但未确认邮箱的用户立即可以登录
UPDATE auth.users 
SET 
  email_confirmed_at = COALESCE(email_confirmed_at, now()),
  updated_at = now()
WHERE email_confirmed_at IS NULL;

-- 显示更新的用户数
DO $$
DECLARE
  updated_count INTEGER;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RAISE NOTICE 'Updated % users with email confirmation', updated_count;
END $$;

-- 步骤 5: 验证结果
-- 显示最近注册的用户及其确认状态
SELECT 
  id,
  email,
  created_at,
  email_confirmed_at,
  CASE 
    WHEN email_confirmed_at IS NOT NULL THEN '已确认'
    ELSE '未确认'
  END as confirmation_status
FROM auth.users
ORDER BY created_at DESC
LIMIT 10;

-- 步骤 6: 为特定用户（279838958@qq.com）创建投资组合
DO $$
DECLARE
    v_user_id UUID;
    v_portfolio_count INTEGER;
BEGIN
    -- 获取用户 ID
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = '279838958@qq.com'
    LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        -- 检查是否已有投资组合
        SELECT COUNT(*) INTO v_portfolio_count
        FROM portfolios
        WHERE user_id = v_user_id;
        
        IF v_portfolio_count = 0 THEN
            -- 创建投资组合
            INSERT INTO portfolios (user_id, name, total_equity, cash_balance, margin_used)
            VALUES (v_user_id, '我的投资组合', '1000000.00', '300000.00', '0.00');
            
            RAISE NOTICE 'Created portfolio for user %', v_user_id;
        ELSE
            RAISE NOTICE 'User % already has % portfolio(s)', v_user_id, v_portfolio_count;
        END IF;
    ELSE
        RAISE NOTICE 'User 279838958@qq.com not found';
    END IF;
END $$;

-- ================================================================
-- 恢复邮箱确认（如果需要）
-- ================================================================
-- 如果需要重新启用邮箱确认，运行以下命令：
/*
UPDATE auth.config 
SET 
  mailer_autoconfirm = false,
  security_update_password_require_reauthentication = true
WHERE id = 'default';

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS auth.handle_new_user();
*/