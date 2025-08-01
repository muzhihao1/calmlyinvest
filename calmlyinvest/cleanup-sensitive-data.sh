#!/bin/bash
# 紧急安全清理脚本 - 清理 Git 历史中的敏感信息

echo "🚨 紧急安全清理脚本"
echo "====================="
echo ""
echo "⚠️  警告：此脚本将永久修改 Git 历史记录！"
echo "⚠️  请确保您已经："
echo "   1. 在 Supabase 中轮换了所有密钥"
echo "   2. 更新了所有环境变量"
echo "   3. 备份了重要数据"
echo ""
read -p "确认继续？(yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "已取消"
    exit 1
fi

# 创建密钥文件
echo "📝 创建密钥列表..."
cat > sensitive-strings.txt << 'EOF'
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzZnRocWNoeXVwa2JtYXpjdWlzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1MTg0NjUsImV4cCI6MjA2ODA5NDQ2NX0.GAajoAAyNgbq5SVPhtL99NFIoycaLjXbcCJJqc8wLrQ
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhzZnRocWNoeXVwa2JtYXpjdWlzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjUxODQ2NSwiZXhwIjoyMDY4MDk0NDY1fQ.II5EEdkqznfNNRkZrr22XosV3w5qaj4jTkPiTd65EPk
https://hsfthqchyupkbmazcuis.supabase.co
279838958@qq.com
EOF

# 检查是否安装了 BFG
if ! command -v java &> /dev/null; then
    echo "❌ 需要 Java 来运行 BFG。请先安装 Java。"
    exit 1
fi

# 下载 BFG（如果不存在）
if [ ! -f "bfg-1.14.0.jar" ]; then
    echo "📥 下载 BFG Repo-Cleaner..."
    curl -L https://repo1.maven.org/maven2/com/madgag/bfg/1.14.0/bfg-1.14.0.jar -o bfg-1.14.0.jar
fi

echo ""
echo "🧹 开始清理过程..."
echo ""

# 备份当前状态
echo "💾 创建备份..."
cp -r .git .git.backup.$(date +%Y%m%d_%H%M%S)

# 运行 BFG 清理敏感字符串
echo "🔧 清理敏感信息..."
java -jar bfg-1.14.0.jar --replace-text sensitive-strings.txt .

# 清理和优化仓库
echo "🗑️  清理无用数据..."
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 显示清理结果
echo ""
echo "✅ 清理完成！"
echo ""
echo "📊 清理结果："
echo "============="

# 检查是否还有敏感信息
echo ""
echo "🔍 验证清理结果..."
if git log --all -p | grep -q "eyJhbGci"; then
    echo "❌ 警告：仍然检测到敏感信息！"
    echo "   请手动检查并重新运行清理。"
else
    echo "✅ 未检测到已知的敏感信息。"
fi

echo ""
echo "📋 下一步操作："
echo "==============="
echo "1. 检查清理结果："
echo "   git log --oneline --all"
echo ""
echo "2. 如果满意，强制推送到远程仓库："
echo "   git push origin --force --all"
echo "   git push origin --force --tags"
echo ""
echo "3. 通知所有协作者重新克隆仓库"
echo ""
echo "4. 删除本地敏感文件："
echo "   rm -f setup-env.sh"
echo "   rm -f scripts/restore-*.ts"
echo "   rm -f VERCEL_ENV_VARS_GUIDE.md"
echo ""
echo "⚠️  重要：即使清理了历史，也必须轮换所有密钥！"

# 清理临时文件
rm -f sensitive-strings.txt