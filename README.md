# 持仓助手 - 股票期权风险管理系统

一个专业的股票和期权投资组合风险管理系统，帮助投资者实时监控和管理投资风险。

## 功能特点

- 📊 **实时行情数据**：集成 Yahoo Finance API，获取实时股票价格和 Beta 值
- 💼 **投资组合管理**：支持股票和期权持仓管理，自动计算风险指标
- ⚠️ **风险监控**：实时计算杠杆率、集中度、Delta 值等关键风险指标
- 📈 **智能建议**：基于风险阈值提供实时的投资建议
- 🔐 **用户认证**：安全的用户登录系统，数据隔离保护
- 👥 **访客模式**：无需登录即可使用，数据保存在本地内存
- 📱 **响应式设计**：支持桌面和移动端访问

## 技术栈

- **前端**：React 18 + TypeScript + Tailwind CSS + Radix UI
- **后端**：Express.js + TypeScript
- **数据库**：PostgreSQL (Supabase) 或本地 JSON 存储
- **部署**：Vercel / Docker / 自托管
- **其他**：Yahoo Finance API, JWT 认证, TanStack Query

## 部署指南

### 1. 准备工作

1. Fork 或克隆本仓库
2. 注册 [Supabase](https://supabase.com) 账号
3. (可选) 注册 [Vercel](https://vercel.com) 账号用于部署

### 2. 设置 Supabase 数据库

1. 在 Supabase 创建新项目
2. 在 SQL 编辑器中运行 `migrations/001_supabase_schema.sql`
3. 运行 `fix-supabase-auth-simple.sql` 设置认证和 RLS
4. 保存项目 URL 和 API 密钥

### 3. 配置环境变量

创建 `.env` 文件：

```bash
SUPABASE_URL=你的Supabase项目URL
SUPABASE_ANON_KEY=你的Supabase匿名密钥
```

### 4. 部署到 Vercel

1. 在 Vercel 导入 GitHub 仓库
2. 选择 Framework Preset: Other
3. Build Command: `npm run build`
4. Output Directory: `dist`
5. 点击 Deploy

## 本地开发

### 安装依赖

```bash
npm install
```

### 设置环境变量

复制 `.env.example` 到 `.env` 并填写配置：

```bash
cp .env.example .env
```

### 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## 项目结构

```
calmlyinvest/
├── client/                 # 前端代码
│   ├── src/
│   │   ├── components/     # React 组件
│   │   ├── pages/          # 页面组件
│   │   ├── hooks/          # 自定义 Hooks
│   │   └── lib/            # 工具函数
├── server/                 # 后端代码
│   ├── routes.ts           # API 路由
│   ├── storage.ts          # 数据存储层
│   ├── market-data.ts      # 市场数据服务
│   └── auth.ts             # 认证服务
├── shared/                 # 共享代码
│   └── schema.ts           # 数据模型定义
├── migrations/             # 数据库迁移文件
└── api/                    # Vercel API 处理器
```

## 使用说明

### 访客模式 vs 登录模式

**访客模式**
- 无需注册或登录，立即使用
- 数据保存在服务器内存中（不持久化）
- 刷新页面后数据可能丢失
- 适合快速体验和测试

**登录模式**
- 需要注册账号并登录
- 数据持久化保存在 Supabase 数据库
- 支持多设备访问
- 适合长期使用

### 演示账号

- 邮箱：demo@example.com
- 密码：demo123

### 主要功能

1. **股票管理**
   - 添加/编辑/删除股票持仓
   - 实时更新股票价格和 Beta 值
   - 支持批量导入 CSV

2. **期权管理**
   - 添加/编辑/删除期权持仓
   - 自动计算最大风险
   - 到期提醒功能

3. **风险监控**
   - 实时计算杠杆率
   - 监控持仓集中度
   - Delta 值追踪

4. **智能建议**
   - 基于风险阈值的实时提醒
   - 持仓调整建议
   - 期权到期管理

## 注意事项

- 首次部署后需要手动创建管理员账号
- Yahoo Finance API 有请求频率限制
- 建议定期备份数据库

## 许可证

MIT License

## 贡献

欢迎提交 Issue 和 Pull Request！

## 联系方式

如有问题，请提交 Issue 或联系作者。