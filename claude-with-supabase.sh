#!/bin/bash

# Load Supabase MCP environment variables
if [ -f .env.mcp ]; then
    export $(cat .env.mcp | grep -v '^#' | xargs)
fi

# Launch Claude Code with the environment variables
echo "🚀 Starting Claude Code with Supabase MCP support..."
echo "📊 Supabase Project: xewzprfamxswxtmzucbt"
echo ""

# Start Claude Code
claude