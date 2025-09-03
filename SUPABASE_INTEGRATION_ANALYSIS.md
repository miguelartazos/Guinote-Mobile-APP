# Supabase Integration Analysis for Guiñote+ Multiplayer

## Executive Summary
After analyzing the provided Supabase setup feedback and your current implementation, I've identified several critical gaps and inconsistencies that need to be addressed for a fully functional multiplayer system.

## 🔍 Key Findings

### 1. ✅ Session Refresh Pattern (Partially Implemented)
**Current Status:** INCONSISTENT

#### Correctly Implemented:
- `CREATE_ROOM` action in `useUnifiedRooms.ts:97`
- `JOIN_ROOM` action in `useUnifiedRooms.ts:133`

#### Missing Session Refresh:
- ❌ `LEAVE_ROOM` action (line 151)
- ❌ `ADD_AI_PLAYER` action (line 160)
- ❌ `UPDATE_READY_STATUS` action (line 171)
- ❌ `START_GAME` action (line 179)
- ❌ `get_online_friends` in `useUnifiedFriends.ts:436`

**Impact:** These RPC calls may fail with authentication errors when session tokens expire.

### 2. 🔴 Database Schema Mismatch
**Current Status:** CRITICAL MISMATCH

#### Schema Differences:
| SQL Setup | Your database.types.ts | Impact |
|-----------|------------------------|---------|
| `users` table | `profiles` table | RPC functions expect `users` table |
| `users.id` | N/A | RPC functions reference this |
| `users.auth_user_id` | `profiles.user_id` | Different column name |
| `room_players.user_id` | `room_players.player_id` | Column name mismatch |
| `room_players.team` (INTEGER) | `room_players.team_id` (STRING) | Type mismatch |
| N/A | `room_players.is_bot` | Missing in SQL |

### 3. 🔴 Missing RPC Functions
**Current Status:** CRITICAL

#### Functions Called but Not in SQL:
1. **`add_ai_player`** (useUnifiedRooms.ts:160)
   - Parameters: p_room_id, p_difficulty, p_personality
   - Required for AI player functionality

2. **`get_online_friends`** (useUnifiedFriends.ts:436)
   - Parameters: p_user_id
   - Required for friends list functionality

### 4. ⚠️ RPC Response Handling
**Current Status:** PARTIALLY CORRECT

#### Good Pattern (useUnifiedRooms.ts):
```typescript
if (data && typeof data === 'object' && 'success' in data) {
  if (!data.success) {
    throw new Error(data.error || 'Failed to create room on server');
  }
}
```

#### Missing Error Handling:
- Other RPC calls don't check for success/error structure
- No consistent error reporting

## 📋 Comprehensive Fix Checklist

### Phase 1: Database Schema Alignment
- [ ] Decide on `users` vs `profiles` table
- [ ] Align column names (`user_id` vs `player_id`, `team` vs `team_id`)
- [ ] Add missing columns for AI player support
- [ ] Update database.types.ts to match actual schema

### Phase 2: Missing RPC Functions
Create these SQL functions:

```sql
-- Add AI Player Function
CREATE OR REPLACE FUNCTION public.add_ai_player(
    p_room_id UUID,
    p_difficulty TEXT,
    p_personality TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_position INTEGER;
    v_team INTEGER;
    v_ai_id UUID;
    v_current_players INTEGER;
    v_max_players INTEGER;
BEGIN
    -- Check room exists and isn't full
    SELECT current_players, max_players
    INTO v_current_players, v_max_players
    FROM rooms
    WHERE id = p_room_id AND status = 'waiting';
    
    IF NOT FOUND THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Room not found or already started'
        );
    END IF;
    
    IF v_current_players >= v_max_players THEN
        RETURN json_build_object(
            'success', false,
            'error', 'Room is full'
        );
    END IF;
    
    -- Generate AI player ID and position
    v_ai_id := gen_random_uuid();
    v_position := v_current_players + 1;
    v_team := CASE WHEN v_position IN (1, 3) THEN 1 ELSE 2 END;
    
    -- Insert AI player
    INSERT INTO room_players (
        room_id, user_id, position, team, 
        is_ready, is_ai, ai_difficulty, ai_personality
    )
    VALUES (
        p_room_id, v_ai_id, v_position, v_team,
        true, true, p_difficulty, p_personality
    );
    
    -- Update room player count
    UPDATE rooms
    SET current_players = current_players + 1
    WHERE id = p_room_id;
    
    RETURN json_build_object(
        'success', true,
        'ai_player_id', v_ai_id
    );
END;
$$;

-- Get Online Friends Function
CREATE OR REPLACE FUNCTION public.get_online_friends(p_user_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN json_agg(row_to_json(friends))
    FROM (
        SELECT 
            u.id as friend_id,
            u.username,
            u.display_name,
            p.avatar_url,
            p.ranking as elo,
            p.is_online
        FROM friendships f
        JOIN users u ON u.id = f.friend_id
        LEFT JOIN profiles p ON p.user_id = u.auth_user_id
        WHERE f.user_id = p_user_id
        AND f.status = 'accepted'
        AND p.is_online = true
    ) friends;
END;
$$;
```

### Phase 3: Session Refresh Implementation
Add session refresh to all RPC calls:

- [ ] Fix `LEAVE_ROOM` action
- [ ] Fix `ADD_AI_PLAYER` action  
- [ ] Fix `UPDATE_READY_STATUS` action
- [ ] Fix `START_GAME` action
- [ ] Fix `get_online_friends` in useUnifiedFriends.ts

### Phase 4: Error Handling Standardization
- [ ] Implement consistent success/error checking for all RPC responses
- [ ] Add proper error logging with context
- [ ] Implement retry logic for transient failures

### Phase 5: Testing Verification
- [ ] Test room creation with expired session
- [ ] Test room joining with expired session
- [ ] Test AI player addition
- [ ] Test ready status updates
- [ ] Test game start functionality
- [ ] Test friends list retrieval
- [ ] Test offline queue processing

## 🚀 Recommended Implementation Order

1. **URGENT**: Add session refresh to all RPC calls
2. **CRITICAL**: Resolve database schema mismatches
3. **HIGH**: Create missing RPC functions
4. **MEDIUM**: Standardize error handling
5. **LOW**: Add comprehensive logging

## 💡 Key Insight
The main authentication issue you discovered (session tokens expiring) is correctly fixed for CREATE_ROOM and JOIN_ROOM, but needs to be applied consistently across all RPC calls. This is a common Supabase pattern that's easy to miss.

## 📝 Quick Fix Template
For each RPC call, use this pattern:

```typescript
// Refresh session before RPC call
const { data: refreshData, error: refreshError } = await client.auth.refreshSession();
if (refreshError || !refreshData?.session) {
  const { data: sessionData, error: sessionError } = await client.auth.getSession();
  if (sessionError || !sessionData?.session) {
    throw new Error('Not authenticated. Please sign in again.');
  }
}

// Make RPC call
const { data, error } = await client.rpc('function_name', params);

// Check response
if (error) throw error;
if (data && !data.success) {
  throw new Error(data.error || 'RPC call failed');
}
```

## 🔒 Security Considerations
- All RPC functions use `SECURITY DEFINER` - ensure proper auth checks
- `ensure_user_exists` function helps prevent orphaned auth users
- RLS policies properly configured for row-level security

## Next Steps
1. Apply the session refresh pattern to all RPC calls immediately
2. Verify your actual Supabase database schema matches either the SQL setup or your types
3. Create the missing RPC functions
4. Test thoroughly with session expiration scenarios