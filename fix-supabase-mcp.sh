#!/bin/bash

echo "🔧 Supabase MCP Configuration Helper"
echo "===================================="
echo ""
echo "This script will help you configure the Supabase MCP connection."
echo ""
echo "📝 First, get your Personal Access Token:"
echo "   1. Go to: https://supabase.com/dashboard/account/tokens"
echo "   2. Click 'Generate new token'"
echo "   3. Name it (e.g., 'MCP Server')"
echo "   4. Copy the token"
echo ""
read -p "Paste your Supabase Personal Access Token here: " TOKEN

if [ -z "$TOKEN" ]; then
    echo "❌ No token provided. Exiting."
    exit 1
fi

# Update .env.mcp
echo "SUPABASE_ACCESS_TOKEN=$TOKEN" > .env.mcp

# Update .mcp.json to use the environment variable from .env.mcp
cat > .mcp.json << 'EOF'
{
  "mcpServers": {
    "supabase": {
      "type": "stdio", 
      "command": "npx",
      "args": [
        "-y",
        "@supabase/mcp-server-supabase@latest",
        "--read-only",
        "--project-ref=xewzprfamxswxtmzucbt"
      ],
      "env": {
        "SUPABASE_ACCESS_TOKEN": "${SUPABASE_ACCESS_TOKEN}"
      }
    }
  }
}
EOF

echo ""
echo "✅ Configuration updated successfully!"
echo ""
echo "Now restart Claude Code or reload the MCP servers to apply changes."
echo "You can test with: /mcp"