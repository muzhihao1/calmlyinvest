# 部署问题修复总结

## 问题诊断

### 1. 根本原因
- **Server 返回类型问题**：`registerRoutes` 函数返回 `Promise<Server>`，这在 Vercel serverless 环境中不兼容
- **环境变量缺失**：Supabase 配置未在 Vercel 中设置，导致初始化失败
- **错误处理不当**：代码在环境变量缺失时直接抛出错误，而不是降级到访客模式

### 2. 错误表现
```
FUNCTION_INVOCATION_FAILED
500: A server error has occurred
```

## 已实施的修复

### 1. 修改 Server 返回类型
```typescript
// 之前
export async function registerRoutes(app: Express): Promise<Server>

// 之后
export function registerRoutes(app: Express): void
```

### 2. 优雅处理环境变量缺失
```typescript
// auth-supabase.ts
const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : dummySupabase;

// storage-init.ts
if (!supabaseConfig.url || !serviceKey) {
  console.warn('Missing Supabase configuration. Guest mode only will be available.');
  return null;
}
```

### 3. Storage Wrapper 改进
```typescript
// 当 Supabase 不可用时，自动使用访客存储
if (req.user?.id === 'guest-user' || !storage) {
  return guestStorage;
}
```

## 快速修复步骤

如果您遇到同样的问题，请按以下步骤操作：

### 选项 1：启用完整功能（推荐）
1. 在 Vercel Dashboard 中设置环境变量：
   ```
   VITE_SUPABASE_URL=你的_Supabase_URL
   VITE_SUPABASE_ANON_KEY=你的_Supabase_匿名密钥
   ```
2. 重新部署

### 选项 2：仅使用访客模式
1. 在 Vercel Dashboard 中设置占位符环境变量：
   ```
   VITE_SUPABASE_URL=https://placeholder.supabase.co
   VITE_SUPABASE_ANON_KEY=placeholder_key
   ```
2. 重新部署

## 验证修复

访问以下端点检查部署状态：
- `/api/health` - 健康检查
- `/api/debug/env` - 环境变量状态（调试用）

## 系统行为

### 有 Supabase 配置时
- ✅ 完整的用户注册/登录功能
- ✅ 数据永久保存
- ✅ 多设备同步

### 无 Supabase 配置时（访客模式）
- ✅ 所有功能正常工作
- ✅ 数据保存在服务器内存中
- ⚠️ 刷新页面后数据重置为示例数据
- ❌ 无法注册新用户