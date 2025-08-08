# MCP Usage Guide for Guiñote Project

## Installed MCP Servers

### 1. Context7 - Documentation Fetcher
**Purpose:** Fetches up-to-date, version-specific documentation for libraries and frameworks

**How to use:**
- Add "use context7" to any prompt when you need current docs
- Examples:
  ```
  "How to implement Convex mutations? use context7"
  "Create a Clerk authentication flow in React Native. use context7"
  "Explain React Native Reanimated 3 API. use context7"
  ```

**Best for:**
- Getting latest API documentation
- Avoiding deprecated methods
- Learning new library features
- Ensuring code uses current best practices

### 2. Magic (21st.dev) - UI Component Generator
**Purpose:** Creates modern UI components from natural language descriptions

**How to use:**
- Describe the component you want in natural language
- Magic will generate the complete component code
- Examples:
  ```
  "Create a card game table with 4 player positions using Magic"
  "Build an animated card dealing component with Magic"
  "Design a modern game lobby screen with Magic"
  ```

**Best for:**
- Rapid UI prototyping
- Creating complex animations
- Building consistent design systems
- Game UI components (cards, boards, panels)

### 3. Magic UI Design - Component Library
**Purpose:** Access to pre-built, customizable UI components

**How to use:**
- Request specific UI patterns from the Magic UI library
- Examples:
  ```
  "Add a shimmer loading effect from Magic UI"
  "Implement a gradient button from Magic UI"
  "Create a glassmorphism card from Magic UI"
  ```

**Best for:**
- Polished UI effects
- Modern design patterns
- Reusable component templates
- Accessibility-compliant components

## Practical Examples for Your Game

### Getting Convex Documentation
```
"How to implement real-time game state sync with Convex? use context7"
```

### Creating Game Components
```
"Create a Spanish card component with flip animation using Magic"
"Build a player hand component that arranges cards in a fan using Magic"
```

### Adding UI Polish
```
"Add a particle effect when player wins a trick using Magic UI"
"Create a countdown timer with gradient animation from Magic UI"
```

## Verification Commands

Check MCP status:
```bash
claude mcp list
```

Get MCP details:
```bash
claude mcp get context7
claude mcp get magic
claude mcp get magicui
```

## Tips
1. Context7 works best when you specify the exact library version you're using
2. Magic components are TypeScript-ready and work well with React Native
3. Combine MCPs: Use Context7 for docs, then Magic to implement the UI
4. Magic UI components are optimized for performance and accessibility

## Troubleshooting

If an MCP disconnects:
```bash
# Remove and re-add
claude mcp remove <name>
claude mcp add <name> <command>

# Restart Claude Code
claude restart
```

## API Keys (When Needed)
- Magic (21st.dev) may require an API key for premium features
- Get your key at: https://21st.dev
- Add with environment variable:
  ```bash
  claude mcp add magic npx --env API_KEY=your-key -- -y @21st-dev/magic@latest
  ```