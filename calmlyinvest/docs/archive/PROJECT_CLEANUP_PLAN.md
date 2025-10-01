# 项目清理计划

## 📊 当前状况

**发现的问题:**
- ✅ 38个Markdown文档文件在根目录
- ✅ 多个重复的部署指南
- ✅ 过时的状态报告
- ✅ 多个安全事件报告
- ✅ 项目结构混乱

## 🎯 清理目标

1. **保持简洁** - 只保留必要的文档
2. **归档历史** - 将旧文件移到 `docs/archive/`
3. **合并重复** - 整合重复的内容
4. **标准化** - 使用标准的项目结构

## 📁 建议的文件结构

```
calmlyinvest/
├── README.md                       # 保留 - 项目概述
├── CLAUDE.md                       # 保留 - AI开发指导
├── TROUBLESHOOTING.md              # 保留 - 故障排除
├── URGENT_SECURITY_RESPONSE.md     # 保留 - 当前安全响应
├── docs/
│   ├── deployment/
│   │   ├── deployment-guide.md     # 合并所有部署指南
│   │   └── vercel-setup.md         # Vercel特定设置
│   ├── security/
│   │   ├── security-checklist.md   # 安全检查清单
│   │   └── incident-response.md    # 安全事件响应
│   ├── development/
│   │   ├── supabase-setup.md       # Supabase设置
│   │   └── mcp-setup.md            # MCP设置
│   └── archive/                    # 历史文档
│       ├── 2025-07-security/       # 7月安全事件
│       ├── 2025-10-security/       # 10月安全事件
│       └── deployment-history/     # 部署历史
```

## 🗑️ 待删除文件 (共26个)

### 重复的部署文档 (删除)
- [ ] DEPLOYMENT_CHECKLIST.md
- [ ] DEPLOYMENT_CHECKLIST_FINAL.md
- [ ] DEPLOYMENT_FIX_COMPLETE.md
- [ ] DEPLOYMENT_FIX_SUMMARY.md
- [ ] DEPLOYMENT_STATUS_SUMMARY.md
- [ ] DEPLOYMENT_STEPS.md
- [ ] SERVERLESS_MIGRATION_SUMMARY.md
- [ ] VERCEL_API_ISSUE.md
- [ ] VERCEL_ENV_VARS_GUIDE.md

### 过时的状态报告 (归档到 docs/archive/)
- [ ] API_ROUTING_FIX.md
- [ ] CLEANUP_STATUS_FINAL.md
- [ ] CURRENT_STATUS.md
- [ ] FILES_CHANGED.md
- [ ] MIGRATION_COMPLETE.md
- [ ] PROJECT_STATUS.md
- [ ] ROUTING_FIX_STATUS.md

### 重复的安全文档 (整合)
- [ ] FINAL_SECURITY_STATUS.md
- [ ] IMMEDIATE_ACTION_REQUIRED.md
- [ ] SECURITY_CLEANUP_GUIDE.md
- [ ] SECURITY_FIXES_SUMMARY.md
- [ ] SECURITY_INCIDENT_FINAL_REPORT.md
- [ ] SECURITY_INCIDENT_SUMMARY.md
- [ ] SECURITY_KEY_ROTATION_COMPLETE.md
- [ ] SECURITY_KEY_ROTATION_LOG.md
- [ ] SECURITY_UPDATE_STATUS.md

### 其他
- [ ] replit.md (项目不使用Replit)
- [ ] QUICK_SETUP.md (内容已整合到README)

## 📝 待保留/整合文件

### 保留在根目录
- ✅ README.md
- ✅ CLAUDE.md
- ✅ TROUBLESHOOTING.md
- ✅ URGENT_SECURITY_RESPONSE.md (当前安全响应)

### 移动到 docs/deployment/
- ➡️ DEPLOYMENT.md → docs/deployment/deployment-guide.md
- ➡️ VERCEL_ENV_SETUP.md → docs/deployment/vercel-setup.md

### 移动到 docs/security/
- ➡️ SECURITY_CHECKLIST.md → docs/security/security-checklist.md
- ➡️ SECURITY_INCIDENT_RESPONSE.md → docs/security/incident-response.md

### 移动到 docs/development/
- ➡️ SUPABASE_MIGRATION.md → docs/development/supabase-migration.md
- ➡️ supabase-setup-guide.md → docs/development/supabase-setup.md
- ➡️ SUPABASE-MCP-安装指南.md → docs/development/mcp-setup.md
- ➡️ MCP_TOKEN_SETUP.md → docs/development/mcp-token-setup.md
- ➡️ SUPABASE_AUTH_FIX.md → docs/development/auth-troubleshooting.md
- ➡️ SUPABASE_RATE_LIMITS.md → docs/development/rate-limits.md

## 🔧 执行步骤

### Step 1: 创建目录结构
```bash
mkdir -p docs/{deployment,security,development,archive/2025-10-security}
```

### Step 2: 移动保留文件
```bash
# 部署文档
mv DEPLOYMENT.md docs/deployment/deployment-guide.md
mv VERCEL_ENV_SETUP.md docs/deployment/vercel-setup.md

# 安全文档
mv SECURITY_CHECKLIST.md docs/security/security-checklist.md
mv SECURITY_INCIDENT_RESPONSE.md docs/security/incident-response.md

# 开发文档
mv SUPABASE_MIGRATION.md docs/development/supabase-migration.md
mv supabase-setup-guide.md docs/development/supabase-setup.md
mv SUPABASE-MCP-安装指南.md docs/development/mcp-setup.md
mv MCP_TOKEN_SETUP.md docs/development/mcp-token-setup.md
mv SUPABASE_AUTH_FIX.md docs/development/auth-troubleshooting.md
mv SUPABASE_RATE_LIMITS.md docs/development/rate-limits.md
```

### Step 3: 归档旧文档
```bash
# 安全事件文档
mv FINAL_SECURITY_STATUS.md docs/archive/2025-10-security/
mv IMMEDIATE_ACTION_REQUIRED.md docs/archive/2025-10-security/
mv SECURITY_CLEANUP_GUIDE.md docs/archive/2025-10-security/
mv SECURITY_FIXES_SUMMARY.md docs/archive/2025-10-security/
mv SECURITY_INCIDENT_FINAL_REPORT.md docs/archive/2025-10-security/
mv SECURITY_INCIDENT_SUMMARY.md docs/archive/2025-10-security/
mv SECURITY_KEY_ROTATION_COMPLETE.md docs/archive/2025-10-security/
mv SECURITY_KEY_ROTATION_LOG.md docs/archive/2025-10-security/
mv SECURITY_UPDATE_STATUS.md docs/archive/2025-10-security/

# 部署历史
mkdir -p docs/archive/deployment-history
mv DEPLOYMENT_CHECKLIST.md docs/archive/deployment-history/
mv DEPLOYMENT_CHECKLIST_FINAL.md docs/archive/deployment-history/
mv DEPLOYMENT_FIX_COMPLETE.md docs/archive/deployment-history/
mv DEPLOYMENT_FIX_SUMMARY.md docs/archive/deployment-history/
mv DEPLOYMENT_STATUS_SUMMARY.md docs/archive/deployment-history/
mv DEPLOYMENT_STEPS.md docs/archive/deployment-history/
mv SERVERLESS_MIGRATION_SUMMARY.md docs/archive/deployment-history/
mv VERCEL_API_ISSUE.md docs/archive/deployment-history/
mv VERCEL_ENV_VARS_GUIDE.md docs/archive/deployment-history/

# 其他历史文档
mkdir -p docs/archive/status-reports
mv API_ROUTING_FIX.md docs/archive/status-reports/
mv CLEANUP_STATUS_FINAL.md docs/archive/status-reports/
mv CURRENT_STATUS.md docs/archive/status-reports/
mv FILES_CHANGED.md docs/archive/status-reports/
mv MIGRATION_COMPLETE.md docs/archive/status-reports/
mv PROJECT_STATUS.md docs/archive/status-reports/
mv ROUTING_FIX_STATUS.md docs/archive/status-reports/
```

### Step 4: 删除不需要的文件
```bash
rm replit.md QUICK_SETUP.md
```

### Step 5: 提交更改
```bash
git add .
git commit -m "docs: reorganize project documentation structure

- Move deployment docs to docs/deployment/
- Move security docs to docs/security/
- Move development docs to docs/development/
- Archive old status reports to docs/archive/
- Remove redundant and outdated files
- Keep only essential docs in root directory"
git push
```

## ✅ 清理后的结果

**根目录文件 (仅4个):**
- README.md
- CLAUDE.md
- TROUBLESHOOTING.md
- URGENT_SECURITY_RESPONSE.md

**docs/ 目录:**
- deployment/ (2个文件)
- security/ (2个文件)
- development/ (6个文件)
- archive/ (26个历史文件)

**减少根目录文件: 38个 → 4个** ✨

## 📋 清理检查清单

- [ ] 创建docs目录结构
- [ ] 移动部署文档
- [ ] 移动安全文档
- [ ] 移动开发文档
- [ ] 归档旧的安全事件文档
- [ ] 归档旧的部署历史
- [ ] 归档旧的状态报告
- [ ] 删除不需要的文件
- [ ] 更新README.md链接
- [ ] 更新CLAUDE.md文档路径
- [ ] 提交更改
- [ ] 推送到GitHub

---

**创建时间**: 2025-10-01
**执行优先级**: 在安全密钥轮换完成后执行
