# 🚨 紧急安全清理指南 - 清理网上的敏感信息

## 发现的安全问题

您的 Supabase API 密钥（包括 service role key）已经被提交到 Git 历史记录，并推送到了 GitHub 公开仓库：
- 仓库地址: https://github.com/muzhihao1/calmlyinvest.git
- 涉及的密钥类型：
  - Supabase Anon Key (公开密钥)
  - Supabase Service Role Key (管理员密钥) ⚠️ 高危

## 立即执行的步骤

### 1. 🔑 立即轮换 Supabase 密钥（最紧急）

**必须立即执行**，因为密钥已经暴露在公开仓库中：

1. 登录 [Supabase Dashboard](https://app.supabase.com)
2. 选择您的项目
3. 进入 Settings → API
4. 点击 "Roll keys" 或 "Regenerate keys"
5. 保存新的密钥：
   - 新的 Anon Key
   - 新的 Service Role Key

### 2. 🔄 更新所有使用旧密钥的地方

使用新密钥更新：
- Vercel 环境变量
- 本地 `.env` 文件
- 任何其他部署环境
- CI/CD 配置

### 3. 🧹 清理 Git 历史记录

#### 选项 A：使用 BFG Repo-Cleaner（推荐）

```bash
# 1. 克隆仓库的镜像
git clone --mirror https://github.com/muzhihao1/calmlyinvest.git

# 2. 下载 BFG
wget https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar

# 3. 创建包含所有泄露密钥的文件
echo "your_old_leaked_anon_key_here" > passwords.txt
echo "your_old_leaked_service_role_key_here" >> passwords.txt

# 4. 运行 BFG 清理密钥
java -jar bfg-1.14.0.jar --replace-text passwords.txt calmlyinvest.git

# 5. 进入仓库目录
cd calmlyinvest.git

# 6. 清理和优化仓库
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# 7. 强制推送清理后的历史
git push --force
```

#### 选项 B：使用 git filter-branch（备选）

```bash
# 克隆仓库
git clone https://github.com/muzhihao1/calmlyinvest.git
cd calmlyinvest

# 对每个包含密钥的文件运行过滤
git filter-branch --force --index-filter \
"git rm --cached --ignore-unmatch client/src/lib/supabase.ts api/auth/register.ts setup-env.sh scripts/restore-user-data.ts scripts/restore-via-api.ts VERCEL_ENV_VARS_GUIDE.md SECURITY_KEY_ROTATION_COMPLETE.md" \
--prune-empty --tag-name-filter cat -- --all

# 强制推送
git push origin --force --all
git push origin --force --tags
```

### 4. 📊 审计访问日志

在 Supabase Dashboard 中检查：
1. 进入 Logs → API
2. 查看是否有异常访问
3. 检查 Auth logs 是否有未授权登录
4. 检查 Database logs 是否有异常查询

### 5. 🚫 删除本地敏感文件

```bash
# 删除包含密钥的文件
rm -f setup-env.sh
rm -f scripts/restore-user-data.ts
rm -f scripts/restore-via-api.ts
rm -f VERCEL_ENV_VARS_GUIDE.md
rm -f SECURITY_KEY_ROTATION_COMPLETE.md
```

### 6. 📢 通知相关人员

如果这是团队项目，通知所有团队成员：
- 更新他们的本地密钥
- 重新克隆仓库
- 不要使用旧的密钥

## 预防措施

### 设置 Git 预提交钩子

创建 `.git/hooks/pre-commit` 文件：

```bash
#!/bin/sh
# 检查是否包含 Supabase 密钥
if git diff --cached | grep -E "eyJhbGci|supabase_url.*=|SUPABASE.*KEY"; then
    echo "错误：检测到可能的 API 密钥！"
    echo "请移除敏感信息后再提交。"
    exit 1
fi
```

使其可执行：
```bash
chmod +x .git/hooks/pre-commit
```

### 使用 .gitignore

确保 `.gitignore` 包含：
```
.env
.env.*
*.key
*.pem
secrets.json
setup-env.sh
**/restore-*.ts
**/restore-*.sh
```

### 使用 GitHub Secret Scanning

1. 在 GitHub 仓库设置中启用 Secret scanning
2. 设置警报通知

## 时间线总结

基于 Git 历史，密钥暴露的时间线：
- 首次提交包含密钥：多个提交中发现
- 最近的密钥轮换：2025-07-15（但轮换后的新密钥也被提交了）
- 受影响的提交数：至少 11 个

## 紧急行动清单

- [ ] 1. **立即**在 Supabase 轮换所有密钥
- [ ] 2. 更新 Vercel 和本地环境变量
- [ ] 3. 清理 Git 历史（使用 BFG）
- [ ] 4. 强制推送清理后的仓库
- [ ] 5. 审计 Supabase 访问日志
- [ ] 6. 通知团队成员（如果适用）
- [ ] 7. 设置预防措施

## ⚠️ 重要提醒

- 即使清理了 Git 历史，仍应将旧密钥视为已泄露
- GitHub 可能已经缓存了历史提交
- 搜索引擎可能已经索引了包含密钥的文件
- 必须轮换密钥，这是唯一确保安全的方法

## 联系支持

如果发现任何异常访问：
- 联系 Supabase 支持：support@supabase.io
- 报告 GitHub 安全事件：https://github.com/security

---

**立即行动！** 密钥已经在公开仓库中暴露，每分钟都有风险。