-- Multiplayer Foundation Migration
-- Adds missing columns and indexes for multiplayer features

-- Function to generate unique friend codes
CREATE OR REPLACE FUNCTION generate_friend_code() RETURNS VARCHAR(8) AS $$
DECLARE
  v_code VARCHAR(8);
  v_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate 8-character alphanumeric code
    v_code := UPPER(SUBSTR(MD5(RANDOM()::TEXT || CLOCK_TIMESTAMP()::TEXT), 1, 8));
    
    -- Check if code exists
    SELECT EXISTS(SELECT 1 FROM users WHERE friend_code = v_code) INTO v_exists;
    
    EXIT WHEN NOT v_exists;
  END LOOP;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Add missing columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS 
  friend_code VARCHAR(8) UNIQUE DEFAULT generate_friend_code();

ALTER TABLE users ADD COLUMN IF NOT EXISTS
  last_activity TIMESTAMPTZ DEFAULT NOW();

-- Add missing columns to rooms table  
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS
  invite_link_id UUID DEFAULT gen_random_uuid();

ALTER TABLE rooms ADD COLUMN IF NOT EXISTS
  ai_config JSONB DEFAULT '[]'::jsonb;

-- Essential indexes
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(user_id, status);
CREATE INDEX IF NOT EXISTS idx_room_players_room ON room_players(room_id, user_id);
CREATE INDEX IF NOT EXISTS idx_rooms_code_waiting ON rooms(code) WHERE status = 'waiting';

-- RLS policies
-- Rooms table already has RLS enabled in 02_rls_policies.sql
-- Add policy for room members to read
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' 
    AND tablename = 'rooms' 
    AND policyname = 'room_members_read'
  ) THEN
    CREATE POLICY room_members_read ON rooms
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM room_players rp
          JOIN users u ON u.id = rp.user_id
          WHERE rp.room_id = rooms.id 
          AND u.auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;