#!/bin/bash

# DEPRECATED: This script configures conflicting MCP servers
# Use setup-mcp-minimal.sh instead for non-conflicting configuration
# See MCP_CONFLICT_RESOLUTION.md for details

echo "⚠️  WARNING: This script is deprecated!"
echo "It configures MCP servers that conflict with Claude Code's built-in tools."
echo "Please use ./scripts/setup-mcp-minimal.sh instead."
echo ""
read -p "Do you want to continue anyway? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    exit 1
fi

# MCP Setup Script for Guinote2
# This script installs necessary dependencies and configures MCP servers

set -e

echo "🚀 Setting up MCP servers for Guinote2..."
echo ""

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install Node.js first."
    exit 1
fi

# Install ESLint and Prettier plugins
echo "📦 Installing ESLint and Prettier plugins..."
npm install --save-dev \
  eslint-plugin-jest \
  eslint-plugin-react-hooks \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint-config-prettier \
  prettier-plugin-organize-imports

echo ""
echo "✅ Dependencies installed successfully!"
echo ""

# Check for .env.mcp.local
if [ ! -f ".env.mcp.local" ]; then
    echo "📝 Creating .env.mcp.local from template..."
    if [ -f ".env.mcp" ]; then
        cp .env.mcp .env.mcp.local
        echo "✅ Created .env.mcp.local - Please edit it with your credentials"
    else
        echo "⚠️  .env.mcp template not found"
    fi
else
    echo "✅ .env.mcp.local already exists"
fi

echo ""
echo "🔧 Running initial checks..."
echo ""

# Run prettier
echo "💅 Formatting code with Prettier..."
npx prettier --write "src/**/*.{ts,tsx,js,jsx}" --ignore-path .gitignore

# Run ESLint
echo "🔍 Running ESLint..."
npx eslint . --ext .js,.jsx,.ts,.tsx --fix || true

# Run TypeScript check
echo "📘 Running TypeScript check..."
npx tsc --noEmit || true

echo ""
echo "✨ MCP Setup Complete!"
echo ""
echo "Next steps:"
echo "1. Edit .env.mcp.local with your credentials:"
echo "   - GitHub token"
echo "   - Convex URL and deploy key"
echo "   - (Optional) Sentry and Expo credentials"
echo ""
echo "2. Add the .mcp.json configuration to Claude Desktop:"
echo "   - Open Claude Desktop settings"
echo "   - Navigate to Developer > MCP Servers"
echo "   - Add configuration from $(pwd)/.mcp.json"
echo ""
echo "3. Restart Claude Desktop"
echo ""
echo "4. Test the setup by asking Claude to:"
echo "   - Run npm test"
echo "   - Show git status"
echo "   - Check Convex connection"
echo ""
echo "📚 See MCP_SETUP.md for detailed documentation"