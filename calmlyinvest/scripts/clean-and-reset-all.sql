-- ================================================================
-- 完全清理和重置系统
-- ================================================================
-- 警告：此脚本将删除所有用户数据！请先备份重要数据
-- 执行前请确认您真的要清理所有数据
-- ================================================================

-- 步骤 1: 禁用 RLS 以便删除所有数据
ALTER TABLE portfolios DISABLE ROW LEVEL SECURITY;
ALTER TABLE stock_holdings DISABLE ROW LEVEL SECURITY;
ALTER TABLE option_holdings DISABLE ROW LEVEL SECURITY;
ALTER TABLE risk_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE risk_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE risk_history DISABLE ROW LEVEL SECURITY;

-- 步骤 2: 删除所有业务数据（按外键依赖顺序）
TRUNCATE TABLE risk_history CASCADE;
TRUNCATE TABLE risk_metrics CASCADE;
TRUNCATE TABLE risk_settings CASCADE;
TRUNCATE TABLE option_holdings CASCADE;
TRUNCATE TABLE stock_holdings CASCADE;
TRUNCATE TABLE portfolios CASCADE;

-- 步骤 3: 删除所有用户（仅删除特定测试用户，保留您自己的账号）
-- 注意：如果要删除所有用户，请谨慎操作
DELETE FROM auth.users 
WHERE email IN (
    '279838958@qq.com',
    'demo@example.com',
    'test@example.com'
);

-- 如果要删除所有用户（极度谨慎！）：
-- DELETE FROM auth.users WHERE email != 'your-admin-email@example.com';

-- 步骤 4: 重新启用 RLS
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE option_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_history ENABLE ROW LEVEL SECURITY;

-- 步骤 5: 验证清理结果
SELECT 'Users' as table_name, COUNT(*) as row_count FROM auth.users
UNION ALL
SELECT 'Portfolios', COUNT(*) FROM portfolios
UNION ALL
SELECT 'Stock Holdings', COUNT(*) FROM stock_holdings
UNION ALL
SELECT 'Option Holdings', COUNT(*) FROM option_holdings
UNION ALL
SELECT 'Risk Metrics', COUNT(*) FROM risk_metrics
UNION ALL
SELECT 'Risk Settings', COUNT(*) FROM risk_settings
UNION ALL
SELECT 'Risk History', COUNT(*) FROM risk_history;

-- ================================================================
-- 优化认证配置（Pro 版本）
-- ================================================================

-- 1. 更新认证配置以适应 Pro 版本
UPDATE auth.config 
SET 
  -- 保持邮箱确认（生产环境）
  mailer_autoconfirm = false,
  -- 允许更灵活的密码更新
  security_update_password_require_reauthentication = false
WHERE id = 'default';

-- 2. 创建一个简单的欢迎消息函数（可选）
CREATE OR REPLACE FUNCTION auth.handle_new_user_simple() 
RETURNS trigger AS $$
BEGIN
  -- 仅记录新用户注册
  RAISE LOG 'New user registered: % at %', NEW.email, NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 删除旧的触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 创建新的简化触发器
CREATE TRIGGER on_auth_user_created_simple
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION auth.handle_new_user_simple();

-- ================================================================
-- 显示系统状态
-- ================================================================
SELECT 
  'System cleaned and ready for fresh start' as status,
  NOW() as cleaned_at;