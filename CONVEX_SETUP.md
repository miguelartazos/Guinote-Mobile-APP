# Convex Setup Instructions

## Migration from Socket.io to Convex is Complete! 🎉

All the code has been migrated from Socket.io to Convex. Here's what needs to be done to complete the setup:

## Required Steps

### 1. Initialize Convex Project

Run these commands in order:

```bash
# Login to Convex (opens browser)
npx convex login

# Initialize the project
npx convex init

# When prompted:
# - Select "Create a new project"
# - Choose a project name (e.g., "guinote-game")
# - Select your team
```

### 2. Deploy Convex Functions

```bash
# Start Convex dev server
npx convex dev

# This will:
# - Generate TypeScript types in convex/_generated/
# - Deploy your functions to Convex
# - Give you a CONVEX_URL (looks like https://[your-project].convex.cloud)
```

### 3. Update Environment Variables

Update your `.env` file with the Convex URL from step 2:

```env
# Replace with your actual Convex URL
EXPO_PUBLIC_CONVEX_URL=https://[your-project].convex.cloud
```

### 4. Configure Clerk Webhook (Optional but Recommended)

To sync Clerk users with Convex:

1. Go to your Clerk dashboard
2. Navigate to Webhooks
3. Add a new endpoint: `<CONVEX_URL>/clerk`
4. Select these events:
   - `user.created`
   - `user.updated`

### 5. Run the App

```bash
# iOS
npx react-native run-ios

# Android
npx react-native run-android
```

## What Was Changed

### Removed
- ❌ Socket.io server (`/server` directory)
- ❌ Socket.io client code
- ❌ Network service using Socket.io
- ❌ Old matchmaking hooks
- ❌ Redis/MongoDB dependencies

### Added
- ✅ Convex schema and functions
- ✅ Real-time game state with Convex
- ✅ Convex-based matchmaking
- ✅ AI player system in Convex
- ✅ Voice message handling
- ✅ Presence tracking
- ✅ Authentication sync with Clerk

### Updated
- 📝 QuickMatchScreen to use Convex hooks
- 📝 Game hooks to use Convex queries/mutations
- 📝 Environment configuration

## Architecture Overview

```
┌─────────────────┐     ┌─────────────────┐
│  React Native   │────▶│     Convex      │
│      App        │◀────│    Backend      │
└─────────────────┘     └─────────────────┘
        │                        │
        │                        │
        ▼                        ▼
┌─────────────────┐     ┌─────────────────┐
│     Clerk       │     │   Convex DB     │
│     Auth        │     │  (Game State)   │
└─────────────────┘     └─────────────────┘
```

## Next Steps

After completing the setup:

1. Test multiplayer functionality
2. Verify AI players work correctly
3. Test voice messages
4. Monitor Convex dashboard for any issues

## Troubleshooting

### TypeScript Errors
**IMPORTANT**: You will see TypeScript errors about missing `./_generated` files until you run `npx convex dev`. This is normal! The Convex CLI generates these files when you first deploy your functions.

To fix TypeScript errors:
1. Complete steps 1-2 above (login and init)
2. Run `npx convex dev` to generate the files
3. TypeScript errors will disappear

### Authentication Issues
Make sure your Clerk publishable key is correctly set in `.env`.

### Multiplayer Not Working
1. Check Convex dashboard for errors
2. Verify CONVEX_URL is set correctly
3. Check browser console for WebSocket connection issues

## Support

- [Convex Documentation](https://docs.convex.dev)
- [Clerk Documentation](https://clerk.com/docs)
- [React Native Documentation](https://reactnative.dev)