# Supabase Migration Execution Guide

## Overview

This guide walks you through executing the Supabase SQL migrations in the correct order. The migrations create a complete database schema for the Guiñote card game.

## Prerequisites

- Supabase CLI installed (`npm install supabase --save-dev` or `npm install -g supabase`)
- Access to your Supabase project
- Database connection configured

## Migration Files Created

I've created separate SQL files for easier execution:

1. `/Users/maiky/Documents/guinote2/run_migrations.sql` - Initial schema (Step 1)
2. `/Users/maiky/Documents/guinote2/migration_step_2_rls.sql` - RLS policies (Step 2)
3. `/Users/maiky/Documents/guinote2/migration_step_3_functions.sql` - Game functions (Step 3)
4. `/Users/maiky/Documents/guinote2/migration_step_4_fixes.sql` - Fixes (Step 4)

## Execution Methods

### Method 1: Using Supabase CLI (Recommended)

```bash
cd /Users/maiky/Documents/guinote2

# Check current database state
supabase db diff --check

# Run all migrations at once
supabase db push

# OR run them individually for better control:

# Step 1: Initial schema
supabase db push --file run_migrations.sql

# Step 2: RLS policies
supabase db push --file migration_step_2_rls.sql

# Step 3: Game functions
supabase db push --file migration_step_3_functions.sql

# Step 4: Fixes
supabase db push --file migration_step_4_fixes.sql
```

### Method 2: Via Supabase Dashboard SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Execute each file content in order:

   **Step 1**: Copy and run content from `run_migrations.sql`
   **Step 2**: Copy and run content from `migration_step_2_rls.sql`
   **Step 3**: Copy and run content from `migration_step_3_functions.sql`
   **Step 4**: Copy and run content from `migration_step_4_fixes.sql`

### Method 3: Using psql or another SQL client

```bash
# Connect to your Supabase database
psql "postgresql://[user]:[password]@[host]:[port]/[database]"

# Execute each migration file
\i /Users/maiky/Documents/guinote2/run_migrations.sql
\i /Users/maiky/Documents/guinote2/migration_step_2_rls.sql
\i /Users/maiky/Documents/guinote2/migration_step_3_functions.sql
\i /Users/maiky/Documents/guinote2/migration_step_4_fixes.sql
```

## What Each Migration Does

### Step 1: Initial Schema (`run_migrations.sql`)

- Enables required PostgreSQL extensions (uuid-ossp, pgcrypto)
- Creates all main tables:
  - `users` - User profiles and authentication
  - `rooms` - Game room management
  - `room_players` - Players in rooms
  - `game_states` - Current game state storage
  - `voice_messages` - Voice message storage
  - `matchmaking_queue` - Matchmaking system
  - `friendships` - Friend relationships
  - `game_stats` - Game statistics and leaderboards
- Creates indexes for performance
- Sets up triggers for updated_at fields

### Step 2: RLS Policies (`migration_step_2_rls.sql`)

- Enables Row Level Security on all tables
- Creates security policies ensuring:
  - Users can only access their own data
  - Room members can access room-related data
  - Proper access control for game states and messages
- Creates helper views for user management

### Step 3: Game Functions (`migration_step_3_functions.sql`)

- `generate_room_code()` - Generates unique 6-character room codes
- `create_room()` - Creates new game rooms
- `join_room()` - Allows players to join existing rooms
- `leave_room()` - Handles player leaving rooms
- `toggle_ready()` - Manages player ready status
- `initialize_game_state()` - Sets up initial game state
- `start_game()` - Starts a new game
- `play_card()` - Handles card play actions (simplified)
- `add_ai_player()` - Placeholder for AI players (disabled)

### Step 4: Fixes (`migration_step_4_fixes.sql`)

- Adds unique constraint ensuring one game state per room
- Creates `end_trick()` function for atomic trick completion
- Properly disables AI player functionality

## Verification

After running all migrations, verify the setup:

```sql
-- Check that all tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Check that RLS is enabled
SELECT schemaname, tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public';

-- Check functions were created
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_type = 'FUNCTION';

-- Test basic functionality
SELECT generate_room_code();
```

Expected tables:

- friendships
- game_states
- game_stats
- matchmaking_queue
- room_players
- rooms
- users
- voice_messages

## Error Handling

If you encounter errors:

1. **Permission errors**: Ensure you have proper database privileges
2. **Constraint violations**: Check if tables already exist - you may need to drop/recreate
3. **Function conflicts**: Previous function definitions may conflict - the scripts handle most of these
4. **Version conflicts**: If using optimistic concurrency, ensure version numbers match

## Next Steps

After successful migration:

1. Test basic room creation: `SELECT create_room('casual', true);`
2. Verify RLS policies are working
3. Test game functions with your application
4. Set up realtime subscriptions if needed
5. Configure any additional indexes based on query patterns

## Rollback

If you need to rollback:

```sql
-- Drop all functions
DROP FUNCTION IF EXISTS generate_room_code();
DROP FUNCTION IF EXISTS create_room(TEXT, BOOLEAN);
-- ... (continue for all functions)

-- Drop all tables (be careful!)
DROP TABLE IF EXISTS game_stats CASCADE;
DROP TABLE IF EXISTS voice_messages CASCADE;
DROP TABLE IF EXISTS matchmaking_queue CASCADE;
DROP TABLE IF EXISTS friendships CASCADE;
DROP TABLE IF EXISTS game_states CASCADE;
DROP TABLE IF EXISTS room_players CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;
DROP TABLE IF EXISTS users CASCADE;
```

## Support

If you encounter issues during migration:

1. Check Supabase logs in the dashboard
2. Verify your database connection
3. Ensure you have the necessary permissions
4. Check for conflicting existing schema

The migrations are designed to be idempotent where possible using `IF NOT EXISTS` and `CREATE OR REPLACE` statements.
