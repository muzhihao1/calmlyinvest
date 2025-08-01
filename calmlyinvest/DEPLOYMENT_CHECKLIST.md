# 部署检查清单

## ✅ 已完成的准备工作

### 1. 认证系统
- [x] JWT 认证实现 (`server/auth.ts`)
- [x] 登录/注册页面 (`client/src/pages/login.tsx`)
- [x] 所有 API 路由添加认证中间件
- [x] 客户端 API 请求添加认证头
- [x] 路由保护和自动重定向到登录页

### 2. 数据持久化
- [x] PostgreSQL 数据库存储实现 (`server/db-storage.ts`)
- [x] Drizzle ORM 集成
- [x] 根据环境变量自动选择存储方式
- [x] 数据库迁移文件准备完成

### 3. 用户体验
- [x] 登出功能
- [x] 演示账号快速登录
- [x] 动态获取用户的投资组合

### 4. 构建和部署配置
- [x] 构建脚本测试通过
- [x] Vercel 配置文件 (`vercel.json`)
- [x] 环境变量配置文件 (`.env.example`)
- [x] 详细的 README 文档

## 📝 部署步骤

### 1. Supabase 设置
1. 登录 [Supabase](https://supabase.com)
2. 创建新项目
3. 在 SQL 编辑器中运行 `migrations/001_initial_schema.sql`
4. (可选) 运行 `migrations/002_demo_data.sql` 创建演示数据
5. 从项目设置中复制数据库连接字符串

### 2. GitHub 提交
```bash
# 确保所有更改都已保存
git add .
git commit -m "feat: 准备生产部署 - 添加认证系统和数据库持久化"
git push origin main
```

### 3. Vercel 部署
1. 登录 [Vercel](https://vercel.com)
2. 导入 GitHub 仓库
3. 配置环境变量：
   - `DATABASE_URL`: Supabase 连接字符串
   - `JWT_SECRET`: 使用 `openssl rand -base64 32` 生成
   - `NODE_ENV`: production
   - `USE_MOCK_DATA`: false
   - `APP_URL`: https://your-app.vercel.app
4. 部署设置：
   - Framework Preset: Other
   - Build Command: `npm run build`
   - Output Directory: `dist`
5. 点击 Deploy

### 4. 部署后验证
- [ ] 访问应用 URL
- [ ] 测试用户注册
- [ ] 测试用户登录
- [ ] 验证数据持久化
- [ ] 测试股票/期权添加
- [ ] 验证实时股票数据获取

## ⚠️ 重要提醒
1. 确保生产环境使用强密码的 JWT_SECRET
2. Supabase 免费层限制：500MB 数据库，2GB 传输
3. Yahoo Finance API 有请求频率限制
4. 建议设置数据库自动备份

## 🔧 故障排除
- 如果登录失败：检查 JWT_SECRET 环境变量
- 如果数据不持久：检查 DATABASE_URL 配置
- 如果股票数据不更新：检查 Yahoo Finance API 连接