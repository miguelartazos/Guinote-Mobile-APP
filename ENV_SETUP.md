# Environment Variables Setup

This project uses environment variables for configuration. Follow these steps to set up your environment:

## Development Setup

1. **Copy the example file:**
   ```bash
   cp .env.example .env
   ```

2. **Update the values in `.env`:**
   - `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY`: Your Clerk publishable key
   - `EXPO_PUBLIC_CONVEX_URL`: Your Convex deployment URL
   - Other settings as needed

## Production Setup

1. **Create a production env file:**
   ```bash
   cp .env.production .env
   ```

2. **Update with production values:**
   - Replace `pk_live_YOUR_PRODUCTION_KEY` with your actual production Clerk key
   - Update Convex URL if using a different production deployment
   - Set `EXPO_PUBLIC_ENVIRONMENT=production`
   - Disable debug logs: `EXPO_PUBLIC_SHOW_AUTH_LOGS=false`

## Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk public key for authentication | `pk_test_...` or `pk_live_...` |
| `EXPO_PUBLIC_CONVEX_URL` | Convex deployment URL | `https://your-app.convex.cloud` |
| `EXPO_PUBLIC_ENVIRONMENT` | Current environment | `development`, `production`, `test` |
| `EXPO_PUBLIC_ENABLE_AUTH` | Enable authentication | `true` or `false` |
| `EXPO_PUBLIC_ENABLE_GUEST_MODE` | Allow guest access | `true` or `false` |
| `EXPO_PUBLIC_ENABLE_OFFLINE_MODE` | Enable offline mode | `true` or `false` |
| `EXPO_PUBLIC_SHOW_AUTH_LOGS` | Show auth debug logs | `true` or `false` |
| `EXPO_PUBLIC_API_TIMEOUT` | API timeout in ms | `30000` |
| `EXPO_PUBLIC_MAX_RETRY_ATTEMPTS` | Max API retry attempts | `3` |

## Important Notes

- **Never commit `.env` files** to version control
- **Test Mode**: When using Clerk test keys, emails must use format: `your_email+clerk_test@example.com`
- **Restart Metro**: After changing `.env`, restart Metro bundler:
  ```bash
  npx react-native start --reset-cache
  ```

## TypeScript Support

Environment variables are typed in `src/types/env.d.ts`. Update this file when adding new variables.

## Using Environment Variables in Code

```typescript
import { APP_CONFIG } from './config/appConfig';

// Use configuration
console.log(APP_CONFIG.CLERK_PUBLISHABLE_KEY);
console.log(APP_CONFIG.CONVEX_URL);
```

The `appConfig.ts` file provides a centralized configuration with fallbacks and type safety.