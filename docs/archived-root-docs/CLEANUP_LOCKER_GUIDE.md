# 清理 Locker/杆柜 表的简单指南

## 📋 背景

你的Supabase数据库中混入了locker/杆柜项目的表（包含store_id, locker_id字段），需要清理。

CalmlyInvest只使用：
- `auth.users` （Supabase认证）
- `public.profiles` （用户档案）
- `public.portfolios` （投资组合）
- `public.stock_holdings` （股票持仓）
- `public.option_holdings` （期权持仓）
- 等其他投资相关表

## 🎯 目标

删除所有locker相关的表，保留CalmlyInvest的完整功能。

## ✅ 执行步骤

### 步骤1：打开Supabase SQL Editor

1. 登录 https://supabase.com/dashboard
2. 选择 CalmlyInvest 项目
3. 点击左侧菜单 **SQL Editor**
4. 点击 **New query**

### 步骤2：识别locker相关的表

复制以下SQL并执行：

```sql
-- 查询包含 store_id 或 locker_id 的表
SELECT
  table_schema,
  table_name,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as locker_columns
FROM information_schema.columns
WHERE column_name IN ('store_id', 'locker_id', 'cabinet_id', 'door_id')
  AND table_schema = 'public'
GROUP BY table_schema, table_name
ORDER BY table_name;
```

**记录显示的表名！**（例如：users, stores, lockers等）

### 步骤3：检查外键依赖

```sql
-- 查询哪些表依赖 users 表
SELECT
  tc.table_name AS dependent_table,
  ccu.table_name AS referenced_table,
  kcu.column_name AS foreign_key_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND ccu.table_name = 'users'
ORDER BY tc.table_name;
```

### 步骤4：执行清理（在事务中测试）

根据步骤2的结果，调整以下SQL中的表名：

```sql
-- 开始事务（可以回滚）
BEGIN;

-- 删除 locker 相关表（根据步骤2的结果调整）
DROP TABLE IF EXISTS public.locker_records CASCADE;
DROP TABLE IF EXISTS public.door_records CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.lockers CASCADE;

-- 删除包含 store_id/locker_id 的 users 表
-- ⚠️ 这会删除非 CalmlyInvest 的用户表
DROP TABLE IF EXISTS public.users CASCADE;

-- 如果有其他locker相关的表，也加到这里

-- 先回滚测试（确认无误后再COMMIT）
ROLLBACK;
```

**第一次运行用 ROLLBACK 测试！**

### 步骤5：确认无误后正式删除

如果步骤4没有报错，将最后一行改为 COMMIT：

```sql
BEGIN;

DROP TABLE IF EXISTS public.xxx CASCADE;  -- 替换为实际表名
DROP TABLE IF EXISTS public.users CASCADE;

-- 正式提交
COMMIT;
```

### 步骤6：验证 CalmlyInvest 完整性

```sql
-- 确认 profiles 表存在
SELECT * FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name = 'profiles';

-- 确认核心表都在
SELECT tablename, pg_size_pretty(pg_total_relation_size('public.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename IN (
    'profiles',
    'portfolios',
    'stock_holdings',
    'option_holdings',
    'risk_metrics',
    'risk_settings',
    'risk_history'
  )
ORDER BY tablename;

-- 检查 profiles 与 auth.users 的关联
SELECT
  COUNT(*) FILTER (WHERE p.id IS NOT NULL) as profiles_count,
  COUNT(*) as auth_users_count
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id;
```

### 步骤7：测试 CalmlyInvest 功能

在浏览器中测试：
1. ✅ 登录
2. ✅ 查看投资组合
3. ✅ 添加持仓
4. ✅ 查看风险指标

## 🚨 注意事项

1. **Supabase自动备份**：Supabase有PITR（Point-in-Time Recovery），可以恢复到任何时刻
2. **先测试后提交**：第一次用ROLLBACK，确认无误后再用COMMIT
3. **CASCADE的作用**：会自动删除依赖的外键、视图、触发器等
4. **不会影响auth.users**：Supabase的认证用户在auth.users中，不受影响

## 📝 常见场景

### 场景1：只有 public.users 表

```sql
BEGIN;
DROP TABLE IF EXISTS public.users CASCADE;
COMMIT;
```

### 场景2：多个locker相关表

```sql
BEGIN;
DROP TABLE IF EXISTS public.locker_records CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.lockers CASCADE;
DROP TABLE IF EXISTS public.users CASCADE;
COMMIT;
```

### 场景3：删除后发现问题

使用Supabase Dashboard → Settings → Database → Point in Time Recovery 恢复到删除前的状态。

## ✅ 完成确认

删除完成后，应该：
- ✅ Table Editor中不再显示store_id, locker_id字段
- ✅ profiles表存在且与auth.users关联
- ✅ CalmlyInvest所有功能正常
- ✅ Authentication → Users中的用户数据完整

## 🔗 相关文件

- `migrations/cleanup_locker_tables.sql` - 完整的清理脚本（包含详细注释）

---

有问题随时问！
