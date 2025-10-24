# Phase 2 实施进度报告 - Step 2 完成
## Phase 2 Implementation Progress Report - Step 2 Completed

**日期 / Date**: 2025-10-24
**阶段 / Phase**: Phase 2 - 用户偏好系统
**步骤 / Step**: 2/5 - API 端点开发
**状态 / Status**: ✅ **已完成 / Completed**

---

## 📋 执行摘要 / Executive Summary

成功完成了 Phase 2 的第二个关键步骤：创建用户偏好 API 端点。该端点提供完整的 CRUD 操作，使用 Supabase RLS 进行权限控制，为前端 Settings Wizard 提供数据服务。

### 完成的工作 / Completed Work

#### 1. ✅ API 端点创建

**文件位置**: `/api/user/preferences.ts`

**支持的 HTTP 方法**:
- `OPTIONS` - CORS 预检请求处理
- `GET` - 获取用户偏好设置
- `POST` - 创建新的偏好设置（首次设置）
- `PUT` - 更新现有偏好设置（支持 upsert）

**核心功能**:
1. 完整的身份验证流程
2. 基于 RLS 的权限控制
3. Zod schema 输入验证
4. 统一的错误处理
5. 详细的日志记录

---

## 🔧 技术实现 / Technical Implementation

### API 端点架构

```typescript
Handler Flow:
├── CORS 处理 (setCorsHeaders)
├── OPTIONS 请求处理
├── 身份验证 (requireAuth)
├── JWT token 提取
├── 创建 Supabase 客户端 (用户 token)
└── 路由到对应 handler
    ├── GET → handleGet()
    ├── POST → handlePost()
    └── PUT → handlePut()
```

### 1. GET /api/user/preferences

**功能**: 获取当前用户的偏好设置

**流程**:
1. 从数据库查询 `user_preferences` 表
2. 如果记录不存在，返回默认值 + `exists: false`
3. 如果记录存在，返回实际数据 + `exists: true`

**响应格式**:
```json
{
  "userId": "uuid",
  "investmentGoal": "balanced",
  "riskTolerance": "moderate",
  "investmentHorizon": "medium_term",
  "maxLeverageRatio": "1.5",
  "maxConcentrationPct": "25.0",
  "maxSectorConcentrationPct": "40.0",
  "minCashRatio": "10.0",
  "maxMarginUsagePct": "50.0",
  "targetBeta": null,
  "targetDelta": null,
  "sectorPreferences": { "prefer": [], "avoid": [] },
  "onboardingCompleted": false,
  "exists": true,
  "createdAt": "2025-10-24T...",
  "updatedAt": "2025-10-24T..."
}
```

**默认值**: 基于行业最佳实践
- `investmentGoal`: `"balanced"`
- `riskTolerance`: `"moderate"`
- `investmentHorizon`: `"medium_term"`
- `maxLeverageRatio`: `"1.5"`
- 其他阈值设置合理默认值

### 2. POST /api/user/preferences

**功能**: 创建新的用户偏好（首次设置）

**流程**:
1. 使用 `insertUserPreferencesSchema` 验证请求体
2. 检查是否已存在偏好设置
3. 如果已存在，返回 409 Conflict
4. 如果不存在，插入新记录并返回 201

**请求体示例**:
```json
{
  "investmentGoal": "growth",
  "riskTolerance": "aggressive",
  "investmentHorizon": "long_term",
  "maxLeverageRatio": "2.0",
  "maxConcentrationPct": "30.0",
  "sectorPreferences": {
    "prefer": ["Technology", "Healthcare"],
    "avoid": ["Energy"]
  }
}
```

**验证规则**:
- 所有核心字段必填（投资目标、风险承受能力、投资期限）
- 数值字段范围验证
- 跨字段逻辑验证（例如：growth goal 不应搭配 conservative tolerance）

**错误响应**:
```json
// 409 - 偏好已存在
{
  "error": "User preferences already exist. Use PUT to update.",
  "userId": "uuid",
  "timestamp": "2025-10-24T..."
}
```

### 3. PUT /api/user/preferences

**功能**: 更新现有偏好设置（支持部分更新和 upsert）

**流程**:
1. 使用 `updateUserPreferencesSchema` 验证（所有字段可选）
2. 构建只包含提供字段的更新对象
3. 使用 Supabase `upsert` 操作（更新或插入）
4. 返回更新后的完整记录

**特点**:
- **部分更新**: 只需提供要更新的字段
- **Upsert 行为**: 如果记录不存在则创建，存在则更新
- **自动时间戳**: `updated_at` 自动更新

**请求体示例（部分更新）**:
```json
{
  "riskTolerance": "moderate",
  "maxLeverageRatio": "1.8"
}
```

---

## 🔒 安全设计 / Security Design

### 1. 身份验证流程

```typescript
// 1. 验证 JWT token
const authResult = await requireAuth(req);

// 2. 提取 user ID
const userId = user.id;

// 3. 创建带用户 token 的 Supabase 客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: {
    headers: {
      Authorization: `Bearer ${token}`
    }
  }
});
```

### 2. Row Level Security (RLS)

**优势**:
- 数据库层面的权限控制
- 用户自动只能访问自己的数据
- 无需在代码中手动验证权限
- 防止权限绕过攻击

**RLS 策略应用**:
```sql
-- RLS 自动确保：
-- 1. 用户只能查询自己的 user_preferences
-- 2. 用户只能插入自己的 user_id
-- 3. 用户只能更新/删除自己的记录
```

### 3. 输入验证

**多层验证**:
1. **Zod Schema 验证** - 类型和格式检查
2. **范围验证** - 数值在合理范围内
3. **跨字段验证** - 业务逻辑检查
4. **SQL 注入防护** - Supabase 自动处理

**验证示例**:
```typescript
// 杠杆率验证
maxLeverageRatio: z.string()
  .refine(val => parseFloat(val) > 0 && parseFloat(val) <= 10, {
    message: 'Max leverage ratio must be between 0 and 10'
  })
```

---

## 📊 数据流设计 / Data Flow Design

### 完整的数据流

```
┌─────────────┐
│   Browser   │
│  (JWT token)│
└──────┬──────┘
       │ HTTPS Request
       │ Authorization: Bearer <token>
       ▼
┌─────────────────────┐
│ Vercel Serverless   │
│ /api/user/preferences│
├─────────────────────┤
│ 1. CORS Check       │
│ 2. Auth Verify      │
│ 3. Extract user_id  │
│ 4. Zod Validation   │
└──────┬──────────────┘
       │ Authenticated Request
       ▼
┌─────────────────────┐
│ Supabase PostgreSQL │
│ user_preferences    │
├─────────────────────┤
│ 1. RLS Check        │
│ 2. Execute Query    │
│ 3. Return Data      │
└──────┬──────────────┘
       │ Response
       ▼
┌─────────────┐
│   Browser   │
│   (JSON)    │
└─────────────┘
```

---

## 🎨 代码质量 / Code Quality

### 1. TypeScript 类型安全

```typescript
// 完整的类型定义
import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  UserPreferences,
  InsertUserPreferences,
  insertUserPreferencesSchema,
  updateUserPreferencesSchema
} from '../../shared/schema-supabase';
```

### 2. 错误处理

```typescript
// 统一的错误响应格式
try {
  // ... 业务逻辑
} catch (error) {
  console.error('API Error:', error);
  return sendError(
    res,
    error instanceof Error ? error : 'Internal server error',
    500
  );
}
```

### 3. 日志记录

```typescript
// 关键操作日志
console.log(`No preferences found for user ${userId}, returning defaults`);
console.log(`Created preferences for user ${userId}`);
console.log(`Updated preferences for user ${userId}`);
console.error('Supabase query error:', error);
```

### 4. CORS 处理

```typescript
// 统一的 CORS 配置
setCorsHeaders(res, req);
// 支持所有来源、所有 HTTP 方法
// 包含认证头支持
```

---

## 🔧 优化亮点 / Optimization Highlights

### 1. 使用 RLS 而非 Service Role

**改进前** (初版):
```typescript
// 使用 supabaseAdmin（绕过 RLS）
const { data } = await supabaseAdmin
  .from('user_preferences')
  .select('*')
  .eq('user_id', userId);

// 需要手动验证权限
if (data.user_id !== userId) {
  return sendError(res, 'Access denied', 403);
}
```

**改进后** (当前版本):
```typescript
// 使用用户 token（RLS 自动处理）
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  global: { headers: { Authorization: `Bearer ${token}` } }
});

const { data } = await supabase
  .from('user_preferences')
  .select('*')
  .eq('user_id', userId);

// RLS 自动确保用户只能访问自己的数据
// 更安全、代码更简洁
```

**优势**:
- ✅ 数据库层面的安全保障
- ✅ 代码更简洁、易维护
- ✅ 遵循 Supabase 最佳实践
- ✅ 防止权限绕过漏洞

### 2. Upsert 操作简化流程

**传统方式**:
```typescript
// 1. 检查是否存在
const existing = await db.select()...;

if (existing) {
  // 2. 更新
  await db.update()...;
} else {
  // 3. 插入
  await db.insert()...;
}
```

**Upsert 方式**:
```typescript
// 一次操作完成
const { data } = await supabase
  .from('user_preferences')
  .upsert({ user_id: userId, ...updateData }, { onConflict: 'user_id' })
  .select()
  .single();
```

**优势**:
- ✅ 减少数据库往返次数
- ✅ 避免竞态条件
- ✅ 代码更简洁
- ✅ 适合向导自动保存场景

### 3. 默认值策略

提供合理的默认值，改善新用户体验：
```typescript
const DEFAULT_PREFERENCES = {
  investmentGoal: 'balanced',      // 平衡型
  riskTolerance: 'moderate',       // 稳健型
  investmentHorizon: 'medium_term', // 中期
  maxLeverageRatio: '1.5',         // 1.5x 杠杆
  // ... 其他合理默认值
};
```

---

## ⚠️ 已知问题和注意事项 / Known Issues

### 1. TypeScript 项目级别类型错误

**问题**: `npm run check` 显示现有代码的类型错误

**影响**: 不影响新 API 端点，错误来自：
- `/api/_archived/*` - 归档的旧代码
- `/client/src/components/add-holding-dialog.tsx` - 现有前端组件

**状态**: 新 API 端点代码类型正确，现有错误不属于此次实施范围

### 2. 环境变量配置

**要求**: Vercel 环境变量必须配置：
```bash
SUPABASE_URL
SUPABASE_ANON_KEY
# SUPABASE_SERVICE_ROLE_KEY 不需要（使用 RLS 方案）
```

**验证方法**:
```typescript
// API 端点会检查环境变量
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
```

---

## 🧪 测试建议 / Testing Recommendations

### 单元测试（计划中）

```typescript
describe('GET /api/user/preferences', () => {
  it('should return default preferences for new user', async () => {
    // Mock Supabase response with PGRST116 error
    // Expect default values returned
  });

  it('should return existing preferences', async () => {
    // Mock existing user preferences
    // Expect actual data returned
  });
});

describe('POST /api/user/preferences', () => {
  it('should create new preferences', async () => {
    // Mock successful insert
    // Expect 201 status
  });

  it('should reject duplicate creation', async () => {
    // Mock existing preferences
    // Expect 409 status
  });
});

describe('PUT /api/user/preferences', () => {
  it('should update existing preferences', async () => {
    // Mock successful update
    // Expect updated data
  });

  it('should validate input data', async () => {
    // Send invalid data
    // Expect 400 validation error
  });
});
```

### 集成测试（下一步）

需要实际的 Supabase 数据库测试环境：
1. 应用数据库迁移
2. 创建测试用户
3. 测试完整的 CRUD 流程
4. 验证 RLS 策略生效

### 手动测试清单

- [ ] GET - 新用户获取默认值
- [ ] GET - 现有用户获取实际数据
- [ ] POST - 创建新偏好
- [ ] POST - 重复创建返回 409
- [ ] PUT - 部分更新字段
- [ ] PUT - Upsert 创建新记录
- [ ] 验证 RLS - 无法访问其他用户数据
- [ ] 验证 CORS - 前端可正常调用
- [ ] 验证输入 - 无效数据返回 400

---

## 📝 API 使用示例 / API Usage Examples

### 前端集成代码示例

```typescript
// 1. 获取用户偏好
async function getUserPreferences(token: string) {
  const response = await fetch('/api/user/preferences', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch preferences');
  }

  return await response.json();
}

// 2. 创建用户偏好（首次设置）
async function createUserPreferences(token: string, data: any) {
  const response = await fetch('/api/user/preferences', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (response.status === 409) {
    console.log('Preferences already exist, using PUT instead');
    return updateUserPreferences(token, data);
  }

  if (!response.ok) {
    throw new Error('Failed to create preferences');
  }

  return await response.json();
}

// 3. 更新用户偏好（向导自动保存）
async function updateUserPreferences(token: string, data: any) {
  const response = await fetch('/api/user/preferences', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error('Failed to update preferences');
  }

  return await response.json();
}
```

### React Hook 示例

```typescript
// useUserPreferences.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export function useUserPreferences() {
  const queryClient = useQueryClient();
  const { user } = useAuth(); // 获取当前用户和 token

  // 查询偏好
  const { data: preferences, isLoading } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: () => getUserPreferences(user.token),
    enabled: !!user,
  });

  // 创建偏好
  const createMutation = useMutation({
    mutationFn: (data: any) => createUserPreferences(user.token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
    },
  });

  // 更新偏好
  const updateMutation = useMutation({
    mutationFn: (data: any) => updateUserPreferences(user.token, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] });
    },
  });

  return {
    preferences,
    isLoading,
    createPreferences: createMutation.mutate,
    updatePreferences: updateMutation.mutate,
  };
}
```

---

## 🎯 下一步计划 / Next Steps

### Step 3: 应用数据库迁移 (预计 1 天)

**任务**:
1. 在 Supabase Dashboard 执行迁移 SQL
2. 验证表结构和索引
3. 验证 RLS 策略
4. 测试数据库连接

**验证清单**:
- [ ] `user_preferences` 表已创建
- [ ] 所有枚举类型已创建
- [ ] 索引已创建
- [ ] RLS 策略已启用
- [ ] 触发器已创建

### Step 4: API 集成测试 (预计 1-2 天)

**任务**:
1. 创建测试用户
2. 测试所有 API 端点
3. 验证 RLS 安全性
4. 性能测试

### Step 5: 前端 Settings Wizard 开发 (预计 3-4 天)

**组件清单**:
- `SettingsWizard.tsx` - 主容器
- `Step1InvestmentGoal.tsx`
- `Step2RiskTolerance.tsx`
- `Step3InvestmentHorizon.tsx`
- `Step4RiskThresholds.tsx`
- `Step5SectorPreferences.tsx`
- `Step6Confirmation.tsx`
- `useUserPreferences.ts` - 自定义 Hook

---

## ✅ 验收标准检查 / Acceptance Criteria

### Phase 2 - Step 2 验收标准

- [x] API 端点已创建 (`/api/user/preferences.ts`)
- [x] 支持 GET, POST, PUT 方法
- [x] 实现身份验证流程
- [x] 使用 RLS 进行权限控制
- [x] Zod schema 输入验证
- [x] 统一的错误处理
- [x] CORS 支持
- [x] 日志记录完整
- [x] 代码符合 TypeScript 规范
- [x] 导入路径正确
- [x] 详细的代码注释

---

## 📚 相关文档链接 / Technical Documentation

### 相关文件

- **API 端点**: `/api/user/preferences.ts`
- **Schema 定义**: `/shared/schema-supabase.ts`
- **工具函数**: `/api/utils/auth.ts`, `/api/utils/response.ts`
- **Step 1 进度**: `/docs/PHASE_2_PROGRESS_STEP1.md`
- **本进度报告**: `/docs/PHASE_2_PROGRESS_STEP2.md`

### 技术参考

- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Zod Validation](https://zod.dev/)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript/introduction)

---

## 💡 技术决策记录 / Technical Decision Record

### 1. 为什么使用 RLS 而不是 Service Role？

**决策**: 使用用户 JWT token + RLS，而不是 Service Role Key

**理由**:
1. **更安全**: 数据库层面的权限控制，无法绕过
2. **更简洁**: 无需手动验证用户权限
3. **最佳实践**: Supabase 官方推荐方式
4. **防御深度**: 即使代码有漏洞，数据库也会拦截

### 2. 为什么实现 Upsert 而不是分开的 Update？

**决策**: PUT 方法使用 upsert 行为

**理由**:
1. **简化向导逻辑**: 前端无需判断是创建还是更新
2. **避免竞态**: 单次原子操作
3. **用户体验**: 向导每一步都能自动保存
4. **容错性**: 即使用户刷新页面也能继续

### 3. 为什么返回默认值而不是 404？

**决策**: 新用户 GET 返回默认值 + `exists: false`

**理由**:
1. **用户体验**: 前端无需处理 404 特殊逻辑
2. **一致性**: 总是返回完整的偏好对象
3. **类型安全**: 前端可以依赖数据结构
4. **渐进式**: 用户可以看到推荐的默认值

---

## 🎉 总结 / Summary

✅ **Phase 2 - Step 2 成功完成！**

我们成功创建了完整的用户偏好 API 端点，提供：
- ✅ 完整的 CRUD 操作
- ✅ 基于 RLS 的安全架构
- ✅ 严格的输入验证
- ✅ 优雅的错误处理
- ✅ 良好的代码质量

这为后续的前端 Settings Wizard 开发提供了坚实的后端支持。

**下一步**: 应用数据库迁移，然后开始前端组件开发。

---

**文档版本**: 1.0
**创建者**: Claude Code (AI Assistant)
**最后更新**: 2025-10-24
