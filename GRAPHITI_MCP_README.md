# Graphiti MCP Server

This is a Model Context Protocol (MCP) server that provides access to Graphiti knowledge graph operations.

## Installation

1. **Install uv package manager** (already done):
   ```bash
   curl -LsSf https://astral.sh/uv/install.sh | sh
   ```

2. **Create and activate virtual environment**:
   ```bash
   export PATH="$HOME/.local/bin:$PATH"
   uv venv --python 3.10
   source .venv/bin/activate
   ```

3. **Install dependencies**:
   ```bash
   uv pip install graphiti-core mcp
   ```

## Configuration

Set the following environment variables for Neo4j connection:

```bash
export NEO4J_URI="bolt://localhost:7687"
export NEO4J_USER="neo4j"
export NEO4J_PASSWORD="your-password"
```

## Available Tools

The MCP server provides the following tools:

1. **add_episode** - Add new episodes to the knowledge graph
   - Parameters: content, source, source_description, entity_name

2. **search_nodes** - Search for nodes by query or entity type
   - Parameters: query, entity_type, limit
   - Entity types: Preference, Procedure, Person, Organization, Place, Event, Concept

3. **search_facts** - Search for facts/relationships in the graph
   - Parameters: query, center_node_uuid, limit

4. **get_node** - Get a specific node by its UUID
   - Parameters: uuid

5. **get_neighbors** - Get all neighboring nodes connected to a specific node
   - Parameters: node_uuid

## Running the Server

```bash
# Activate virtual environment
source .venv/bin/activate

# Run the server
python graphiti_mcp_server.py
```

The server will run via stdio and wait for MCP client connections.

## Testing

Run the test script to verify installation:

```bash
python test_graphiti_mcp.py
```

## Integration with Claude Desktop

To use this server with Claude Desktop, add it to your Claude Desktop configuration file (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "graphiti": {
      "command": "/Users/liasiloam/Library/CloudStorage/Dropbox/项目开发/持仓助手/.venv/bin/python",
      "args": ["/Users/liasiloam/Library/CloudStorage/Dropbox/项目开发/持仓助手/graphiti_mcp_server.py"],
      "env": {
        "NEO4J_URI": "bolt://localhost:7687",
        "NEO4J_USER": "neo4j",
        "NEO4J_PASSWORD": "your-password"
      }
    }
  }
}
```

## Troubleshooting

1. **Import errors**: Make sure you're using the virtual environment with `source .venv/bin/activate`
2. **Neo4j connection**: Ensure Neo4j is running and credentials are correct
3. **Python version**: This requires Python 3.10 or higher

## Example Usage

Once integrated with Claude Desktop, you can use commands like:

- "Search for preferences about coding style"
- "Add an episode: User prefers TypeScript over JavaScript for new projects"
- "Find all procedures related to deployment"
- "Get neighbors of node UUID xyz-123"