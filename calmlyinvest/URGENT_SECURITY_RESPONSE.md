# 🚨 紧急安全响应计划

**创建时间**: 2025-10-01 19:45
**严重等级**: CRITICAL
**影响范围**: 完整数据库访问权限泄露

## 📋 泄露概况

在 commit `25df2202` (2025-10-01 19:35) 中，以下敏感信息被提交到公开GitHub仓库：

### 泄露的凭证
1. **SUPABASE_SERVICE_ROLE_KEY** - 🔥 CRITICAL
   - 完整的数据库管理员权限
   - 可以绕过所有RLS (Row Level Security) 策略
   - 可以访问/修改/删除所有数据

2. **DATABASE_URL** - 🔥 CRITICAL
   - 包含数据库密码: `muzhihao12`
   - 直接PostgreSQL访问

3. **SUPABASE_ANON_KEY** - ⚠️ HIGH
   - 匿名用户访问密钥

4. **JWT_SECRET** - ⚠️ HIGH
   - JWT令牌签名密钥

## ⚡ 立即执行 (接下来15分钟内)

### Step 1: 轮换Supabase密钥 (优先级: CRITICAL)

```bash
# 1. 登录Supabase Dashboard
https://supabase.com/dashboard/project/your-project-id

# 2. 导航到: Settings > API
# 3. 点击 "Reset" 按钮重置以下密钥:
#    - Service Role Key (service_role)
#    - Anon Key (anon)

# 4. 更新环境变量 (在Vercel Dashboard):
https://vercel.com/muzhihao1/calmlyinvest/settings/environment-variables

# 5. 删除旧的环境变量，添加新的:
SUPABASE_SERVICE_ROLE_KEY=<新的service_role_key>
SUPABASE_ANON_KEY=<新的anon_key>
```

### Step 2: 更改数据库密码

```bash
# 1. 登录Supabase Dashboard
# 2. Settings > Database
# 3. Reset database password
# 4. 更新所有使用该密码的地方
```

### Step 3: 生成新的JWT密钥

```bash
# 生成新的强密码
openssl rand -base64 32
# 更新到Vercel环境变量: JWT_SECRET
```

### Step 4: 触发重新部署

```bash
# 在Vercel Dashboard中触发重新部署
# 或者推送一个空commit
git commit --allow-empty -m "chore: redeploy after key rotation"
git push
```

## 🧹 清理Git历史 (接下来30分钟内)

### 选项A: 使用BFG Repo Cleaner (推荐)

```bash
# 1. 安装BFG
brew install bfg  # macOS
# 或从 https://rtyley.github.io/bfg-repo-cleaner/ 下载

# 2. 克隆仓库的镜像
cd /tmp
git clone --mirror https://github.com/muzhihao1/calmlyinvest.git

# 3. 删除敏感文件
cd calmlyinvest.git
bfg --delete-files .env.production
bfg --delete-files .env.production.check
bfg --delete-files test-supabase-key.html
bfg --delete-files VERCEL_ENV_CHECK.md

# 4. 清理和推送
git reflog expire --expire=now --all
git gc --prune=now --aggressive
git push --force

# 注意: Force push会破坏其他协作者的本地仓库
```

### 选项B: 使用git filter-branch

```bash
git filter-branch --force --index-filter \
  'git rm --cached --ignore-unmatch .env.production .env.production.check test-supabase-key.html VERCEL_ENV_CHECK.md' \
  --prune-empty --tag-name-filter cat -- --all

git push origin --force --all
git push origin --force --tags
```

## 📊 影响评估

### 潜在风险
- ✅ 任何人都可以完全访问你的Supabase数据库
- ✅ 可以读取所有用户数据（包括敏感信息）
- ✅ 可以修改或删除数据
- ✅ 可以创建管理员账户
- ✅ 绕过所有身份验证和授权检查

### 需要审查的内容
1. **审计日志**: 检查Supabase日志是否有异常访问
   - Dashboard > Logs > API Logs
   - 查找从未知IP的访问

2. **用户账户**: 检查是否有未授权的新用户
   ```sql
   SELECT * FROM auth.users
   ORDER BY created_at DESC
   LIMIT 50;
   ```

3. **数据修改**: 检查最近的数据变更
   ```sql
   SELECT * FROM portfolios
   WHERE updated_at > '2025-10-01 11:35:00'
   ORDER BY updated_at DESC;
   ```

## 🔒 长期防护措施

### 1. 更新 .gitignore
```gitignore
# Environment files - NEVER COMMIT
.env
.env.*
!.env.example
!.env.*.example

# Production configs
*.production
*.prod
*_production*
*_prod*

# Security
*.key
*.pem
secrets.json
```

### 2. 实施Pre-commit Hook

创建 `.git/hooks/pre-commit`:
```bash
#!/bin/bash
if git diff --cached --name-only | grep -E '\.env$|\.env\.|secrets|\.key|\.pem'; then
    echo "🚫 检测到敏感文件，阻止提交！"
    echo "请检查并移除这些文件："
    git diff --cached --name-only | grep -E '\.env$|\.env\.|secrets|\.key|\.pem'
    exit 1
fi
```

### 3. 使用环境变量管理工具
- Vercel Environment Variables (已使用)
- 考虑使用: Doppler, Vault, AWS Secrets Manager

### 4. 启用GitHub Secret Scanning
- 已经启用 (这就是为什么你收到警告)
- 保持启用状态

### 5. 实施密钥轮换策略
- 每90天轮换一次生产密钥
- 在任何可疑活动后立即轮换
- 记录所有轮换操作

## ✅ 完成检查清单

- [ ] 轮换 Supabase Service Role Key
- [ ] 轮换 Supabase Anon Key
- [ ] 更改数据库密码
- [ ] 更新 JWT Secret
- [ ] 在Vercel中更新所有环境变量
- [ ] 触发重新部署
- [ ] 从Git历史中删除敏感文件
- [ ] Force push更新后的历史
- [ ] 审计Supabase访问日志
- [ ] 检查用户账户是否有异常
- [ ] 检查数据是否被修改
- [ ] 更新 .gitignore
- [ ] 添加 pre-commit hook
- [ ] 通知所有协作者重新克隆仓库
- [ ] 文档化这次事件和响应

## 📞 支持联系

如果需要帮助:
- Supabase Support: https://supabase.com/support
- GitHub Support: https://support.github.com
- Vercel Support: https://vercel.com/support

## 📚 参考资源

- [GitHub Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [BFG Repo Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/platform/going-into-prod)
- [OWASP Secret Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

---

**最后更新**: 2025-10-01 19:45
**下次审查**: 密钥轮换完成后立即
