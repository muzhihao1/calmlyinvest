# 修复 Serena MCP 服务器安装问题

## 问题诊断
Serena MCP 服务器显示 "Failed to connect" 的原因是系统未安装 UV (Python 包管理器)。

## 解决方案

### 方法一：使用官方安装脚本（推荐）
```bash
# 1. 安装 UV
curl -LsSf https://astral.sh/uv/install.sh | sh

# 2. 更新 PATH 环境变量
source $HOME/.cargo/env

# 3. 验证安装
uv --version
uvx --version
```

### 方法二：使用 Homebrew（如果已安装）
```bash
# 1. 安装 UV
brew install uv

# 2. 验证安装
uv --version
uvx --version
```

## 安装后步骤

1. **重启 Claude Code**
   - 完全退出 Claude Code 应用
   - 重新打开 Claude Code

2. **验证 Serena 状态**
   ```bash
   claude mcp list
   ```
   - Serena 应该显示 "✓ Connected" 状态

3. **如果仍然失败，尝试重新安装 Serena**
   ```bash
   # 删除现有配置
   claude mcp remove serena -s local
   
   # 重新安装
   claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena-mcp-server --context ide-assistant --project $(pwd)
   ```

## 关于 UV
UV 是一个用 Rust 编写的极快的 Python 包管理器，由 Astral 开发。它提供：
- 比 pip 快 10-100 倍的包安装速度
- 内置的虚拟环境管理
- 与 pip 兼容的命令行接口
- uvx 工具用于运行 Python 应用程序

## 验证所有 MCP 服务器状态
安装 UV 后，运行以下命令查看所有服务器状态：
```bash
claude mcp
```

预期结果：
- serena: ✓ Connected
- playwright: ✓ Connected
- sequential-thinking: ✓ Connected
- github: ✓ Connected
- notion: ✓ Connected