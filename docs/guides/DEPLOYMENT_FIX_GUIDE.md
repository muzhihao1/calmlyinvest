# 🚨 Vercel 部署500错误修复指南

## 问题症状

- ✅ 用户可以登录
- ✅ 能获取portfolios列表
- ❌ 所有portfolio详情API返回500错误
- ❌ Dashboard显示空白数据（杠杆率0.00，Beta 0.00等）

## 🔍 根本原因

经过深度分析，发现有**两个关键问题**导致500错误：

### 1. 缺少Supabase服务密钥环境变量
`SUPABASE_SERVICE_ROLE_KEY` 未在Vercel中配置，导致API无法访问数据库

### 2. 模块导入路径问题（已修复）
Vercel serverless环境无法正确解析 `_helpers/token-parser` 导入

## ✅ 解决方案

### 第一步：配置Vercel环境变量（**最重要**）

1. **登录Vercel Dashboard**
   - 访问: https://vercel.com/dashboard
   - 找到你的 `calmlyinvest` 项目

2. **进入环境变量设置**
   - 点击项目
   - 选择 `Settings` 标签
   - 点击左侧 `Environment Variables`

3. **添加必需的环境变量**

   添加以下3个变量：

   #### a) SUPABASE_URL
   ```
   Variable Name: SUPABASE_URL
   Value: https://你的项目ID.supabase.co
   Environment: Production + Preview + Development (全选)
   ```

   #### b) SUPABASE_ANON_KEY
   ```
   Variable Name: SUPABASE_ANON_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cC... (你的anon key)
   Environment: Production + Preview + Development (全选)
   ```

   #### c) SUPABASE_SERVICE_ROLE_KEY ⚠️ **关键**
   ```
   Variable Name: SUPABASE_SERVICE_ROLE_KEY
   Value: eyJhbGciOiJIUzI1NiIsInR5cC... (你的service_role key)
   Environment: Production (仅生产环境，保密！)
   ```

4. **获取Supabase密钥**
   - 登录 https://supabase.com
   - 选择你的项目
   - Settings → API
   - 复制：
     - Project URL → `SUPABASE_URL`
     - anon public → `SUPABASE_ANON_KEY`
     - service_role → `SUPABASE_SERVICE_ROLE_KEY` (点击"Reveal"显示)

5. **保存并重新部署**
   - 添加完所有3个变量后，点击 `Save`
   - 回到 `Deployments` 页面
   - 找到最新部署，点击右侧 `...` 菜单
   - 选择 `Redeploy`
   - **勾选** "Use existing Build Cache"
   - 点击 `Redeploy` 确认

### 第二步：代码修复（已完成）

已修复以下文件，内联token解析逻辑以避免导入问题：
- ✅ [portfolio-details-simple.ts](api/portfolio-details-simple.ts)
- ⏳ portfolio-stocks-simple.ts (需要应用相同修复)
- ⏳ portfolio-options-simple.ts (需要应用相同修复)
- ⏳ portfolio-risk-simple.ts (需要应用相同修复)

修复内容：
1. 移除 `import { extractToken } from './_helpers/token-parser'`
2. 直接在文件中定义 `extractToken` 函数
3. 增强错误日志，包含详细提示信息

### 第三步：验证修复

部署完成后，执行以下验证步骤：

1. **访问应用**
   - 打开 https://www.calmlyinvest.com
   - 使用你的账号登录

2. **检查Dashboard**
   - 查看是否显示实际数据
   - 杠杆率、Beta值等应显示正确数值

3. **查看浏览器控制台**
   - 按F12打开开发者工具
   - 切换到 `Console` 标签
   - 检查是否还有500错误
   - 应该看到成功的200响应

4. **检查Vercel日志**（如果仍有问题）
   - Vercel Dashboard → Deployments
   - 点击最新部署
   - 点击 `Functions` 标签
   - 查看各个API函数的日志
   - 搜索 `[portfolio-details-simple]` 等标签

## 📊 预期结果

修复后，你应该能看到：

✅ **Dashboard显示实际数据**
- 杠杆率显示正确计算值（如 1.25）
- Beta值显示投资组合Beta（如 0.95）
- 持仓集中度显示百分比（如 35%）
- 保证金使用率显示实际值

✅ **API返回200状态**
```
GET /api/portfolio-details-simple?portfolioId=xxx → 200 OK
GET /api/portfolio-stocks-simple?portfolioId=xxx → 200 OK
GET /api/portfolio-options-simple?portfolioId=xxx → 200 OK
GET /api/portfolio-risk-simple?portfolioId=xxx → 200 OK
```

✅ **控制台日志**
```
[portfolio-details-simple] GET request for portfolio: 186ecd89-...
[portfolio-details-simple] User authenticated: 8e82d664-...
[portfolio-details-simple] Calculation: { portfolioId, cash: 10000, ... }
```

## 🛠️ 故障排除

### 问题1: 仍然500错误

**检查清单**:
- [ ] 确认已添加全部3个环境变量
- [ ] 确认 `SUPABASE_SERVICE_ROLE_KEY` 是 **service_role** key（不是anon key）
- [ ] 确认已点击 `Redeploy` 重新部署
- [ ] 确认新部署已完成（状态显示 `Ready`）

**调试步骤**:
1. 查看Vercel函数日志
2. 搜索 `Missing SUPABASE_SERVICE_ROLE_KEY` 错误
3. 如果看到此错误，说明环境变量未生效，需要重新部署

### 问题2: 401 Unauthorized

**可能原因**:
- Token格式错误
- Supabase anon key配置错误

**解决方案**:
1. 检查 `SUPABASE_ANON_KEY` 是否正确
2. 在浏览器中清除localStorage
3. 重新登录

### 问题3: 403 Forbidden

**可能原因**:
- Portfolio不属于当前用户
- RLS策略问题

**解决方案**:
1. 检查Supabase Dashboard中的RLS policies
2. 确保 `portfolios` 表有正确的RLS策略
3. 验证portfolio的 `user_id` 与当前用户匹配

### 问题4: 环境变量不生效

**原因**: 环境变量修改需要重新部署才能生效

**解决方案**:
```
1. Settings → Environment Variables → 添加/修改变量 → Save
2. Deployments → 最新部署 → ... → Redeploy
3. 等待部署完成（约1-2分钟）
4. 刷新应用页面
```

## 📝 更多信息

详细配置说明请参考：
- [VERCEL_ENV_SETUP.md](VERCEL_ENV_SETUP.md) - 环境变量配置详细指南
- [CLAUDE.md](CLAUDE.md) - 项目架构和部署信息
- [README_CALMLY.md](README_CALMLY.md) - 用户使用指南

## ✉️ 获取帮助

如果按照以上步骤仍无法解决问题：

1. **收集诊断信息**:
   - Vercel函数日志截图
   - 浏览器控制台错误截图
   - 网络请求详情（Network标签）

2. **检查点**:
   - Supabase项目是否正常运行
   - 环境变量是否正确配置
   - 代码是否最新版本

3. **联系支持**:
   - 在GitHub仓库提交Issue
   - 包含上述诊断信息

---

**最后更新**: 2025-10-21
**修复版本**: v1.2.0
**适用环境**: Vercel Production Deployment
