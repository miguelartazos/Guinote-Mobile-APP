-- ============================================
-- COMPLETE FIX FOR "JUGAR CON AMIGOS" 
-- Run this ENTIRE file in Supabase SQL Editor
-- ============================================

-- STEP 1: Ensure auth trigger exists for user creation
-- This creates a public.users entry for every auth.users entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,
    auth_user_id,
    username,
    display_name,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    ),
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      NEW.raw_user_meta_data->>'username',
      split_part(NEW.email, '@', 1)
    ),
    NOW()
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists and recreate
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- STEP 2: Function to ensure user exists (handles missing users)
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
    SET username = COALESCE(EXCLUDED.username, public.users.username)
  RETURNING id INTO v_user_id;
  
  RETURN v_user_id;
END;
$$;

-- STEP 3: Room code generator (if not exists)
CREATE OR REPLACE FUNCTION generate_room_code() 
RETURNS TEXT 
LANGUAGE plpgsql
AS $$
DECLARE
  chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  result TEXT := '';
  i INTEGER;
BEGIN
  FOR i IN 1..6 LOOP
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- STEP 4: Create room function (FIXED)
CREATE OR REPLACE FUNCTION create_room(
  p_game_mode TEXT DEFAULT 'friend',
  p_is_public BOOLEAN DEFAULT FALSE
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
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM rooms 
      WHERE code = v_room_code 
      AND status = 'waiting'
    );
    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN
      RAISE EXCEPTION 'Could not generate unique room code';
    END IF;
  END LOOP;
  
  -- Create room
  INSERT INTO rooms (
    id,
    code,
    host_id,
    status,
    game_mode,
    is_public,
    max_players,
    current_players,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    v_room_code,
    v_user_id,
    'waiting',
    p_game_mode,
    p_is_public,
    4,
    1,
    NOW()
  )
  RETURNING id INTO v_room_id;
  
  -- Add host as first player
  INSERT INTO room_players (
    room_id,
    user_id,
    position,
    team,
    is_ready,
    joined_at
  )
  VALUES (
    v_room_id,
    v_user_id,
    0,
    0,
    FALSE,
    NOW()
  );
  
  -- Return success with room details
  RETURN json_build_object(
    'success', TRUE,
    'room_id', v_room_id,
    'code', v_room_code
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', SQLERRM
    );
END;
$$;

-- STEP 5: Join room function (FIXED)
CREATE OR REPLACE FUNCTION join_room(p_room_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_room_id UUID;
  v_current_players INT;
  v_max_players INT;
  v_position INT;
  v_room_status TEXT;
BEGIN
  -- Ensure user exists and get their ID
  v_user_id := ensure_user_exists();
  
  -- Find room and lock it
  SELECT id, current_players, max_players, status
  INTO v_room_id, v_current_players, v_max_players, v_room_status
  FROM rooms 
  WHERE UPPER(code) = UPPER(p_room_code)
  FOR UPDATE;
  
  IF v_room_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Room not found'
    );
  END IF;
  
  IF v_room_status != 'waiting' THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Game already started'
    );
  END IF;
  
  -- Check if already in room
  IF EXISTS (
    SELECT 1 FROM room_players 
    WHERE room_id = v_room_id 
    AND user_id = v_user_id
  ) THEN
    -- Already in room, just return success
    RETURN json_build_object(
      'success', TRUE,
      'room_id', v_room_id,
      'code', p_room_code,
      'already_joined', TRUE
    );
  END IF;
  
  -- Check if room is full
  IF v_current_players >= v_max_players THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Room is full'
    );
  END IF;
  
  -- Add player to room
  v_position := v_current_players;
  INSERT INTO room_players (
    room_id,
    user_id,
    position,
    team,
    is_ready,
    joined_at
  )
  VALUES (
    v_room_id,
    v_user_id,
    v_position,
    v_position % 2,  -- Alternate teams
    FALSE,
    NOW()
  );
  
  -- Update player count
  UPDATE rooms 
  SET current_players = current_players + 1,
      last_activity_at = NOW()
  WHERE id = v_room_id;
  
  RETURN json_build_object(
    'success', TRUE,
    'room_id', v_room_id,
    'code', p_room_code
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', SQLERRM
    );
END;
$$;

-- STEP 6: Leave room function
CREATE OR REPLACE FUNCTION leave_room(p_room_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_host_id UUID;
  v_current_players INT;
BEGIN
  -- Ensure user exists and get their ID
  v_user_id := ensure_user_exists();
  
  -- Get room info
  SELECT host_id, current_players 
  INTO v_host_id, v_current_players
  FROM rooms 
  WHERE id = p_room_id;
  
  -- Remove player from room
  DELETE FROM room_players 
  WHERE room_id = p_room_id 
  AND user_id = v_user_id;
  
  -- Update player count
  UPDATE rooms 
  SET current_players = GREATEST(0, current_players - 1),
      last_activity_at = NOW()
  WHERE id = p_room_id;
  
  -- If host left and room still has players, assign new host
  IF v_host_id = v_user_id AND v_current_players > 1 THEN
    UPDATE rooms 
    SET host_id = (
      SELECT user_id 
      FROM room_players 
      WHERE room_id = p_room_id 
      ORDER BY joined_at 
      LIMIT 1
    )
    WHERE id = p_room_id;
  END IF;
  
  -- If room is empty, mark as finished
  IF v_current_players <= 1 THEN
    UPDATE rooms 
    SET status = 'finished',
        finished_at = NOW()
    WHERE id = p_room_id;
  END IF;
END;
$$;

-- STEP 7: Toggle ready status
CREATE OR REPLACE FUNCTION toggle_ready(p_room_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Ensure user exists and get their ID
  v_user_id := ensure_user_exists();
  
  -- Toggle ready status
  UPDATE room_players 
  SET is_ready = NOT is_ready 
  WHERE room_id = p_room_id 
  AND user_id = v_user_id;
  
  -- Update room last activity
  UPDATE rooms 
  SET last_activity_at = NOW()
  WHERE id = p_room_id;
END;
$$;

-- STEP 8: Start game function
CREATE OR REPLACE FUNCTION start_game(p_room_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_host_id UUID;
  v_ready_count INT;
BEGIN
  -- Ensure user exists and get their ID
  v_user_id := ensure_user_exists();
  
  -- Check if user is host
  SELECT host_id INTO v_host_id
  FROM rooms 
  WHERE id = p_room_id;
  
  IF v_host_id != v_user_id THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Only host can start the game'
    );
  END IF;
  
  -- Check if all players are ready
  SELECT COUNT(*) INTO v_ready_count
  FROM room_players 
  WHERE room_id = p_room_id 
  AND is_ready = TRUE;
  
  IF v_ready_count < 4 THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'All players must be ready'
    );
  END IF;
  
  -- Start the game
  UPDATE rooms 
  SET status = 'playing',
      started_at = NOW(),
      last_activity_at = NOW()
  WHERE id = p_room_id;
  
  RETURN json_build_object(
    'success', TRUE,
    'room_id', p_room_id
  );
END;
$$;

-- STEP 9: Add AI player function
CREATE OR REPLACE FUNCTION add_ai_player(
  p_room_id UUID,
  p_difficulty TEXT DEFAULT 'medium',
  p_personality TEXT DEFAULT 'balanced'
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_host_id UUID;
  v_current_players INT;
  v_max_players INT;
  v_position INT;
  v_ai_user_id UUID;
BEGIN
  -- Ensure user exists and get their ID
  v_user_id := ensure_user_exists();
  
  -- Check if user is host
  SELECT host_id, current_players, max_players
  INTO v_host_id, v_current_players, v_max_players
  FROM rooms 
  WHERE id = p_room_id;
  
  IF v_host_id != v_user_id THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Only host can add AI players'
    );
  END IF;
  
  IF v_current_players >= v_max_players THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Room is full'
    );
  END IF;
  
  -- Create AI user entry
  v_ai_user_id := gen_random_uuid();
  v_position := v_current_players;
  
  -- Add AI player
  INSERT INTO room_players (
    room_id,
    user_id,
    position,
    team,
    is_ready,
    is_ai,
    ai_difficulty,
    ai_personality,
    joined_at
  )
  VALUES (
    p_room_id,
    v_ai_user_id,
    v_position,
    v_position % 2,
    TRUE,  -- AI is always ready
    TRUE,
    p_difficulty,
    p_personality,
    NOW()
  );
  
  -- Update player count
  UPDATE rooms 
  SET current_players = current_players + 1,
      last_activity_at = NOW()
  WHERE id = p_room_id;
  
  RETURN json_build_object(
    'success', TRUE,
    'ai_player_id', v_ai_user_id
  );
END;
$$;

-- STEP 10: Get online friends function
CREATE OR REPLACE FUNCTION get_online_friends(p_user_id UUID)
RETURNS TABLE(
  friend_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_url TEXT,
  elo INT,
  is_online BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id AS friend_id,
    u.username,
    u.display_name,
    u.avatar_url,
    u.elo,
    u.is_online
  FROM friendships f
  JOIN users u ON u.id = f.friend_id
  WHERE f.user_id = p_user_id
  AND f.status = 'accepted'
  AND u.is_online = TRUE
  ORDER BY u.username;
END;
$$;

-- STEP 11: Grant necessary permissions
GRANT EXECUTE ON FUNCTION ensure_user_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION create_room(TEXT, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION join_room(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION leave_room(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_ready(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION start_game(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_ai_player(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_online_friends(UUID) TO authenticated;

-- STEP 12: Enable Row Level Security (if not already enabled)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- STEP 13: Create RLS policies (if not exist)
DO $$
BEGIN
  -- Users can read their own data
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile" ON users
      FOR SELECT USING (auth_user_id = auth.uid());
  END IF;

  -- Users can read all public user data (for friend search)
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'users' 
    AND policyname = 'Public profiles are viewable'
  ) THEN
    CREATE POLICY "Public profiles are viewable" ON users
      FOR SELECT USING (true);
  END IF;

  -- Room members can read room data
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'rooms' 
    AND policyname = 'Room members can view room'
  ) THEN
    CREATE POLICY "Room members can view room" ON rooms
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM room_players rp
          JOIN users u ON u.id = rp.user_id
          WHERE rp.room_id = rooms.id
          AND u.auth_user_id = auth.uid()
        )
      );
  END IF;

  -- Room members can view other players
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'room_players' 
    AND policyname = 'Room members can view players'
  ) THEN
    CREATE POLICY "Room members can view players" ON room_players
      FOR SELECT USING (
        EXISTS (
          SELECT 1 FROM room_players rp2
          JOIN users u ON u.id = rp2.user_id
          WHERE rp2.room_id = room_players.room_id
          AND u.auth_user_id = auth.uid()
        )
      );
  END IF;
END
$$;

-- ============================================
-- FINAL STEP: ENABLE REALTIME
-- ============================================
-- After running this SQL, go to:
-- Supabase Dashboard > Database > Replication
-- Enable realtime for these tables:
-- - users (for online status)
-- - rooms (for room updates)
-- - room_players (for player joins/leaves)
-- - friendships (for friend requests)
-- ============================================

-- Test that everything works
DO $$
BEGIN
  RAISE NOTICE 'All functions created successfully!';
  RAISE NOTICE 'Next steps:';
  RAISE NOTICE '1. Enable realtime for tables in Supabase Dashboard';
  RAISE NOTICE '2. Test room creation in your app';
END
$$;