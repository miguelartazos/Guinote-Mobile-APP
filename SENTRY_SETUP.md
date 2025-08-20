# Sentry Setup Guide for Guinote2

## ✅ Installation Complete

Sentry has been installed and configured for your React Native project.

## Configuration Steps

### 1. Get Your Sentry DSN
1. Go to https://sentry.io/settings/artazos/projects/react-native/keys/
2. Copy the DSN (looks like: `https://xxx@o123456.ingest.sentry.io/123456`)

### 2. Create Auth Token (Internal Integration - Recommended)
1. Go to https://sentry.io/settings/artazos/developer-settings/
2. Click "Create New Internal Integration"
3. Name: `guinote2-mcp`
4. Set permissions:
   - **Release**: Admin
   - **Project**: Write  
   - **Organization**: Read
   - **Issue & Event**: Read
5. Save and copy the token

### 3. Update Configuration Files

#### In `sentry.properties`:
```properties
auth.token=YOUR_AUTH_TOKEN_HERE
```

#### In `sentry.config.js`:
```javascript
Sentry.init({
  dsn: 'YOUR_DSN_HERE',
  // ... rest of config
});
```

#### In `.env.mcp.local`:
```bash
SENTRY_DSN=YOUR_DSN_HERE
SENTRY_AUTH_TOKEN=YOUR_AUTH_TOKEN_HERE
```

## Features Configured

✅ **Error Tracking** - Automatic error capture and reporting
✅ **Performance Monitoring** - Track app performance and transactions  
✅ **Screenshots** - Attach screenshots to error reports
✅ **View Hierarchy** - Include view hierarchy for debugging
✅ **React Navigation** - Track navigation events
✅ **Source Maps** - Upload source maps for better error details
✅ **Release Management** - Track releases and deployments

## Testing Sentry

### Test Error Capture:
```javascript
// Add this temporarily to any component
Sentry.captureException(new Error('Test error from Guinote2'));
```

### Test Performance:
```javascript
const transaction = Sentry.startTransaction({
  name: 'test-transaction',
  op: 'test'
});
// ... do something
transaction.finish();
```

## Build Configuration

### For iOS:
```bash
cd ios && pod install
```

### For Android:
The Sentry gradle plugin will be configured automatically on next build.

## Environment-Specific Settings

- **Development**: Full tracing (100%), debug mode enabled
- **Production**: Reduced tracing (10%), debug mode disabled

## MCP Integration

The Sentry MCP server is configured and ready to use. Claude can now:
- Create releases
- Upload source maps
- Monitor error rates
- Query issues and events

## Useful Commands

```bash
# Upload source maps manually
npx @sentry/cli releases files RELEASE_NAME upload-sourcemaps --dist DIST_NAME ./build

# Create a release
npx @sentry/cli releases new RELEASE_NAME

# Finalize a release
npx @sentry/cli releases finalize RELEASE_NAME
```

## Troubleshooting

### Auth Token Issues:
- Ensure you're using Internal Integration token, not personal token
- Check token has correct permissions
- Token should not have quotes in config files

### DSN Issues:
- Verify DSN format is correct
- Check project exists in Sentry dashboard
- Ensure DSN is for correct environment

### Build Issues:
- Run `cd ios && pod install` after installation
- Clean build folders if needed
- Check `sentry.properties` is not committed to git

## Security Notes

⚠️ **NEVER commit these files:**
- `sentry.properties` (contains auth token)
- `.sentryclirc` (if created)
- `.env.mcp.local` (contains credentials)

These are already in `.gitignore` for protection.

## Next Steps

1. Add your DSN and auth token to the configuration files
2. Test error capture in development
3. Configure alerts in Sentry dashboard
4. Set up release tracking for deployments

---

*Organization: artazos*
*Project: react-native*
*Setup Date: January 2025*