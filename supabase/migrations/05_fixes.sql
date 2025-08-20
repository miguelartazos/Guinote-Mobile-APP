-- Fixes and minimal atomic ops additions
-- 1) Ensure single active game_state per room
-- 2) Add minimal end_trick RPC with optimistic concurrency
-- 3) Disable AI DB insertion to avoid FK/RLS issues until proper design

-- 1) Unique index to enforce one game_state per room
CREATE UNIQUE INDEX IF NOT EXISTS ux_game_states_room ON game_states(room_id);

-- 2) Minimal end_trick function
-- Moves table_cards into tricks, sets round_winner/current_player, bumps version.
-- Heavy validation/scoring stays client-side; this enforces atomicity + versioning.
CREATE OR REPLACE FUNCTION end_trick(
  p_room_id UUID,
  p_winner_position INTEGER,
  p_expected_version INTEGER
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_state game_states%ROWTYPE;
  v_result JSON;
  v_table_len INTEGER;
BEGIN
  -- Lock current game state by room
  SELECT * INTO v_state
  FROM game_states
  WHERE room_id = p_room_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game not found';
  END IF;

  -- Version check for optimistic concurrency
  IF v_state.version != p_expected_version THEN
    RAISE EXCEPTION 'version_conflict'
      USING DETAIL = json_build_object('actual', v_state.version)::text;
  END IF;

  -- Expect exactly 4 cards on the table (one per player)
  v_table_len := COALESCE(jsonb_array_length(v_state.table_cards), 0);
  IF v_table_len != 4 THEN
    RAISE EXCEPTION 'Invalid table_cards length: expected 4, got %', v_table_len;
  END IF;

  -- Update state: append trick, clear table, set next player and round_winner
  UPDATE game_states
  SET
    tricks = COALESCE(tricks, '[]'::jsonb) || jsonb_build_array(v_state.table_cards),
    table_cards = '[]'::jsonb,
    round_winner = p_winner_position,
    current_player = p_winner_position,
    last_action = jsonb_build_object(
      'type', 'end_trick',
      'winner', p_winner_position,
      'timestamp', NOW()
    ),
    version = v_state.version + 1
  WHERE id = v_state.id
  RETURNING to_json(game_states) INTO v_result;

  RETURN v_result;
END;
$$;

-- 3) Disable AI add function for now due to FK/RLS constraints.
-- Drop any existing definitions and replace with a stub that raises a clear error.
DROP FUNCTION IF EXISTS add_ai_player(UUID, TEXT);
DROP FUNCTION IF EXISTS add_ai_player(UUID, TEXT, TEXT);

CREATE OR REPLACE FUNCTION add_ai_player(
  p_room_id UUID,
  p_difficulty TEXT DEFAULT 'medium',
  p_personality TEXT DEFAULT 'balanced'
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE EXCEPTION 'AI players are temporarily disabled until a dedicated bots design is implemented';
END;
$$;

