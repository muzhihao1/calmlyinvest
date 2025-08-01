# 部署指南

本文档提供了详细的部署说明，包括 Supabase 设置和应用部署步骤。

## 前置准备

1. 注册 [Supabase](https://supabase.com) 账号
2. 注册 [Vercel](https://vercel.com) 账号（如果使用 Vercel 部署）
3. Fork 或克隆本仓库

## Supabase 设置

### 1. 创建新项目

1. 登录 Supabase Dashboard
2. 点击 "New Project"
3. 填写项目信息：
   - Project name: `portfolio-manager`（或其他名称）
   - Database Password: 设置一个强密码
   - Region: 选择离你最近的区域
4. 点击 "Create new project"

### 2. 执行数据库迁移

等待项目创建完成后：

1. 进入 SQL Editor（左侧菜单）
2. 点击 "New query"
3. 复制并运行以下文件的内容（按顺序）：
   - `migrations/001_supabase_schema.sql` - 创建基础表结构
   - `fix-supabase-auth-simple.sql` - 设置认证和 RLS 策略

### 3. 获取 API 密钥

1. 进入 Settings → API
2. 复制以下信息：
   - Project URL (`SUPABASE_URL`)
   - `anon` public key (`SUPABASE_ANON_KEY`)
   - (可选) `service_role` key - 仅用于数据迁移

### 4. 创建用户（可选）

#### 方法 A: 使用 SQL 创建 demo 用户

运行 `fix-supabase-auth-simple.sql` 会自动创建：
- Email: demo@example.com
- Password: demo123

#### 方法 B: 通过 Auth 界面创建

1. 进入 Authentication → Users
2. 点击 "Invite user"
3. 输入邮箱和密码

## 应用部署

### 选项 1: Vercel 部署（推荐）

1. Fork 本仓库到你的 GitHub 账号
2. 登录 [Vercel](https://vercel.com)
3. 点击 "New Project"
4. 导入你 fork 的仓库
5. 配置环境变量：
   ```
   SUPABASE_URL=你的项目URL
   SUPABASE_ANON_KEY=你的anon密钥
   ```
6. 点击 "Deploy"

### 选项 2: 自托管

#### 使用 Docker

1. 构建镜像：
   ```bash
   docker build -t portfolio-manager .
   ```

2. 运行容器：
   ```bash
   docker run -p 3000:3000 \
     -e SUPABASE_URL=你的项目URL \
     -e SUPABASE_ANON_KEY=你的anon密钥 \
     portfolio-manager
   ```

#### 使用 PM2

1. 安装依赖：
   ```bash
   npm install
   npm install -g pm2
   ```

2. 构建应用：
   ```bash
   npm run build
   ```

3. 创建 ecosystem.config.js：
   ```javascript
   module.exports = {
     apps: [{
       name: 'portfolio-manager',
       script: 'npm',
       args: 'start',
       env: {
         SUPABASE_URL: '你的项目URL',
         SUPABASE_ANON_KEY: '你的anon密钥',
         PORT: 3000
       }
     }]
   }
   ```

4. 启动应用：
   ```bash
   pm2 start ecosystem.config.js
   ```


## 验证部署

1. 访问应用 URL
2. 尝试以下操作：
   - 访客模式：直接使用，无需登录
   - 注册新账号
   - 使用 demo 账号登录
   - 添加股票持仓
   - 查看风险指标

## 常见问题

### 1. 登录后出现 403 错误

检查 RLS 策略是否正确设置：
- 运行 `fix-supabase-auth-simple.sql`
- 确保所有表都启用了 RLS

### 2. 无法获取股票价格

- Yahoo Finance API 有地区限制
- 中国股票代码（如 600519.SH）可能不支持
- 使用美股代码（如 AAPL）进行测试

### 3. 数据库连接失败

检查环境变量：
- `SUPABASE_URL` 格式：`https://xxxxx.supabase.co`
- `SUPABASE_ANON_KEY` 是否正确

### 4. 构建失败

- 确保 Node.js 版本 >= 18
- 删除 `node_modules` 和 `package-lock.json` 后重新安装

## 安全建议

1. **生产环境**：
   - 使用强密码
   - 启用 2FA
   - 定期备份数据库
   - 使用 HTTPS

2. **API 密钥**：
   - 不要在客户端代码中使用 `service_role` key
   - 使用环境变量管理敏感信息
   - 定期轮换密钥

3. **数据隐私**：
   - RLS 策略确保用户只能访问自己的数据
   - 敏感操作需要身份验证
   - 定期审查访问日志

## 支持

如有问题，请：
1. 查看 [README.md](README.md)
2. 提交 [Issue](https://github.com/muzhihao1/calmlyinvest/issues)
3. 参考 [Supabase 文档](https://supabase.com/docs)