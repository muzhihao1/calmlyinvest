#!/bin/bash

# Vercel部署调试脚本
# 自动获取部署日志、构建错误和函数配置问题

echo "🔍 Vercel部署调试工具"
echo "========================"

# 检查是否安装了Vercel CLI
if ! command -v vercel &> /dev/null; then
    echo "❌ Vercel CLI未安装"
    echo "请运行: npm i -g vercel"
    exit 1
fi

# 1. 获取最近的部署记录
echo -e "\n📋 获取最近5次部署记录..."
vercel list --count 5

# 2. 获取最新部署的详细信息
echo -e "\n📊 获取最新部署详情..."
LATEST_DEPLOYMENT=$(vercel list --count 1 --json | jq -r '.[0].url')
if [ ! -z "$LATEST_DEPLOYMENT" ]; then
    echo "最新部署URL: $LATEST_DEPLOYMENT"
    
    # 获取部署日志
    echo -e "\n📜 获取部署日志..."
    vercel logs $LATEST_DEPLOYMENT --limit 50
fi

# 3. 检查项目配置
echo -e "\n⚙️ 检查vercel.json配置..."
if [ -f "vercel.json" ]; then
    cat vercel.json | jq '.'
else
    echo "⚠️ 未找到vercel.json文件"
fi

# 4. 检查API函数文件
echo -e "\n📁 检查API函数文件..."
echo "根目录API文件:"
ls -la api/ 2>/dev/null || echo "未找到api目录"
echo -e "\n子目录API文件:"
ls -la calmlyinvest/api/ 2>/dev/null || echo "未找到calmlyinvest/api目录"

# 5. 验证函数文件格式
echo -e "\n✅ 验证函数文件格式..."
for file in api/*.ts; do
    if [ -f "$file" ]; then
        echo -n "检查 $file... "
        # 检查是否导出了默认handler
        if grep -q "export default" "$file"; then
            echo "✓"
        else
            echo "❌ 缺少 export default"
        fi
    fi
done

# 6. 测试本地构建
echo -e "\n🏗️ 测试本地构建..."
cd calmlyinvest && npm run build && cd ..

# 7. 检查环境变量
echo -e "\n🔐 检查环境变量配置..."
vercel env ls

# 8. 获取函数日志
echo -e "\n📋 获取函数运行日志..."
vercel logs --follow --limit 20