# MCP Token Setup Instructions

## ⚠️ Security Alert

The SUPABASE_ACCESS_TOKEN (Management API token) was exposed in the MCP configuration files. This token has been removed from the configuration files and needs to be properly managed.

## ✅ Security Update Status - 2025-07-31 16:16

### 1. ~~Revoke the Exposed Token~~ ✅ COMPLETED
The exposed token `sbp_aeb93df390eb119ab40beeafcac4c59c8ac6e3e3` has been successfully revoked.

### 2. ~~Generate a New Access Token~~ ✅ COMPLETED
New token generated: `sbp_572c6f9e313f64a0a0c9fd4ab014afcd798f83ae`
Token name: "MCP Server - Read Only"

## Setting Up SUPABASE_ACCESS_TOKEN

### Immediate Action Required: Set the Environment Variable

The new token has been generated and needs to be set as an environment variable.

#### On macOS/Linux:
```bash
# Add to ~/.zshrc or ~/.bashrc
export SUPABASE_ACCESS_TOKEN="sbp_572c6f9e313f64a0a0c9fd4ab014afcd798f83ae"

# Reload shell configuration
source ~/.zshrc  # or source ~/.bashrc
```

#### On Windows:
```powershell
# Set as user environment variable
[System.Environment]::SetEnvironmentVariable("SUPABASE_ACCESS_TOKEN", "sbp_572c6f9e313f64a0a0c9fd4ab014afcd798f83ae", "User")
```

### 4. Verify MCP Configuration

The MCP configuration files have been updated to use environment variable:
- `.cursor/mcp.json`
- `calmlyinvest/cursor-mcp-config.json`

Both now reference `${SUPABASE_ACCESS_TOKEN}` instead of hardcoding the token.

### 5. Test MCP Connection

After setting the environment variable, restart your IDE (Cursor) to ensure the MCP server can connect properly.

## Security Best Practices

1. **Never commit tokens to Git**
   - MCP config files should use environment variables
   - Add `*mcp*.json` to `.gitignore` if they contain sensitive data

2. **Use separate tokens for different purposes**
   - Development token
   - Production token
   - MCP/IDE token

3. **Set minimal permissions**
   - Use read-only tokens when possible
   - Limit scope to necessary resources

4. **Rotate tokens regularly**
   - Set calendar reminders for token rotation
   - Document rotation procedures

## Troubleshooting

If MCP server fails to connect:
1. Verify environment variable is set: `echo $SUPABASE_ACCESS_TOKEN`
2. Check token permissions in Supabase dashboard
3. Ensure token hasn't expired
4. Restart IDE after setting environment variable