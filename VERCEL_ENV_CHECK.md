# Vercel 环境变量验证指南

## 📋 问题背景

本地开发中发现 `.env.local` 的 Supabase ANON Key 有拼写错误（`"rose": "anon"` 而非 `"role": "anon"`），导致登录失败。

**本地已修复**，但生产环境（Vercel）也需要检查！

---

## ⚠️ 重要：检查 Vercel 环境变量

### 步骤1：登录 Vercel Dashboard

访问：https://vercel.com/muzhihao1s-projects/calmlyinvest

### 步骤2：检查环境变量

1. 点击项目 **calmlyinvest**
2. 点击 **Settings** 标签
3. 点击左侧菜单 **Environment Variables**

### 步骤3：验证以下变量

检查这些变量是否存在且正确：

#### ✅ 必须的环境变量

```bash
# Supabase URL
VITE_SUPABASE_URL=https://hsfthqchyupkbmazcuis.supabase.co
SUPABASE_URL=https://hsfthqchyupkbmazcuis.supabase.co

# Supabase ANON Key (公开可见的客户端key)
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzZnRocWNoeXVwa2JtYXpjdWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NDcxMzQsImV4cCI6MjA2OTUyMzEzNH0.lgEh9aI69XXxSB_V1QpXLyNP-CCXFfxTHhQMfN3bxF0
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzZnRocWNoeXVwa2JtYXpjdWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM5NDcxMzQsImV4cCI6MjA2OTUyMzEzNH0.lgEh9aI69XXxSB_V1QpXLyNP-CCXFfxTHhQMfN3bxF0

# Supabase Service Role Key (服务端私钥，仅用于API functions)
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzZnRocWNoeXVwa2JtYXpjdWlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1Mzk0NzEzNCwiZXhwIjoyMDY5NTIzMTM0fQ.c3mXGrxU4lrgGBcZp1465c-qJYrrf_mi6vL2c_kerE8
```

### 步骤4：验证 JWT Payload

你可以在 https://jwt.io 解码 ANON Key，确认payload中有：

```json
{
  "iss": "supabase",
  "ref": "hsfthqchyupkbmazcuis",
  "role": "anon",  ← 必须是 "role"，不能是 "rose"！
  "iat": 1753947134,
  "exp": 2069523134
}
```

---

## 🔧 如果环境变量错误，如何修复

### 方法1：在 Vercel Dashboard 手动更新

1. 找到错误的变量
2. 点击右侧的 **⋯** (三个点)
3. 选择 **Edit**
4. 粘贴正确的值（见上面）
5. 点击 **Save**
6. **重要**：点击 **Redeploy** 让修改生效

### 方法2：使用 Vercel CLI（推荐）

```bash
# 在项目根目录
vercel env pull .env.vercel

# 检查下载的环境变量
cat .env.vercel

# 如果有错误，手动更新：
vercel env add VITE_SUPABASE_ANON_KEY production
# 粘贴正确的key

# 重新部署
vercel --prod
```

---

## 🚀 部署后验证

### 1. 等待部署完成

Vercel会自动部署，通常需要2-5分钟。

访问：https://vercel.com/muzhihao1s-projects/calmlyinvest/deployments

查看最新部署状态。

### 2. 测试生产环境

访问：https://calmlyinvest.vercel.app

**测试步骤**：

1. ✅ **访客模式**：点击"使用演示账号登录"
   - 应该能正常进入dashboard
   - 可以添加/删除持仓

2. ✅ **注册新账号**：点击"注册"
   - 填写邮箱和密码
   - 应该能成功注册

3. ✅ **登录**：使用你的账号 `279838958@qq.com`
   - 密码：`muzhihao12`
   - **应该能成功登录**（之前显示 Invalid API key）
   - 登录后应该显示正确的投资组合价值

4. ✅ **添加持仓**：
   - 添加一个股票（如TSLA）
   - 价值应该立即更新

5. ✅ **刷新页面**：
   - 价值应该保持一致（不再显示0）

---

## 📊 预期结果

### ✅ 修复前的问题

- ❌ 登录失败：显示 "Invalid API key"
- ❌ 投资组合价值：首次显示0，刷新后显示正确值

### ✅ 修复后的行为

- ✅ 登录成功：直接进入dashboard
- ✅ 投资组合价值：首次加载就显示正确值
- ✅ 添加持仓：价值立即更新
- ✅ 刷新页面：价值保持一致

---

## 🔍 如果还有问题

### 检查浏览器 Console

按 F12 打开开发者工具，查看 Console：

**正常情况**：
```
Debug Dashboard: {isGuest: false, userId: "xxx", portfoliosLength: 1, ...}
```

**异常情况**：
```
POST https://...supabase.co/auth/v1/token 401 (Unauthorized)
Error: Invalid API key
```

如果还显示 401，说明 Vercel 环境变量没更新成功。

### 强制重新部署

```bash
# 方法1：在 Vercel Dashboard
点击 Deployments → 最新部署 → ⋯ → Redeploy

# 方法2：使用 Git
git commit --allow-empty -m "chore: force redeploy"
git push origin main
```

---

## 📝 本次代码修改总结

### 修复的问题

1. **登录失败** - 修复 `.env.local` 中的 ANON Key 拼写错误
2. **价值显示0** - portfolio-details-simple.ts 动态计算 total_equity
3. **价值不更新** - portfolio-refresh-prices-simple.ts 更新价格后重新计算

### 新增功能

- dashboard首次加载1秒后自动刷新，确保价格最新
- Locker表清理指南和SQL脚本

---

**最后一步**：验证完成后，记得在这里留言确认一切正常！
