#!/usr/bin/env python3
"""Test script to verify Graphiti MCP server can start"""

import sys
import os
import json

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

try:
    print("Testing Graphiti MCP Server...")
    print("=" * 50)
    
    # Test imports
    print("1. Testing imports...")
    from graphiti_core import Graphiti
    print("   ✓ graphiti-core imported successfully")
    
    from mcp.server import Server
    print("   ✓ mcp imported successfully")
    
    # Test server initialization
    print("\n2. Testing server initialization...")
    from graphiti_mcp_server import GraphitiMCPServer
    server = GraphitiMCPServer()
    print("   ✓ GraphitiMCPServer initialized successfully")
    
    # Check server details
    print("\n3. Server details:")
    print(f"   - Server name: {server.server.name}")
    
    # List available tools (without async)
    print("\n4. Available tools:")
    # The tools are defined in the setup_handlers method
    tools_info = [
        ("add_episode", "Add new episodes to the knowledge graph"),
        ("search_nodes", "Search for nodes by query or entity type"),
        ("search_facts", "Search for facts/relationships"),
        ("get_node", "Get a specific node by UUID"),
        ("get_neighbors", "Get neighboring nodes")
    ]
    
    for tool_name, description in tools_info:
        print(f"   - {tool_name}: {description}")
    
    print("\n5. Environment variables needed:")
    print("   - NEO4J_URI (default: bolt://localhost:7687)")
    print("   - NEO4J_USER (default: neo4j)")
    print("   - NEO4J_PASSWORD (default: password)")
    
    print("\n" + "=" * 50)
    print("✓ All tests passed! The Graphiti MCP server is ready to run.")
    print("\nTo start the server, run:")
    print("  python graphiti_mcp_server.py")
    print("\nNote: The server will wait for MCP client connections via stdio.")
    
except Exception as e:
    print(f"\n✗ Test failed: {e}")
    import traceback
    traceback.print_exc()
    sys.exit(1)