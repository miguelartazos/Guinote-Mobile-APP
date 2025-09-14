-- Unify game_states schema and authoritative start_game initializer
-- Safe to run multiple times (idempotent guards).

-- 1) Ensure canonical columns exist on game_states
ALTER TABLE game_states
  ADD COLUMN IF NOT EXISTS players JSONB,
  ADD COLUMN IF NOT EXISTS hands JSONB,
  ADD COLUMN IF NOT EXISTS deck JSONB,
  ADD COLUMN IF NOT EXISTS trump_card JSONB,
  ADD COLUMN IF NOT EXISTS trump_suit TEXT,
  ADD COLUMN IF NOT EXISTS table_cards JSONB,
  ADD COLUMN IF NOT EXISTS tricks JSONB,
  ADD COLUMN IF NOT EXISTS scores JSONB,
  ADD COLUMN IF NOT EXISTS team_scores JSONB DEFAULT '[0,0]'::JSONB,
  ADD COLUMN IF NOT EXISTS match_scores JSONB DEFAULT json_build_object('team1',0,'team2',0,'team1_cotos',0,'team2_cotos',0),
  ADD COLUMN IF NOT EXISTS current_player INTEGER,
  ADD COLUMN IF NOT EXISTS current_player_index INTEGER,
  ADD COLUMN IF NOT EXISTS dealer_index INTEGER,
  ADD COLUMN IF NOT EXISTS phase TEXT,
  ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2) Canonical initializer: initialize_game_state inserts full row
CREATE OR REPLACE FUNCTION initialize_game_state(
  p_room_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_players JSONB;
  v_deck JSONB;
  v_hands JSONB;
  v_trump_card JSONB;
  v_trump_suit TEXT;
  v_state_id UUID;
  i INTEGER;
  v_dealer_index INTEGER;
  v_first_player_index INTEGER;
  suit TEXT;
  card_value INTEGER;
BEGIN
  -- Players in seat order 0..3
  SELECT jsonb_agg(
    jsonb_build_object('id', user_id, 'position', position, 'team', team, 'is_ai', is_ai) ORDER BY position
  ) INTO v_players
  FROM room_players
  WHERE room_id = p_room_id;

  IF v_players IS NULL OR jsonb_array_length(v_players) != 4 THEN
    RAISE EXCEPTION 'Game requires exactly 4 players';
  END IF;

  -- Build 40-card Spanish deck
  v_deck := '[]'::jsonb;
  FOREACH suit IN ARRAY ARRAY['oros','copas','espadas','bastos'] LOOP
    FOREACH card_value IN ARRAY ARRAY[1,2,3,4,5,6,7,10,11,12] LOOP
      v_deck := v_deck || jsonb_build_object('suit', suit, 'value', card_value, 'id', suit || '_' || card_value);
    END LOOP;
  END LOOP;

  -- Shuffle deck randomly
  WITH shuffled AS (
    SELECT card
    FROM jsonb_array_elements(v_deck) AS t(card)
    ORDER BY random()
  )
  SELECT jsonb_agg(card) INTO v_deck FROM shuffled;

  -- Deal 6 per seat into hands-by-position object {'0':[],...}
  v_hands := jsonb_build_object('0', '[]'::jsonb, '1','[]'::jsonb, '2','[]'::jsonb, '3','[]'::jsonb);
  FOR i IN 0..23 LOOP
    v_hands := jsonb_set(v_hands, ARRAY[(i % 4)::text], (v_hands->((i % 4)::text)) || (v_deck->i));
  END LOOP;

  -- Trump is next card; remaining deck after index 24 (1-based 25th dealt)
  v_trump_card := v_deck->24;
  v_trump_suit := v_trump_card->>'suit';
  WITH remaining AS (
    SELECT card, idx
    FROM jsonb_array_elements(v_deck) WITH ORDINALITY AS t(card, idx)
    WHERE idx > 25
  )
  SELECT jsonb_agg(card) INTO v_deck FROM remaining;

  -- Dealer and mano (first player is to dealer's right)
  v_dealer_index := 0; -- simple rotation start; could randomize if desired
  v_first_player_index := (v_dealer_index - 1 + 4) % 4;

  INSERT INTO game_states (
    room_id, players, hands, deck, trump_card, trump_suit,
    table_cards, tricks, scores, team_scores, match_scores,
    current_player, current_player_index, dealer_index, phase, version
  ) VALUES (
    p_room_id,
    v_players,
    v_hands,
    v_deck,
    v_trump_card,
    v_trump_suit,
    '[]'::jsonb,
    '[]'::jsonb,
    jsonb_build_object('0',0,'1',0),
    '[0,0]'::jsonb,
    json_build_object('team1',0,'team2',0,'team1_cotos',0,'team2_cotos',0),
    v_first_player_index,
    v_first_player_index,
    v_dealer_index,
    'dealing',
    0
  ) RETURNING id INTO v_state_id;

  UPDATE rooms SET status='playing', started_at=NOW() WHERE id=p_room_id;

  RETURN json_build_object('success', true, 'state_id', v_state_id, 'trump_suit', v_trump_suit);
END;
$$;

-- 3) start_game uses initializer and enforces waiting + 4 players
CREATE OR REPLACE FUNCTION start_game(p_room_id UUID) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_player_count INTEGER;
  v_result JSON;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM rooms WHERE id=p_room_id AND status='waiting') THEN
    RAISE EXCEPTION 'Room not found or not in waiting status';
  END IF;

  SELECT COUNT(*) INTO v_player_count FROM room_players WHERE room_id=p_room_id;
  IF v_player_count != 4 THEN
    RAISE EXCEPTION 'Game requires exactly 4 players, found %', v_player_count;
  END IF;

  SELECT initialize_game_state(p_room_id) INTO v_result;
  RETURN v_result;
END;
$$;

-- 4) Ensure game_states table is in realtime publication
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname='supabase_realtime'
      AND schemaname='public'
      AND tablename='game_states'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.game_states;
  END IF;
END $$;

-- 5) Helpful index for latest-by-room queries
CREATE INDEX IF NOT EXISTS idx_game_states_room_updated ON game_states(room_id, updated_at DESC);


