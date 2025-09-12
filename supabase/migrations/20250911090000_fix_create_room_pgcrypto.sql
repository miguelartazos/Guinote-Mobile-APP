-- Ensure pgcrypto is available in the extensions schema
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

-- Redefine create_room to use fully-qualified pgcrypto for robust randomness
CREATE OR REPLACE FUNCTION public.create_room(
  p_game_mode TEXT DEFAULT 'friend',
  p_is_public BOOLEAN DEFAULT FALSE
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_room_id UUID;
  v_room_code TEXT;
  v_attempts INTEGER := 0;
  v_auth_id UUID;
BEGIN
  -- Get auth user ID
  v_auth_id := auth.uid();
  
  -- Check authentication
  IF v_auth_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Not authenticated'
    );
  END IF;
  
  -- Get or create user in public.users
  SELECT id INTO v_user_id
  FROM public.users
  WHERE auth_user_id = v_auth_id
  LIMIT 1;
  
  IF v_user_id IS NULL THEN
    INSERT INTO public.users (
      id,
      auth_user_id,
      username,
      display_name,
      created_at
    )
    SELECT
      gen_random_uuid(),
      au.id,
      COALESCE(
        split_part(au.email, '@', 1),
        'player_' || substr(au.id::text, 1, 8)
      ),
      COALESCE(
        au.raw_user_meta_data->>'display_name',
        split_part(au.email, '@', 1),
        'Player'
      ),
      NOW()
    FROM auth.users au
    WHERE au.id = v_auth_id
    ON CONFLICT (auth_user_id) DO UPDATE SET
      last_activity = NOW()
    RETURNING id INTO v_user_id;

    IF v_user_id IS NULL THEN
      RETURN json_build_object(
        'success', FALSE,
        'error', 'Failed to create or get user profile'
      );
    END IF;
  END IF;

  -- Generate unique room code using extensions.gen_random_bytes for strong randomness
  LOOP
    v_room_code := UPPER(SUBSTRING(ENCODE(extensions.gen_random_bytes(4), 'hex'), 1, 6));
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM rooms
      WHERE code = v_room_code
      AND status IN ('waiting', 'playing')
    );
    v_attempts := v_attempts + 1;
    IF v_attempts > 100 THEN
      RETURN json_build_object(
        'success', FALSE,
        'error', 'Could not generate unique room code after 100 attempts'
      );
    END IF;
  END LOOP;

  -- Create the room
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
    COALESCE(p_game_mode, 'friend'),
    COALESCE(p_is_public, FALSE),
    4,
    1,
    NOW()
  )
  RETURNING id INTO v_room_id;

  IF v_room_id IS NULL THEN
    RETURN json_build_object(
      'success', FALSE,
      'error', 'Failed to create room'
    );
  END IF;

  -- Add host as first player (best-effort)
  BEGIN
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
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN json_build_object(
    'success', TRUE,
    'room_id', v_room_id,
    'code', v_room_code
  );

EXCEPTION WHEN OTHERS THEN
  RETURN json_build_object(
    'success', FALSE,
    'error', SQLERRM,
    'detail', SQLSTATE
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.create_room(TEXT, BOOLEAN) TO authenticated;


