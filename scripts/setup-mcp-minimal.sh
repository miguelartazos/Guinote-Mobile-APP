#!/bin/bash

# Minimal MCP Setup Script for Guinote2
# This script configures only non-conflicting MCP servers that complement Claude Code

set -e

echo "🚀 Setting up minimal MCP servers for Guinote2..."
echo ""
echo "This configuration keeps only MCPs that don't conflict with Claude Code's built-in tools:"
echo "  ✅ jest - Specialized test runner"
echo "  ✅ eslint - Advanced linting"  
echo "  ✅ prettier - Code formatting"
echo "  ✅ supabase - Database API"
echo ""
echo "Removed conflicting MCPs:"
echo "  ❌ filesystem - Use Claude Code's Read/Write/Edit tools instead"
echo "  ❌ terminal - Use Claude Code's Bash tool instead"
echo "  ❌ git - Use git commands via Bash tool instead"
echo "  ❌ github - Use gh CLI via Bash tool instead"
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

# Install required dependencies for remaining MCPs
echo "📦 Installing dependencies for ESLint and Prettier MCPs..."
npm install --save-dev \
  eslint-plugin-jest \
  eslint-plugin-react-hooks \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint-config-prettier

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Check for .env.mcp.local for Supabase token
if [ ! -f ".env.mcp.local" ]; then
    echo "📝 Creating .env.mcp.local template for Supabase configuration..."
    cat > .env.mcp.local << 'EOF'
# Supabase Management API Token
# Get from: https://supabase.com/dashboard/account/tokens
SUPABASE_ACCESS_TOKEN=YOUR_SUPABASE_ACCESS_TOKEN_HERE
EOF
    echo "✅ Created .env.mcp.local template - Please add your Supabase token"
else
    echo "✅ .env.mcp.local already exists"
fi

echo ""
echo "🔧 Verifying MCP configuration..."
echo ""

# Check if .mcp.json exists and is valid
if [ -f ".mcp.json" ]; then
    if npx prettier --check .mcp.json > /dev/null 2>&1; then
        echo "✅ .mcp.json is valid JSON"
    else
        echo "⚠️  .mcp.json has formatting issues, fixing..."
        npx prettier --write .mcp.json
    fi
else
    echo "❌ .mcp.json not found!"
    exit 1
fi

echo ""
echo "✨ Minimal MCP Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Restart Claude Desktop to load the new configuration"
echo ""
echo "2. Test the remaining MCPs work correctly:"
echo "   - Jest: Ask Claude to run tests"
echo "   - ESLint: Ask Claude to lint code"
echo "   - Prettier: Ask Claude to format files"
echo "   - Supabase: Ask Claude to query database (if token configured)"
echo ""
echo "3. For file operations, use Claude Code's built-in tools:"
echo "   - Read files: Claude's Read tool"
echo "   - Edit files: Claude's Edit/Write tools"
echo "   - Search: Claude's Grep/Glob tools"
echo ""
echo "4. For terminal operations, use Claude Code's Bash tool:"
echo "   - npm commands: Bash tool"
echo "   - git commands: Bash tool"
echo "   - gh CLI: Bash tool"
echo ""
echo "📚 See MCP_CONFLICT_RESOLUTION.md for detailed information"