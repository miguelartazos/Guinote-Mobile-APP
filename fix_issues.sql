-- Fix the issues found in testing

-- 1. Fix infinite recursion in room_players RLS policies
-- Drop existing policies that might cause recursion
DROP POLICY IF EXISTS "room_players_select" ON room_players;
DROP POLICY IF EXISTS "room_players_insert" ON room_players;
DROP POLICY IF EXISTS "room_players_update" ON room_players;
DROP POLICY IF EXISTS "room_players_delete" ON room_players;

-- Recreate simplified policies without recursion
CREATE POLICY "room_players_select" ON room_players FOR SELECT
  USING (true);  -- Allow all selects for now, can tighten later

CREATE POLICY "room_players_insert" ON room_players FOR INSERT
  WITH CHECK (
    auth.uid() IS NOT NULL
  );

CREATE POLICY "room_players_update" ON room_players FOR UPDATE
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

CREATE POLICY "room_players_delete" ON room_players FOR DELETE
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- 2. Check what parameters create_room actually expects
SELECT 
  proname as function_name,
  pg_get_function_identity_arguments(oid) as parameters
FROM pg_proc 
WHERE proname = 'create_room';

-- 3. Fix create_room function if needed (update to match expected signature)
DROP FUNCTION IF EXISTS create_room(UUID, TEXT, BOOLEAN, TEXT);
DROP FUNCTION IF EXISTS create_room(TEXT, UUID, BOOLEAN);

CREATE OR REPLACE FUNCTION create_room(
  p_code TEXT,
  p_is_public BOOLEAN DEFAULT TRUE,
  p_game_mode TEXT DEFAULT 'casual'
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_room_id UUID;
  v_result JSON;
BEGIN
  -- Get the current user's ID from auth
  SELECT id INTO v_user_id
  FROM users
  WHERE auth_user_id = auth.uid();
  
  IF v_user_id IS NULL THEN
    -- If user doesn't exist, create one
    INSERT INTO users (auth_user_id, username, display_name)
    VALUES (auth.uid(), 'Player' || substr(auth.uid()::text, 1, 8), 'Player')
    RETURNING id INTO v_user_id;
  END IF;

  -- Create the room
  INSERT INTO rooms (code, host_id, status, is_public, game_mode)
  VALUES (p_code, v_user_id, 'waiting', p_is_public, p_game_mode)
  RETURNING id INTO v_room_id;

  -- Add host as first player
  INSERT INTO room_players (room_id, user_id, position, team, is_ready)
  VALUES (v_room_id, v_user_id, 0, 0, FALSE);

  -- Update room player count
  UPDATE rooms 
  SET current_players = 1 
  WHERE id = v_room_id;

  -- Return room info
  SELECT json_build_object(
    'room_id', v_room_id,
    'code', p_code,
    'host_id', v_user_id
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 4. Add a simple join_room function that matches expected signature
CREATE OR REPLACE FUNCTION join_room(
  p_room_code TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_room_id UUID;
  v_position INTEGER;
  v_result JSON;
BEGIN
  -- Get current user
  SELECT id INTO v_user_id
  FROM users
  WHERE auth_user_id = auth.uid();
  
  IF v_user_id IS NULL THEN
    -- Create user if doesn't exist
    INSERT INTO users (auth_user_id, username, display_name)
    VALUES (auth.uid(), 'Player' || substr(auth.uid()::text, 1, 8), 'Player')
    RETURNING id INTO v_user_id;
  END IF;

  -- Find room
  SELECT id INTO v_room_id
  FROM rooms
  WHERE code = p_room_code
  AND status = 'waiting';

  IF v_room_id IS NULL THEN
    RAISE EXCEPTION 'Room not found or not available';
  END IF;

  -- Check if already in room
  IF EXISTS (
    SELECT 1 FROM room_players 
    WHERE room_id = v_room_id AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'Already in this room';
  END IF;

  -- Get next position
  SELECT COALESCE(MAX(position) + 1, 0) INTO v_position
  FROM room_players
  WHERE room_id = v_room_id;

  -- Join room
  INSERT INTO room_players (room_id, user_id, position, team, is_ready)
  VALUES (v_room_id, v_user_id, v_position, v_position % 2, FALSE);

  -- Update player count
  UPDATE rooms 
  SET current_players = current_players + 1
  WHERE id = v_room_id;

  -- Return result
  SELECT json_build_object(
    'room_id', v_room_id,
    'user_id', v_user_id,
    'position', v_position
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- 5. Grant necessary permissions
GRANT USAGE ON SCHEMA public TO anon;
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO authenticated;