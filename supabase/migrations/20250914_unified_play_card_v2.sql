-- Unified play_card (v2) using table_cards/tricks and optimistic concurrency
-- Safe to run multiple times; functions are created/replaced.

-- Clean up older overloads to avoid ambiguity
DO $$ BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'play_card' AND p.pronargs = 2
  ) THEN
    DROP FUNCTION IF EXISTS play_card(UUID, TEXT);
  END IF;
  IF EXISTS (
    SELECT 1 FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname = 'public' AND p.proname = 'play_card' AND p.pronargs = 3
  ) THEN
    -- Drop any existing 3-arg version to avoid ambiguity
    DROP FUNCTION IF EXISTS play_card(UUID, TEXT, INTEGER);
  END IF;
END $$;

-- Optional: server-driven bot turn executor (host-triggered)
CREATE OR REPLACE FUNCTION maybe_play_bot_turn(
  p_game_state_id UUID,
  p_expected_version INTEGER DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_state game_states%ROWTYPE;
  v_players JSONB;
  v_turn_idx INTEGER;
  v_is_ai BOOLEAN := FALSE;
  v_hand JSONB;
  v_card_id TEXT;
BEGIN
  SELECT * INTO v_state FROM game_states WHERE id = p_game_state_id FOR UPDATE;
  IF NOT FOUND THEN RAISE EXCEPTION 'Game not found'; END IF;

  IF p_expected_version IS NOT NULL AND v_state.version != p_expected_version THEN
    RAISE EXCEPTION 'version_conflict' USING DETAIL = jsonb_build_object('actual', v_state.version)::text;
  END IF;

  v_players := COALESCE(v_state.players, '[]'::jsonb);
  v_turn_idx := COALESCE(v_state.current_player_index, v_state.current_player);
  IF v_turn_idx IS NULL THEN v_turn_idx := 0; END IF;

  -- Detect AI by players[].is_ai or fallback to even/odd team heuristic (not ideal but safe)
  v_is_ai := COALESCE((v_players->v_turn_idx->>'is_ai')::BOOLEAN, FALSE);
  IF NOT v_is_ai THEN
    RETURN to_json(v_state);
  END IF;

  -- Choose a trivial legal card: first in hand
  v_hand := COALESCE(v_state.hands->(v_turn_idx::text), '[]'::jsonb);
  IF COALESCE(jsonb_array_length(v_hand),0) = 0 THEN
    RETURN to_json(v_state);
  END IF;
  v_card_id := v_hand->0->>'id';

  RETURN apply_play_card(
    p_game_state_id := p_game_state_id,
    p_actor_index := v_turn_idx,
    p_card_id := v_card_id,
    p_expected_version := v_state.version
  );
END;
$$;

-- Helper: map Spanish card value to trick points (1=11, 3=10, 12=4, 11=3, 10=2)
CREATE OR REPLACE FUNCTION get_card_points_v2(p_card JSONB) RETURNS INTEGER AS $$
DECLARE
  v INTEGER;
BEGIN
  v := COALESCE((p_card->>'value')::INTEGER, NULL);
  IF v IS NULL THEN
    RETURN 0;
  END IF;
  CASE v
    WHEN 1 THEN RETURN 11;
    WHEN 3 THEN RETURN 10;
    WHEN 12 THEN RETURN 4;
    WHEN 11 THEN RETURN 3;
    WHEN 10 THEN RETURN 2;
    ELSE RETURN 0;
  END CASE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Helper: compute strength for winner determination using suit + lead + trump
CREATE OR REPLACE FUNCTION get_card_strength_v2(
  p_card JSONB,
  p_trump_suit TEXT,
  p_lead_suit TEXT
) RETURNS INTEGER AS $$
DECLARE
  v_suit TEXT := p_card->>'suit';
  v_value INTEGER := COALESCE((p_card->>'value')::INTEGER, 0);
  v_base INTEGER;
BEGIN
  -- Base by value similar to points but used only for ordering
  CASE v_value
    WHEN 1 THEN v_base := 11;
    WHEN 3 THEN v_base := 10;
    WHEN 12 THEN v_base := 4;
    WHEN 11 THEN v_base := 3;
    WHEN 10 THEN v_base := 2;
    ELSE v_base := 0;
  END CASE;

  IF v_suit = p_trump_suit THEN
    RETURN 1000 + v_base;
  ELSIF v_suit = p_lead_suit THEN
    RETURN 100 + v_base;
  ELSE
    RETURN v_base; -- cannot win unless none match lead/trump
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Determine trick winner for table_cards formatted as array of {player_id, card, position}
CREATE OR REPLACE FUNCTION determine_trick_winner_v2(
  p_trick JSONB,
  p_trump_suit TEXT
) RETURNS JSONB AS $$
DECLARE
  v_len INTEGER := COALESCE(jsonb_array_length(p_trick), 0);
  v_lead_suit TEXT;
  v_winner_idx INTEGER := 0;
  v_winner_strength INTEGER := -1;
  v_points INTEGER := 0;
  i INTEGER;
  v_card JSONB;
  v_strength INTEGER;
BEGIN
  IF v_len = 0 THEN
    RETURN jsonb_build_object('winner_position', 0, 'winner_player_id', NULL, 'points', 0);
  END IF;

  v_lead_suit := (p_trick->0->'card'->>'suit');

  FOR i IN 0..(v_len - 1) LOOP
    v_card := p_trick->i->'card';
    v_strength := get_card_strength_v2(v_card, p_trump_suit, v_lead_suit);
    IF v_strength > v_winner_strength THEN
      v_winner_strength := v_strength;
      v_winner_idx := i;
    END IF;
    v_points := v_points + get_card_points_v2(v_card);
  END LOOP;

  RETURN jsonb_build_object(
    'winner_position', v_winner_idx,
    'winner_player_id', p_trick->v_winner_idx->>'player_id',
    'points', v_points
  );
END;
$$ LANGUAGE plpgsql;

-- Internal, seat-driven card play. Validates actor seat and updates updated_at.
CREATE OR REPLACE FUNCTION apply_play_card(
  p_game_state_id UUID,
  p_actor_index INTEGER,
  p_card_id TEXT,
  p_expected_version INTEGER DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_state game_states%ROWTYPE;
  v_players JSONB;
  v_hands JSONB;
  v_hand JSONB;
  v_card JSONB := NULL;
  v_new_hand JSONB;
  v_table JSONB;
  v_next_idx INTEGER;
  v_trump_suit TEXT;
  v_winner JSONB;
  v_tricks JSONB;
  v_deck JSONB;
  v_target_idx INTEGER;
  v_result JSONB;
  v_winner_abs_pos INTEGER;
  v_winner_team INTEGER;
  v_team_scores JSONB;
  v_table_len INTEGER;
  v_turn_idx INTEGER;
  v_key TEXT;
  i INTEGER;
  v_actor_player_id UUID;
BEGIN
  -- Lock and load state
  SELECT * INTO v_state FROM game_states WHERE id = p_game_state_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game not found';
  END IF;

  -- Optional optimistic concurrency
  IF p_expected_version IS NOT NULL AND v_state.version != p_expected_version THEN
    RAISE EXCEPTION 'version_conflict' USING DETAIL = jsonb_build_object('actual', v_state.version)::text;
  END IF;

  v_players := COALESCE(v_state.players, '[]'::jsonb);
  v_turn_idx := COALESCE(v_state.current_player_index, v_state.current_player);
  IF v_turn_idx IS NULL THEN
    v_turn_idx := 0;
  END IF;

  IF p_actor_index IS NULL OR p_actor_index < 0 OR p_actor_index > 3 THEN
    RAISE EXCEPTION 'Invalid actor index';
  END IF;

  IF p_actor_index != v_turn_idx THEN
    RAISE EXCEPTION 'Not your turn';
  END IF;

  v_hands := COALESCE(v_state.hands, '{}'::jsonb);
  v_key := p_actor_index::text;
  v_hand := COALESCE(v_hands->v_key, '[]'::jsonb);

  -- Find and remove the card from player's hand
  FOR i IN 0..COALESCE(jsonb_array_length(v_hand),0)-1 LOOP
    IF v_hand->i->>'id' = p_card_id THEN
      v_card := v_hand->i;
      EXIT;
    END IF;
  END LOOP;

  IF v_card IS NULL THEN
    RAISE EXCEPTION 'Card not in hand';
  END IF;

  v_new_hand := (
    SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
    FROM jsonb_array_elements(v_hand) WITH ORDINALITY AS t(elem, ord)
    WHERE (elem->>'id') IS DISTINCT FROM p_card_id
  );

  -- Update hands with card removed
  v_hands := jsonb_set(v_hands, ARRAY[v_key], v_new_hand, true);

  -- Resolve actor's player_id from players JSON
  BEGIN
    v_actor_player_id := (v_players->p_actor_index->>'id')::uuid;
  EXCEPTION WHEN others THEN
    v_actor_player_id := NULL;
  END;

  -- Append to table_cards using seat-based identity
  v_table := COALESCE(v_state.table_cards, '[]'::jsonb) || jsonb_build_array(
    jsonb_build_object(
      'player_id', COALESCE(v_actor_player_id::text, NULL),
      'card', v_card,
      'position', p_actor_index
    )
  );

  v_table_len := COALESCE(jsonb_array_length(v_table), 0);
  v_trump_suit := COALESCE(v_state.trump_suit, (v_state.trump->>'suit'));

  -- Advance to next player
  v_next_idx := (v_turn_idx + 1) % 4;

  UPDATE game_states
  SET
    hands = v_hands,
    table_cards = v_table,
    current_player_index = v_next_idx,
    current_player = v_next_idx,
    last_action = jsonb_build_object('type','play_card','card',p_card_id,'player',p_actor_index,'timestamp', NOW()),
    version = v_state.version + 1,
    updated_at = NOW()
  WHERE id = v_state.id
  RETURNING to_json(game_states) INTO v_result;

  -- If trick complete (4 cards), determine winner and apply trick end
  IF v_table_len = 4 THEN
    v_winner := determine_trick_winner_v2(v_table, v_trump_suit);
    -- winner_position is index within the trick array (0..3). Convert to absolute seat using stored 'position'
    v_winner_abs_pos := (
      v_table->((v_winner->>'winner_position')::INTEGER)->>'position'
    )::INTEGER;

    -- Append trick and clear table
    v_tricks := COALESCE(v_state.tricks, '[]'::jsonb) || jsonb_build_array(v_table);

    -- Winner team via players JSON (preferred) or fallback
    v_winner_team := COALESCE((v_players->v_winner_abs_pos->>'team')::INTEGER, v_winner_abs_pos % 2);
    v_team_scores := COALESCE(v_state.team_scores, '[0,0]'::jsonb);
    v_team_scores := jsonb_set(
      v_team_scores,
      ARRAY[v_winner_team::text],
      to_jsonb(COALESCE((v_team_scores->>v_winner_team::text)::INTEGER, 0) + (v_winner->>'points')::INTEGER)
    );

    -- Deal up to 4 cards in winner-first order (take from top = last element)
    v_deck := COALESCE(v_state.deck, '[]'::jsonb);
    v_hands := COALESCE(v_hands, '{}'::jsonb);

    FOR i IN 0..3 LOOP
      EXIT WHEN COALESCE(jsonb_array_length(v_deck),0) = 0;
      v_target_idx := (v_winner_abs_pos + i) % 4;
      v_key := v_target_idx::text;
      v_hand := COALESCE(v_hands->v_key, '[]'::jsonb);
      -- Take top of deck as last element
      v_card := v_deck->(COALESCE(jsonb_array_length(v_deck),1) - 1);
      v_hand := v_hand || jsonb_build_array(v_card);
      v_hands := jsonb_set(v_hands, ARRAY[v_key], v_hand, true);
      -- Remove top from deck (drop last element)
      v_deck := (
        SELECT COALESCE(jsonb_agg(elem), '[]'::jsonb)
        FROM jsonb_array_elements(v_deck) WITH ORDINALITY AS t(elem, ord)
        WHERE ord < COALESCE(jsonb_array_length(v_deck),1)
      );
    END LOOP;

    UPDATE game_states
    SET
      tricks = v_tricks,
      table_cards = '[]'::jsonb,
      team_scores = v_team_scores,
      current_player_index = v_winner_abs_pos,
      current_player = v_winner_abs_pos,
      deck = v_deck,
      hands = v_hands,
      last_action = jsonb_build_object('type','end_trick','winner',v_winner_abs_pos,'points',v_winner->>'points','timestamp', NOW()),
      version = version + 1,
      updated_at = NOW()
    WHERE id = v_state.id
    RETURNING to_json(game_states) INTO v_result;
  END IF;

  RETURN v_result;
END;
$$;

-- Unified play_card: moves a card to table_cards, advances turn, handles end-of-trick
CREATE OR REPLACE FUNCTION play_card(
  p_game_state_id UUID,
  p_card_id TEXT,
  p_expected_version INTEGER DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_player_idx INTEGER := NULL;
  v_players JSONB;
  v_result JSONB;
  i INTEGER;
  v_turn_idx INTEGER;
BEGIN
  -- Current user
  SELECT id INTO v_user_id FROM users WHERE auth_user_id = auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Load players to map seat index from auth user
  SELECT players INTO v_players FROM game_states WHERE id = p_game_state_id;
  IF v_players IS NULL THEN
    RAISE EXCEPTION 'Game not found';
  END IF;
  -- Determine player index from players JSON (seat order)
  FOR i IN 0..COALESCE(jsonb_array_length(v_players), 0)-1 LOOP
    IF (v_players->i->>'id')::uuid = v_user_id THEN
      v_player_idx := i;
      EXIT;
    END IF;
  END LOOP;
  IF v_player_idx IS NULL THEN
    RAISE EXCEPTION 'Player not in game';
  END IF;

  -- Delegate to internal seat-driven function
  RETURN apply_play_card(
    p_game_state_id := p_game_state_id,
    p_actor_index := v_player_idx,
    p_card_id := p_card_id,
    p_expected_version := p_expected_version
  );
END;
$$;


