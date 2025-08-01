# 快速设置指南

## 系统已完成的更新

- ✅ 移除所有硬编码账号信息
- ✅ 清理用户特定的代码和脚本  
- ✅ 创建自动初始化脚本
- ✅ 更新认证流程
- ✅ 部署到 Vercel

## 立即执行步骤

### 1. 在 Supabase SQL Editor 中运行初始化脚本

登录到 Supabase Dashboard，在 SQL Editor 中运行：

```sql
-- 运行 scripts/initialize-new-user.sql 的内容
-- 这会为新用户自动创建投资组合
```

### 2. 配置 Supabase Pro 版本设置

在 Dashboard 中进行以下设置：

#### Authentication > Providers > Email
- Rate limit for signups: **10 per hour**
- Rate limit for password recovery: **5 per hour**
- Rate limit for magic links: **5 per hour**

#### Authentication > Settings  
- Enable email confirmations: **Yes** (保持启用)
- Double confirm email changes: **No**
- Secure password change: **No**
- JWT expiry limit: **3600** (1小时)

### 3. （可选）启用其他登录方式

为了减轻邮箱注册压力，可以在 Authentication > Providers 中启用：
- Google OAuth
- GitHub OAuth

## 系统现在的工作方式

1. **新用户注册流程**：
   - 注册 → 邮箱确认 → 自动创建投资组合（100万初始资金）
   - 自动设置默认风险参数

2. **访客模式**：
   - 无需注册，数据保存在本地
   - 适合快速体验

3. **无特殊账号**：
   - 系统中没有任何硬编码的测试账号
   - 所有用户平等对待

## 如何测试

1. 访问 https://calmlyinvest.vercel.app
2. 注册新账号或使用访客模式
3. 确认所有功能正常工作

## 数据清理（如需要）

如果需要完全清理系统数据，运行 `scripts/clean-and-reset-all.sql`

系统现已准备就绪，可以正常使用！