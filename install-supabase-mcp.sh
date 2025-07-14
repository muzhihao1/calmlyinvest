#!/bin/bash

# 🔌 Supabase MCP 自动安装脚本
# 适用于 macOS/Linux 系统

echo "🚀 开始安装 Supabase MCP 服务器..."

# 检查 Node.js 是否安装
if ! command -v node &> /dev/null; then
    echo "❌ 错误：未找到 Node.js，请先安装 Node.js"
    echo "📥 下载地址：https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js 已安装: $(node --version)"

# 检查 npm 是否可用
if ! command -v npm &> /dev/null; then
    echo "❌ 错误：未找到 npm"
    exit 1
fi

echo "✅ npm 已安装: $(npm --version)"

# 清理 npm 缓存
echo "🧹 清理 npm 缓存..."
npm cache clean --force

# 预安装 Supabase MCP 服务器
echo "📦 预安装 Supabase MCP 服务器..."
npx -y @supabase/mcp-server-supabase@latest --version

if [ $? -eq 0 ]; then
    echo "✅ Supabase MCP 服务器安装成功！"
else
    echo "❌ 安装失败，请检查网络连接或权限"
    exit 1
fi

# 显示配置信息
echo ""
echo "🔧 配置信息："
echo "项目 Ref: hsfthqchyupkbmazcuis"
echo "访问令牌: sbp_aeb93df390eb119ab40beeafcac4c59c8ac6e3e3"
echo ""

# 检查 Cursor 配置目录
CONFIG_DIRS=(
    "$HOME/Library/Application Support/Cursor/User/globalStorage/cursor.mcp"
    "$HOME/.config/cursor/User/globalStorage/cursor.mcp"
    "$HOME/AppData/Roaming/Cursor/User/globalStorage/cursor.mcp"
)

CURSOR_CONFIG_DIR=""
for dir in "${CONFIG_DIRS[@]}"; do
    if [ -d "$(dirname "$dir")" ]; then
        CURSOR_CONFIG_DIR="$dir"
        break
    fi
done

if [ -n "$CURSOR_CONFIG_DIR" ]; then
    echo "📁 找到 Cursor 配置目录: $CURSOR_CONFIG_DIR"
    
    # 创建目录（如果不存在）
    mkdir -p "$CURSOR_CONFIG_DIR"
    
    # 创建配置文件
    cat > "$CURSOR_CONFIG_DIR/settings.json" << 'EOF'
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=hsfthqchyupkbmazcuis"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "sbp_aeb93df390eb119ab40beeafcac4c59c8ac6e3e3"
      }
    }
  }
}
EOF
    
    echo "✅ 配置文件已创建: $CURSOR_CONFIG_DIR/settings.json"
else
    echo "⚠️  未找到 Cursor 配置目录，请手动配置"
fi

echo ""
echo "🎉 安装完成！接下来的步骤："
echo ""
echo "1. 打开 Cursor"
echo "2. 按 Cmd+, 进入设置"
echo "3. 点击左侧的 'MCP'"
echo "4. 添加以下配置（如果自动配置失败）："
echo ""
echo '{'
echo '  "mcpServers": {'
echo '    "supabase": {'
echo '      "command": "npx",'
echo '      "args": ['
echo '        "-y",'
echo '        "@supabase/mcp-server-supabase@latest",'
echo '        "--read-only",'
echo '        "--project-ref=hsfthqchyupkbmazcuis"'
echo '      ],'
echo '      "env": {'
echo '        "SUPABASE_ACCESS_TOKEN": "sbp_aeb93df390eb119ab40beeafcac4c59c8ac6e3e3"'
echo '      }'
echo '    }'
echo '  }'
echo '}'
echo ""
echo "5. 保存配置文件"
echo "6. 查看绿色状态指示器确认连接成功"
echo ""
echo "🧪 测试命令："
echo "在 Cursor AI 对话中输入：'请查询 portfolios 表的结构'"
echo ""
echo "📚 详细指南请查看：SUPABASE-MCP-安装指南.md" 