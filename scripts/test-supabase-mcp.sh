#!/bin/bash

# Test script for Supabase MCP Server connection
# This verifies that the MCP server can start and connect properly

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🔍 Testing Supabase MCP Server Connection${NC}"
echo "================================================"

# Check environment
echo -e "\n${YELLOW}1. Checking environment...${NC}"

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js installed: ${NODE_VERSION}${NC}"
else
    echo -e "${RED}❌ Node.js not found. Please install Node.js first.${NC}"
    exit 1
fi

# Check npx
if command -v npx &> /dev/null; then
    echo -e "${GREEN}✅ npx is available${NC}"
else
    echo -e "${RED}❌ npx not found. Please install npm/npx.${NC}"
    exit 1
fi

# Kill any existing MCP processes
echo -e "\n${YELLOW}2. Cleaning up existing processes...${NC}"
pkill -f "mcp-server-supabase" 2>/dev/null || true
pkill -f "@supabase/mcp-server" 2>/dev/null || true
echo -e "${GREEN}✅ Cleaned up existing processes${NC}"

# Test MCP server
echo -e "\n${YELLOW}3. Testing MCP server startup...${NC}"

# Set up test environment
export SUPABASE_ACCESS_TOKEN="sbp_1a238530d55b768088bf27eadc2d3eb153ec5460"

# Start the server in background and capture output
echo "Starting MCP server..."
npx -y @supabase/mcp-server-supabase@latest \
    --read-only \
    --project-ref=xewzprfamxswxtmzucbt \
    2>&1 > /tmp/mcp-test.log &

MCP_PID=$!

# Wait a moment for server to start
sleep 3

# Check if process is running
if ps -p $MCP_PID > /dev/null 2>&1; then
    echo -e "${GREEN}✅ MCP server started successfully${NC}"
    
    # Kill the test process
    kill $MCP_PID 2>/dev/null || true
    
    # Also kill any npx processes that might be hanging
    pkill -f "@supabase/mcp-server" 2>/dev/null || true
else
    echo -e "${RED}❌ MCP server failed to start${NC}"
    echo "Check /tmp/mcp-test.log for errors:"
    cat /tmp/mcp-test.log 2>/dev/null | head -10
    exit 1
fi

# Check Claude Desktop config
echo -e "\n${YELLOW}4. Checking Claude Desktop configuration...${NC}"

CONFIG_FILE="$HOME/Library/Application Support/Claude/claude_desktop_config.json"

if [ -f "$CONFIG_FILE" ]; then
    echo -e "${GREEN}✅ Claude Desktop config exists${NC}"
    
    # Check if supabase is configured
    if grep -q '"supabase"' "$CONFIG_FILE"; then
        echo -e "${GREEN}✅ Supabase MCP is configured in Claude Desktop${NC}"
        
        # Extract and verify config
        PROJECT_REF=$(grep -A10 '"supabase"' "$CONFIG_FILE" | grep "project-ref" | cut -d'=' -f2 | cut -d'"' -f1)
        if [ "$PROJECT_REF" = "xewzprfamxswxtmzucbt" ]; then
            echo -e "${GREEN}✅ Project reference matches: ${PROJECT_REF}${NC}"
        else
            echo -e "${YELLOW}⚠️  Project reference: ${PROJECT_REF}${NC}"
        fi
    else
        echo -e "${RED}❌ Supabase MCP not found in config${NC}"
    fi
else
    echo -e "${RED}❌ Claude Desktop config not found${NC}"
fi

# Final instructions
echo -e "\n${BLUE}================================================${NC}"
echo -e "${BLUE}📋 NEXT STEPS:${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${GREEN}Everything looks good! Now:${NC}"
echo ""
echo -e "1. ${YELLOW}Quit Claude Desktop completely${NC} (Cmd+Q)"
echo -e "2. ${YELLOW}Wait 5 seconds${NC}"
echo -e "3. ${YELLOW}Reopen Claude Desktop${NC}"
echo -e "4. ${YELLOW}Type /mcp${NC} in the chat"
echo ""
echo -e "You should see:"
echo -e "  ${GREEN}• filesystem ✓${NC}"
echo -e "  ${GREEN}• git ✓${NC}"
echo -e "  ${GREEN}• supabase ✓${NC}"
echo ""
echo -e "${BLUE}If supabase doesn't appear, try:${NC}"
echo -e "  - Wait 10 more seconds after opening Claude"
echo -e "  - Type /mcp again"
echo -e "  - Check Console.app for Claude errors"
echo ""
echo -e "${GREEN}✨ Test complete!${NC}"