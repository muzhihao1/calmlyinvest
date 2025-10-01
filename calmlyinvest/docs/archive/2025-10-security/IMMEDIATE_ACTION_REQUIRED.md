# 🚨 立即行动：清理网上的敏感信息

## 当前状况

您的 Supabase API 密钥已经暴露在 GitHub 公开仓库中。我已经完成了以下工作：

### ✅ 已完成的工作：

1. **移除源代码中的硬编码密钥**
   - `/client/src/lib/supabase.ts` - 已更新为使用环境变量
   - `/api/auth/register.ts` - 已更新为使用环境变量

2. **更新 .gitignore**
   - 已添加所有包含敏感信息的文件

3. **创建安全文档**
   - `SECURITY_CHECKLIST.md` - 安全检查清单
   - `SECURITY_CLEANUP_GUIDE.md` - 详细清理指南

4. **提交了所有修复**
   - 已提交消息：`Security fix: Remove all hardcoded API keys and sensitive information`

### ❌ 问题：

Git 历史中仍然包含 42 处敏感密钥！BFG 工具未能完全清理，因为最新提交被保护了。

## 🔥 您需要立即执行的步骤

### 步骤 1：立即轮换 Supabase 密钥（最紧急！）

```bash
# 1. 登录 Supabase Dashboard
https://app.supabase.com

# 2. 选择您的项目

# 3. 进入 Settings → API

# 4. 点击 "Roll keys" 或 "Regenerate keys"

# 5. 保存新的密钥
```

### 步骤 2：创建新的干净仓库

由于 Git 历史清理比较复杂，建议采用以下方法：

```bash
# 1. 创建新的 GitHub 仓库（私有）

# 2. 只提交当前的干净代码
git init new-calmlyinvest
cd new-calmlyinvest
cp -r ../calmlyinvest/* .
cp -r ../calmlyinvest/.* . 2>/dev/null || true

# 3. 创建新的 .env 文件（使用新密钥）
echo "VITE_SUPABASE_URL=your_new_url" > .env
echo "VITE_SUPABASE_ANON_KEY=your_new_anon_key" >> .env

# 4. 提交干净的代码
git add .
git commit -m "Initial commit with cleaned codebase"

# 5. 推送到新仓库
git remote add origin https://github.com/muzhihao1/new-calmlyinvest.git
git push -u origin main
```

### 步骤 3：更新 Vercel 部署

1. 在 Vercel 中更新环境变量为新密钥
2. 将 Vercel 项目连接到新的 GitHub 仓库
3. 触发新的部署

### 步骤 4：删除或私有化旧仓库

```bash
# 选项 A：将旧仓库设为私有
# GitHub → Settings → Danger Zone → Change visibility

# 选项 B：完全删除旧仓库（推荐）
# GitHub → Settings → Danger Zone → Delete this repository
```

### 步骤 5：审计 Supabase 访问日志

在 Supabase Dashboard 中：
1. 进入 Logs → API
2. 查看是否有异常访问
3. 检查 Auth logs
4. 如发现异常，立即联系 Supabase 支持

## ⏰ 时间线

1. **立即**（0-5分钟）：轮换 Supabase 密钥
2. **紧急**（5-30分钟）：创建新仓库并更新 Vercel
3. **重要**（30-60分钟）：删除/私有化旧仓库
4. **跟进**（1小时内）：审计访问日志

## 📞 如需帮助

- Supabase 支持：support@supabase.io
- GitHub 安全：https://github.com/security

## ⚠️ 重要提醒

即使您清理了 Git 历史，搜索引擎和第三方服务可能已经缓存了您的密钥。**必须轮换密钥**才能确保安全。

---

**请立即行动！每分钟都很关键。**