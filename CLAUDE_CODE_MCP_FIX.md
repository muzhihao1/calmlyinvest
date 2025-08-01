# Claude Code MCP配置修复说明

## 问题诊断

1. **配置文件位置错误**：
   - Claude Code 使用 `~/.claude.json`
   - 不是 `~/.claude/claude_desktop_config.json`（那是Claude Desktop的）

2. **原始配置错误**：
   - graphiti使用了不存在的npm包 `graphiti-mcp`
   - supabase缺少必要的环境变量

## 已实施的修复

### 1. Supabase MCP
```json
{
  "type": "stdio",
  "command": "npx",
  "args": ["-y", "@supabase/mcp-server-supabase"],
  "env": {
    "SUPABASE_URL": "https://xelyobfvfjqeuysfzpcf.supabase.co",
    "SUPABASE_SERVICE_ROLE_KEY": "[YOUR_KEY]"
  }
}
```

### 2. Graphiti MCP
```json
{
  "type": "stdio",
  "command": "/Users/liasiloam/graphiti/mcp_server/.venv/bin/python",
  "args": [
    "/Users/liasiloam/graphiti/mcp_server/graphiti_mcp_server.py",
    "--transport",
    "stdio"
  ],
  "env": {
    "NEO4J_URI": "bolt://localhost:7687",
    "NEO4J_USER": "neo4j",
    "NEO4J_PASSWORD": "[YOUR_PASSWORD]",
    "OPENAI_API_KEY": "[YOUR_API_KEY]",
    "MODEL_NAME": "gpt-4.1-mini"
  }
}
```

## 关键区别

1. **Claude Code** 在项目级别配置MCP服务器
2. **环境变量** 必须在 `env` 对象中设置
3. **Graphiti** 使用本地Python脚本，不是npm包

## 验证步骤

1. 运行 `claude mcp list` 查看所有配置的MCP服务器
2. 重启Claude Code使配置生效
3. 在新的Claude会话中测试MCP工具

## 注意事项

- 确保Neo4j正在运行（端口7687）
- Python虚拟环境必须存在于指定路径
- 所有API密钥和凭据必须有效