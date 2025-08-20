# 🤖 Claude Code Subagents for Guinote Project

## Overview

This directory contains specialized AI subagents that enhance Claude Code's capabilities for the Guinote game project. Each subagent is optimized for specific tasks and automatically triggers based on context or explicit commands.

## Quick Start

### Automatic Triggers

Subagents activate automatically when you use these shortcuts:

- **`QPLAN`** → Triggers `code-planner` subagent
- **`QCODE`** → Triggers `tdd-coder` subagent
- **`QCHECK`** → Triggers `skeptical-reviewer` subagent
- **`QTEST [function]`** → Triggers `test-writer` subagent
- **`QGAME [move]`** → Triggers `game-rules-validator` subagent

### Manual Invocation

You can also explicitly request a subagent:

```
Use the code-planner subagent to analyze how authentication is implemented
```

## Available Subagents

### 1. code-planner

**Purpose**: Analyzes codebase patterns and creates consistent implementation plans

**Auto-triggers when**:
- Using QPLAN command
- Planning features affecting > 3 files
- Refactoring existing functionality

**Key Features**:
- Searches for similar implementations
- Identifies reusable components
- Ensures architectural consistency
- Minimizes code duplication

**Example Usage**:
```
QPLAN
I need to add a new game mode for tournament play
```

### 2. tdd-coder

**Purpose**: Implements features using strict Test-Driven Development

**Auto-triggers when**:
- Using QCODE command
- Implementing new functions
- Adding new features

**Key Features**:
- Writes tests FIRST (Red phase)
- Minimal implementation (Green phase)  
- Quality refactoring (Refactor phase)
- Automatic formatting and linting

**Example Usage**:
```
QCODE
Implement the tournament scoring system based on the plan
```

### 3. skeptical-reviewer

**Purpose**: Performs brutally honest code reviews

**Auto-triggers when**:
- Using QCHECK command
- After significant code changes
- Before commits (if configured)

**Key Features**:
- Checks function complexity
- Validates test coverage
- Identifies code smells
- Enforces best practices

**Example Usage**:
```
QCHECK
Review the tournament mode implementation
```

### 4. test-writer

**Purpose**: Generates comprehensive test suites

**Auto-triggers when**:
- Using QTEST command
- New functions lack tests
- Coverage drops below threshold

**Key Features**:
- Generates happy path tests
- Creates edge case tests
- Adds property-based tests
- Ensures high coverage

**Example Usage**:
```
QTEST calculateTournamentScore
```

### 5. game-rules-validator

**Purpose**: Validates Guinote game rules and move legality

**Auto-triggers when**:
- Using QGAME command
- Modifying game logic
- Debugging bot behavior

**Key Features**:
- Validates move legality
- Checks phase-specific rules
- Verifies point calculations
- Detects rule violations

**Example Usage**:
```
QGAME validate current game state
```

## Advanced Configuration

### Creating Custom Subagents

1. Create a new file in `.claude/subagents/`:

```yaml
---
name: your-subagent-name
description: What this subagent does
tools:
  - read
  - write
  - bash
---

# Your Subagent Name

[System prompt and instructions here]
```

2. Update CLAUDE.md to add a shortcut (optional):

```markdown
### QYOUR

When I type "qyour", this means:
```
1. Delegate to your-subagent-name
2. [What it does]
```
```

### Tool Permissions

Each subagent specifies which tools it can use:

- **read**: Read files
- **write**: Create/modify files
- **edit/multiedit**: Edit existing files
- **bash**: Run shell commands
- **grep/glob**: Search capabilities
- **ls**: List directory contents

### Best Practices

1. **Single Responsibility**: Each subagent should focus on ONE area
2. **Clear Triggers**: Define when subagents should activate
3. **Tool Limits**: Only grant necessary tools
4. **Documentation**: Include examples in the subagent file
5. **Testing**: Test subagents with various scenarios

## Workflow Examples

### Complete Feature Implementation

```bash
# 1. Plan the feature
QPLAN
Add player statistics tracking

# 2. Implement with TDD
QCODE

# 3. Generate additional tests
QTEST PlayerStatistics

# 4. Review the code
QCHECK

# 5. Validate game logic
QGAME check statistics calculation

# 6. Commit the changes
QGIT
```

### Bug Fix Workflow

```bash
# 1. Validate the bug
QGAME reproduce bot freezing issue

# 2. Plan the fix
QPLAN
Fix bot freezing in vueltas phase

# 3. Implement fix with tests
QCODE

# 4. Thorough review
QCHECK
```

## Performance Tips

1. **Batch Operations**: Subagents work best with clear, complete requirements
2. **Context Preservation**: Each subagent maintains its own context
3. **Parallel Execution**: Multiple subagents can work simultaneously
4. **Caching**: Subagents cache codebase analysis for efficiency

## Troubleshooting

### Subagent Not Triggering

- Check the command syntax
- Verify the subagent file exists
- Ensure proper YAML frontmatter
- Check tool permissions

### Unexpected Behavior

- Review the subagent's system prompt
- Check for conflicting instructions
- Verify tool availability
- Test with simpler inputs

### Performance Issues

- Reduce scope of analysis
- Use more specific search patterns
- Limit tool usage
- Break complex tasks into steps

## Future Enhancements

Planned subagents:

- **performance-optimizer**: Analyzes and improves app performance
- **ui-consistency-checker**: Ensures UI/UX consistency
- **migration-assistant**: Helps with database/API migrations
- **accessibility-auditor**: Checks accessibility compliance
- **security-scanner**: Identifies security vulnerabilities

## Contributing

To contribute a new subagent:

1. Create the subagent file
2. Test thoroughly with real scenarios
3. Document usage examples
4. Update this README
5. Submit a pull request

## Support

For issues or questions:

1. Check this documentation
2. Review subagent files for examples
3. Test with simpler inputs
4. Report issues in the project repository