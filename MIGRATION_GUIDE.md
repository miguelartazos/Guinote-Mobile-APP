# Supabase Migration Guide

## Overview
This guide explains how to migrate from Convex + Clerk to Supabase for the Guiñote game app.

## Current Status

### ✅ Completed
- Supabase client setup and configuration
- Database schema with all tables
- Row Level Security (RLS) policies
- Database functions for game operations
- Auth provider (SupabaseAuthProvider)
- All core hooks migrated:
  - useSupabaseGame
  - useSupabaseRooms
  - useSupabaseMatchmaking
  - useSupabaseVoice
  - useSupabaseFriends
  - useSupabaseStatistics
- Feature flag system for gradual migration
- Unified hooks that switch between Convex and Supabase

### 🚧 In Progress
- Screen updates to use unified hooks
- Testing and validation

### 📋 TODO
- Create Supabase project and get credentials
- Run SQL migrations in Supabase
- Complete screen migrations
- Remove Convex and Clerk dependencies

## Step-by-Step Migration

### 1. Create Supabase Project

1. Go to https://supabase.com and create a new project
2. Note your project URL and anon key
3. Update `.env` file:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Run Database Migrations

In your Supabase dashboard SQL editor, run the migrations in order:

1. `supabase/migrations/01_initial_schema.sql` - Creates all tables
2. `supabase/migrations/02_rls_policies.sql` - Sets up security policies
3. `supabase/migrations/03_game_functions.sql` - Creates game logic functions
4. `supabase/migrations/04_realtime_setup.sql` - Configures realtime

### 3. Create Storage Buckets

In Supabase Storage, create a bucket named `voice-messages` for voice recordings.

### 4. Enable Feature Flags

The app uses feature flags to gradually migrate. In development, all Supabase features are enabled by default.

To control features manually:
```typescript
import { featureFlags } from './src/config/featureFlags';

// Enable specific features
await featureFlags.setFlag('useSupabaseAuth', true);
await featureFlags.setFlag('useSupabaseRooms', true);

// Or enable all at once
await featureFlags.setFlags({
  useSupabaseAuth: true,
  useSupabaseRooms: true,
  useSupabaseGame: true,
  useSupabaseMatchmaking: true,
  useSupabaseFriends: true,
  useSupabaseVoice: true,
  useSupabaseStatistics: true,
});
```

### 5. Test Migration

1. **Auth Flow**: Test login/register with Supabase Auth
2. **Room Creation**: Create and join rooms
3. **Game Play**: Test game state synchronization
4. **Real-time**: Verify real-time updates work
5. **Voice Messages**: Test voice recording and playback

### 6. Data Migration (if needed)

If you have existing data in Convex:

1. Export data from Convex
2. Transform to match Supabase schema
3. Import using Supabase's CSV import or custom script

### 7. Complete Migration

Once everything is working:

1. Remove Convex dependencies:
```bash
npm uninstall convex
rm -rf convex/
```

2. Remove Clerk dependencies:
```bash
npm uninstall @clerk/clerk-expo
```

3. Clean up old files:
- Delete `src/providers/ClerkProvider.tsx`
- Delete `src/providers/ConvexClientProvider.tsx`
- Delete all `src/hooks/useConvex*.ts` files
- Delete unified hooks if no longer needed

## Architecture Changes

### Authentication
- **Before**: Clerk (external service) → Convex
- **After**: Supabase Auth (integrated)

### Database
- **Before**: Convex (NoSQL-like, reactive)
- **After**: PostgreSQL with RLS

### Real-time
- **Before**: Convex subscriptions
- **After**: Supabase Realtime (Postgres Changes + Presence)

### File Storage
- **Before**: Convex storage
- **After**: Supabase Storage

## Key Differences

### 1. Authentication
Supabase Auth is integrated, reducing complexity and cost. User sessions are persisted in AsyncStorage.

### 2. Database Operations
- Convex uses mutations/queries
- Supabase uses RPC functions for complex operations
- Direct table access for simple CRUD

### 3. Real-time Updates
- Convex: Automatic reactive queries
- Supabase: Explicit channel subscriptions with presence

### 4. Optimistic Updates
Supabase implementation includes optimistic updates with version control for conflict resolution.

## Performance Considerations

1. **Latency**: Supabase may have slightly higher latency for simple operations but better for complex queries
2. **Real-time**: Use broadcast channels for low-latency game moves
3. **Caching**: Implement client-side caching for frequently accessed data
4. **Connection Pooling**: Supabase handles this automatically

## Troubleshooting

### Common Issues

1. **RLS Policies Blocking Access**
   - Check that policies are correctly set up
   - Verify user is authenticated
   - Use service key for admin operations

2. **Real-time Not Working**
   - Ensure tables are added to publication
   - Check WebSocket connection
   - Verify RLS policies allow SELECT

3. **Auth Issues**
   - Check redirect URLs for OAuth
   - Verify email templates in Supabase
   - Ensure AsyncStorage is working

## Rollback Plan

If issues arise, you can quickly rollback:

1. Set all feature flags to false
2. The app will revert to using Convex/Clerk
3. Fix issues in Supabase implementation
4. Re-enable features one by one

## Support

For Supabase-specific issues:
- Documentation: https://supabase.com/docs
- Discord: https://discord.supabase.com
- GitHub: https://github.com/supabase/supabase

## Next Steps

1. Monitor performance metrics
2. Gather user feedback
3. Optimize queries and indexes
4. Consider adding Edge Functions for complex logic
5. Implement backup and disaster recovery