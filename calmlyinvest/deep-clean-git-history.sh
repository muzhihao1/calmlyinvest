#!/bin/bash
# 深度清理 Git 历史中的敏感信息

echo "🔧 深度清理 Git 历史"
echo "==================="
echo ""

# 备份当前状态
echo "💾 创建完整备份..."
tar -czf git-backup-$(date +%Y%m%d-%H%M%S).tar.gz .git

# 定义要清理的敏感字符串
SENSITIVE_STRINGS=(
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzZnRocWNoeXVwa2JtYXpjdWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTg0NjUsImV4cCI6MjA2ODA5NDQ2NX0.GAajoAAyNgbq5SVPhtL99NFIoycaLjXbcCJJqc8wLrQ"
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzZnRocWNoeXVwa2JtYXpjdWlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjUxODQ2NSwiZXhwIjoyMDY4MDk0NDY1fQ.II5EEdkqznfNNRkZrr22XosV3w5qaj4jTkPiTd65EPk"
    "https://hsfthqchyupkbmazcuis.supabase.co"
    "279838958@qq.com"
)

# 定义要从历史中完全删除的文件
FILES_TO_REMOVE=(
    "setup-env.sh"
    "scripts/restore-user-data.ts"
    "scripts/restore-via-api.ts"
    "VERCEL_ENV_VARS_GUIDE.md"
    "SECURITY_KEY_ROTATION_COMPLETE.md"
    "restore_user_data.sh"
    "restore_user_data_v2.sh"
)

echo "🧹 使用 git filter-branch 清理敏感文件..."
for file in "${FILES_TO_REMOVE[@]}"; do
    echo "  删除: $file"
    git filter-branch --force --index-filter \
        "git rm --cached --ignore-unmatch '$file'" \
        --prune-empty --tag-name-filter cat -- --all 2>/dev/null || true
done

echo ""
echo "🔍 替换敏感字符串..."
# 创建 sed 命令来替换所有敏感字符串
SED_COMMANDS=""
for str in "${SENSITIVE_STRINGS[@]}"; do
    # 转义特殊字符
    escaped_str=$(echo "$str" | sed 's/[[\.*^$()+?{|]/\\&/g')
    SED_COMMANDS="${SED_COMMANDS}s/${escaped_str}/[REDACTED]/g;"
done

# 对所有文件运行替换
git filter-branch --force --tree-filter "
    find . -type f -name '*.ts' -o -name '*.js' -o -name '*.tsx' -o -name '*.jsx' \
           -o -name '*.json' -o -name '*.md' -o -name '*.sh' -o -name '*.sql' \
           -o -name '*.html' | while read file; do
        if [ -f \"\$file\" ]; then
            sed -i.bak '$SED_COMMANDS' \"\$file\" && rm -f \"\$file.bak\"
        fi
    done
" --tag-name-filter cat -- --all

echo ""
echo "🗑️  清理 Git 对象..."
# 删除原始引用
rm -rf .git/refs/original/

# 过期所有 reflog
git reflog expire --expire=now --all

# 垃圾回收
git gc --prune=now --aggressive

echo ""
echo "✅ 深度清理完成！"
echo ""

# 验证结果
echo "🔍 验证清理结果..."
FOUND_KEYS=false
for str in "${SENSITIVE_STRINGS[@]}"; do
    if git log --all -p | grep -q "$str" 2>/dev/null; then
        echo "❌ 警告：仍然发现敏感信息片段"
        FOUND_KEYS=true
        break
    fi
done

if [ "$FOUND_KEYS" = false ]; then
    echo "✅ 未检测到已知的敏感信息"
fi

echo ""
echo "📋 下一步："
echo "1. 检查历史: git log --oneline --all"
echo "2. 强制推送: git push origin --force --all"
echo "3. 强制推送标签: git push origin --force --tags"
echo "4. 通知所有协作者重新克隆仓库"
echo ""
echo "⚠️  重要：请立即在 Supabase 轮换所有密钥！"