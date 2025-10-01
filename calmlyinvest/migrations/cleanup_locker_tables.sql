-- ====================================================
-- 清理 Locker/杆柜 项目的数据库对象
-- 日期: 2025-10-01
-- 目的: 移除与 locker 项目相关的表，保留 CalmlyInvest 的完整功能
-- ====================================================

-- ⚠️ 重要提醒：
-- 1. 在生产环境执行前，请先在测试环境验证
-- 2. 确保已备份数据库
-- 3. 建议分步执行，每步后验证 CalmlyInvest 功能

-- ====================================================
-- 第1步：识别 locker 相关的表
-- ====================================================

-- 查询包含 store_id 或 locker_id 字段的表
SELECT
  table_schema,
  table_name,
  string_agg(column_name, ', ' ORDER BY ordinal_position) as columns_with_locker_refs
FROM information_schema.columns
WHERE column_name IN ('store_id', 'locker_id', 'cabinet_id', 'door_id')
  AND table_schema = 'public'
GROUP BY table_schema, table_name
ORDER BY table_name;

-- 查询表名包含 locker 相关关键词的表
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'public'
  AND (
    tablename LIKE '%locker%'
    OR tablename LIKE '%cabinet%'
    OR tablename LIKE '%store%'
    OR tablename LIKE '%door%'
    OR tablename LIKE '%gate%'
  )
ORDER BY tablename;

-- ====================================================
-- 第2步：查看依赖关系
-- ====================================================

-- 查询外键依赖（哪些表引用了 users 表）
SELECT
  tc.table_schema,
  tc.table_name,
  kcu.column_name,
  ccu.table_schema AS foreign_table_schema,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
  AND tc.table_schema = 'public'
  AND ccu.table_name = 'users'
ORDER BY tc.table_name;

-- ====================================================
-- 第3步：备份查询（可选，在删除前运行）
-- ====================================================

-- 如果需要备份 users 表数据到 JSON
-- SELECT json_agg(row_to_json(t))
-- FROM (SELECT * FROM public.users) t;

-- ====================================================
-- 第4步：安全删除 locker 相关表
-- ====================================================

-- 🚨 注意：下面的语句会删除数据，请确认后再执行！

-- 开始事务（可以在测试后 ROLLBACK）
BEGIN;

-- 删除 locker 相关表（根据实际情况调整）
-- 注意：先删除有外键依赖的表，最后删除被引用的表

-- 示例：如果发现以下表（请根据第1步的查询结果调整）
DROP TABLE IF EXISTS public.locker_records CASCADE;
DROP TABLE IF EXISTS public.stores CASCADE;
DROP TABLE IF EXISTS public.lockers CASCADE;

-- 删除包含 store_id/locker_id 的 users 表
-- ⚠️ 这会删除非 CalmlyInvest 的用户表
DROP TABLE IF EXISTS public.users CASCADE;

-- 如果有其他 locker 相关的视图、函数或触发器，也要删除
DROP VIEW IF EXISTS public.locker_stats CASCADE;
DROP FUNCTION IF EXISTS public.handle_locker_event() CASCADE;

-- 提交事务（确认无误后执行）
-- COMMIT;

-- 或者回滚测试
-- ROLLBACK;

-- ====================================================
-- 第5步：验证 CalmlyInvest 的表完整性
-- ====================================================

-- 确认 profiles 表存在且结构正确
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 确认 CalmlyInvest 核心表存在
SELECT
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
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

-- 验证 auth.users 的用户数量
SELECT
  COUNT(*) as total_users,
  COUNT(CASE WHEN email_confirmed_at IS NOT NULL THEN 1 END) as confirmed_users,
  COUNT(CASE WHEN email_confirmed_at IS NULL THEN 1 END) as unconfirmed_users
FROM auth.users;

-- ====================================================
-- 第6步：确保 profiles 表与 auth.users 正确关联
-- ====================================================

-- 检查 profiles 表的外键约束
SELECT
  tc.constraint_name,
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'profiles'
  AND tc.constraint_type = 'FOREIGN KEY';

-- 检查是否有 auth.users 没有对应的 profiles
SELECT
  u.id,
  u.email,
  u.created_at,
  CASE WHEN p.id IS NULL THEN 'Missing Profile' ELSE 'Has Profile' END as profile_status
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 20;

-- ====================================================
-- 第7步：清理完成后的验证清单
-- ====================================================

/*
验证清单：
□ 第1步：运行识别查询，确认需要删除的表列表
□ 第2步：检查外键依赖，确保删除顺序正确
□ 第3步：（可选）备份 locker 相关表数据
□ 第4步：在测试环境先执行删除（BEGIN...ROLLBACK测试）
□ 第5步：验证 CalmlyInvest 核心表完整
□ 第6步：确认 profiles 与 auth.users 正确关联
□ 第7步：测试 CalmlyInvest 的登录和核心功能
□ 第8步：在生产环境执行删除（BEGIN...COMMIT）
□ 第9步：再次运行第5-6步验证
□ 第10步：测试生产环境的 CalmlyInvest 功能
*/

-- ====================================================
-- 执行建议
-- ====================================================

/*
推荐执行顺序：

1. 在 Supabase SQL Editor 中先运行第1步和第2步（只读查询）
   - 这会显示所有 locker 相关的表
   - 记录这些表名

2. 根据第1步的结果，更新第4步的 DROP TABLE 语句

3. 在测试环境或使用 BEGIN...ROLLBACK 测试删除
   BEGIN;
   DROP TABLE IF EXISTS public.xxx CASCADE;
   -- 运行第5-6步验证
   ROLLBACK;  -- 如果有问题就回滚

4. 确认无误后，在生产环境执行：
   BEGIN;
   DROP TABLE IF EXISTS public.xxx CASCADE;
   -- 运行第5-6步验证
   COMMIT;  -- 确认无误后提交

5. 测试 CalmlyInvest 的完整功能：
   - 用户登录
   - 创建投资组合
   - 添加持仓
   - 查看风险指标
*/
