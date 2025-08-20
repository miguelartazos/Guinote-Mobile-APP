-- Complete game logic functions for Guiñote
-- This file contains the complete implementation of all game functions

-- Function to shuffle an array (used for deck shuffling)
CREATE OR REPLACE FUNCTION shuffle_array(arr JSON) RETURNS JSON AS $$
DECLARE
  shuffled JSON := '[]'::JSON;
  temp JSON;
  remaining JSON := arr;
  idx INTEGER;
  len INTEGER;
BEGIN
  len := json_array_length(arr);
  
  FOR i IN 1..len LOOP
    idx := floor(random() * json_array_length(remaining))::INT;
    temp := remaining->idx;
    shuffled := shuffled || jsonb_build_array(temp);
    remaining := (
      SELECT json_agg(elem) 
      FROM json_array_elements(remaining) WITH ORDINALITY AS t(elem, ord)
      WHERE ord - 1 != idx
    );
  END LOOP;
  
  RETURN shuffled;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate card value for trick winner determination
CREATE OR REPLACE FUNCTION get_card_value(
  p_card JSON,
  p_trump_suit TEXT,
  p_lead_suit TEXT
) RETURNS INTEGER AS $$
DECLARE
  v_rank INTEGER;
  v_suit TEXT;
  v_base_value INTEGER;
BEGIN
  v_rank := (p_card->>'rank')::INTEGER;
  v_suit := p_card->>'suit';
  
  -- Base values for cards
  CASE v_rank
    WHEN 1 THEN v_base_value := 11;  -- As
    WHEN 3 THEN v_base_value := 10;  -- Tres
    WHEN 12 THEN v_base_value := 4;  -- Rey
    WHEN 11 THEN v_base_value := 3;  -- Caballo
    WHEN 10 THEN v_base_value := 2;  -- Sota
    ELSE v_base_value := 0;  -- 4,5,6,7
  END CASE;
  
  -- Trump cards always win
  IF v_suit = p_trump_suit THEN
    RETURN 1000 + v_base_value;
  -- Cards of lead suit
  ELSIF v_suit = p_lead_suit THEN
    RETURN 100 + v_base_value;
  -- Other cards can't win
  ELSE
    RETURN v_base_value;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to determine trick winner
CREATE OR REPLACE FUNCTION determine_trick_winner(
  p_trick JSON,
  p_trump_suit TEXT
) RETURNS JSON AS $$
DECLARE
  v_lead_suit TEXT;
  v_winner_idx INTEGER := 0;
  v_winner_value INTEGER := 0;
  v_current_value INTEGER;
  v_total_points INTEGER := 0;
  v_card JSON;
BEGIN
  -- Get lead suit from first card
  v_lead_suit := p_trick->0->'card'->>'suit';
  
  -- Find winner and calculate points
  FOR i IN 0..json_array_length(p_trick) - 1 LOOP
    v_card := p_trick->i->'card';
    v_current_value := get_card_value(v_card, p_trump_suit, v_lead_suit);
    
    IF v_current_value > v_winner_value THEN
      v_winner_value := v_current_value;
      v_winner_idx := i;
    END IF;
    
    -- Add card points
    CASE (v_card->>'rank')::INTEGER
      WHEN 1 THEN v_total_points := v_total_points + 11;
      WHEN 3 THEN v_total_points := v_total_points + 10;
      WHEN 12 THEN v_total_points := v_total_points + 4;
      WHEN 11 THEN v_total_points := v_total_points + 3;
      WHEN 10 THEN v_total_points := v_total_points + 2;
      ELSE v_total_points := v_total_points + 0;
    END CASE;
  END LOOP;
  
  RETURN json_build_object(
    'winner_position', v_winner_idx,
    'winner_player_id', p_trick->v_winner_idx->>'player_id',
    'points', v_total_points
  );
END;
$$ LANGUAGE plpgsql;

-- Enhanced play_card function with complete game logic
CREATE OR REPLACE FUNCTION play_card(
  p_game_state_id UUID,
  p_card_id TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_game game_states%ROWTYPE;
  v_user_id UUID;
  v_player_idx INTEGER;
  v_card JSON;
  v_new_trick JSON;
  v_trick_winner JSON;
  v_new_hands JSON;
  v_new_deck JSON;
  v_cards_to_deal JSON;
  v_is_last_trick BOOLEAN;
BEGIN
  -- Get current user
  SELECT id INTO v_user_id FROM users WHERE auth_user_id = auth.uid();
  
  -- Lock and get game state
  SELECT * INTO v_game FROM game_states WHERE id = p_game_state_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game not found';
  END IF;
  
  -- Find player index
  FOR i IN 0..json_array_length(v_game.players) - 1 LOOP
    IF v_game.players->i->>'id' = v_user_id::TEXT THEN
      v_player_idx := i;
      EXIT;
    END IF;
  END LOOP;
  
  IF v_player_idx IS NULL THEN
    RAISE EXCEPTION 'Player not in game';
  END IF;
  
  IF v_player_idx != v_game.current_player_index THEN
    RAISE EXCEPTION 'Not your turn';
  END IF;
  
  -- Find and remove card from hand
  v_new_hands := v_game.hands;
  v_card := NULL;
  
  FOR i IN 0..json_array_length(v_new_hands->v_player_idx) - 1 LOOP
    IF v_new_hands->v_player_idx->i->>'id' = p_card_id THEN
      v_card := v_new_hands->v_player_idx->i;
      -- Remove card from hand
      v_new_hands := jsonb_set(
        v_new_hands::jsonb, 
        ARRAY[v_player_idx::TEXT], 
        (
          SELECT json_agg(elem)
          FROM json_array_elements(v_new_hands->v_player_idx) WITH ORDINALITY AS t(elem, ord)
          WHERE ord - 1 != i
        )::jsonb
      );
      EXIT;
    END IF;
  END LOOP;
  
  IF v_card IS NULL THEN
    RAISE EXCEPTION 'Card not in hand';
  END IF;
  
  -- Add card to current trick
  v_new_trick := v_game.current_trick || jsonb_build_array(
    json_build_object(
      'player_id', v_user_id,
      'card', v_card,
      'position', v_player_idx
    )
  );
  
  -- Check if trick is complete
  IF json_array_length(v_new_trick) = 4 THEN
    -- Determine winner
    v_trick_winner := determine_trick_winner(v_new_trick, v_game.trump_suit);
    
    -- Update scores
    UPDATE game_states
    SET 
      current_trick = '[]'::JSON,
      last_trick = v_new_trick,
      last_trick_winner = (v_trick_winner->>'winner_player_id')::UUID,
      current_player_index = (v_trick_winner->>'winner_position')::INTEGER,
      hands = v_new_hands,
      team_scores = jsonb_set(
        team_scores::jsonb,
        ARRAY[((v_trick_winner->>'winner_position')::INTEGER % 2)::TEXT],
        ((team_scores->((v_trick_winner->>'winner_position')::INTEGER % 2))::INTEGER + 
         (v_trick_winner->>'points')::INTEGER)::TEXT::jsonb
      ),
      version = version + 1
    WHERE id = p_game_state_id;
    
    -- Check if we need to deal more cards (arrastre phase)
    v_new_deck := v_game.deck;
    v_is_last_trick := json_array_length(v_new_hands->0) = 0;
    
    IF json_array_length(v_new_deck) > 0 AND NOT v_is_last_trick THEN
      -- Deal cards in winner-first order
      v_cards_to_deal := '[]'::JSON;
      FOR i IN 0..3 LOOP
        IF json_array_length(v_new_deck) > 0 THEN
          v_cards_to_deal := v_cards_to_deal || jsonb_build_array(v_new_deck->0);
          v_new_deck := (
            SELECT json_agg(elem)
            FROM json_array_elements(v_new_deck) WITH ORDINALITY AS t(elem, ord)
            WHERE ord > 1
          );
        END IF;
      END LOOP;
      
      -- Add cards to hands
      FOR i IN 0..json_array_length(v_cards_to_deal) - 1 LOOP
        DECLARE
          v_target_player INTEGER;
        BEGIN
          v_target_player := ((v_trick_winner->>'winner_position')::INTEGER + i) % 4;
          v_new_hands := jsonb_set(
            v_new_hands::jsonb,
            ARRAY[v_target_player::TEXT],
            (v_new_hands->v_target_player || jsonb_build_array(v_cards_to_deal->i))::jsonb
          );
        END;
      END LOOP;
      
      UPDATE game_states
      SET 
        hands = v_new_hands,
        deck = v_new_deck
      WHERE id = p_game_state_id;
    END IF;
    
    -- Check for game end
    IF v_is_last_trick THEN
      -- Add remaining 10 points to last trick winner
      UPDATE game_states
      SET 
        team_scores = jsonb_set(
          team_scores::jsonb,
          ARRAY[((v_trick_winner->>'winner_position')::INTEGER % 2)::TEXT],
          ((team_scores->((v_trick_winner->>'winner_position')::INTEGER % 2))::INTEGER + 10)::TEXT::jsonb
        ),
        phase = 'scoring'
      WHERE id = p_game_state_id;
    END IF;
  ELSE
    -- Just update with new card played
    UPDATE game_states
    SET 
      current_trick = v_new_trick,
      current_player_index = (v_game.current_player_index + 1) % 4,
      hands = v_new_hands,
      version = version + 1
    WHERE id = p_game_state_id;
  END IF;
  
  RETURN json_build_object('success', TRUE);
END;
$$;

-- Function to handle cante (20/40 declaration)
CREATE OR REPLACE FUNCTION declare_cante(
  p_game_state_id UUID,
  p_suit TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_game game_states%ROWTYPE;
  v_user_id UUID;
  v_player_idx INTEGER;
  v_team_idx INTEGER;
  v_points INTEGER;
  v_cantes JSON;
BEGIN
  -- Get current user
  SELECT id INTO v_user_id FROM users WHERE auth_user_id = auth.uid();
  
  -- Get game state
  SELECT * INTO v_game FROM game_states WHERE id = p_game_state_id FOR UPDATE;
  
  -- Find player index
  FOR i IN 0..json_array_length(v_game.players) - 1 LOOP
    IF v_game.players->i->>'id' = v_user_id::TEXT THEN
      v_player_idx := i;
      v_team_idx := i % 2;
      EXIT;
    END IF;
  END LOOP;
  
  -- Check if player has the cards (Rey and Caballo of the suit)
  DECLARE
    v_has_rey BOOLEAN := FALSE;
    v_has_caballo BOOLEAN := FALSE;
    v_hand JSON;
  BEGIN
    v_hand := v_game.hands->v_player_idx;
    
    FOR i IN 0..json_array_length(v_hand) - 1 LOOP
      IF v_hand->i->>'suit' = p_suit THEN
        IF (v_hand->i->>'rank')::INTEGER = 12 THEN
          v_has_rey := TRUE;
        ELSIF (v_hand->i->>'rank')::INTEGER = 11 THEN
          v_has_caballo := TRUE;
        END IF;
      END IF;
    END LOOP;
    
    IF NOT (v_has_rey AND v_has_caballo) THEN
      RAISE EXCEPTION 'You don''t have the required cards for cante';
    END IF;
  END;
  
  -- Calculate points (40 for trump suit, 20 for others)
  IF p_suit = v_game.trump_suit THEN
    v_points := 40;
  ELSE
    v_points := 20;
  END IF;
  
  -- Add cante to team's cantes
  v_cantes := COALESCE(v_game.cantes->v_team_idx, '[]'::JSON);
  v_cantes := v_cantes || jsonb_build_array(
    json_build_object(
      'suit', p_suit,
      'points', v_points,
      'player_id', v_user_id,
      'is_visible', v_points = 20  -- 20s are always visible
    )
  );
  
  -- Update game state
  UPDATE game_states
  SET 
    cantes = jsonb_set(
      COALESCE(cantes, '{}'::jsonb)::jsonb,
      ARRAY[v_team_idx::TEXT],
      v_cantes::jsonb
    ),
    team_scores = jsonb_set(
      team_scores::jsonb,
      ARRAY[v_team_idx::TEXT],
      ((team_scores->v_team_idx)::INTEGER + v_points)::TEXT::jsonb
    ),
    version = version + 1
  WHERE id = p_game_state_id;
  
  RETURN json_build_object(
    'success', TRUE,
    'points', v_points
  );
END;
$$;

-- Function to exchange 7 of trumps
CREATE OR REPLACE FUNCTION exchange_seven(
  p_game_state_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_game game_states%ROWTYPE;
  v_user_id UUID;
  v_player_idx INTEGER;
  v_seven_card JSON;
  v_trump_card JSON;
  v_new_hands JSON;
BEGIN
  -- Get current user
  SELECT id INTO v_user_id FROM users WHERE auth_user_id = auth.uid();
  
  -- Get game state
  SELECT * INTO v_game FROM game_states WHERE id = p_game_state_id FOR UPDATE;
  
  -- Find player index
  FOR i IN 0..json_array_length(v_game.players) - 1 LOOP
    IF v_game.players->i->>'id' = v_user_id::TEXT THEN
      v_player_idx := i;
      EXIT;
    END IF;
  END LOOP;
  
  -- Check if it's arrastre phase (deck not empty)
  IF json_array_length(v_game.deck) = 0 THEN
    RAISE EXCEPTION 'Cannot exchange in vueltas phase';
  END IF;
  
  -- Find 7 of trumps in player's hand
  v_new_hands := v_game.hands;
  FOR i IN 0..json_array_length(v_new_hands->v_player_idx) - 1 LOOP
    IF v_new_hands->v_player_idx->i->>'suit' = v_game.trump_suit AND
       (v_new_hands->v_player_idx->i->>'rank')::INTEGER = 7 THEN
      v_seven_card := v_new_hands->v_player_idx->i;
      
      -- Get current trump card
      v_trump_card := v_game.trump_card;
      
      -- Exchange cards
      v_new_hands := jsonb_set(
        v_new_hands::jsonb,
        ARRAY[v_player_idx::TEXT, i::TEXT],
        v_trump_card::jsonb
      );
      
      -- Update game state
      UPDATE game_states
      SET 
        hands = v_new_hands,
        trump_card = v_seven_card,
        version = version + 1
      WHERE id = p_game_state_id;
      
      RETURN json_build_object('success', TRUE);
    END IF;
  END LOOP;
  
  RAISE EXCEPTION 'You don''t have the 7 of trumps';
END;
$$;

-- Function to handle renuncio (declaring opponent's illegal play)
CREATE OR REPLACE FUNCTION declare_renuncio(
  p_game_state_id UUID,
  p_reason TEXT
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_game game_states%ROWTYPE;
  v_user_id UUID;
  v_player_idx INTEGER;
  v_team_idx INTEGER;
BEGIN
  -- Get current user
  SELECT id INTO v_user_id FROM users WHERE auth_user_id = auth.uid();
  
  -- Get game state
  SELECT * INTO v_game FROM game_states WHERE id = p_game_state_id FOR UPDATE;
  
  -- Find player's team
  FOR i IN 0..json_array_length(v_game.players) - 1 LOOP
    IF v_game.players->i->>'id' = v_user_id::TEXT THEN
      v_team_idx := i % 2;
      EXIT;
    END IF;
  END LOOP;
  
  -- Award all points to declaring team
  UPDATE game_states
  SET 
    team_scores = CASE 
      WHEN v_team_idx = 0 THEN '[130, 0]'::JSON
      ELSE '[0, 130]'::JSON
    END,
    phase = 'scoring',
    version = version + 1
  WHERE id = p_game_state_id;
  
  RETURN json_build_object(
    'success', TRUE,
    'reason', p_reason
  );
END;
$$;

-- Function to continue from scoring to next game
CREATE OR REPLACE FUNCTION continue_from_scoring(
  p_game_state_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_game game_states%ROWTYPE;
  v_room_id UUID;
  v_new_dealer INTEGER;
  v_new_game_id UUID;
BEGIN
  -- Get game state
  SELECT * INTO v_game FROM game_states WHERE id = p_game_state_id;
  
  IF v_game.phase != 'scoring' THEN
    RAISE EXCEPTION 'Game not in scoring phase';
  END IF;
  
  -- Get room
  v_room_id := v_game.room_id;
  
  -- Calculate new dealer (next player)
  v_new_dealer := (v_game.dealer_index + 1) % 4;
  
  -- Create new game state
  INSERT INTO game_states (
    room_id,
    phase,
    players,
    dealer_index,
    current_player_index,
    team_scores,
    match_scores
  ) VALUES (
    v_room_id,
    'dealing',
    v_game.players,
    v_new_dealer,
    v_new_dealer,
    '[0, 0]'::JSON,
    json_build_object(
      'team1', (v_game.match_scores->>'team1')::INTEGER + 
               CASE WHEN (v_game.team_scores->0)::INTEGER >= 101 THEN 1 ELSE 0 END,
      'team2', (v_game.match_scores->>'team2')::INTEGER + 
               CASE WHEN (v_game.team_scores->1)::INTEGER >= 101 THEN 1 ELSE 0 END,
      'team1_cotos', COALESCE((v_game.match_scores->>'team1_cotos')::INTEGER, 0),
      'team2_cotos', COALESCE((v_game.match_scores->>'team2_cotos')::INTEGER, 0)
    )
  ) RETURNING id INTO v_new_game_id;
  
  -- Initialize new game
  PERFORM initialize_game_state(v_room_id);
  
  RETURN json_build_object(
    'success', TRUE,
    'new_game_id', v_new_game_id
  );
END;
$$;

-- Function to add AI players to a room
CREATE OR REPLACE FUNCTION add_ai_player(
  p_room_id UUID,
  p_difficulty TEXT DEFAULT 'medium'
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room rooms%ROWTYPE;
  v_position INTEGER;
  v_ai_user_id UUID;
BEGIN
  -- Get room
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  
  IF v_room.status != 'waiting' THEN
    RAISE EXCEPTION 'Game already started';
  END IF;
  
  IF v_room.current_players >= v_room.max_players THEN
    RAISE EXCEPTION 'Room is full';
  END IF;
  
  -- Find next available position
  FOR i IN 0..3 LOOP
    IF NOT EXISTS (
      SELECT 1 FROM room_players 
      WHERE room_id = p_room_id AND position = i
    ) THEN
      v_position := i;
      EXIT;
    END IF;
  END LOOP;
  
  -- Create AI user ID
  v_ai_user_id := gen_random_uuid();
  
  -- Add AI player
  INSERT INTO room_players (
    room_id, 
    user_id, 
    position, 
    team, 
    is_ready, 
    is_ai,
    ai_difficulty
  ) VALUES (
    p_room_id,
    v_ai_user_id,
    v_position,
    v_position % 2,
    TRUE,  -- AI is always ready
    TRUE,
    p_difficulty
  );
  
  -- Update player count
  UPDATE rooms 
  SET current_players = current_players + 1
  WHERE id = p_room_id;
  
  RETURN json_build_object(
    'success', TRUE,
    'position', v_position,
    'ai_id', v_ai_user_id
  );
END;
$$;

-- Function to remove AI player
CREATE OR REPLACE FUNCTION remove_ai_player(
  p_room_id UUID,
  p_position INTEGER
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Remove AI player at position
  DELETE FROM room_players
  WHERE room_id = p_room_id 
    AND position = p_position 
    AND is_ai = TRUE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'No AI player at this position';
  END IF;
  
  -- Update player count
  UPDATE rooms 
  SET current_players = current_players - 1
  WHERE id = p_room_id;
  
  RETURN json_build_object('success', TRUE);
END;
$$;