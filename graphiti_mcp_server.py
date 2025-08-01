#!/Users/liasiloam/Library/CloudStorage/Dropbox/项目开发/持仓助手/.venv/bin/python
"""
Graphiti MCP Server

This server provides access to Graphiti knowledge graph operations via the Model Context Protocol.
It allows adding episodes, searching nodes/facts, and managing the knowledge graph.
"""

import asyncio
import json
import logging
import os
import sys
from typing import Any, Dict, List, Optional
from datetime import datetime, timezone

# Import MCP SDK components
try:
    from mcp.server.models import InitializationOptions
    from mcp.server import NotificationOptions, Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    print("Error: MCP SDK not installed. Installing now...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "mcp"])
    from mcp.server.models import InitializationOptions
    from mcp.server import NotificationOptions, Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent

# Import Graphiti components
try:
    from graphiti_core import Graphiti
    from graphiti_core.nodes import EpisodeType
    from graphiti_core.search.search_config import SearchConfig, NodeSearchMethod
except ImportError as e:
    print(f"Error importing graphiti-core: {str(e)}")
    print("Please install it with: pip install graphiti-core")
    sys.exit(1)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class GraphitiMCPServer:
    def __init__(self):
        self.server = Server("graphiti-mcp")
        self.graphiti: Optional[Graphiti] = None
        
        # Setup handlers
        self.setup_handlers()
        
    def setup_handlers(self):
        """Setup all MCP handlers"""
        
        @self.server.list_tools()
        async def handle_list_tools() -> List[Tool]:
            """List all available Graphiti tools"""
            return [
                Tool(
                    name="add_episode",
                    description="Add a new episode to the knowledge graph. Episodes are events or interactions that contain information to be stored.",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "content": {
                                "type": "string",
                                "description": "The content of the episode (e.g., conversation, observation, preference)"
                            },
                            "source": {
                                "type": "string",
                                "description": "The source of the episode (e.g., 'user', 'system', 'observation')"
                            },
                            "source_description": {
                                "type": "string",
                                "description": "Additional description of the source"
                            },
                            "entity_name": {
                                "type": "string",
                                "description": "Name of the primary entity this episode is about (optional)"
                            }
                        },
                        "required": ["content", "source"]
                    }
                ),
                Tool(
                    name="search_nodes",
                    description="Search for nodes in the knowledge graph by query or entity type",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "Search query text"
                            },
                            "entity_type": {
                                "type": "string",
                                "description": "Filter by entity type (e.g., 'Preference', 'Procedure', 'Person', 'Organization')",
                                "enum": ["Preference", "Procedure", "Person", "Organization", "Place", "Event", "Concept"]
                            },
                            "limit": {
                                "type": "integer",
                                "description": "Maximum number of results to return",
                                "default": 10
                            }
                        },
                        "required": ["query"]
                    }
                ),
                Tool(
                    name="search_facts",
                    description="Search for facts (relationships) in the knowledge graph",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "query": {
                                "type": "string",
                                "description": "Search query text"
                            },
                            "center_node_uuid": {
                                "type": "string",
                                "description": "UUID of a node to search facts around (optional)"
                            },
                            "limit": {
                                "type": "integer",
                                "description": "Maximum number of results to return",
                                "default": 10
                            }
                        },
                        "required": ["query"]
                    }
                ),
                Tool(
                    name="get_node",
                    description="Get a specific node by its UUID",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "uuid": {
                                "type": "string",
                                "description": "The UUID of the node to retrieve"
                            }
                        },
                        "required": ["uuid"]
                    }
                ),
                Tool(
                    name="get_neighbors",
                    description="Get all neighboring nodes connected to a specific node",
                    inputSchema={
                        "type": "object",
                        "properties": {
                            "node_uuid": {
                                "type": "string",
                                "description": "The UUID of the node to get neighbors for"
                            }
                        },
                        "required": ["node_uuid"]
                    }
                )
            ]
        
        @self.server.call_tool()
        async def handle_call_tool(name: str, arguments: Dict[str, Any]) -> List[TextContent]:
            """Handle tool calls"""
            if not self.graphiti:
                await self._initialize_graphiti()
            
            try:
                if name == "add_episode":
                    result = await self._add_episode(arguments)
                elif name == "search_nodes":
                    result = await self._search_nodes(arguments)
                elif name == "search_facts":
                    result = await self._search_facts(arguments)
                elif name == "get_node":
                    result = await self._get_node(arguments)
                elif name == "get_neighbors":
                    result = await self._get_neighbors(arguments)
                else:
                    result = {"error": f"Unknown tool: {name}"}
                
                return [TextContent(type="text", text=json.dumps(result, indent=2))]
                
            except Exception as e:
                logger.error(f"Error calling tool {name}: {str(e)}")
                return [TextContent(type="text", text=json.dumps({"error": str(e)}))]
    
    async def _initialize_graphiti(self):
        """Initialize Graphiti connection"""
        # Get Neo4j connection details from environment
        neo4j_uri = os.getenv("NEO4J_URI", "bolt://localhost:7687")
        neo4j_user = os.getenv("NEO4J_USER", "neo4j")
        neo4j_password = os.getenv("NEO4J_PASSWORD", "password")
        
        try:
            self.graphiti = Graphiti(
                uri=neo4j_uri,
                user=neo4j_user,
                password=neo4j_password
            )
            logger.info("Graphiti initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Graphiti: {str(e)}")
            raise
    
    async def _add_episode(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Add a new episode to the graph"""
        content = args.get("content")
        source = args.get("source", "user")
        source_description = args.get("source_description", "")
        entity_name = args.get("entity_name")
        
        episode = await self.graphiti.add_episode(
            name=content[:50] + "..." if len(content) > 50 else content,  # Short name
            content=content,
            source=source,
            source_description=source_description,
            entity_name=entity_name,
            episode_type=EpisodeType.message,
            timestamps=[datetime.now(timezone.utc)]
        )
        
        return {
            "success": True,
            "episode": {
                "uuid": episode.uuid,
                "name": episode.name,
                "created_at": episode.created_at.isoformat() if episode.created_at else None
            },
            "message": "Episode added successfully"
        }
    
    async def _search_nodes(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Search for nodes in the graph"""
        query = args.get("query")
        entity_type = args.get("entity_type")
        limit = args.get("limit", 10)
        
        # Build search parameters
        search_params = {
            "query": query,
            "limit": limit
        }
        
        if entity_type:
            search_params["entity_types"] = [entity_type]
        
        nodes = await self.graphiti.search_nodes(**search_params)
        
        return {
            "success": True,
            "count": len(nodes),
            "nodes": [
                {
                    "uuid": node.uuid,
                    "name": node.name,
                    "entity_type": node.entity_type,
                    "summary": node.summary,
                    "created_at": node.created_at.isoformat() if node.created_at else None
                }
                for node in nodes
            ]
        }
    
    async def _search_facts(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Search for facts in the graph"""
        query = args.get("query")
        center_node_uuid = args.get("center_node_uuid")
        limit = args.get("limit", 10)
        
        edges = await self.graphiti.search_edges(
            query=query,
            center_node_uuid=center_node_uuid,
            limit=limit
        )
        
        return {
            "success": True,
            "count": len(edges),
            "facts": [
                {
                    "uuid": edge.uuid,
                    "fact": edge.fact,
                    "source_node": edge.source_node_uuid,
                    "target_node": edge.target_node_uuid,
                    "created_at": edge.created_at.isoformat() if edge.created_at else None
                }
                for edge in edges
            ]
        }
    
    async def _get_node(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Get a specific node by UUID"""
        uuid = args.get("uuid")
        
        node = await self.graphiti.get_node(uuid)
        
        if not node:
            return {"success": False, "error": f"Node with UUID {uuid} not found"}
        
        return {
            "success": True,
            "node": {
                "uuid": node.uuid,
                "name": node.name,
                "entity_type": node.entity_type,
                "summary": node.summary,
                "created_at": node.created_at.isoformat() if node.created_at else None
            }
        }
    
    async def _get_neighbors(self, args: Dict[str, Any]) -> Dict[str, Any]:
        """Get neighbors of a specific node"""
        node_uuid = args.get("node_uuid")
        
        # Get edges connected to this node
        edges = await self.graphiti.get_edges_by_node(node_uuid)
        
        # Collect neighbor node UUIDs
        neighbor_uuids = set()
        for edge in edges:
            if edge.source_node_uuid == node_uuid:
                neighbor_uuids.add(edge.target_node_uuid)
            else:
                neighbor_uuids.add(edge.source_node_uuid)
        
        # Get neighbor nodes
        neighbors = []
        for uuid in neighbor_uuids:
            node = await self.graphiti.get_node(uuid)
            if node:
                neighbors.append({
                    "uuid": node.uuid,
                    "name": node.name,
                    "entity_type": node.entity_type,
                    "summary": node.summary
                })
        
        return {
            "success": True,
            "count": len(neighbors),
            "neighbors": neighbors
        }
    
    async def run(self):
        """Run the MCP server"""
        async with stdio_server() as (read_stream, write_stream):
            await self.server.run(
                read_stream,
                write_stream,
                InitializationOptions(
                    server_name="Graphiti MCP Server",
                    server_version="1.0.0",
                    capabilities=self.server.get_capabilities(
                        notification_options=NotificationOptions(),
                        experimental_capabilities={},
                    ),
                ),
            )

async def main():
    """Main entry point"""
    server = GraphitiMCPServer()
    await server.run()

if __name__ == "__main__":
    asyncio.run(main())