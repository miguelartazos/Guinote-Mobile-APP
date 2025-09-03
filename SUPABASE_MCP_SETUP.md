# Supabase MCP Implementation - Complete Setup Guide

## ✅ Fixes Applied

### 1. **MCP Server Configuration**
- Added Supabase MCP server to `.mcp.json`
- Configured with environment variables for URL and service role key
- Uses `@supabase-community/supabase-mcp` package

### 2. **Environment Variable Consistency**
- Fixed inconsistent handling between `@env` module and `getEnvVar()`
- Now uses consistent `@env` module imports
- Added proper TypeScript declarations for `@env` module
- Improved error messages for missing environment variables

### 3. **Enhanced RLS Policies**
- Created migration `13_improved_rls_policies.sql` with granular security rules:
  - Users can only modify their own profiles
  - Room hosts have elevated permissions for their rooms
  - Players can only make moves on their turn
  - Friend relationships are properly scoped
- Added performance indexes for common queries
- Implemented principle of least privilege

### 4. **Exponential Backoff & Error Recovery**
- Added reconnection with exponential backoff (1s → 2s → 4s... max 30s)
- Maximum 10 reconnection attempts before giving up
- Heartbeat monitoring every 30 seconds
- Automatic reconnection on heartbeat timeout (60s)
- Queue processing for actions sent while disconnected
- Proper cleanup of timers on disconnect

### 5. **Type Generation Scripts**
- Added `npm run supabase:types` command for generating TypeScript types
- Created `generate-supabase-types.sh` script with error handling
- Set up `database.types.ts` to re-export generated types with utilities
- Added helper types: `Tables<T>`, `Insertable<T>`, `Updatable<T>`

### 6. **Testing**
- Created comprehensive test suite for reconnection logic
- Tests exponential backoff behavior
- Tests heartbeat monitoring
- Tests queue processing after reconnection
- Tests proper cleanup and timer management

## 📋 Setup Instructions

### 1. Install Supabase CLI
```bash
npm install -g supabase
```

### 2. Configure Environment Variables
Create a `.env` file based on `.env.example`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-ID].supabase.co:5432/postgres
```

### 3. Apply Database Migrations
```bash
# Apply the new RLS policies
npm run supabase:migrate
```

### 4. Generate TypeScript Types
```bash
# Generate types from your Supabase schema
npm run supabase:types
```

### 5. Restart Claude Desktop
After adding the MCP server configuration, restart Claude Desktop to load the new server.

## 🚀 Usage

### Using Supabase MCP in Claude
Once configured, you can use Supabase MCP commands in Claude:
- Query your database directly
- Manage migrations
- Update RLS policies
- Test edge functions

### Type-Safe Database Access
```typescript
import { Tables, Insertable } from './types/database.types';

// Type-safe table rows
const user: Tables<'users'> = await getUser();

// Type-safe inserts
const newRoom: Insertable<'rooms'> = {
  code: 'ABC123',
  host_id: userId,
  status: 'waiting',
};
```

### Reconnection Handling
The MultiplayerGameService now automatically:
- Reconnects with exponential backoff on connection loss
- Monitors connection health via heartbeats
- Queues actions during disconnection
- Processes queued actions after reconnection

## 🔒 Security Improvements

### RLS Policies
- **Users Table**: Can only update own profile
- **Rooms Table**: Only hosts can modify room settings
- **Room Players**: Players can only update their own status
- **Game Moves**: Players can only insert moves on their turn
- **Friends**: Users can only see/modify their own friendships

### Best Practices Implemented
- No direct exposure of service role key in client code
- Proper JWT validation for all RPC functions
- Row-level security on all tables
- Indexed foreign keys for performance

## 📊 Performance Optimizations

### Database Indexes Added
- `idx_users_auth_user_id` - Fast auth user lookups
- `idx_room_players_user_room` - Efficient room membership queries
- `idx_rooms_host_id` - Quick host verification
- `idx_rooms_status_public` - Fast room discovery
- `idx_game_moves_room_id` - Efficient move history queries

### Connection Management
- Lazy loading of Supabase client
- Connection pooling with transaction mode
- Heartbeat monitoring to detect stale connections
- Automatic cleanup of resources on disconnect

## 🧪 Testing

Run the new reconnection tests:
```bash
npm test -- multiplayerGameService.reconnection.spec.ts
```

## 📝 Maintenance

### Regenerate Types
When database schema changes:
```bash
npm run supabase:types
```

### Update RLS Policies
Edit `supabase/migrations/13_improved_rls_policies.sql` and run:
```bash
npm run supabase:migrate
```

### Monitor Connection Health
Check logs for:
- `[MultiplayerGameService] Reconnecting in Xms`
- `[MultiplayerGameService] Connection seems lost`
- `[MultiplayerGameService] Reconnection successful`

## ⚠️ Known Limitations

1. **MCP Server**: Requires Claude Desktop restart after configuration changes
2. **Type Generation**: Requires Supabase CLI and project access
3. **Heartbeat**: 30-second interval may be too long for some use cases
4. **Queue Size**: No limit on queued actions (potential memory issue)

## 🔄 Next Steps

1. Add queue size limits with overflow handling
2. Implement connection quality indicators in UI
3. Add telemetry for connection issues
4. Consider WebSocket compression for large game states
5. Add circuit breaker pattern for repeated failures

## 📚 Resources

- [Supabase MCP Documentation](https://github.com/supabase-community/supabase-mcp)
- [Supabase RLS Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Exponential Backoff Algorithm](https://en.wikipedia.org/wiki/Exponential_backoff)
- [React Native Supabase Guide](https://supabase.com/docs/guides/getting-started/tutorials/with-react-native)