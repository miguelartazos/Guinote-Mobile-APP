# Guiñote Multiplayer Setup Guide

## Overview

This guide explains how to set up the multiplayer functionality for the Guiñote app using Supabase and Clerk.

## Prerequisites

- Supabase account
- Clerk account
- React Native development environment

## 1. Supabase Setup

### Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Save your project URL and anon key

### Run Database Migrations

1. Go to the SQL Editor in your Supabase dashboard
2. Copy and run the contents of `supabase/migrations/001_multiplayer_schema.sql`
3. This will create all necessary tables and functions

### Enable Realtime

1. Go to Database → Replication
2. Enable replication for these tables:
   - `rooms`
   - `room_players`
   - `profiles`

## 2. Clerk Setup

### Create a Clerk Application

1. Go to [https://clerk.com](https://clerk.com)
2. Create a new application
3. Configure authentication methods:
   - Enable Phone Number (SMS)
   - Enable Google OAuth
   - Enable Email Magic Links

### Spanish Localization

1. Go to Customization → Localization
2. Select Spanish (es-ES)
3. Customize the UI texts as needed

### Get API Keys

1. Go to API Keys
2. Copy your Publishable Key

## 3. Environment Configuration

Create a `.env` file in your project root:

```env
# Supabase
EXPO_PUBLIC_SUPABASE_URL=your_supabase_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# Clerk
EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key

# App URLs
EXPO_PUBLIC_APP_URL=https://guinote.app
EXPO_PUBLIC_DEEP_LINK_SCHEME=guinote
```

## 4. Deep Linking Setup

### iOS (ios/guinote2/Info.plist)

Add to your Info.plist:

```xml
<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>guinote</string>
        </array>
    </dict>
</array>
```

### Android (android/app/src/main/AndroidManifest.xml)

Add inside the `<activity>` tag:

```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data android:scheme="guinote" />
</intent-filter>
```

## 5. Contact Permissions

### iOS

Add to Info.plist:

```xml
<key>NSContactsUsageDescription</key>
<string>Guiñote necesita acceso a tus contactos para encontrar amigos que ya juegan.</string>
```

### Android

Already configured in AndroidManifest.xml with:

```xml
<uses-permission android:name="android.permission.READ_CONTACTS" />
```

## 6. Testing Multiplayer

### Local Testing

1. Run the app on multiple simulators/devices
2. Create test accounts using different phone numbers
3. Test room creation and joining

### Test Scenarios

1. **Quick Match**
   - Start searching on 2+ devices
   - Verify players are matched
   - Test AI filling empty slots

2. **Friend Rooms**
   - Create room on device A
   - Join with code on device B
   - Test WhatsApp sharing

3. **Disconnection**
   - Join a game
   - Kill the app
   - Verify AI takeover after 30s

## 7. Production Checklist

- [ ] Set up production Supabase project
- [ ] Configure production Clerk app
- [ ] Update environment variables
- [ ] Enable Supabase RLS policies
- [ ] Set up monitoring
- [ ] Configure rate limiting
- [ ] Test WhatsApp deep links
- [ ] Verify contact sync privacy

## Troubleshooting

### Common Issues

1. **"Sala no encontrada"**
   - Check room code is correct
   - Verify room hasn't expired (24h)
   - Check Supabase connection

2. **Can't see friends**
   - Verify contact permissions
   - Check phone number format
   - Ensure friends have accounts

3. **Realtime not working**
   - Check Supabase realtime is enabled
   - Verify network connection
   - Check RLS policies

### Debug Mode

Enable debug logging:

```typescript
// src/config/supabase.ts
export const supabase = createClient(url, key, {
  global: {
    headers: {
      'X-Debug': 'true',
    },
  },
});
```