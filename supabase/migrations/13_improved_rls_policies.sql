-- Improved RLS Policies for Better Security
-- This migration enhances Row Level Security with more granular controls

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS users_select ON users;
DROP POLICY IF EXISTS users_insert ON users;
DROP POLICY IF EXISTS users_update ON users;
DROP POLICY IF EXISTS rooms_select ON rooms;
DROP POLICY IF EXISTS rooms_insert ON rooms;
DROP POLICY IF EXISTS rooms_update ON rooms;
DROP POLICY IF EXISTS room_players_select ON room_players;
DROP POLICY IF EXISTS room_players_insert ON room_players;
DROP POLICY IF EXISTS room_players_update ON room_players;
DROP POLICY IF EXISTS room_players_delete ON room_players;
DROP POLICY IF EXISTS game_moves_select ON game_moves;
DROP POLICY IF EXISTS game_moves_insert ON game_moves;

-- ========================================
-- USERS TABLE POLICIES
-- ========================================

-- Users can view all users (for friend lists and matchmaking)
CREATE POLICY users_select_all ON users
  FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Users can only insert their own profile
CREATE POLICY users_insert_own ON users
  FOR INSERT
  WITH CHECK (auth_user_id = auth.uid());

-- Users can only update their own profile
CREATE POLICY users_update_own ON users
  FOR UPDATE
  USING (auth_user_id = auth.uid())
  WITH CHECK (auth_user_id = auth.uid());

-- ========================================
-- ROOMS TABLE POLICIES
-- ========================================

-- Users can view public rooms and rooms they're in
CREATE POLICY rooms_select_accessible ON rooms
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND (
      is_public = TRUE OR
      EXISTS (
        SELECT 1 FROM room_players rp
        JOIN users u ON u.id = rp.user_id
        WHERE rp.room_id = rooms.id 
        AND u.auth_user_id = auth.uid()
      )
    )
  );

-- Users can create rooms (host_id will be set via ensure_user_exists)
CREATE POLICY rooms_insert_authenticated ON rooms
  FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = host_id 
      AND auth_user_id = auth.uid()
    )
  );

-- Only room host can update room settings
CREATE POLICY rooms_update_host_only ON rooms
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = host_id 
      AND auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = host_id 
      AND auth_user_id = auth.uid()
    )
  );

-- ========================================
-- ROOM_PLAYERS TABLE POLICIES
-- ========================================

-- Users can view players in rooms they can access
CREATE POLICY room_players_select_accessible ON room_players
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM rooms r
      WHERE r.id = room_players.room_id
      AND (
        r.is_public = TRUE OR
        EXISTS (
          SELECT 1 FROM room_players rp2
          JOIN users u ON u.id = rp2.user_id
          WHERE rp2.room_id = r.id 
          AND u.auth_user_id = auth.uid()
        )
      )
    )
  );

-- Users can add themselves to rooms (via join_room function)
CREATE POLICY room_players_insert_self ON room_players
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = user_id 
      AND auth_user_id = auth.uid()
    )
  );

-- Users can update their own player status
CREATE POLICY room_players_update_own ON room_players
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = user_id 
      AND auth_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = user_id 
      AND auth_user_id = auth.uid()
    )
  );

-- Users can remove themselves from rooms
CREATE POLICY room_players_delete_own ON room_players
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = user_id 
      AND auth_user_id = auth.uid()
    )
  );

-- Host can remove players from their room
CREATE POLICY room_players_delete_host ON room_players
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM rooms r
      JOIN users u ON u.id = r.host_id
      WHERE r.id = room_players.room_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- ========================================
-- GAME_MOVES TABLE POLICIES
-- ========================================

-- Players can view moves in their games
CREATE POLICY game_moves_select_players ON game_moves
  FOR SELECT
  USING (
    auth.uid() IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM room_players rp
      JOIN users u ON u.id = rp.user_id
      WHERE rp.room_id = game_moves.room_id
      AND u.auth_user_id = auth.uid()
    )
  );

-- Players can insert moves for their own turns
CREATE POLICY game_moves_insert_own ON game_moves
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = player_id 
      AND auth_user_id = auth.uid()
    ) AND
    EXISTS (
      SELECT 1 FROM room_players rp
      WHERE rp.room_id = game_moves.room_id
      AND rp.user_id = player_id
    )
  );

-- ========================================
-- FRIENDS TABLE POLICIES (if exists)
-- ========================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'friends') THEN
    -- Users can view their own friendships
    EXECUTE 'CREATE POLICY friends_select_own ON friends
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE (id = user_id OR id = friend_id)
          AND auth_user_id = auth.uid()
        )
      )';
    
    -- Users can create friend requests
    EXECUTE 'CREATE POLICY friends_insert_own ON friends
      FOR INSERT
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users 
          WHERE id = user_id 
          AND auth_user_id = auth.uid()
        )
      )';
    
    -- Users can update friendships they are part of
    EXECUTE 'CREATE POLICY friends_update_own ON friends
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE (id = user_id OR id = friend_id)
          AND auth_user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM users 
          WHERE (id = user_id OR id = friend_id)
          AND auth_user_id = auth.uid()
        )
      )';
    
    -- Users can delete friendships they are part of
    EXECUTE 'CREATE POLICY friends_delete_own ON friends
      FOR DELETE
      USING (
        EXISTS (
          SELECT 1 FROM users 
          WHERE (id = user_id OR id = friend_id)
          AND auth_user_id = auth.uid()
        )
      )';
  END IF;
END $$;

-- ========================================
-- GAME_STATES TABLE POLICIES (if exists)
-- ========================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'game_states') THEN
    -- Players can view game states for their games
    EXECUTE 'CREATE POLICY game_states_select_players ON game_states
      FOR SELECT
      USING (
        auth.uid() IS NOT NULL AND
        EXISTS (
          SELECT 1 FROM room_players rp
          JOIN users u ON u.id = rp.user_id
          WHERE rp.room_id = game_states.room_id
          AND u.auth_user_id = auth.uid()
        )
      )';
    
    -- Game states are managed by server functions, not direct inserts
    -- No direct INSERT policy needed
    
    -- Game states can be updated by players in the game
    EXECUTE 'CREATE POLICY game_states_update_players ON game_states
      FOR UPDATE
      USING (
        EXISTS (
          SELECT 1 FROM room_players rp
          JOIN users u ON u.id = rp.user_id
          WHERE rp.room_id = game_states.room_id
          AND u.auth_user_id = auth.uid()
        )
      )
      WITH CHECK (
        EXISTS (
          SELECT 1 FROM room_players rp
          JOIN users u ON u.id = rp.user_id
          WHERE rp.room_id = game_states.room_id
          AND u.auth_user_id = auth.uid()
        )
      )';
  END IF;
END $$;

-- Create index for performance on common queries
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_room_players_user_room ON room_players(user_id, room_id);
CREATE INDEX IF NOT EXISTS idx_rooms_host_id ON rooms(host_id);
CREATE INDEX IF NOT EXISTS idx_rooms_status_public ON rooms(status, is_public);
CREATE INDEX IF NOT EXISTS idx_game_moves_room_id ON game_moves(room_id, move_number);

-- Add comment explaining the security model
COMMENT ON SCHEMA public IS 'Enhanced RLS policies implementing principle of least privilege. Users can only access and modify data they own or are explicitly authorized to access.';