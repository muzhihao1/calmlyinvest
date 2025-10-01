-- ====================================================
-- 🗑️ 删除 Locker/杆柜 表的SQL脚本
-- 根据查询结果生成
-- ====================================================

-- ⚠️ 重要：先用 ROLLBACK 测试，确认无误后再用 COMMIT

-- ====================================================
-- 方案1：测试模式（推荐第一次使用）
-- ====================================================

BEGIN;

-- 删除包含 store_id, locker_id 的 public.users 表
-- CASCADE 会自动删除所有依赖的外键、视图、触发器
DROP TABLE IF EXISTS public.users CASCADE;

-- 如果第一步查询显示了其他locker相关的表，也加到这里
-- 例如：
-- DROP TABLE IF EXISTS public.stores CASCADE;
-- DROP TABLE IF EXISTS public.lockers CASCADE;
-- DROP TABLE IF EXISTS public.locker_records CASCADE;

-- 🔍 验证：检查是否还有locker相关的表
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name LIKE '%locker%'
ORDER BY table_name;

-- 🔍 验证：检查CalmlyInvest的核心表是否完整
SELECT tablename
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

-- 🔍 验证：确认profiles表存在且结构正确
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'profiles'
ORDER BY ordinal_position;

-- 第一次执行用 ROLLBACK 测试
ROLLBACK;

-- ====================================================
-- 方案2：正式删除（确认无误后使用）
-- ====================================================

-- 取消下面的注释，确认后执行：

-- BEGIN;
--
-- DROP TABLE IF EXISTS public.users CASCADE;
-- -- 如果有其他locker表，也加到这里
--
-- -- 提交删除
-- COMMIT;

-- ====================================================
-- 删除后的验证清单
-- ====================================================

/*
执行 COMMIT 后，运行以下查询验证：

1. 确认users表已删除：
   SELECT * FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name = 'users';
   -- 应该返回空结果

2. 确认profiles表存在：
   SELECT * FROM information_schema.tables
   WHERE table_schema = 'public' AND table_name = 'profiles';
   -- 应该返回1行

3. 检查profiles与auth.users的关联：
   SELECT COUNT(*) as auth_users,
          COUNT(p.id) as profiles
   FROM auth.users u
   LEFT JOIN public.profiles p ON u.id = p.id;
   -- profiles数量应该等于或小于auth_users数量

4. 测试CalmlyInvest功能：
   - 登录
   - 查看投资组合
   - 添加持仓
*/
