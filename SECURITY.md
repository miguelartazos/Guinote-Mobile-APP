# Security Configuration Guide

## Quick Status Check

**Repository:** Private  
**Tokens in Code:** None  
**Security Status:** ✅ **SECURE**

## Protected Files

The following files are automatically blocked by `.gitignore`:

```
.env*                    # All environment files
sentry.properties        # Sentry configuration
*.pem, *.key            # Private keys
*credentials*, *secrets* # Any credential files
```

## Configuration Setup

### 1. Environment Variables

Copy the example file and add your values:

```bash
cp .env.example .env
# Edit .env with your actual values
```

### 2. MCP Configuration (Optional)

If using MCP servers:

```bash
cp .env.mcp.example .env.mcp.local
# Edit .env.mcp.local with your tokens
```

### 3. Sentry Configuration (Optional)

For error tracking:

```bash
cp sentry.properties.example sentry.properties
# Add your Sentry auth token
```

## Security Checklist

Before committing:

- [ ] Run `git status` - ensure no `.env` files listed
- [ ] Check for tokens: `grep -r "token\|secret\|key" . --exclude-dir=node_modules`
- [ ] Use `.example` files for templates

## Token Sources

If you need tokens:

| Service  | Where to Get Token                                  | Required Scopes  |
| -------- | --------------------------------------------------- | ---------------- |
| Supabase | https://supabase.com/dashboard/account/tokens       | Read/Write       |
| GitHub   | https://github.com/settings/tokens                  | repo, workflow   |
| Sentry   | https://sentry.io/settings/account/api/auth-tokens/ | project:releases |

## Best Practices

### ✅ DO

- Use `.env.local` for local secrets
- Create `.example` files with placeholders
- Check `git status` before committing

### ❌ DON'T

- Commit real tokens (even in private repos)
- Use `git add -f` on sensitive files
- Store secrets in code

## Quick Commands

```bash
# Check for exposed secrets
npm run security:check 2>/dev/null || \
  grep -r "ghp_\|sbp_\|sk_live" . --exclude-dir=node_modules

# List tracked sensitive files (should be empty)
git ls-files | grep -E "\.env|secret|token" | grep -v ".example"
```

## If You Find a Token

1. Remove it immediately
2. Rotate the token if it was pushed
3. Add the file to `.gitignore`

---

_Last Security Audit: August 19, 2025_
