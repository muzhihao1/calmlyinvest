# Vercel 环境变量配置指南

## 🚨 紧急修复：API 500 错误

如果你遇到API返回500错误，无法加载账户数据，请按以下步骤配置Vercel环境变量。

## 必需的环境变量

在 Vercel Dashboard 中设置以下环境变量：

### 1. 登录 Vercel Dashboard
访问: https://vercel.com/dashboard

### 2. 选择你的项目
找到 `calmlyinvest` 项目并点击进入

### 3. 进入Settings > Environment Variables
添加以下三个环境变量：

#### ✅ SUPABASE_URL
```
值: 你的 Supabase 项目 URL
示例: https://xxxxxxxxxxxxx.supabase.co
位置: Supabase Dashboard > Project Settings > API > Project URL
```

#### ✅ SUPABASE_ANON_KEY
```
值: 你的 Supabase 匿名密钥
示例: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
位置: Supabase Dashboard > Project Settings > API > Project API keys > anon public
环境: Production, Preview, Development (全选)
```

#### ✅ SUPABASE_SERVICE_ROLE_KEY (⚠️ **关键！**)
```
值: 你的 Supabase 服务角色密钥
示例: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
位置: Supabase Dashboard > Project Settings > API > Project API keys > service_role secret
⚠️ 重要: 这是SECRET密钥，非常重要！
环境: Production (仅生产环境)
```

## 配置步骤截图

### Step 1: 打开环境变量页面
```
Vercel Dashboard > Your Project > Settings > Environment Variables
```

### Step 2: 添加每个变量
对于每个变量：
1. 点击 "Add New"
2. 输入变量名（如 `SUPABASE_URL`）
3. 输入变量值
4. 选择环境：
   - `SUPABASE_URL`: Production + Preview + Development
   - `SUPABASE_ANON_KEY`: Production + Preview + Development
   - `SUPABASE_SERVICE_ROLE_KEY`: **仅 Production**（安全考虑）
5. 点击 "Save"

### Step 3: 重新部署
添加所有变量后：
1. 回到 "Deployments" 页面
2. 找到最新的部署
3. 点击右侧的 "..." 菜单
4. 选择 "Redeploy"
5. 等待部署完成

## 验证配置

部署完成后，访问你的应用：
1. 登录账户
2. 查看Dashboard是否显示数据
3. 打开浏览器控制台（F12）
4. 检查是否还有500错误

## 从Supabase获取密钥

### 获取SUPABASE_URL和密钥:
1. 登录 https://supabase.com
2. 选择你的项目
3. 点击左侧菜单的 Settings (齿轮图标)
4. 选择 API
5. 复制以下信息：
   - **Project URL** → `SUPABASE_URL`
   - **anon public** (under Project API keys) → `SUPABASE_ANON_KEY`
   - **service_role secret** (under Project API keys) → `SUPABASE_SERVICE_ROLE_KEY`

## ⚠️ 安全提示

1. **永远不要**将 `SUPABASE_SERVICE_ROLE_KEY` 提交到Git
2. **永远不要**在前端代码中使用 `SERVICE_ROLE_KEY`
3. 只在Vercel环境变量中配置，不要在代码中硬编码
4. 定期轮换密钥（每3-6个月）

## 常见问题

### Q: 我添加了环境变量但仍然500错误？
A: 你需要**重新部署**。环境变量更改不会自动应用到现有部署。

### Q: 我的SERVICE_ROLE_KEY在哪里？
A: Supabase Dashboard > Project Settings > API > Project API keys > service_role (点击"Reveal"显示)

### Q: 为什么需要SERVICE_ROLE_KEY？
A: 这个密钥绕过Row Level Security (RLS)策略，允许服务器端代码访问所有数据。API函数需要它来执行管理员操作。

### Q: Preview环境也需要配置吗？
A: 是的，如果你想在Preview部署中测试功能，也需要配置环境变量。

## 检查环境变量是否生效

访问 `/api/debug-env` 端点（如果可用）查看环境变量状态。

或者查看Vercel Function日志：
1. Vercel Dashboard > Your Project > Deployments
2. 点击最新部署
3. 点击 "Functions" 标签
4. 查看函数日志中的错误信息

## 下一步

配置完成后，你的应用应该能够：
- ✅ 成功加载用户portfolios
- ✅ 显示股票持仓数据
- ✅ 显示期权持仓数据
- ✅ 计算风险指标
- ✅ 显示AI建议

如果仍有问题，请查看 `TROUBLESHOOTING.md` 或提交Issue。
