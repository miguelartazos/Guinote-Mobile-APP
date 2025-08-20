#!/bin/bash

# DEPRECATED: This script creates conflicting MCP configuration
# The .mcp.json file in the project root is now configured with minimal non-conflicting MCPs
# See MCP_CONFLICT_RESOLUTION.md for details

echo "⚠️  WARNING: This script is deprecated!"
echo "It creates MCP configurations that conflict with Claude Code's built-in tools."
echo "The .mcp.json file has been updated with a minimal non-conflicting configuration."
echo ""
read -p "Do you want to continue anyway? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# Enable MCP Servers in Claude Desktop
# This script configures MCP servers for Claude Desktop

set -e

CONFIG_DIR="$HOME/Library/Application Support/Claude"
CONFIG_FILE="$CONFIG_DIR/claude_desktop_config.json"

echo "🚀 Enabling MCP Servers for Claude Desktop..."
echo ""

# Check if Claude Desktop is installed
if [ ! -d "$CONFIG_DIR" ]; then
    echo "❌ Claude Desktop config directory not found at: $CONFIG_DIR"
    echo "Please ensure Claude Desktop is installed."
    exit 1
fi

# Load environment variables if .env.mcp exists
if [ -f ".env.mcp" ]; then
    echo "📋 Loading environment variables from .env.mcp..."
    export $(cat .env.mcp | grep -v '^#' | xargs)
fi

# Create the MCP configuration
cat > "$CONFIG_FILE" << 'EOF'
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/Users/maiky/Documents/guinote2"
      ]
    },
    "git": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-git"
      ],
      "cwd": "/Users/maiky/Documents/guinote2"
    }
  }
}
EOF

echo "✅ MCP configuration created at: $CONFIG_FILE"
echo ""
echo "📝 Configuration includes:"
echo "   - Filesystem MCP (read/write files)"
echo "   - Git MCP (version control)"
echo ""
echo "⚠️  IMPORTANT: Restart Claude Desktop for changes to take effect!"
echo ""
echo "To add more servers, edit: $CONFIG_FILE"
echo ""
echo "Available MCP servers to add:"
echo "   - @modelcontextprotocol/server-github (needs GITHUB_PERSONAL_ACCESS_TOKEN)"
echo "   - @modelcontextprotocol/server-postgres (for database)"
echo "   - @modelcontextprotocol/server-slack (for Slack integration)"
echo ""
echo "✨ Done! Restart Claude Desktop now."