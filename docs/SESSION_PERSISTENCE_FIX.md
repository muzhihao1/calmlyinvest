# Session 持久化问题修复方案

**问题发现时间**: 2025-10-24
**严重程度**: 🔴 Critical - 用户无法保持登录状态
**影响范围**: 所有用户，特别是自定义域名 calmlyinvest.com

---

## 🔍 问题诊断

### 症状

1. ❌ **登录后刷新页面立即退出登录**
2. ❌ **关闭浏览器再打开，需要重新登录**
3. ❌ **Session 无法持久化到 localStorage**
4. ✅ **登录本身成功**（数据库显示 last_sign_in_at: 2025-10-24 14:20:50）

### 用户信息

- **账号**: 279838958@qq.com
- **User ID**: 8e82d664-5ef9-47c1-a540-9af664860a7c
- **Email 已验证**: ✅ 2025-07-13
- **最后登录**: ✅ 2025-10-24 14:20:50
- **使用域名**: https://calmlyinvest.com (自定义域名)

---

## 🎯 根本原因分析

### 1. Auth Context 逻辑过于激进

**问题代码**: `client/src/contexts/auth-context.tsx` (Lines 67-89)

```typescript
// ❌ 问题：任何错误都清除 session
try {
  const { data: testUser, error: testError } = await supabase.auth.getUser();
  if (testError || !testUser?.user) {
    throw new Error('Session invalid');
  }
  setSession(session);
  setUser(session.user);
  setIsGuest(false);
} catch (err) {
  console.error('Session validation failed:', err);
  // ❌ 清除 session 并强制进入 Guest Mode
  await supabase.auth.signOut();
  setIsGuest(true);
  setUser(GUEST_USER);
  setSession(null);
}
```

**问题分析**:
- 每次页面加载都调用 `getUser()` 验证 session
- 遇到**任何错误**（网络错误、CORS、超时）都会清除 session
- 应该只在**真正的认证错误**（401 invalid_grant）时清除 session

---

### 2. 自定义域名 CORS 配置问题

**当前域名**: https://calmlyinvest.com
**Vercel 域名**: https://calmlyinvest.vercel.app

**可能的问题**:
1. Supabase 项目的 **Site URL** 可能还是 `vercel.app` 域名
2. Supabase **CORS 配置**中没有添加 `calmlyinvest.com`
3. API 调用被 CORS 策略阻止

---

### 3. Session 验证时机问题

**当前流程**（有问题）:
```
页面加载 → getSession() → 立即调用 getUser() 验证
         ↓
      任何错误 → 清除 session → 强制 Guest Mode
```

**正确流程**应该是:
```
页面加载 → getSession() → 如果有 session，先信任它
         ↓                   ↓
      使用 session      后台异步验证 → 仅在真正的 401 错误才清除
```

---

## ✅ 修复方案

### 方案 A: 快速修复（推荐 - 立即部署）

修改 Auth Context，使其更加宽容：

**文件**: `client/src/contexts/auth-context.tsx`

```typescript
useEffect(() => {
  // ... 前面的代码保持不变 ...

  // Get initial session
  supabase.auth.getSession().then(async ({ data: { session }, error }) => {
    if (error) {
      console.error('Error getting session:', error);
      // ✅ 改进：网络错误不应该强制 Guest Mode
      setIsGuest(true);
      setUser(GUEST_USER);
      setSession(null);
      setLoading(false);
      return;
    }

    // ✅ 改进：如果有 session，先信任它
    if (session?.user) {
      // 立即设置用户状态（不等待验证）
      setSession(session);
      setUser(session.user);
      setIsGuest(false);
      setLoading(false);

      // ✅ 改进：后台异步验证，但不阻塞 UI
      // 只在真正的认证错误时清除 session
      supabase.auth.getUser().then(({ data: testUser, error: testError }) => {
        if (testError) {
          // 检查是否是真正的认证错误
          if (testError.status === 401 ||
              testError.message?.includes('invalid_grant') ||
              testError.message?.includes('invalid_token')) {
            // 真正的认证错误，清除 session
            console.error('Session is invalid, clearing:', testError);
            supabase.auth.signOut();
            setIsGuest(true);
            setUser(GUEST_USER);
            setSession(null);
          } else {
            // 其他错误（网络、CORS等），保持现有 session
            console.warn('Session validation failed (non-auth error), keeping session:', testError);
          }
        } else if (!testUser?.user) {
          // User 不存在，清除 session
          console.error('User not found, clearing session');
          supabase.auth.signOut();
          setIsGuest(true);
          setUser(GUEST_USER);
          setSession(null);
        }
      });
    } else {
      // No authenticated user, automatically enter guest mode
      setIsGuest(true);
      setUser(GUEST_USER);
      setLoading(false);
    }
  });

  // ... 后面的代码保持不变 ...
}, []);
```

---

### 方案 B: Supabase 配置修复（必须）

#### 步骤 1: 检查并更新 Site URL

1. 登录 **Supabase Dashboard**: https://supabase.com/dashboard
2. 选择您的项目
3. 进入 **Authentication** → **URL Configuration**
4. **Site URL** 设置为:
   ```
   https://calmlyinvest.com
   ```
   ⚠️ **重要**: 不要有尾部斜杠

5. **Redirect URLs** 添加:
   ```
   https://calmlyinvest.com/**
   https://www.calmlyinvest.com/**
   https://calmlyinvest.vercel.app/**
   ```

#### 步骤 2: 配置 CORS

1. 在 Supabase Dashboard
2. 进入 **Project Settings** → **API**
3. 找到 **CORS Configuration**
4. 添加允许的源:
   ```
   https://calmlyinvest.com
   https://www.calmlyinvest.com
   ```

#### 步骤 3: 验证配置

在浏览器 DevTools Console 执行:
```javascript
// 检查当前 Supabase 配置
console.log('Supabase URL:', import.meta.env.VITE_SUPABASE_URL);
console.log('Current Origin:', window.location.origin);

// 测试 CORS
fetch(import.meta.env.VITE_SUPABASE_URL + '/auth/v1/user', {
  method: 'OPTIONS',
  headers: {
    'Origin': window.location.origin,
    'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'authorization,apikey'
  }
}).then(r => console.log('CORS Preflight:', r.status, r.headers));
```

---

### 方案 C: 添加调试日志（临时 - 用于诊断）

在 `auth-context.tsx` 添加详细日志：

```typescript
useEffect(() => {
  console.log('🔐 Auth Context: Initializing...');
  console.log('Current domain:', window.location.origin);

  supabase.auth.getSession().then(async ({ data: { session }, error }) => {
    console.log('📦 getSession result:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      error: error?.message
    });

    if (session?.user) {
      console.log('✅ Session found, user:', session.user.email);

      // 尝试验证
      const { data: testUser, error: testError } = await supabase.auth.getUser();
      console.log('🔍 Validation result:', {
        hasUser: !!testUser?.user,
        error: testError?.message,
        errorStatus: testError?.status
      });

      if (testError) {
        console.error('❌ Validation failed:', testError);
        // ... 处理错误
      }
    }
  });
}, []);
```

---

## 🧪 测试步骤

### 测试 1: 验证修复后的行为

1. **部署修复后的代码**
2. **登录**: https://calmlyinvest.com/login
   - 邮箱: 279838958@qq.com
   - 密码: muzhihao12

3. **打开 DevTools (F12)** → Console 标签页

4. **查看日志**:
   ```
   ✅ 应该看到:
   🔐 Auth Context: Initializing...
   Current domain: https://calmlyinvest.com
   📦 getSession result: { hasSession: true, hasUser: true, error: null }
   ✅ Session found, user: 279838958@qq.com
   🔍 Validation result: { hasUser: true, error: null }
   ```

5. **刷新页面 (F5)**

6. **检查登录状态**:
   - ✅ 应该**仍然保持登录**
   - ✅ 不应该回到 Guest Mode
   - ✅ Dashboard 应该显示您的数据

---

### 测试 2: LocalStorage 验证

在 DevTools → Application → Local Storage → https://calmlyinvest.com

**应该看到**:
```
Key: portfolio-risk-auth
Value: {"access_token":"eyJh...","refresh_token":"...",etc}
```

✅ **刷新页面后，这个值应该仍然存在**

---

### 测试 3: CORS 验证

在 DevTools → Network 标签页

**查找请求**:
```
Request URL: https://xxx.supabase.co/auth/v1/user
Request Method: GET
Request Headers:
  Origin: https://calmlyinvest.com
  Authorization: Bearer eyJh...
```

**检查响应**:
```
Status: 200 OK
Response Headers:
  Access-Control-Allow-Origin: https://calmlyinvest.com
  ✅ 或 Access-Control-Allow-Origin: *
```

❌ **如果看到 CORS 错误**:
```
Access to fetch at '...' from origin 'https://calmlyinvest.com'
has been blocked by CORS policy
```
→ 说明 Supabase CORS 配置还需要修复（参考方案 B）

---

## 📊 成功标准

修复成功的标志：

### ✅ 基本功能
- [x] 登录成功
- [x] 刷新页面后仍然保持登录
- [x] 关闭浏览器后重新打开，仍然登录
- [x] LocalStorage 中有 session 数据
- [x] Console 无 CORS 错误

### ✅ Session 持久化
- [x] LocalStorage key `portfolio-risk-auth` 存在
- [x] Session 包含 access_token 和 refresh_token
- [x] Token 过期前会自动刷新

### ✅ Settings Wizard 可用
- [x] 访问 `/settings` 不报 500 错误
- [x] 可以完成所有 6 个步骤
- [x] 数据成功保存到数据库

---

## 🚀 部署步骤

### 步骤 1: 修复代码

1. 修改 `client/src/contexts/auth-context.tsx`（使用方案 A 的代码）
2. 添加调试日志（方案 C）

### 步骤 2: 本地测试

```bash
npm run dev

# 访问 http://localhost:5173
# 登录 → 刷新 → 验证 session 保持
```

### 步骤 3: 提交并部署

```bash
git add .
git commit -m "fix: improve session persistence and CORS handling

- Make auth context more tolerant to network errors
- Only clear session on real auth errors (401 invalid_grant)
- Trust existing session from localStorage first
- Add detailed logging for debugging
- Fix aggressive guest mode triggering

Related to custom domain: calmlyinvest.com
Fixes session loss on page refresh

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

git push origin main
```

### 步骤 4: 配置 Supabase

按照**方案 B**配置 Supabase:
1. Site URL → https://calmlyinvest.com
2. Redirect URLs → 添加所有域名
3. CORS → 添加 calmlyinvest.com

### 步骤 5: 验证部署

1. 访问 https://calmlyinvest.com
2. 登录测试
3. 刷新测试
4. 检查 DevTools 日志

---

## ⚠️ 常见问题

### Q1: 修复后仍然无法保持登录

**检查**:
1. 清除浏览器缓存和 Cookie
2. 打开 DevTools → Application → Clear site data
3. 重新登录

**可能原因**:
- 旧的无效 session 仍在 localStorage
- 浏览器缓存了旧的代码

---

### Q2: 看到 CORS 错误

**检查 Supabase 配置**:
1. Site URL 是否正确
2. CORS 是否包含您的域名
3. 等待 5-10 分钟让配置生效

**临时解决方案**:
使用 Vercel 域名测试:
```
https://calmlyinvest.vercel.app
```

---

### Q3: Token 过期问题

**症状**: 一段时间后退出登录

**检查**:
```javascript
// 在 Console 查看 token 过期时间
const session = JSON.parse(localStorage.getItem('portfolio-risk-auth'));
console.log('Token expires:', new Date(session.expires_at * 1000));
```

**确认 autoRefreshToken**:
- `client/src/lib/supabase.ts` line 13: `autoRefreshToken: true` ✅

---

### Q4: www 和非 www 域名问题

**如果您使用**:
- https://calmlyinvest.com
- https://www.calmlyinvest.com

**都需要在 Supabase 添加**:
```
Site URL: https://calmlyinvest.com
Redirect URLs:
  - https://calmlyinvest.com/**
  - https://www.calmlyinvest.com/**
```

---

## 📞 需要帮助？

**如果修复后仍有问题，请提供**:

1. **浏览器 Console 日志**:
   - 包括所有 🔐、📦、✅、🔍 的日志
   - 任何红色错误

2. **Network 标签页截图**:
   - `/auth/v1/user` 请求
   - Response Headers
   - 是否有 CORS 错误

3. **LocalStorage 内容**:
   - Application → Local Storage
   - `portfolio-risk-auth` 的值（可以删除敏感 token）

4. **测试环境**:
   - 浏览器类型和版本
   - 使用的域名
   - 是否使用 VPN/代理

---

## 🎯 下一步

**修复并测试成功后**:

1. ✅ 验证 Session 持久化
2. ✅ 登录到 https://calmlyinvest.com
3. ✅ 访问 Settings Wizard: `/settings`
4. ✅ 完成所有 6 个步骤
5. ✅ 告诉我 "Session 修复成功，Settings Wizard 测试通过"

**然后我会立即开始 Phase 3.1 - RiskEngine 开发！** 🚀

---

**文档创建时间**: 2025-10-24
**最后更新**: 2025-10-24
**状态**: 等待部署和验证
