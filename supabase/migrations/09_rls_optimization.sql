-- RLS Optimization Migration
-- Optimizes Row Level Security policies for better performance

-- Drop existing policies to replace with optimized versions
DO $$
BEGIN
  -- Drop existing room update policy if it exists
  DROP POLICY IF EXISTS rooms_update_host ON rooms;
  DROP POLICY IF EXISTS room_update ON rooms;
END $$;

DO $$
BEGIN
  -- Drop existing game state read policy if it exists  
  DROP POLICY IF EXISTS game_states_member_select ON game_states;
  DROP POLICY IF EXISTS game_state_read ON game_states;
END $$;

-- Optimized room update policy - host only
-- More restrictive and efficient than the previous version
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'rooms' 
    AND policyname = 'room_update'
  ) THEN
    CREATE POLICY room_update ON rooms
      FOR UPDATE 
      USING (
        EXISTS(
          SELECT 1 FROM users u 
          WHERE u.id = rooms.host_id 
          AND u.auth_user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS(
          SELECT 1 FROM users u 
          WHERE u.id = rooms.host_id 
          AND u.auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Optimized game state read policy - room members only
-- Uses efficient subquery with proper indexing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'game_states' 
    AND policyname = 'game_state_read'
  ) THEN
    CREATE POLICY game_state_read ON game_states
      FOR SELECT
      USING (
        room_id IN (
          SELECT rp.room_id 
          FROM room_players rp
          JOIN users u ON u.id = rp.user_id
          WHERE u.auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Performance indexes for RLS policy lookups
-- These indexes specifically optimize the subqueries used in policies

-- Index for efficient auth.uid() lookups on rooms
CREATE INDEX IF NOT EXISTS idx_rooms_host_id ON rooms(host_id);

-- Index for efficient room_players subquery in game_state_read policy
CREATE INDEX IF NOT EXISTS idx_room_players_user_room ON room_players(user_id, room_id);

-- Index for game_states room_id lookups
CREATE INDEX IF NOT EXISTS idx_game_states_room_id ON game_states(room_id);

-- Additional optimization: partial index for active rooms
CREATE INDEX IF NOT EXISTS idx_rooms_active ON rooms(id, host_id) 
  WHERE status IN ('waiting', 'playing');

-- Index for efficient user auth lookups
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);