-- Fix for "User not found" error when creating/joining rooms
-- This ensures users are created in public.users even if the trigger didn't fire

-- Function to ensure user exists in public.users table
CREATE OR REPLACE FUNCTION ensure_user_exists()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_auth_id UUID;
  v_email TEXT;
  v_metadata JSONB;
BEGIN
  -- Get current auth user ID
  v_auth_id := auth.uid();
  
  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  -- Check if user already exists
  SELECT id INTO v_user_id FROM public.users WHERE auth_user_id = v_auth_id;
  
  IF v_user_id IS NOT NULL THEN
    RETURN v_user_id;
  END IF;
  
  -- Get auth user details
  SELECT email, raw_user_meta_data INTO v_email, v_metadata
  FROM auth.users 
  WHERE id = v_auth_id;
  
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Auth user not found';
  END IF;
  
  -- Create user if doesn't exist
  INSERT INTO public.users (
    id,
    auth_user_id,
    username,
    display_name,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    v_auth_id,
    COALESCE(
      v_metadata->>'username',
      split_part(v_email, '@', 1)
    ),
    COALESCE(
      v_metadata->>'display_name',
      v_metadata->>'username',
      split_part(v_email, '@', 1)
    ),
    NOW()
  )
  ON CONFLICT (auth_user_id) DO UPDATE
    SET username = EXCLUDED.username
  RETURNING id INTO v_user_id;
  
  RETURN v_user_id;
END;
$$;

-- Update create_room function to use ensure_user_exists
CREATE OR REPLACE FUNCTION create_room(
  p_game_mode TEXT DEFAULT 'casual',
  p_is_public BOOLEAN DEFAULT TRUE
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_room_id UUID;
  v_room_code TEXT;
  v_attempts INTEGER := 0;
BEGIN
  -- Ensure user exists and get their ID
  v_user_id := ensure_user_exists();
  
  -- Generate unique room code
  LOOP
    v_room_code := generate_room_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM rooms WHERE code = v_room_code);
    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN
      RAISE EXCEPTION 'Could not generate unique room code';
    END IF;
  END LOOP;
  
  -- Create room
  INSERT INTO rooms (code, host_id, status, game_mode, is_public, current_players)
  VALUES (v_room_code, v_user_id, 'waiting', p_game_mode, p_is_public, 1)
  RETURNING id INTO v_room_id;
  
  -- Add host as first player
  INSERT INTO room_players (room_id, user_id, position, team, is_ready)
  VALUES (v_room_id, v_user_id, 0, 0, FALSE);
  
  RETURN json_build_object(
    'success', TRUE,
    'room_id', v_room_id,
    'code', v_room_code
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to create room: %', SQLERRM;
END;
$$;

-- Update join_room function to use ensure_user_exists
CREATE OR REPLACE FUNCTION join_room(
  p_room_code TEXT,
  p_position INTEGER DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room rooms%ROWTYPE;
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Ensure user exists and get their ID
  v_user_id := ensure_user_exists();
  
  -- Lock and get room
  SELECT * INTO v_room FROM rooms WHERE code = p_room_code FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  
  IF v_room.status != 'waiting' THEN
    RAISE EXCEPTION 'Game already started';
  END IF;
  
  IF v_room.current_players >= v_room.max_players THEN
    RAISE EXCEPTION 'Room is full';
  END IF;
  
  -- Check if already in room
  IF EXISTS (SELECT 1 FROM room_players WHERE room_id = v_room.id AND user_id = v_user_id) THEN
    RETURN json_build_object(
      'success', TRUE,
      'room_id', v_room.id,
      'already_joined', TRUE
    );
  END IF;
  
  -- Add player
  INSERT INTO room_players (room_id, user_id, position, team, is_ready)
  VALUES (
    v_room.id, 
    v_user_id, 
    COALESCE(p_position, v_room.current_players), 
    v_room.current_players % 2, 
    FALSE
  );
  
  -- Update player count
  UPDATE rooms SET current_players = current_players + 1 
  WHERE id = v_room.id;
  
  RETURN json_build_object(
    'success', TRUE,
    'room_id', v_room.id,
    'position', COALESCE(p_position, v_room.current_players)
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Failed to join room: %', SQLERRM;
END;
$$;

-- Update leave_room function to use ensure_user_exists
CREATE OR REPLACE FUNCTION leave_room(p_room_id UUID) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_room rooms%ROWTYPE;
BEGIN
  -- Ensure user exists and get their ID
  v_user_id := ensure_user_exists();
  
  -- Get room info
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  
  -- Remove player
  DELETE FROM room_players 
  WHERE room_id = p_room_id AND user_id = v_user_id;
  
  -- Update player count
  UPDATE rooms SET current_players = current_players - 1 
  WHERE id = p_room_id;
  
  -- If host left and room is waiting, transfer host or abandon room
  IF v_room.host_id = v_user_id AND v_room.status = 'waiting' THEN
    -- Try to transfer host to another player
    UPDATE rooms 
    SET host_id = (
      SELECT user_id FROM room_players 
      WHERE room_id = p_room_id 
      LIMIT 1
    )
    WHERE id = p_room_id;
    
    -- If no players left, mark as abandoned
    IF NOT EXISTS (SELECT 1 FROM room_players WHERE room_id = p_room_id) THEN
      UPDATE rooms SET status = 'abandoned' WHERE id = p_room_id;
    END IF;
  END IF;
  
  RETURN json_build_object('success', TRUE);
END;
$$;

-- Update toggle_ready function to use ensure_user_exists  
CREATE OR REPLACE FUNCTION toggle_ready(p_room_id UUID) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_is_ready BOOLEAN;
BEGIN
  -- Ensure user exists and get their ID
  v_user_id := ensure_user_exists();
  
  -- Toggle ready status
  UPDATE room_players 
  SET is_ready = NOT is_ready
  WHERE room_id = p_room_id AND user_id = v_user_id
  RETURNING is_ready INTO v_is_ready;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not in this room';
  END IF;
  
  RETURN json_build_object(
    'success', TRUE,
    'is_ready', v_is_ready
  );
END;
$$;

-- Grant necessary permissions
GRANT EXECUTE ON FUNCTION ensure_user_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION create_room(TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION join_room(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION leave_room(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_ready(UUID) TO authenticated;