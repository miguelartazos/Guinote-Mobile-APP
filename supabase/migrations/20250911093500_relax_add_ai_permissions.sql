-- Relax add_ai_player policy to allow any authenticated room member to add AI
-- (Previously restricted to host only.)

CREATE OR REPLACE FUNCTION public.add_ai_player(
  p_room_id UUID,
  p_difficulty TEXT DEFAULT 'medium',
  p_personality TEXT DEFAULT 'balanced'
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id UUID;
  v_current_players INT;
  v_max_players INT;
  v_position INT;
  v_ai_user_id UUID;
BEGIN
  -- Ensure caller exists (auth) and is a member of this project
  v_user_id := ensure_user_exists();

  -- Validate room and capacity
  SELECT current_players, max_players
  INTO v_current_players, v_max_players
  FROM rooms
  WHERE id = p_room_id
  FOR UPDATE;

  IF v_current_players IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'Room not found');
  END IF;

  IF v_current_players >= v_max_players THEN
    RETURN json_build_object('success', FALSE, 'error', 'Room is full');
  END IF;

  -- Next available position
  v_position := v_current_players;

  -- Create AI entry as a synthetic user_id (not in users)
  v_ai_user_id := gen_random_uuid();

  INSERT INTO public.room_players (
    room_id,
    user_id,
    position,
    team,
    is_ready,
    is_ai,
    ai_difficulty,
    ai_personality,
    joined_at
  ) VALUES (
    p_room_id,
    v_ai_user_id,
    v_position,
    v_position % 2,
    TRUE,
    TRUE,
    COALESCE(p_difficulty, 'medium'),
    COALESCE(p_personality, 'balanced'),
    NOW()
  );

  UPDATE public.rooms
  SET current_players = current_players + 1,
      last_activity_at = NOW()
  WHERE id = p_room_id;

  RETURN json_build_object('success', TRUE, 'ai_player_id', v_ai_user_id, 'position', v_position);
END;
$$;

GRANT EXECUTE ON FUNCTION public.add_ai_player(UUID, TEXT, TEXT) TO authenticated;


