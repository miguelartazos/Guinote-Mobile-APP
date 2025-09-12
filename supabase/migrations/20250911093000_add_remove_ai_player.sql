-- Ensure remove_ai_player function exists and is granted
CREATE OR REPLACE FUNCTION public.remove_ai_player(
  p_room_id UUID,
  p_position INTEGER
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deleted INTEGER;
BEGIN
  -- Delete AI player at the given position only if it's an AI entry
  DELETE FROM public.room_players
  WHERE room_id = p_room_id
    AND position = p_position
    AND is_ai = TRUE
  RETURNING 1 INTO v_deleted;

  IF v_deleted IS NULL THEN
    RAISE EXCEPTION 'No AI player at this position';
  END IF;

  -- Decrement current players and bump last activity
  UPDATE public.rooms
  SET current_players = GREATEST(0, current_players - 1),
      last_activity_at = NOW()
  WHERE id = p_room_id;

  RETURN json_build_object('success', TRUE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_ai_player(UUID, INTEGER) TO authenticated;


