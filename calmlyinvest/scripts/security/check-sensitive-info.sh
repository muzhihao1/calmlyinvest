#!/bin/bash
# 检查敏感信息的脚本

echo "🔍 检查敏感信息"
echo "================"
echo ""

# 定义敏感模式
PATTERNS=(
    "eyJhbGci"
    "supabase\.co"
    "service_role"
    "SUPABASE_.*KEY"
    "279838958@qq\.com"
)

# 检查当前工作目录文件
echo "📁 检查当前文件..."
echo "-------------------"
for pattern in "${PATTERNS[@]}"; do
    echo -n "检查 '$pattern': "
    count=$(grep -r "$pattern" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.sh" 2>/dev/null | wc -l)
    if [ $count -gt 0 ]; then
        echo "❌ 发现 $count 处"
        grep -r "$pattern" . --exclude-dir=node_modules --exclude-dir=.git --exclude="*.md" --exclude="*.sh" 2>/dev/null | head -5
        echo ""
    else
        echo "✅ 未发现"
    fi
done

# 检查 Git 历史
echo ""
echo "📚 检查 Git 历史..."
echo "-------------------"
for pattern in "${PATTERNS[@]}"; do
    echo -n "检查 '$pattern': "
    if git log -p --all | grep -q "$pattern"; then
        echo "❌ 在历史中发现"
        commits=$(git log --oneline -S "$pattern" --all | wc -l)
        echo "   受影响的提交数: $commits"
    else
        echo "✅ 未发现"
    fi
done

# 检查环境变量文件
echo ""
echo "🔐 检查环境变量文件..."
echo "----------------------"
env_files=(".env" ".env.local" ".env.production" ".env.development")
for file in "${env_files[@]}"; do
    if [ -f "$file" ]; then
        echo "📄 发现 $file"
        if grep -q "SUPABASE" "$file"; then
            echo "   ✅ 包含 Supabase 配置（这是正常的）"
        fi
    fi
done

# 检查 .gitignore
echo ""
echo "🛡️  检查 .gitignore..."
echo "--------------------"
important_ignores=(".env" "setup-env.sh" "*.key" "secrets.json")
for ignore in "${important_ignores[@]}"; do
    if grep -q "^$ignore" .gitignore 2>/dev/null; then
        echo "✅ '$ignore' 已在 .gitignore 中"
    else
        echo "❌ '$ignore' 未在 .gitignore 中"
    fi
done

# 总结
echo ""
echo "📊 总结"
echo "======="
echo ""
echo "建议的操作："
if git log -p --all | grep -q "eyJhbGci"; then
    echo "1. ⚠️  Git 历史中存在敏感信息 - 需要清理"
    echo "2. 🔑 立即在 Supabase 轮换所有密钥"
    echo "3. 🧹 运行 ./cleanup-sensitive-data.sh 清理历史"
    echo "4. 📤 强制推送清理后的仓库"
else
    echo "✅ Git 历史看起来是干净的"
fi

echo ""
echo "提示：运行 'git status' 查看待提交的更改"