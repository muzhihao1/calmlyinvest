# Supabase Redirect URL 修复指南

## 问题

新用户注册后，Supabase的邮箱验证链接跳转到了错误的网站（localhost/首页显示其他项目）。

## 原因

Supabase的 **Site URL** 配置错误或未设置。

## 解决方案

### 步骤1：登录Supabase Dashboard

1. 访问 https://supabase.com/dashboard
2. 选择 CalmlyInvest 项目

### 步骤2：配置 Site URL

1. 点击左侧菜单 **Authentication**
2. 点击 **URL Configuration** 标签
3. 设置以下URL：

#### Production（生产环境）:
```
Site URL: https://calmlyinvest.vercel.app
```

或如果使用自定义域名：
```
Site URL: https://www.calmlyinvest.com
```

#### Redirect URLs（允许的重定向URL）:
添加以下URL（每行一个）：
```
https://calmlyinvest.vercel.app
https://calmlyinvest.vercel.app/auth/callback
https://www.calmlyinvest.com
https://www.calmlyinvest.com/auth/callback
http://localhost:5173
http://localhost:5173/auth/callback
```

### 步骤3：保存配置

点击 **Save** 保存更改。

---

## 测试验证

### 1. 注册新用户

```bash
POST /api/auth/register
{
  "email": "test@example.com",
  "password": "test123"
}
```

### 2. 检查邮件

查收验证邮件，点击验证链接。

### 3. 验证跳转

应该跳转到：
- ✅ https://calmlyinvest.vercel.app
- ❌ 不应该跳转到 localhost 或其他项目

---

## 额外配置（可选）

### 禁用邮箱验证（开发环境）

如果是开发环境想跳过邮箱验证：

1. 在 Supabase Dashboard
2. **Authentication** → **Settings**
3. 找到 **Email Auth**
4. **关闭** "Enable email confirmations"

⚠️ **注意**：生产环境不建议关闭！

---

## 其他问题修复

### 问题：新用户有初始资金

已修复！在 `user-portfolios-simple.ts` 中：

**之前**：
```typescript
total_equity: '1000000',  // $1,000,000
cash_balance: '300000',   // $300,000
```

**现在**：
```typescript
total_equity: '0',
cash_balance: '0',
```

新用户现在从$0开始！

---

## 完整的认证流程

### 1. 注册
```
POST /api/auth/register
→ 创建用户
→ 发送验证邮件
```

### 2. 验证邮件
```
用户点击邮件链接
→ Supabase验证token
→ 跳转到 Site URL
```

### 3. 登录
```
POST /api/auth/login
→ 返回session
→ 前端保存token
```

### 4. 自动创建投资组合
```
GET /api/user-portfolios-simple
→ 检测无投资组合
→ 自动创建空投资组合($0)
```

---

## 检查清单

- [ ] Site URL 设置为生产域名
- [ ] Redirect URLs 包含所有允许的域名
- [ ] 测试注册流程
- [ ] 验证邮件跳转正确
- [ ] 新用户投资组合为$0

---

## 相关文件

- `/api/auth/register.ts` - 注册API
- `/api/auth/login.ts` - 登录API
- `/api/user-portfolios-simple.ts` - 投资组合API（自动创建）

Commit: 待提交
