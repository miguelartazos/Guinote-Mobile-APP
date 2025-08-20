# MCP Server Setup Guide for Guinote2

## Overview
This guide covers the setup and configuration of Model Context Protocol (MCP) servers for the Guinote2 project, enabling Claude to interact with your development environment effectively.

## MCP Servers Configured

### 1. Filesystem MCP ✅
**Purpose:** Read/write access to project files for refactoring, adding features, and tests.
**Status:** Ready to use
**Commands available:**
- `"Open src/screens/HomeScreen.tsx and refactor the header"`
- `"Create src/stores/useGameStore.ts with Zustand"`

### 2. Terminal/Process MCP ✅
**Purpose:** Execute development commands (npm, jest, eslint, prettier, pod install)
**Status:** Ready to use
**Commands available:**
- `"Run npm test and show failures"`
- `"Run npm run lint && npm run typecheck"`

### 3. Git + GitHub MCP ✅
**Purpose:** Version control operations and PR management
**Status:** Requires GitHub token configuration
**Setup:**
1. Create GitHub Personal Access Token at https://github.com/settings/tokens
2. Add token to `.env.mcp` file
**Commands available:**
- `"Create branch feat/tournaments, commit changes, open PR"`
- `"Show git status and recent commits"`

### 4. Jest MCP ✅
**Purpose:** Run and manage tests
**Status:** Ready to use
**Commands available:**
- `"Run tests for gameLogic and fix failures"`
- `"Add tests for arrastre logic with partner exception"`

### 5. ESLint/Prettier MCP ✅
**Purpose:** Code quality and formatting
**Status:** Ready to use with enhanced configuration
**Commands available:**
- `"Auto-fix lint issues in all changed files"`
- `"Format all TypeScript files"`

### 6. Convex MCP ✅
**Purpose:** Backend operations, function calls, data seeding
**Status:** Requires Convex credentials
**Setup:**
1. Get Convex URL from https://dashboard.convex.dev
2. Get Deploy Key from deployment settings
3. Add to `.env.mcp` file
**Commands available:**
- `"Seed a test room with 4 bots and simulate 10 tricks"`
- `"Query active games and show statistics"`

### 7. Sentry MCP (Optional) ⏳
**Purpose:** Error tracking and monitoring
**Status:** Optional, configure when ready
**Setup:**
1. Create Sentry project
2. Get DSN and auth token
3. Add to `.env.mcp` file

### 8. Expo/EAS MCP (Optional) ⏳
**Purpose:** Build and deploy preview builds
**Status:** Optional, configure when ready
**Setup:**
1. Create Expo account
2. Configure EAS project
3. Add credentials to `.env.mcp` file
**Commands available:**
- `"Build iOS preview and share install link"`
- `"Deploy Android internal test build"`

## Setup Instructions

### Step 1: Configure Environment Variables
1. Copy the template: `cp .env.mcp .env.mcp.local`
2. Edit `.env.mcp.local` and add your credentials:
   ```bash
   # Required
   GITHUB_TOKEN=ghp_your_token_here
   CONVEX_URL=https://your-project.convex.cloud
   CONVEX_DEPLOY_KEY=your_deploy_key

   # Optional (add when ready)
   SENTRY_DSN=your_sentry_dsn
   EXPO_TOKEN=your_expo_token
   ```

### Step 2: Install Required Dependencies
```bash
# Install additional ESLint/Prettier plugins
npm install --save-dev \
  eslint-plugin-jest \
  eslint-plugin-react-hooks \
  @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser \
  eslint-config-prettier

# Install testing utilities
npm install --save-dev \
  @testing-library/react-native \
  @testing-library/jest-native
```

### Step 3: Enable MCP in Claude Desktop
1. Open Claude Desktop settings
2. Navigate to Developer > MCP Servers
3. Click "Add Configuration"
4. Select the `.mcp.json` file from this project
5. Restart Claude Desktop

### Step 4: Verify Setup
Ask Claude to run these commands to verify everything works:
```
"Run npm run lint"
"Run npm test"
"Show git status"
"Check Convex connection"
```

## Usage Examples

### Development Workflow
```
User: "I need to add a tournament mode feature"
Claude will:
1. Create feature branch via Git MCP
2. Use Filesystem MCP to create components
3. Run tests via Jest MCP
4. Format code via Prettier MCP
5. Commit and create PR via GitHub MCP
```

### Testing Workflow
```
User: "Test the arrastre logic with all edge cases"
Claude will:
1. Create comprehensive test file
2. Run tests via Jest MCP
3. Fix any failures
4. Verify via Terminal MCP
```

### Backend Integration
```
User: "Set up a test game with specific hands"
Claude will:
1. Use Convex MCP to seed data
2. Call game functions
3. Verify state changes
4. Generate test scenarios
```

## Best Practices

1. **Always verify changes**: After Claude makes changes, ask to run tests
2. **Use branches**: Create feature branches for new work
3. **Test incrementally**: Run tests after each significant change
4. **Format consistently**: Run prettier after code changes
5. **Commit frequently**: Make small, focused commits

## Troubleshooting

### MCP Server Not Responding
- Restart Claude Desktop
- Check `.mcp.json` configuration
- Verify environment variables in `.env.mcp.local`

### Permission Errors
- Ensure project directory has proper permissions
- Check that npm/npx are accessible
- Verify Git configuration

### Convex Connection Issues
- Verify Convex URL and deploy key
- Check network connectivity
- Ensure Convex dev server is running

## Security Notes

- **NEVER** commit `.env.mcp.local` to version control
- Use minimal permissions for GitHub tokens
- Rotate credentials regularly
- Keep deploy keys secure

## Next Steps

1. Configure GitHub token for full Git integration
2. Set up Convex credentials for backend operations
3. Consider adding Sentry for production error tracking
4. Set up EAS for automated builds when ready

---

*Last updated: January 2025*