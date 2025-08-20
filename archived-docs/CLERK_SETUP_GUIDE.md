# Clerk Authentication Setup Guide

## Current Status ✅

The app is configured with Clerk authentication for both iOS and Android. Here's what's already set up:

### 1. Environment Variables
- **Development keys are already configured** in `.env` and `src/config/appConfig.ts`
- Current Clerk publishable key: `pk_test_dXNlZnVsLW1vc3F1aXRvLTMzLmNsZXJrLmFjY291bnRzLmRldiQ`
- Convex URL: `https://industrious-civet-236.convex.cloud`

### 2. Platform Configuration
- ✅ iOS Info.plist configured with URL scheme `com.guinote2.app`
- ✅ Android Manifest configured with matching URL scheme
- ✅ ClerkProvider implemented with token caching
- ✅ Authentication hook (`useAuth`) syncs users between Clerk and Convex

## Clerk Dashboard Configuration 📋

You need to configure the following in your Clerk Dashboard:

### 1. Go to [Clerk Dashboard](https://dashboard.clerk.com)

### 2. Configure Redirect URLs
Add these URLs in your Clerk application settings:

**For Development:**
- `com.guinote2.app://oauth-redirect`
- `http://localhost:8081/*` (for Expo development)

**For Production:**
- `com.guinote2.app://oauth-redirect`

### 3. Enable Authentication Methods
In the Clerk Dashboard, enable:
- ✉️ Email/Password authentication
- 📱 (Optional) Social logins (Google, Apple, etc.)

### 4. Configure Application Settings
- Application name: "Guiñote"
- Support email: Your support email
- Privacy policy URL: Your privacy policy URL
- Terms of service URL: Your terms URL

## Production Setup 🚀

### 1. Get Production Keys
1. In Clerk Dashboard, switch to production mode
2. Copy your production publishable key
3. Create production environment variables

### 2. Update Environment Variables

Create a `.env.production` file:
```bash
# Clerk Production
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_YOUR_PRODUCTION_KEY

# Environment
EXPO_PUBLIC_ENVIRONMENT=production

# Convex Configuration (if different for production)
EXPO_PUBLIC_CONVEX_URL=https://your-production-convex-url.convex.cloud
```

### 3. Update App Configuration

For production builds, update `src/config/appConfig.ts`:
```typescript
// Use environment-based configuration
export const APP_CONFIG = {
  CLERK_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY || 
    'pk_test_dXNlZnVsLW1vc3F1aXRvLTMzLmNsZXJrLmFjY291bnRzLmRldiQ',
  // ... rest of config
};
```

### 4. Build Commands

**For iOS Production:**
```bash
expo build:ios --release-channel production
```

**For Android Production:**
```bash
expo build:android --release-channel production
```

## Testing Authentication Flow 🧪

### 1. Test OAuth Redirect
```bash
# iOS Simulator
xcrun simctl openurl booted "com.guinote2.app://oauth-redirect"

# Android Emulator
adb shell am start -W -a android.intent.action.VIEW -d "com.guinote2.app://oauth-redirect"
```

### 2. Verify Authentication Flow
1. Launch the app
2. Navigate to Login/Register screen
3. Test email/password signup
4. Test social login (if configured)
5. Verify user is synced to Convex

## Troubleshooting 🔧

### Common Issues:

1. **"Invalid redirect URL" error**
   - Ensure `com.guinote2.app://oauth-redirect` is added to Clerk Dashboard
   - Check that URL scheme matches in Info.plist/AndroidManifest.xml

2. **OAuth not working on iOS**
   - Run `cd ios && pod install`
   - Clean build: `cd ios && xcodebuild clean`
   - Rebuild the app

3. **OAuth not working on Android**
   - Clean build: `cd android && ./gradlew clean`
   - Rebuild the app

4. **User not syncing to Convex**
   - Check Convex function logs
   - Verify `syncUser` mutation is deployed
   - Check network connectivity

## Security Best Practices 🔒

1. **Never commit production keys** to version control
2. **Use environment variables** for all sensitive data
3. **Enable MFA** in Clerk Dashboard for admin accounts
4. **Regularly rotate** production keys
5. **Monitor** authentication logs in Clerk Dashboard

## Additional Resources 📚

- [Clerk React Native Docs](https://clerk.com/docs/quickstarts/react-native)
- [Convex Auth Docs](https://docs.convex.dev/auth)
- [Expo Environment Variables](https://docs.expo.dev/guides/environment-variables/)