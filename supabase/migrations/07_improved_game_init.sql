-- Improved version with better separation of concerns and validation

-- Helper function to create Spanish deck
CREATE OR REPLACE FUNCTION create_spanish_deck() 
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_deck JSONB := '[]'::jsonb;
  v_suits TEXT[] := ARRAY['oros', 'copas', 'espadas', 'bastos'];
  v_values INTEGER[] := ARRAY[1, 2, 3, 4, 5, 6, 7, 10, 11, 12];
  v_suit TEXT;
  v_value INTEGER;
BEGIN
  FOREACH v_suit IN ARRAY v_suits LOOP
    FOREACH v_value IN ARRAY v_values LOOP
      v_deck := v_deck || jsonb_build_object(
        'suit', v_suit,
        'value', v_value,
        'id', v_suit || '_' || v_value
      );
    END LOOP;
  END LOOP;
  
  -- Validate deck has exactly 40 cards
  IF jsonb_array_length(v_deck) != 40 THEN
    RAISE EXCEPTION 'Invalid deck size: %', jsonb_array_length(v_deck);
  END IF;
  
  RETURN v_deck;
END;
$$;

-- Improved shuffle using better randomization
CREATE OR REPLACE FUNCTION shuffle_deck(p_deck JSONB, p_seed INTEGER DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_shuffled JSONB;
BEGIN
  -- If seed provided, use it for reproducible shuffles (testing)
  IF p_seed IS NOT NULL THEN
    PERFORM setseed(p_seed::real / 2147483647);
  END IF;
  
  WITH shuffled AS (
    SELECT jsonb_array_elements(p_deck) AS card
    ORDER BY random()
  )
  SELECT jsonb_agg(card) INTO v_shuffled FROM shuffled;
  
  RETURN v_shuffled;
END;
$$;

-- Simplified game initialization
CREATE OR REPLACE FUNCTION initialize_game_state_v2(
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
  v_state_id UUID;
  v_player_count INTEGER;
BEGIN
  -- Get and validate players
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', user_id,
      'position', position,
      'team', team,
      'is_ai', is_ai
    ) ORDER BY position
  ), COUNT(*) 
  INTO v_players, v_player_count
  FROM room_players
  WHERE room_id = p_room_id;
  
  IF v_player_count != 4 THEN
    RAISE EXCEPTION 'Game requires exactly 4 players, found %', v_player_count;
  END IF;

  -- Create and shuffle deck
  v_deck := shuffle_deck(create_spanish_deck());
  
  -- Deal cards efficiently using array slicing
  v_hands := jsonb_build_object(
    '0', v_deck #> '{0,1,2,3,4,5}',
    '1', v_deck #> '{6,7,8,9,10,11}',
    '2', v_deck #> '{12,13,14,15,16,17}',
    '3', v_deck #> '{18,19,20,21,22,23}'
  );
  
  -- Set trump (card 24) and remaining deck (25-39)
  v_trump_card := v_deck->24;
  
  WITH remaining AS (
    SELECT jsonb_array_elements(v_deck) WITH ORDINALITY AS t(card, idx)
    WHERE idx > 25 AND idx <= 40
  )
  SELECT jsonb_agg(card) INTO v_deck FROM remaining;

  -- Create game state atomically
  INSERT INTO game_states (
    room_id, players, hands, deck, trump_card, trump_suit,
    table_cards, tricks, scores, current_player, phase, version
  ) VALUES (
    p_room_id, v_players, v_hands, v_deck, v_trump_card, 
    v_trump_card->>'suit', '[]'::jsonb, '[]'::jsonb,
    jsonb_build_object('0', 0, '1', 0), 0, 'playing', 0
  ) RETURNING id INTO v_state_id;

  -- Update room status
  UPDATE rooms 
  SET status = 'playing', started_at = NOW()
  WHERE id = p_room_id;

  RETURN json_build_object(
    'success', true,
    'state_id', v_state_id,
    'trump_suit', v_trump_card->>'suit'
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Game initialization failed: %', SQLERRM;
END;
$$;