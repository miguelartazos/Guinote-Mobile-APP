-- 2025-09-14: Rejoin window (15 minutes) support
-- Adds membership tracking columns and RPCs for soft leave and resume

-- 1) Schema updates: membership rejoin columns
ALTER TABLE public.room_players
  ADD COLUMN IF NOT EXISTS disconnected_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS forfeited_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ DEFAULT NOW();

-- Helpful index for listing rejoinable rooms by user
CREATE INDEX IF NOT EXISTS idx_room_players_user_disconnected
  ON public.room_players (user_id, disconnected_at);

-- 2) RPC: Soft leave (mark as disconnected, keep seat)
CREATE OR REPLACE FUNCTION public.soft_leave_room(p_room_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_row public.room_players%ROWTYPE;
BEGIN
  -- Ensure app user exists and get internal user id
  v_user_id := ensure_user_exists();

  -- Lock membership row
  SELECT * INTO v_row
  FROM public.room_players
  WHERE room_id = p_room_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Not a member of this room');
  END IF;

  -- Mark as disconnected; do not free seat
  UPDATE public.room_players
  SET disconnected_at = NOW(),
      last_seen_at = NOW(),
      connection_status = 'offline'
  WHERE id = v_row.id;

  -- Touch room activity
  UPDATE public.rooms SET last_activity_at = NOW() WHERE id = p_room_id;

  RETURN json_build_object('success', TRUE, 'room_id', p_room_id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;

-- 3) RPC: Resume room (clear disconnected if within 15 minutes)
CREATE OR REPLACE FUNCTION public.resume_room(p_room_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_row public.room_players%ROWTYPE;
  v_room public.rooms%ROWTYPE;
BEGIN
  v_user_id := ensure_user_exists();

  -- Fetch membership and room
  SELECT * INTO v_row
  FROM public.room_players
  WHERE room_id = p_room_id AND user_id = v_user_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN json_build_object('success', FALSE, 'error', 'Not a member of this room');
  END IF;

  SELECT * INTO v_room FROM public.rooms WHERE id = p_room_id;

  IF v_row.forfeited_at IS NOT NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'Seat forfeited');
  END IF;

  IF v_row.disconnected_at IS NULL THEN
    -- Consider already connected; just refresh presence fields
    UPDATE public.room_players
    SET last_seen_at = NOW(),
        connection_status = 'online'
    WHERE id = v_row.id;
  ELSE
    -- Enforce 15-minute window
    IF NOW() > v_row.disconnected_at + INTERVAL '15 minutes' THEN
      RETURN json_build_object('success', FALSE, 'error', 'Rejoin window expired');
    END IF;

    UPDATE public.room_players
    SET disconnected_at = NULL,
        last_seen_at = NOW(),
        connection_status = 'online'
    WHERE id = v_row.id;
  END IF;

  -- Touch room activity
  UPDATE public.rooms SET last_activity_at = NOW() WHERE id = p_room_id;

  RETURN json_build_object(
    'success', TRUE,
    'room_id', p_room_id,
    'code', v_room.code,
    'status', v_room.status
  );
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;

-- 4) RPC: List rejoinable rooms for current user
CREATE OR REPLACE FUNCTION public.get_rejoinable_rooms()
RETURNS TABLE (
  room_id UUID,
  code TEXT,
  status TEXT,
  disconnected_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := ensure_user_exists();

  RETURN QUERY
  SELECT r.id AS room_id,
         r.code,
         r.status,
         rp.disconnected_at,
         rp.disconnected_at + INTERVAL '15 minutes' AS expires_at
  FROM public.room_players rp
  JOIN public.rooms r ON r.id = rp.room_id
  WHERE rp.user_id = v_user_id
    AND rp.forfeited_at IS NULL
    AND rp.disconnected_at IS NOT NULL
    AND NOW() <= rp.disconnected_at + INTERVAL '15 minutes'
    AND r.status IN ('waiting','playing');
END;
$$;


