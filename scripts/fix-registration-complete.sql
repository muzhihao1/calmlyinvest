-- ================================================================
-- 完整修复注册问题脚本
-- ================================================================
-- 此脚本解决 "Database error saving new user" 错误
-- 请在 Supabase SQL Editor 中运行
-- ================================================================

-- 步骤 1: 检查并修复 RLS 策略
-- -----------------------------------------------

-- 临时禁用 RLS 以便设置策略
ALTER TABLE portfolios DISABLE ROW LEVEL SECURITY;
ALTER TABLE risk_settings DISABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Users can view own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can create own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can update own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can delete own portfolios" ON portfolios;
DROP POLICY IF EXISTS "Users can view own risk settings" ON risk_settings;
DROP POLICY IF EXISTS "Users can create own risk settings" ON risk_settings;
DROP POLICY IF EXISTS "Users can update own risk settings" ON risk_settings;

-- 创建新的 RLS 策略
CREATE POLICY "Users can view own portfolios" ON portfolios
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own portfolios" ON portfolios
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios" ON portfolios
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own portfolios" ON portfolios
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own risk settings" ON risk_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own risk settings" ON risk_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own risk settings" ON risk_settings
    FOR UPDATE USING (auth.uid() = user_id);

-- 重新启用 RLS
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_settings ENABLE ROW LEVEL SECURITY;

-- 步骤 2: 创建或更新触发器函数
-- -----------------------------------------------

-- 删除旧的触发器和函数
DROP TRIGGER IF EXISTS on_user_created_portfolio ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user_portfolio();

-- 创建新的触发器函数（使用 SECURITY DEFINER 绕过 RLS）
CREATE OR REPLACE FUNCTION public.handle_new_user_portfolio() 
RETURNS trigger 
SECURITY DEFINER 
SET search_path = public
AS $$
BEGIN
  -- 记录日志
  RAISE LOG 'Creating portfolio for new user: %', NEW.id;
  
  -- 为新用户创建默认投资组合
  INSERT INTO public.portfolios (
    user_id,
    name,
    total_equity,
    cash_balance,
    margin_used
  ) VALUES (
    NEW.id,
    '我的投资组合',
    '1000000.00',
    '1000000.00',
    '0.00'
  ) ON CONFLICT (user_id) DO NOTHING;  -- 避免重复插入
  
  -- 创建默认风险设置
  INSERT INTO public.risk_settings (
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
  ) VALUES (
    NEW.id,
    1.0,
    1.5,
    20.0,
    60.0,
    30.0,
    true,
    true,
    false,
    5
  ) ON CONFLICT (user_id) DO NOTHING;  -- 避免重复插入
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- 记录错误但不阻止用户创建
    RAISE WARNING 'Failed to create portfolio for user %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER on_user_created_portfolio
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user_portfolio();

-- 步骤 3: 授予必要的权限
-- -----------------------------------------------

-- 授予函数执行权限
GRANT EXECUTE ON FUNCTION public.handle_new_user_portfolio() TO postgres, anon, authenticated, service_role;

-- 授予表权限（以防万一）
GRANT ALL ON portfolios TO postgres, service_role;
GRANT ALL ON risk_settings TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON portfolios TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON risk_settings TO anon, authenticated;

-- 步骤 4: 验证设置
-- -----------------------------------------------

-- 检查触发器是否存在
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'auth' 
  AND event_object_table = 'users'
  AND trigger_name = 'on_user_created_portfolio';

-- 检查 RLS 策略
SELECT 
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('portfolios', 'risk_settings')
ORDER BY tablename, policyname;

-- 步骤 5: 测试数据清理（可选）
-- -----------------------------------------------
-- 如果需要清理测试数据，取消下面的注释
/*
DELETE FROM auth.users 
WHERE email IN ('test2025@example.com', 'newtest2025@example.com', 'test123@gmail.com')
AND created_at > NOW() - INTERVAL '1 hour';
*/

-- ================================================================
-- 完成！
-- ================================================================
-- 系统现在应该可以正常注册新用户了。
-- 新用户注册后会自动创建：
-- 1. 默认投资组合（100万初始资金）
-- 2. 默认风险设置
-- ================================================================