# 项目结构说明

## 📊 文档整理成果

**整理前**: 43个markdown文件散落在根目录
**整理后**: 4个核心文档 + 结构化的docs目录

## 📁 当前项目结构

```
calmlyinvest/
├── 📄 README.md                    # 项目概述
├── 📄 CLAUDE.md                    # AI开发指导
├── 📄 TROUBLESHOOTING.md           # 常见问题
├── 📄 URGENT_SECURITY_RESPONSE.md  # 安全响应（当前）
│
├── 📂 client/                      # React前端
│   └── src/
│       ├── components/             # UI组件
│       ├── hooks/                  # React Hooks
│       ├── pages/                  # 页面组件
│       ├── contexts/               # React Contexts
│       └── lib/                    # 工具函数
│
├── 📂 server/                      # Express后端
│   ├── routes.ts                   # API路由
│   ├── storage-*.ts                # 存储层
│   ├── market-data.ts              # 市场数据
│   └── auth-supabase.ts            # 认证中间件
│
├── 📂 api/                         # Vercel无服务器函数
│   ├── auth/                       # 认证端点
│   └── index.ts                    # 主API处理器
│
├── 📂 shared/                      # 共享类型和模式
│   └── schema*.ts                  # 数据库模式 + Zod验证
│
├── 📂 supabase/                    # Supabase配置
│
├── 📂 migrations/                  # 数据库迁移
│
├── 📂 scripts/                     # 工具脚本
│
├── 📂 docs/                        # 📚 技术文档（新增）
│   ├── README.md                   # 文档导航
│   │
│   ├── 📂 deployment/              # 部署相关
│   │   ├── deployment-guide.md
│   │   └── vercel-setup.md
│   │
│   ├── 📂 security/                # 安全相关
│   │   ├── security-checklist.md
│   │   └── incident-response.md
│   │
│   ├── 📂 development/             # 开发相关
│   │   ├── supabase-migration.md
│   │   ├── supabase-setup.md
│   │   ├── mcp-setup.md
│   │   ├── mcp-token-setup.md
│   │   ├── auth-troubleshooting.md
│   │   └── rate-limits.md
│   │
│   └── 📂 archive/                 # 历史归档
│       ├── 2025-10-security/       # 10月安全事件
│       ├── deployment-history/     # 部署历史
│       └── status-reports/         # 状态报告
│
├── 📂 config/                      # 配置文件
│   └── cursor-mcp-config.json
│
└── 📂 .git/                        # Git仓库
    └── hooks/
        └── pre-commit              # 防止提交敏感文件
```

## 🎯 整理原则

### 1. 根目录简洁
只保留4个核心文档：
- `README.md` - 项目入口
- `CLAUDE.md` - AI助手指导
- `TROUBLESHOOTING.md` - 快速故障排查
- `URGENT_SECURITY_RESPONSE.md` - 当前安全事件（如有）

### 2. 文档分类归档
- **部署文档** → `docs/deployment/`
- **安全文档** → `docs/security/`
- **开发文档** → `docs/development/`
- **历史文档** → `docs/archive/`

### 3. 删除临时文件
已删除：
- 测试HTML文件（`test-auth.html`, `clear-session.html`等）
- 重复的部署指南（9个）
- 过时的状态报告（7个）
- 冗余的安全文档（10个）

## 📋 文档数量统计

| 类别 | 文件数 | 位置 |
|------|--------|------|
| 根目录核心文档 | 4 | `/` |
| 部署文档 | 2 | `docs/deployment/` |
| 安全文档 | 2 | `docs/security/` |
| 开发文档 | 6 | `docs/development/` |
| 归档文档 | 27+ | `docs/archive/` |

## 🔒 安全改进

### 已实施的安全措施
1. ✅ 增强的`.gitignore` - 防止提交敏感文件
2. ✅ Pre-commit hook - 自动检测敏感文件
3. ✅ 清除Git历史 - 移除已泄露的凭证
4. ✅ 密钥轮换 - 所有Supabase密钥已更换
5. ✅ 文档归档 - 安全事件文档已分类存档

### 敏感文件保护
所有环境变量文件已被正确忽略：
- `.env`
- `.env.*`（除了`.example`）
- `.env.local`
- `.env.production`
- `.env.supabase`

## 📖 快速查找

### 我想...
- **部署应用** → `docs/deployment/deployment-guide.md`
- **配置数据库** → `docs/development/supabase-setup.md`
- **设置环境变量** → `docs/deployment/vercel-setup.md`
- **解决认证问题** → `docs/development/auth-troubleshooting.md`
- **查看安全检查清单** → `docs/security/security-checklist.md`
- **了解项目概况** → `README.md`
- **AI开发指导** → `CLAUDE.md`

### 我遇到了...
- **部署失败** → `TROUBLESHOOTING.md`
- **认证错误** → `docs/development/auth-troubleshooting.md`
- **API速率限制** → `docs/development/rate-limits.md`
- **环境变量问题** → `docs/deployment/vercel-setup.md`

## 🔄 维护指南

### 添加新文档时
1. 确定文档类别（部署/安全/开发）
2. 放入对应的`docs/`子目录
3. 更新`docs/README.md`索引
4. 如果是核心文档，考虑是否应该放在根目录

### 归档旧文档时
1. 移动到`docs/archive/`
2. 按时间或主题创建子目录
3. 更新相关文档的链接引用

### 删除文档时
1. 确认文档确实不再需要
2. 检查是否有其他文档引用它
3. 考虑归档而非直接删除

## ✨ 改进效果

**之前的问题**:
- ❌ 根目录混乱，43个文件难以查找
- ❌ 重复文档，不知道哪个是最新的
- ❌ 历史文档和当前文档混杂
- ❌ 敏感文件误提交风险高

**现在的状态**:
- ✅ 根目录简洁，只有4个核心文档
- ✅ 文档分类清晰，易于查找
- ✅ 历史文档已归档，保持整洁
- ✅ 敏感文件防护措施完善

---

**整理完成时间**: 2025-10-01
**执行者**: Claude Code
**审核**: 待用户确认
