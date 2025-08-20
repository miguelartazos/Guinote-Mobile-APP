# MCP Server Setup Guide for Guinote2

## ⚠️ Important Note

Most MCP servers have been disabled to avoid conflicts with Claude Code's built-in tools. Only non-conflicting MCPs are retained.

## Overview

This guide covers the minimal MCP configuration for Guinote2, using only servers that complement (not duplicate) Claude Code's capabilities.

## Current MCP Configuration (Minimal)

### Active MCP Servers

#### 1. Jest MCP ✅

**Purpose:** Specialized test runner integration
**Status:** Active
**Use Case:** Advanced test filtering and reporting

#### 2. ESLint MCP ✅

**Purpose:** Advanced linting with auto-fix
**Status:** Active
**Use Case:** Code quality checks beyond basic linting

#### 3. Prettier MCP ✅

**Purpose:** Code formatting with config awareness
**Status:** Active
**Use Case:** Consistent code formatting

#### 4. Supabase MCP ✅

**Purpose:** Database management API
**Status:** Requires token configuration
**Setup:** Add token to `.env.mcp.local`

### Disabled MCP Servers (Use Claude Code Instead)

#### ❌ Filesystem MCP

**Replaced by:** Claude Code's Read/Write/Edit tools
**How to use:** Just ask Claude to read or edit files directly

#### ❌ Terminal MCP

**Replaced by:** Claude Code's Bash tool
**How to use:** Ask Claude to run any command

#### ❌ Git/GitHub MCP

**Replaced by:** Git commands via Bash tool
**How to use:** `git status`, `gh pr create`, etc.

### Removed Non-Existent MCPs

- ❌ **Sentry MCP** - No official MCP exists
- ❌ **Expo MCP** - No official MCP exists
- ❌ **Convex MCP** - No official MCP exists

## Setup Instructions

### Step 1: Use the Minimal Configuration

The `.mcp.json` file is already configured with only non-conflicting MCPs.

### Step 2: Add Supabase Token (Optional)

If using Supabase MCP:

```bash
cp .env.mcp.example .env.mcp.local
# Edit .env.mcp.local and add your Supabase token
```

### Step 3: Restart Claude Desktop

After any MCP configuration change, restart Claude Desktop to load the new settings.

### Step 4: Verify Setup

Test the remaining MCPs:

- Jest: Ask Claude to run specific tests
- ESLint: Ask Claude to lint files
- Prettier: Ask Claude to format code
- Supabase: Query database (if configured)

## Usage with Claude Code

### File Operations

```bash
# Instead of filesystem MCP:
"Read src/components/Game.tsx"     # Uses Claude Code's Read tool
"Edit the handlePlay function"     # Uses Claude Code's Edit tool
"Search for useEffect hooks"       # Uses Claude Code's Grep tool
```

### Terminal Commands

```bash
# Instead of terminal MCP:
"Run npm test"                     # Uses Claude Code's Bash tool
"Install new dependency"           # Uses Claude Code's Bash tool
"Check git status"                 # Uses Claude Code's Bash tool
```

### Testing & Formatting

```bash
# Using retained MCPs:
"Run Jest tests for gameLogic"     # Uses Jest MCP
"Fix all ESLint issues"           # Uses ESLint MCP
"Format all TypeScript files"      # Uses Prettier MCP
```

## Why This Configuration?

1. **No Conflicts**: Each tool has unique functionality
2. **Better Performance**: Fewer MCP processes running
3. **Clearer Separation**: MCPs for specialized tasks, Claude Code for general ops
4. **Simpler Debugging**: Less complexity to troubleshoot

---

_Last updated: August 2025_
