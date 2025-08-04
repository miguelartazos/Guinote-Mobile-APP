# Phase 2 Deployment Guide - Online Multiplayer

## Overview

This guide covers the deployment and setup of Phase 2 features for the Guiñote game, which adds online multiplayer functionality using Supabase and Clerk.

## Prerequisites

- Node.js 18+ and npm installed
- React Native development environment setup
- Supabase account and project
- Clerk account and application
- iOS/Android development certificates

## Environment Setup

### 1. Create Environment File

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

Required environment variables:
```
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your-key
```

### 2. Supabase Setup

#### Create a new Supabase project

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Create a new project
3. Save the project URL and anon key

#### Run Database Migrations

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

The migrations create:
- User profiles table
- Rooms and room players tables
- Game moves and statistics tables
- Friend system tables
- Matchmaking queue
- Required database functions
- Row Level Security policies

#### Enable Realtime

1. Go to your Supabase dashboard
2. Navigate to Database → Replication
3. Enable replication for these tables:
   - `rooms`
   - `room_players`
   - `game_moves`

### 3. Clerk Setup

#### Configure Authentication

1. Go to [Clerk Dashboard](https://dashboard.clerk.com)
2. Create a new application
3. Enable these authentication methods:
   - Phone number with SMS
   - Google OAuth

#### Set up Supabase JWT Template

1. In Clerk Dashboard, go to JWT Templates
2. Create a new template named "supabase"
3. Use this configuration:

```json
{
  "aud": "authenticated",
  "role": "authenticated",
  "email": "{{user.primary_email_address}}",
  "phone": "{{user.primary_phone_number}}",
  "app_metadata": {
    "provider": "clerk"
  },
  "sub": "{{user.id}}"
}
```

#### Configure Supabase to accept Clerk JWTs

1. In Supabase Dashboard, go to Authentication → Providers
2. Add a new provider with:
   - Provider: Custom
   - JWT Secret: Your Clerk JWT signing key
   - JWT Audience: "authenticated"

## Development

### Install Dependencies

```bash
npm install
```

### iOS Setup

```bash
cd ios
pod install
cd ..
```

### Run Development Server

```bash
# Start Metro bundler
npm start

# Run on iOS
npm run ios

# Run on Android
npm run android
```

## Testing

### Run Tests

```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- src/services/room/roomService.spec.ts
```

### Test Online Features

1. Create test accounts in Clerk
2. Use the test phone numbers provided by Clerk
3. Test matchmaking with multiple devices/simulators

## Production Deployment

### 1. Build Configuration

Update `app.json` with production values:

```json
{
  "expo": {
    "name": "Guiñote Pro",
    "version": "2.0.0",
    "ios": {
      "bundleIdentifier": "com.yourcompany.guinote",
      "buildNumber": "2.0.0"
    },
    "android": {
      "package": "com.yourcompany.guinote",
      "versionCode": 200
    }
  }
}
```

### 2. Build for iOS

```bash
# Using EAS Build
eas build --platform ios --profile production

# Or locally
npx react-native run-ios --configuration Release
```

### 3. Build for Android

```bash
# Using EAS Build
eas build --platform android --profile production

# Or locally
cd android
./gradlew assembleRelease
```

### 4. Database Security

Before going to production:

1. Review and tighten RLS policies
2. Set up database backups
3. Configure rate limiting
4. Enable Supabase logs

### 5. Monitoring

Set up monitoring for:
- Database performance
- Real-time connections
- Authentication failures
- Game completion rates

## Troubleshooting

### Common Issues

#### Connection Issues
- Check Supabase project is not paused
- Verify environment variables are correct
- Check network connectivity

#### Authentication Errors
- Verify Clerk JWT template is configured
- Check Supabase JWT secret matches Clerk's
- Ensure phone number is verified in Clerk

#### Real-time Not Working
- Check table replication is enabled
- Verify RLS policies allow SELECT
- Check Supabase real-time quotas

### Debug Mode

Enable debug logging:

```typescript
// In src/config/env.ts
export const env = {
  // ...
  debug: __DEV__,
};
```

## Maintenance

### Regular Tasks

1. **Database Cleanup** (weekly)
   ```sql
   -- Remove abandoned rooms
   SELECT cleanup_abandoned_rooms();
   ```

2. **Monitor Usage**
   - Check Supabase dashboard for usage
   - Monitor Clerk authentication metrics
   - Review game completion rates

3. **Update Dependencies** (monthly)
   ```bash
   npm update
   npm audit fix
   ```

## Support

For issues or questions:
- Supabase: https://supabase.com/docs
- Clerk: https://clerk.com/docs
- React Native: https://reactnative.dev/docs/