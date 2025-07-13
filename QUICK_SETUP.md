# 快速设置指南 (Quick Setup Guide)

## ✅ 已完成 (Completed)
- ✅ 更新 server/index.ts 使用新的路由
- ✅ 复制环境变量到 .env
- ✅ 删除旧的认证文件

## ⚠️ 需要您手动完成 (Manual Steps Required)

### 1. 获取 Service Role Key
1. 打开: https://app.supabase.com/project/hsfthqchyupkbmazcuis/settings/api
2. 找到 "Project API keys" 部分
3. 复制 `service_role` 密钥（以 `eyJ` 开头的长字符串）
4. 编辑 `.env` 文件，将 `SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here` 替换为实际的密钥

### 2. 运行数据库迁移
1. 打开: https://app.supabase.com/project/hsfthqchyupkbmazcuis/sql/new
2. 复制 `migrations/001_supabase_schema.sql` 文件的全部内容
3. 粘贴到 SQL 编辑器并运行

### 3. 迁移您的数据
在项目根目录运行:
```bash
npx tsx migrations/002_migrate_user_data.ts
```

### 4. 测试登录
- 邮箱: 279838958@qq.com
- 密码: muzhihao12

## 完成后
系统将使用纯 Supabase 认证，您的所有数据都会安全存储在 Supabase 数据库中。