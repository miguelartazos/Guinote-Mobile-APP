# MCP Conflict Resolution Report

## Date: August 19, 2025

## Summary

Resolved conflicts between MCP servers and Claude Code's built-in tools by removing redundant MCPs and keeping only complementary ones.

## Conflicts Identified and Resolved

### 1. Removed Conflicting MCPs

These MCPs were removed because they duplicate Claude Code's built-in functionality:

| MCP Server   | Conflict with Claude Code      | Resolution                                             |
| ------------ | ------------------------------ | ------------------------------------------------------ |
| `filesystem` | Built-in Read/Write/Edit tools | **REMOVED** - Use Claude Code's native file operations |
| `terminal`   | Built-in Bash tool             | **REMOVED** - Use Claude Code's Bash tool              |
| `git`        | Git commands via Bash          | **REMOVED** - Use `git` commands through Bash tool     |
| `github`     | GitHub CLI via Bash            | **REMOVED** - Use `gh` commands through Bash tool      |

### 2. Removed Non-Functional MCPs

These MCPs were removed as they don't have standard implementations:

| MCP Server | Issue                         | Resolution                            |
| ---------- | ----------------------------- | ------------------------------------- |
| `sentry`   | No official MCP server exists | **REMOVED** - Use Sentry SDK directly |
| `expo`     | No official MCP server exists | **REMOVED** - Use Expo CLI via Bash   |
| `convex`   | No official MCP server exists | **REMOVED** - Use Convex SDK/CLI      |

### 3. Retained Non-Conflicting MCPs

These MCPs provide unique functionality not available in Claude Code:

| MCP Server | Unique Functionality                  | Status      |
| ---------- | ------------------------------------- | ----------- |
| `jest`     | Specialized test runner integration   | ✅ **KEPT** |
| `eslint`   | Advanced linting with auto-fix        | ✅ **KEPT** |
| `prettier` | Code formatting with config awareness | ✅ **KEPT** |
| `supabase` | Database management API               | ✅ **KEPT** |

## Configuration Changes

### Before (10 servers, many conflicts):

```json
{
  "mcpServers": {
    "filesystem": {...},  // CONFLICT
    "terminal": {...},    // CONFLICT
    "git": {...},        // CONFLICT
    "github": {...},     // CONFLICT
    "jest": {...},
    "eslint": {...},
    "prettier": {...},
    "sentry": {...},     // NON-EXISTENT
    "expo": {...},       // NON-EXISTENT
    "supabase": {...}
  }
}
```

### After (4 servers, no conflicts):

```json
{
  "mcpServers": {
    "jest": {...},       // Unique test integration
    "eslint": {...},     // Advanced linting
    "prettier": {...},   // Code formatting
    "supabase": {...}    // Database API
  }
}
```

## Benefits of This Configuration

1. **No Conflicts**: Each tool has a unique purpose without overlapping Claude Code's capabilities
2. **Better Performance**: Fewer MCP processes running means less resource usage
3. **Clearer Separation**: MCP servers handle specialized tasks, Claude Code handles general operations
4. **Easier Debugging**: Fewer moving parts make it easier to identify issues

## Usage Guidelines

### File Operations

```bash
# Instead of filesystem MCP, use:
- Claude Code's Read tool for reading files
- Claude Code's Write/Edit tools for modifying files
- Claude Code's Glob/Grep tools for searching
```

### Terminal Commands

```bash
# Instead of terminal MCP, use:
- Claude Code's Bash tool for all shell commands
- Example: "Run npm test" → Bash tool executes it directly
```

### Git Operations

```bash
# Instead of git MCP, use:
- Bash tool with git commands
- Example: "git status", "git commit -m 'message'"
```

### GitHub Operations

```bash
# Instead of github MCP, use:
- Bash tool with gh CLI
- Example: "gh pr create", "gh issue list"
```

## Testing the New Configuration

To verify the setup works correctly:

1. **Restart Claude Desktop** to load the new configuration
2. **Test remaining MCPs**:
   - Jest: Ask Claude to run specific test files
   - ESLint: Ask Claude to lint and auto-fix code
   - Prettier: Ask Claude to format code files
   - Supabase: Ask Claude to query database (if configured)

## Rollback Instructions

If you need to restore the previous configuration:

```bash
# Restore from backup
cp .mcp.json.backup-20250819-203024 .mcp.json

# Restart Claude Desktop
```

## Additional Notes

- The backup of the original configuration is saved as `.mcp.json.backup-[timestamp]`
- The `enable-mcp.sh` script should be updated or removed to prevent recreating conflicts
- Consider removing the MCP setup scripts if they're no longer needed

## Recommendations

1. **Remove setup scripts**: Delete or update `scripts/enable-mcp.sh` and `scripts/setup-mcp.sh` to reflect new configuration
2. **Update .env.mcp**: Remove tokens for services no longer using MCP (GitHub, Sentry, Expo)
3. **Document in README**: Update project README to explain the MCP setup for new developers
