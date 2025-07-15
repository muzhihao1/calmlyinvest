-- ================================================================
-- 新用户初始化脚本
-- ================================================================
-- 此脚本为新注册用户自动创建初始投资组合
-- 应该作为数据库触发器运行
-- ================================================================

-- 创建用户初始化函数
CREATE OR REPLACE FUNCTION public.handle_new_user_portfolio() 
RETURNS trigger AS $$
BEGIN
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
    '1000000.00',  -- 初始现金等于总权益
    '0.00'
  );
  
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
    1.0,    -- 安全杠杆率
    1.5,    -- 警告杠杆率
    20.0,   -- 单一持仓限制 20%
    60.0,   -- 行业集中度限制 60%
    30.0,   -- 最低现金比例 30%
    true,   -- 开启杠杆预警
    true,   -- 开启到期预警
    false,  -- 关闭波动率预警
    5       -- 5分钟更新频率
  );
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS on_user_created_portfolio ON auth.users;

-- 创建新触发器
CREATE TRIGGER on_user_created_portfolio
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user_portfolio();

-- ================================================================
-- 验证触发器
-- ================================================================
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers 
WHERE trigger_schema = 'auth' 
  AND event_object_table = 'users';

-- ================================================================
-- 清理旧的测试数据（可选）
-- ================================================================
-- 如果需要清理特定测试账号的数据，运行以下命令：
/*
DO $$
DECLARE
  v_user_id UUID;
BEGIN
  -- 获取要删除的用户ID
  FOR v_user_id IN 
    SELECT id FROM auth.users 
    WHERE email IN ('test@example.com', 'demo@example.com')
  LOOP
    -- 删除该用户的所有数据
    DELETE FROM risk_history WHERE portfolio_id IN (SELECT id FROM portfolios WHERE user_id = v_user_id);
    DELETE FROM risk_metrics WHERE portfolio_id IN (SELECT id FROM portfolios WHERE user_id = v_user_id);
    DELETE FROM option_holdings WHERE portfolio_id IN (SELECT id FROM portfolios WHERE user_id = v_user_id);
    DELETE FROM stock_holdings WHERE portfolio_id IN (SELECT id FROM portfolios WHERE user_id = v_user_id);
    DELETE FROM portfolios WHERE user_id = v_user_id;
    DELETE FROM risk_settings WHERE user_id = v_user_id;
  END LOOP;
  
  -- 删除用户
  DELETE FROM auth.users WHERE email IN ('test@example.com', 'demo@example.com');
END $$;
*/