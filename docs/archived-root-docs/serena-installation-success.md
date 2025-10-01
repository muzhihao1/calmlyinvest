# Serena MCP 服务器安装成功记录

## 问题描述
Serena MCP 服务器持续显示 "Failed to connect" 状态，即使用户声称已安装 UV。

## 根本原因
1. UV 实际上未安装或未在系统 PATH 中
2. Claude Code 的 shell 环境无法访问到 uvx 命令

## 解决方案

### 1. 安装 UV
```bash
# 使用官方安装脚本
curl -LsSf https://astral.sh/uv/install.sh | sh
# UV 被安装到: /Users/liasiloam/.local/bin/
```

### 2. 配置环境变量（可选）
```bash
# 添加到 .zshrc
echo 'export PATH="$HOME/.local/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```
注意：这一步对 Claude Code 来说不是必需的，因为它不会读取 shell 配置文件。

### 3. 重新配置 Serena 使用完整路径
```bash
# 删除旧配置
claude mcp remove serena -s local

# 使用完整路径重新添加
claude mcp add serena -- /Users/liasiloam/.local/bin/uvx --from git+https://github.com/oraios/serena serena-mcp-server --context ide-assistant --project $(pwd)
```

## 验证结果
```bash
claude mcp list
# 输出：
# serena: /Users/liasiloam/.local/bin/uvx ... - ✓ Connected
```

## 关键要点
- 使用 UV 的**完整路径**是关键，避免了 PATH 环境变量的问题
- UV 版本：0.8.3
- 安装位置：`~/.local/bin/`
- 中国大陆访问 GitHub 正常，无需特殊配置

## 当前 MCP 服务器状态
- ✓ playwright
- ✓ sequential-thinking
- ✓ github
- ✓ notion
- ✓ serena（已修复）

## 后续建议
如果将来遇到类似问题：
1. 始终使用完整路径配置外部命令
2. 验证依赖是否真正安装（不仅仅是用户声称）
3. 检查 Claude Code 的 shell 环境，它可能与用户的终端环境不同