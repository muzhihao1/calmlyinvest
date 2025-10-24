# 用户行动清单 / User Action Checklist

**Date**: 2025-10-24
**Phase**: Phase 2 完成 / Phase 2 Completed
**Status**: 等待用户测试 / Awaiting User Testing

---

## 🎯 您现在需要做什么 / What You Need to Do Now

### 1️⃣ 启动开发服务器 / Start Development Server

```bash
cd /Users/liasiloam/Vibecoding/1MyProducts/CamlyInvest
npm run dev
```

**期望输出 / Expected Output**:
```
✓ Ready in XXX ms
➜  Local:   http://localhost:5173/
Express server running on http://localhost:5000
```

---

### 2️⃣ 测试 Settings Wizard / Test Settings Wizard

**路由 / Routes**:
- 设置页面: `http://localhost:5173/settings`
- 引导页面: `http://localhost:5173/onboarding`

**测试步骤 / Testing Steps**:

1. **登录 / Login**
   - 使用演示账户: `demo` / `demo123`
   - 或使用您的 Supabase 账户

2. **访问设置向导 / Access Wizard**
   - 在浏览器打开: `http://localhost:5173/settings`

3. **完成所有 6 个步骤 / Complete All 6 Steps**:
   - ✅ Step 1: 投资目标 (Investment Goal)
   - ✅ Step 2: 风险承受能力 (Risk Tolerance)
   - ✅ Step 3: 投资期限 (Investment Horizon)
   - ✅ Step 4: 风险阈值参数 (Risk Thresholds)
   - ✅ Step 5: 行业偏好 (Sector Preferences)
   - ✅ Step 6: 确认 (Confirmation)

4. **点击 "完成设置" / Click "Complete Setup"**

5. **验证 / Verify**:
   - 应该重定向到 Dashboard
   - 数据应该保存到 Supabase

---

### 3️⃣ 验证数据库 / Verify Database

**Supabase Dashboard**:
1. 打开 Supabase Dashboard
2. 进入 Table Editor
3. 查看 `user_preferences` 表
4. 确认您的数据已保存

**SQL 查询 / SQL Query**:
```sql
SELECT * FROM user_preferences
WHERE user_id = auth.uid();
```

**期望结果 / Expected Result**:
- 1 行数据 with all your preferences
- `onboarding_completed` = `true`

---

### 4️⃣ 报告问题（如果有）/ Report Issues (If Any)

如果遇到问题 / If you encounter issues:

1. **检查浏览器控制台 / Check Browser Console**
   - 打开 DevTools (F12)
   - 查看 Console 标签页
   - 截图任何错误信息

2. **检查网络请求 / Check Network Requests**
   - 打开 Network 标签页
   - 查看 API 请求是否成功 (200 OK)
   - 检查请求/响应数据

3. **查看故障排除指南 / See Troubleshooting**
   - 详细指南: `/docs/PHASE_2_TESTING_GUIDE.md`

---

## ✅ 验证清单 / Verification Checklist

### 必须验证 / Must Verify

- [ ] 开发服务器正常启动 / Dev server starts successfully
- [ ] 可以访问 `/settings` 路由 / Can access `/settings` route
- [ ] Settings Wizard 正常加载 / Settings Wizard loads properly
- [ ] 所有 6 个步骤都可见 / All 6 steps are visible
- [ ] 可以选择选项并继续 / Can select options and continue
- [ ] 进度条正常工作 / Progress bar works
- [ ] "返回" 和 "继续" 按钮正常 / Back/Continue buttons work
- [ ] 最终确认页面显示所有选择 / Final confirmation shows all selections
- [ ] "完成设置" 重定向到 Dashboard / "Complete Setup" redirects to Dashboard
- [ ] 数据保存到 Supabase / Data saved to Supabase

### 建议验证 / Recommended to Verify

- [ ] 编辑按钮可以返回特定步骤 / Edit buttons return to specific steps
- [ ] 滑块可以调整数值 / Sliders can adjust values
- [ ] 行业偏好可以切换 / Sector preferences can be toggled
- [ ] 表单验证正常工作 / Form validation works
- [ ] 中英文标签都正确显示 / Bilingual labels display correctly
- [ ] 移动端响应式布局正常 / Mobile responsive layout works

---

## 🚀 测试成功后 / After Successful Testing

### 下一步行动 / Next Actions

1. **（可选）提交代码 / (Optional) Commit Code**
   ```bash
   git add .
   git commit -m "test: verify Phase 2 Settings Wizard working correctly"
   git push origin main
   ```

2. **准备 Phase 3 开发 / Prepare for Phase 3 Development**
   - Phase 3: AI Logic Engine (AI 逻辑引擎)
   - 内容:
     - RiskEngine (风险引擎)
     - RecommendationEngine (推荐引擎)
     - AI 顾问集成

3. **（可选）部署到生产环境 / (Optional) Deploy to Production**
   - Vercel 将自动部署 / Vercel will auto-deploy
   - 确保在 Vercel 设置环境变量 / Ensure env vars set in Vercel
   - 在生产 Supabase 应用迁移 / Apply migration to production Supabase

---

## 💡 提示 / Tips

### 调试技巧 / Debugging Tips

1. **查看日志 / Check Logs**
   ```bash
   # Terminal 查看 Express 服务器日志
   # Browser DevTools 查看前端日志
   ```

2. **验证 API / Verify API**
   ```bash
   # 测试 API 端点
   curl http://localhost:5000/api/user/preferences \
     -H "Authorization: Bearer YOUR_JWT_TOKEN"
   ```

3. **检查数据库 / Check Database**
   - Supabase Dashboard → SQL Editor
   - 运行查询查看 user_preferences 表

### 常见问题 / Common Issues

| 问题 / Issue | 解决方案 / Solution |
|-------------|-------------------|
| 页面空白 / Blank page | 检查控制台错误 / Check console errors |
| API 404 | 确认 Express 服务器正在运行 / Confirm Express server running |
| 数据未保存 / Data not saving | 检查 Supabase 连接和 RLS 策略 / Check Supabase connection & RLS |
| TypeScript 错误 / TS errors | 运行 `npm run check` / Run `npm run check` |

---

## 📚 参考文档 / Reference Documentation

详细文档 / Detailed Documentation:
- **测试指南 / Testing Guide**: `/docs/PHASE_2_TESTING_GUIDE.md` (完整测试步骤)
- **完成报告 / Completion Report**: `/docs/PHASE_2_COMPLETION_REPORT.md` (架构概述)
- **Hook 使用 / Hook Usage**: `/docs/PHASE_2_HOOK_USAGE.md` (API 参考)
- **迁移指南 / Migration Guide**: `/docs/MIGRATION_GUIDE.md` (数据库设置)

---

## ❓ 需要帮助？/ Need Help?

如果遇到问题 / If you encounter issues:

1. 查看详细测试指南 / See detailed testing guide:
   ```
   /docs/PHASE_2_TESTING_GUIDE.md
   ```

2. 检查故障排除部分 / Check troubleshooting section

3. 验证所有先决条件 / Verify all prerequisites:
   - ✓ 数据库迁移已应用 / Migration applied
   - ✓ 环境变量已设置 / Env vars set
   - ✓ 依赖已安装 / Dependencies installed

---

## 📊 当前状态 / Current Status

### ✅ 已完成 / Completed

- [x] 数据库架构 / Database Schema
- [x] API 端点 / API Endpoints
- [x] 前端 Hook / Frontend Hook
- [x] UI 组件 (8 个文件) / UI Components (8 files)
- [x] 路由集成 / Routing Integration
- [x] TypeScript 类型修复 / TypeScript Fixes
- [x] 测试指南 / Testing Guide
- [x] 用户行动清单 / User Action Checklist

### ⏳ 等待 / Pending

- [ ] 用户测试验证 / User Testing Verification
- [ ] Git 提交 (可选) / Git Commit (optional)
- [ ] Phase 3 规划 / Phase 3 Planning

### 🎯 下一阶段 / Next Phase

**Phase 3: AI Logic Engine**
- RiskEngine: 个性化风险评分
- RecommendationEngine: 投资建议生成
- 与用户偏好集成

---

**创建时间 / Created**: 2025-10-24
**状态 / Status**: 准备测试 / Ready for Testing
**优先级 / Priority**: 高 / High - 请尽快测试 / Please test ASAP

---

## 📞 问题？/ Questions?

如果您有任何问题或遇到错误，请告诉我详细信息：
- 错误截图 / Error screenshots
- 浏览器控制台日志 / Browser console logs
- 网络请求详情 / Network request details

我会立即帮助解决！/ I'll help resolve immediately!
