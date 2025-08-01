-- 禁用邮箱确认要求，允许用户注册后立即登录
-- 警告：这个设置仅适合开发环境，生产环境建议启用邮箱确认

-- 更新认证配置
UPDATE auth.config 
SET 
  mailer_autoconfirm = true
WHERE id = 'default';

-- 设置所有新注册用户的邮箱自动确认
CREATE OR REPLACE FUNCTION auth.handle_new_user() 
RETURNS trigger AS $$
BEGIN
  -- 自动确认邮箱
  UPDATE auth.users 
  SET email_confirmed_at = now()
  WHERE id = NEW.id AND email_confirmed_at IS NULL;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器（如果不存在）
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION auth.handle_new_user();

-- 确认当前所有未确认的用户邮箱
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;

-- 查看更新后的配置
SELECT * FROM auth.config;