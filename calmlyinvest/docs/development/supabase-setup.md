# Supabase 配置指南

本指南将帮助你正确配置 Supabase 以解决 UUID 类型不匹配和认证问题。

## 问题诊断

当前系统存在的主要问题：
1. 数据库 schema 混用了整数 ID 和 UUID
2. RLS（Row Level Security）策略配置不正确
3. 用户认证后无法访问自己的数据（403 错误）

## 解决步骤

### 1. 检查当前数据库状态

首先，在 Supabase SQL Editor 中运行以下查询来检查当前状态：

```sql
-- 检查 portfolios 表的结构
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name = 'portfolios'
ORDER BY ordinal_position;

-- 检查是否有现有数据
SELECT COUNT(*) as portfolio_count FROM public.portfolios;
SELECT COUNT(*) as user_count FROM auth.users;
```

### 2. 运行数据库迁移

根据检查结果，选择合适的迁移路径：

#### 情况 A：全新安装（没有数据）

直接运行 UUID 版本的 schema：

```bash
# 在 Supabase SQL Editor 中运行
# 1. 先运行 001_supabase_schema.sql
# 2. 再运行 003_fix_uuid_mismatch.sql
```

#### 情况 B：有旧数据需要迁移

如果你之前使用了整数 ID 版本的 schema，需要先迁移数据：

```bash
# 1. 首先备份数据库
# 2. 运行数据迁移脚本
cd calmlyinvest
npx tsx migrations/002_migrate_user_data.ts

# 3. 在 Supabase SQL Editor 中运行
# 运行 003_fix_uuid_mismatch.sql
```

### 3. 验证 RLS 策略

在 Supabase SQL Editor 中运行以下查询来验证 RLS 策略：

```sql
-- 列出所有 RLS 策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- 测试当前用户是否可以查看 portfolios
SELECT * FROM public.portfolios;

-- 如果上面的查询返回空或错误，使用调试函数
SELECT * FROM public.check_portfolio_access('your-portfolio-id-here'::uuid);
```

### 4. 创建测试数据

为当前登录用户创建测试数据：

```sql
-- 获取当前用户 ID
SELECT auth.uid() as current_user_id;

-- 创建测试 portfolio（user_id 会自动设置）
INSERT INTO public.portfolios (name, total_equity, cash_balance, margin_used)
VALUES ('测试投资组合', 1000000.00, 800000.00, 200000.00)
RETURNING *;

-- 验证是否可以查询到
SELECT * FROM public.portfolios WHERE user_id = auth.uid();
```

### 5. 更新应用配置

确保应用使用正确的 schema 文件：

```typescript
// 在所有导入中，确保使用 schema-supabase 而不是 schema
import * as schema from '@shared/schema-supabase';
```

### 6. 环境变量配置

确保正确设置了环境变量：

```bash
# .env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key

# .env.supabase (仅服务器端)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 常见问题排查

### 1. 403 Forbidden 错误

如果用户登录后仍然收到 403 错误：

```sql
-- 检查用户 ID 匹配
SELECT 
    auth.uid() as auth_user_id,
    id as portfolio_id,
    user_id as portfolio_user_id,
    auth.uid() = user_id as has_access
FROM public.portfolios;

-- 使用调试函数
SELECT * FROM public.debug_rls_portfolio('portfolio-id-here'::uuid);
```

### 2. 无法创建 Portfolio

```sql
-- 检查触发器是否正常工作
\df public.set_portfolio_user_id

-- 手动测试创建
INSERT INTO public.portfolios (name, total_equity, cash_balance, margin_used)
VALUES ('手动测试', 100000.00, 100000.00, 0.00)
RETURNING *;
```

### 3. 数据类型错误

如果遇到 "invalid input syntax for type uuid" 错误：

```sql
-- 检查是否有遗留的整数 ID 数据
SELECT id, pg_typeof(id) FROM public.portfolios LIMIT 5;

-- 使用迁移函数转换 ID
SELECT public.migrate_portfolio_id('1');
```

## 完整重置步骤（仅在必要时使用）

如果需要完全重置数据库：

```sql
-- ⚠️ 警告：这将删除所有数据！
-- 1. 禁用 RLS
ALTER TABLE public.portfolios DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.stock_holdings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.option_holdings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_history DISABLE ROW LEVEL SECURITY;

-- 2. 删除所有表
DROP TABLE IF EXISTS public.risk_history CASCADE;
DROP TABLE IF EXISTS public.risk_metrics CASCADE;
DROP TABLE IF EXISTS public.risk_settings CASCADE;
DROP TABLE IF EXISTS public.option_holdings CASCADE;
DROP TABLE IF EXISTS public.stock_holdings CASCADE;
DROP TABLE IF EXISTS public.portfolios CASCADE;

-- 3. 重新运行 schema
-- 运行 001_supabase_schema.sql
-- 运行 003_fix_uuid_mismatch.sql
```

## 验证成功配置

运行以下查询来验证配置是否成功：

```sql
-- 1. 验证表结构
SELECT table_name, column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'public' 
AND table_name IN ('portfolios', 'stock_holdings', 'option_holdings')
AND column_name IN ('id', 'user_id', 'portfolio_id')
ORDER BY table_name, column_name;

-- 2. 验证 RLS 已启用
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('portfolios', 'stock_holdings', 'option_holdings');

-- 3. 验证可以创建和查询数据
INSERT INTO public.portfolios (name, total_equity, cash_balance, margin_used)
VALUES ('验证测试', 50000.00, 50000.00, 0.00)
RETURNING *;

SELECT * FROM public.portfolios WHERE user_id = auth.uid();
```

## 客户端测试

使用提供的测试页面验证认证流程：

1. 打开 `test-auth.html`
2. 使用 demo 账户登录（用户名：demo，密码：demo123）
3. 检查是否能成功获取 portfolios
4. 验证创建新 portfolio 功能

## 联系支持

如果遇到其他问题，请检查：
1. Supabase 项目的 Auth 设置是否启用了邮箱/密码登录
2. RLS 策略是否正确应用
3. 客户端和服务器的环境变量是否正确设置