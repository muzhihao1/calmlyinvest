# Vercel 环境变量配置指南

## 必需的环境变量

您需要在 Vercel Dashboard 中配置以下环境变量才能使应用正常工作：

### 1. VITE_SUPABASE_URL
- **值**: `https://hsfthqchyupkbmazcuis.supabase.co`
- **说明**: Supabase 项目 URL，前端代码需要
- **环境**: Production, Preview, Development

### 2. VITE_SUPABASE_ANON_KEY
- **值**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzZnRocWNoeXVwa2JtYXpjdWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTg0NjUsImV4cCI6MjA2ODA5NDQ2NX0.GAajoAAyNgbq5SVPhtL99NFIoycaLjXbcCJJqc8wLrQ`
- **说明**: Supabase 公开密钥（anon key），前端认证需要
- **环境**: Production, Preview, Development

### 3. SUPABASE_URL
- **值**: `https://hsfthqchyupkbmazcuis.supabase.co`
- **说明**: Supabase 项目 URL，服务端 API 需要
- **环境**: Production, Preview, Development

### 4. SUPABASE_ANON_KEY
- **值**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzZnRocWNoeXVwa2JtYXpjdWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTg0NjUsImV4cCI6MjA2ODA5NDQ2NX0.GAajoAAyNgbq5SVPhtL99NFIoycaLjXbcCJJqc8wLrQ`
- **说明**: Supabase 公开密钥，服务端 API 需要
- **环境**: Production, Preview, Development

### 5. SUPABASE_SERVICE_ROLE_KEY
- **值**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzZnRocWNoeXVwa2JtYXpjdWlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjUxODQ2NSwiZXhwIjoyMDY4MDk0NDY1fQ.II5EEdkqznfNNRkZrr22XosV3w5qaj4jTkPiTd65EPk`
- **说明**: Supabase 服务端密钥，可以绕过 RLS 策略
- **环境**: Production, Preview, Development
- **⚠️ 重要**: 这是敏感密钥，请妥善保管

## 配置步骤

1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 选择您的项目
3. 进入 Settings → Environment Variables
4. 逐个添加上述环境变量：
   - 输入变量名（Key）
   - 输入变量值（Value）
   - 选择所有环境（Production, Preview, Development）
   - 点击 Save

5. **重要**：添加完所有变量后，需要重新部署：
   - 进入 Deployments 页面
   - 点击最新部署旁边的三个点
   - 选择 "Redeploy"
   - 确认重新部署

## 验证配置

部署完成后，访问您的应用并尝试：
1. 注册新账号
2. 登录现有账号
3. 使用应用功能

如果仍有问题，请检查：
- Vercel Functions 日志
- 浏览器控制台错误
- 确保所有环境变量名称拼写正确

## 为什么需要 VITE_ 前缀？

Vite 构建工具要求所有客户端可访问的环境变量必须以 `VITE_` 开头。这是一个安全特性，防止意外暴露服务端密钥到前端代码。

## 安全提醒

- `SUPABASE_SERVICE_ROLE_KEY` 是高权限密钥，只能在服务端使用
- 定期轮换密钥（建议每3-6个月）
- 使用 Vercel 的环境变量功能，不要在代码中硬编码密钥