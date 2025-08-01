# MCP Troubleshooting Summary

## Issues Found and Fixed

### 1. Graphiti MCP Configuration
**Problem**: Graphiti MCP was failing to load
**Root Cause**: 
- The graphiti MCP was trying to use an npm package `@upstash/graphiti-mcp@latest` that doesn't exist
- The actual graphiti MCP is a local Python server located at `/Users/liasiloam/graphiti/mcp_server/`

**Solution**:
- Updated configuration to use the local Python virtual environment directly
- Changed command from `uv` to `/Users/liasiloam/graphiti/mcp_server/.venv/bin/python`
- Used the correct environment variables from the `.env` file

### 2. Supabase MCP
**Status**: Already correctly configured
- Using npm package: `@supabase/mcp-server-supabase`
- Environment variables properly set

## Final Configuration

Both MCP servers are now properly configured in `/Users/liasiloam/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server-supabase"],
      "env": {
        "SUPABASE_URL": "https://xelyobfvfjqeuysfzpcf.supabase.co",
        "SUPABASE_SERVICE_ROLE_KEY": "[SERVICE_ROLE_KEY]"
      }
    },
    "graphiti": {
      "transport": "stdio",
      "command": "/Users/liasiloam/graphiti/mcp_server/.venv/bin/python",
      "args": [
        "/Users/liasiloam/graphiti/mcp_server/graphiti_mcp_server.py",
        "--transport",
        "stdio"
      ],
      "env": {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASSWORD": "[PASSWORD]",
        "OPENAI_API_KEY": "[API_KEY]",
        "MODEL_NAME": "gpt-4.1-mini"
      }
    }
  }
}
```

## Prerequisites

1. **Neo4j**: Must be running locally on port 7687 (verified: ✓)
2. **Python Environment**: Virtual environment at `/Users/liasiloam/graphiti/mcp_server/.venv/` (verified: ✓)
3. **uv Package Manager**: Installed at `/Users/liasiloam/.local/bin/uv` (verified: ✓)

## Next Steps

1. **Restart Claude Desktop** to reload the configuration
2. Both MCP servers should now be available and working

## Additional Notes

- The graphiti MCP provides knowledge graph functionality via Neo4j
- The supabase MCP provides database access to your Supabase instance
- All credentials are properly configured in the environment