# Supabase 认证问题解决方案

## 问题描述

1. **429 错误 (Too Many Requests)**：Supabase 免费版对注册请求有速率限制
2. **邮箱确认要求**：默认情况下，用户注册后需要确认邮箱才能登录
3. **用户无法创建投资组合**：用户 ID 外键约束导致创建失败

## 解决步骤

### 1. 禁用邮箱确认（开发环境）

在 Supabase Dashboard 的 SQL Editor 中运行以下 SQL：

```sql
-- 禁用邮箱确认要求
UPDATE auth.config 
SET 
  mailer_autoconfirm = true,
  security_update_password_require_reauthentication = false
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

-- 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION auth.handle_new_user();

-- 确认所有现有未确认的用户
UPDATE auth.users 
SET email_confirmed_at = now()
WHERE email_confirmed_at IS NULL;
```

### 2. 修复现有用户的投资组合

对于已注册但无法创建投资组合的用户（如 279838958@qq.com），运行：

```sql
-- 修复特定用户的投资组合
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- 获取用户 ID
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = '279838958@qq.com'
    LIMIT 1;
    
    IF v_user_id IS NOT NULL THEN
        -- 创建投资组合（如果不存在）
        INSERT INTO portfolios (user_id, name, total_equity, cash_balance, margin_used)
        VALUES (v_user_id, '我的投资组合', '1000000.00', '300000.00', '0.00')
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE 'Portfolio created/verified for user %', v_user_id;
    END IF;
END $$;
```

### 3. 调整认证设置（可选）

在 Supabase Dashboard > Authentication > Providers 中：

1. **Email Provider 设置**：
   - 关闭 "Confirm email" 选项
   - 调整 "Rate limit" 设置（如果是 Pro 版本）

2. **添加其他登录方式**（避免速率限制）：
   - 启用 OAuth 提供商（GitHub、Google 等）
   - 启用 Magic Link 登录

### 4. 前端优化建议

1. **添加重试延迟**：
   ```typescript
   // 在注册失败时添加延迟重试
   if (error.status === 429) {
     await new Promise(resolve => setTimeout(resolve, 60000)); // 等待 1 分钟
   }
   ```

2. **提供明确的错误提示**：
   - 429 错误：提示用户等待 1-2 分钟后重试
   - 提供访客模式作为临时方案
   - 显示预设的测试账号信息

### 5. 长期解决方案

1. **升级到 Supabase Pro**：
   - 更高的速率限制
   - 更好的性能和支持

2. **实施 CAPTCHA**：
   - 防止自动化注册
   - 减少恶意请求

3. **使用代理或负载均衡**：
   - 分散请求来源
   - 避免单一 IP 触发限制

## 测试账号

如果无法注册新账号，可以使用以下测试账号：

- 邮箱：`279838958@qq.com`
- 密码：`123456`

或使用访客模式（无需登录）。

## 注意事项

⚠️ **安全警告**：禁用邮箱确认仅适合开发环境。生产环境应该：
- 启用邮箱确认
- 实施适当的反垃圾注册措施
- 使用 CAPTCHA 或类似机制