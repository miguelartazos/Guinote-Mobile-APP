# Dual-Mode Environment Setup

## Overview

This app supports **dual-mode operation**:

- **Offline Mode** (default): No authentication required, all data stored locally
- **Online Mode** (opt-in): Supabase authentication and real-time features

## Current Status

✅ **Offline mode is the default** - The app works without any authentication or network connection
🔧 **Online mode is ready but disabled** - Enable via feature flags when ready to test

## Quick Start

### 1. Environment Variables

The `.env` file is already created with the Supabase configuration.

**⚠️ SECURITY NOTE**: The current keys in `.env` should be regenerated for production use.

### 2. How the Dual-Mode Works

#### Offline Mode (Default)

- All Supabase feature flags are OFF
- `useAuth` hook returns a mock offline user
- No network requests are made
- Perfect for development and testing

#### Online Mode (When Ready)

To enable online features:

1. **Test connection first**:

   ```bash
   npm run test:supabase
   ```

2. **Enable specific features** in `src/config/featureFlags.ts`:

   ```typescript
   const DEVELOPMENT_FLAGS: FeatureFlags = {
     useSupabaseAuth: true, // Enable auth
     useSupabaseRooms: true, // Enable rooms
     // ... enable others as needed
   };
   ```

3. **The app automatically**:
   - Switches `useAuth` to Supabase mode when `useSupabaseAuth` is true
   - Activates AppState auto-refresh when ANY Supabase feature is on
   - Loads Supabase client only when needed

## Architecture

### Key Components

1. **`src/config/envConfig.ts`**

   - Reads from `process.env.EXPO_PUBLIC_*` variables
   - Has temporary fallbacks for smooth transition (remove in production)

2. **`src/hooks/useAuth.ts`**

   - Checks `useSupabaseAuth` feature flag
   - Returns offline user when flag is false
   - Switches to Supabase auth when flag is true

3. **`src/providers/SupabaseLifecycleProvider.tsx`**

   - Only activates when Supabase features are enabled
   - Handles AppState token auto-refresh
   - Prevents loading Supabase in offline mode

4. **`src/lib/supabase.ts`**
   - Isolated Supabase client configuration
   - Includes `processLock` for token refresh safety
   - Only imported when Supabase features are active

## Testing Workflow

### Phase 1: Offline Testing (Current)

```bash
# Just run the app - everything works offline
npm start
npm run ios  # or android
```

### Phase 2: Connection Testing

```bash
# Test Supabase connection without enabling features
node src/utils/testSupabaseConnection.js
```

### Phase 3: Incremental Feature Testing

Enable ONE feature at a time:

1. **Test Rooms**: Set `useSupabaseRooms: true`
2. **Test Auth**: Set `useSupabaseAuth: true`
3. **Test Game**: Set `useSupabaseGame: true`
4. Continue with other features...

## Security Considerations

### ⚠️ IMPORTANT: Before Production

1. **Regenerate Supabase keys**:

   - Go to Supabase Dashboard > Settings > API
   - Regenerate both URL and anon key
   - Update `.env` file

2. **Remove hardcoded fallbacks**:

   - In `src/config/envConfig.ts`, remove the fallback values
   - These are only for development convenience

3. **Enable RLS policies**:
   - Run all migrations in Supabase Dashboard
   - Verify Row Level Security is working

## Troubleshooting

### App crashes on startup

- Check `.env` file exists and has correct values
- Ensure all Supabase flags are OFF in development

### Supabase connection fails

- Run `node src/utils/testSupabaseConnection.js`
- Check internet connection
- Verify Supabase project is active

### Auth not working

- Ensure `useSupabaseAuth` flag is true
- Check Supabase Dashboard for user records
- Verify RLS policies allow user operations

## Next Steps

1. **Complete offline testing** first
2. **Run Supabase migrations** when ready for online
3. **Enable features incrementally**
4. **Test each feature thoroughly** before enabling the next
5. **Deploy with confidence** knowing offline mode always works

## Benefits of This Approach

✅ **No authentication barriers** during development  
✅ **Gradual migration** from offline to online  
✅ **Feature flag control** for safe testing  
✅ **Performance optimized** - Supabase only loads when needed  
✅ **Security focused** - Keys in env vars, RLS ready  
✅ **Fallback ready** - Offline mode always available
