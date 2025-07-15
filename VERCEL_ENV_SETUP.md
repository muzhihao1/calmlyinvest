# Vercel 环境变量设置指南

## 必需的环境变量

请在 Vercel Dashboard 中设置以下环境变量：

### 1. 基础配置（访客模式必需）
这些变量即使不使用 Supabase 也需要设置，可以设置为占位符值：

```
VITE_SUPABASE_URL=https://placeholder.supabase.co
VITE_SUPABASE_ANON_KEY=placeholder_key
```

### 2. Supabase 配置（注册用户功能必需）
如果您想启用用户注册和数据持久化功能，需要设置真实的 Supabase 值：

```
VITE_SUPABASE_URL=你的_Supabase_项目_URL
VITE_SUPABASE_ANON_KEY=你的_Supabase_匿名密钥
SUPABASE_SERVICE_ROLE_KEY=你的_Supabase_服务角色密钥（可选）
```

## 设置步骤

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目
3. 进入 "Settings" → "Environment Variables"
4. 添加上述环境变量
5. 点击 "Save"
6. 重新部署项目

## 获取 Supabase 配置值

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目
3. 进入 "Settings" → "API"
4. 复制以下值：
   - Project URL → `VITE_SUPABASE_URL`
   - Anon/Public key → `VITE_SUPABASE_ANON_KEY`
   - Service Role key → `SUPABASE_SERVICE_ROLE_KEY`（仅在需要服务器端操作时使用）

## 注意事项

- 环境变量名必须完全匹配（包括 `VITE_` 前缀）
- 设置后需要重新部署才能生效
- 访客模式不需要真实的 Supabase 配置，但仍需要设置占位符值
- Service Role Key 包含敏感权限，请妥善保管