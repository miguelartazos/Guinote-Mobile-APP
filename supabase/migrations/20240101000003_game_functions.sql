-- Function to generate a unique room code
CREATE OR REPLACE FUNCTION generate_room_code() RETURNS TEXT AS $$
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
$$ LANGUAGE plpgsql;

-- Function to create a room
CREATE OR REPLACE FUNCTION create_room(
  p_game_mode TEXT DEFAULT 'casual',
  p_is_public BOOLEAN DEFAULT TRUE
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
  -- Get current user
  SELECT id INTO v_user_id FROM users WHERE auth_user_id = auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Generate unique room code
  LOOP
    v_room_code := generate_room_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM rooms WHERE code = v_room_code);
    v_attempts := v_attempts + 1;
    IF v_attempts > 10 THEN
      RAISE EXCEPTION 'Could not generate unique room code';
    END IF;
  END LOOP;
  
  -- Create room
  INSERT INTO rooms (code, host_id, status, game_mode, is_public, current_players)
  VALUES (v_room_code, v_user_id, 'waiting', p_game_mode, p_is_public, 1)
  RETURNING id INTO v_room_id;
  
  -- Add host as first player
  INSERT INTO room_players (room_id, user_id, position, team, is_ready)
  VALUES (v_room_id, v_user_id, 0, 0, FALSE);
  
  RETURN json_build_object(
    'success', TRUE,
    'room_id', v_room_id,
    'code', v_room_code
  );
END;
$$;

-- Function to join a room
CREATE OR REPLACE FUNCTION join_room(
  p_room_code TEXT,
  p_position INTEGER DEFAULT NULL
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room rooms%ROWTYPE;
  v_user_id UUID;
  v_result JSON;
BEGIN
  -- Get current user
  SELECT id INTO v_user_id FROM users WHERE auth_user_id = auth.uid();
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;
  
  -- Lock and get room
  SELECT * INTO v_room FROM rooms WHERE code = p_room_code FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  
  IF v_room.status != 'waiting' THEN
    RAISE EXCEPTION 'Game already started';
  END IF;
  
  IF v_room.current_players >= v_room.max_players THEN
    RAISE EXCEPTION 'Room is full';
  END IF;
  
  -- Check if already in room
  IF EXISTS (SELECT 1 FROM room_players WHERE room_id = v_room.id AND user_id = v_user_id) THEN
    RETURN json_build_object(
      'success', TRUE,
      'room_id', v_room.id,
      'already_joined', TRUE
    );
  END IF;
  
  -- Add player
  INSERT INTO room_players (room_id, user_id, position, team, is_ready)
  VALUES (
    v_room.id, 
    v_user_id, 
    COALESCE(p_position, v_room.current_players), 
    v_room.current_players % 2, 
    FALSE
  );
  
  -- Update player count
  UPDATE rooms SET current_players = current_players + 1 
  WHERE id = v_room.id;
  
  RETURN json_build_object(
    'success', TRUE,
    'room_id', v_room.id,
    'position', COALESCE(p_position, v_room.current_players)
  );
END;
$$;

-- Function to leave a room
CREATE OR REPLACE FUNCTION leave_room(p_room_id UUID) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_room rooms%ROWTYPE;
BEGIN
  -- Get current user
  SELECT id INTO v_user_id FROM users WHERE auth_user_id = auth.uid();
  
  -- Get room info
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  
  -- Remove player
  DELETE FROM room_players 
  WHERE room_id = p_room_id AND user_id = v_user_id;
  
  -- Update player count
  UPDATE rooms SET current_players = current_players - 1 
  WHERE id = p_room_id;
  
  -- If host left and room is waiting, transfer host or abandon room
  IF v_room.host_id = v_user_id AND v_room.status = 'waiting' THEN
    -- Try to transfer host to another player
    UPDATE rooms 
    SET host_id = (
      SELECT user_id FROM room_players 
      WHERE room_id = p_room_id 
      LIMIT 1
    )
    WHERE id = p_room_id;
    
    -- If no players left, mark as abandoned
    IF NOT EXISTS (SELECT 1 FROM room_players WHERE room_id = p_room_id) THEN
      UPDATE rooms SET status = 'abandoned' WHERE id = p_room_id;
    END IF;
  END IF;
  
  RETURN json_build_object('success', TRUE);
END;
$$;

-- Function to toggle ready status
CREATE OR REPLACE FUNCTION toggle_ready(p_room_id UUID) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_is_ready BOOLEAN;
BEGIN
  -- Get current user
  SELECT id INTO v_user_id FROM users WHERE auth_user_id = auth.uid();
  
  -- Toggle ready status
  UPDATE room_players 
  SET is_ready = NOT is_ready
  WHERE room_id = p_room_id AND user_id = v_user_id
  RETURNING is_ready INTO v_is_ready;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not in this room';
  END IF;
  
  RETURN json_build_object(
    'success', TRUE,
    'is_ready', v_is_ready
  );
END;
$$;

-- Function to initialize game state
CREATE OR REPLACE FUNCTION initialize_game_state(p_room_id UUID) RETURNS JSON
LANGUAGE plpgsql
AS $$
DECLARE
  v_deck JSON;
  v_hands JSON;
  v_trump JSON;
  v_scores JSON;
BEGIN
  -- Create deck
  v_deck := json_build_array(
    -- Oros
    json_build_object('suit', 'oros', 'rank', 1, 'id', 'oros-1'),
    json_build_object('suit', 'oros', 'rank', 3, 'id', 'oros-3'),
    json_build_object('suit', 'oros', 'rank', 4, 'id', 'oros-4'),
    json_build_object('suit', 'oros', 'rank', 5, 'id', 'oros-5'),
    json_build_object('suit', 'oros', 'rank', 6, 'id', 'oros-6'),
    json_build_object('suit', 'oros', 'rank', 7, 'id', 'oros-7'),
    json_build_object('suit', 'oros', 'rank', 10, 'id', 'oros-10'),
    json_build_object('suit', 'oros', 'rank', 11, 'id', 'oros-11'),
    json_build_object('suit', 'oros', 'rank', 12, 'id', 'oros-12'),
    -- Copas
    json_build_object('suit', 'copas', 'rank', 1, 'id', 'copas-1'),
    json_build_object('suit', 'copas', 'rank', 3, 'id', 'copas-3'),
    json_build_object('suit', 'copas', 'rank', 4, 'id', 'copas-4'),
    json_build_object('suit', 'copas', 'rank', 5, 'id', 'copas-5'),
    json_build_object('suit', 'copas', 'rank', 6, 'id', 'copas-6'),
    json_build_object('suit', 'copas', 'rank', 7, 'id', 'copas-7'),
    json_build_object('suit', 'copas', 'rank', 10, 'id', 'copas-10'),
    json_build_object('suit', 'copas', 'rank', 11, 'id', 'copas-11'),
    json_build_object('suit', 'copas', 'rank', 12, 'id', 'copas-12'),
    -- Espadas
    json_build_object('suit', 'espadas', 'rank', 1, 'id', 'espadas-1'),
    json_build_object('suit', 'espadas', 'rank', 3, 'id', 'espadas-3'),
    json_build_object('suit', 'espadas', 'rank', 4, 'id', 'espadas-4'),
    json_build_object('suit', 'espadas', 'rank', 5, 'id', 'espadas-5'),
    json_build_object('suit', 'espadas', 'rank', 6, 'id', 'espadas-6'),
    json_build_object('suit', 'espadas', 'rank', 7, 'id', 'espadas-7'),
    json_build_object('suit', 'espadas', 'rank', 10, 'id', 'espadas-10'),
    json_build_object('suit', 'espadas', 'rank', 11, 'id', 'espadas-11'),
    json_build_object('suit', 'espadas', 'rank', 12, 'id', 'espadas-12'),
    -- Bastos
    json_build_object('suit', 'bastos', 'rank', 1, 'id', 'bastos-1'),
    json_build_object('suit', 'bastos', 'rank', 3, 'id', 'bastos-3'),
    json_build_object('suit', 'bastos', 'rank', 4, 'id', 'bastos-4'),
    json_build_object('suit', 'bastos', 'rank', 5, 'id', 'bastos-5'),
    json_build_object('suit', 'bastos', 'rank', 6, 'id', 'bastos-6'),
    json_build_object('suit', 'bastos', 'rank', 7, 'id', 'bastos-7'),
    json_build_object('suit', 'bastos', 'rank', 10, 'id', 'bastos-10'),
    json_build_object('suit', 'bastos', 'rank', 11, 'id', 'bastos-11'),
    json_build_object('suit', 'bastos', 'rank', 12, 'id', 'bastos-12')
  );
  
  -- TODO: Shuffle deck and deal cards
  -- For now, return empty hands
  v_hands := json_build_array(
    json_build_array(),
    json_build_array(),
    json_build_array(),
    json_build_array()
  );
  
  -- Set trump (last card dealt)
  v_trump := json_build_object(
    'suit', 'oros',
    'card', 'oros-1'
  );
  
  -- Initialize scores
  v_scores := json_build_array(
    json_build_object('cardPoints', 0, 'lastTrick', false, 'cantes', '[]'::json, 'total', 0),
    json_build_object('cardPoints', 0, 'lastTrick', false, 'cantes', '[]'::json, 'total', 0)
  );
  
  RETURN json_build_object(
    'deck', v_deck,
    'hands', v_hands,
    'scores', v_scores,
    'trump', v_trump
  );
END;
$$;

-- Function to start a game
CREATE OR REPLACE FUNCTION start_game(p_room_id UUID) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_room rooms%ROWTYPE;
  v_user_id UUID;
  v_initial_state JSON;
BEGIN
  -- Get current user
  SELECT id INTO v_user_id FROM users WHERE auth_user_id = auth.uid();
  
  -- Lock room
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  
  -- Only host can start the game
  IF v_room.host_id != v_user_id THEN
    RAISE EXCEPTION 'Only host can start the game';
  END IF;
  
  IF v_room.status != 'waiting' THEN
    RAISE EXCEPTION 'Game already started';
  END IF;
  
  -- Check if all players are ready
  IF EXISTS (
    SELECT 1 FROM room_players 
    WHERE room_id = p_room_id 
    AND is_ready = FALSE
    AND is_ai = FALSE
  ) THEN
    RAISE EXCEPTION 'Not all players are ready';
  END IF;
  
  -- Initialize game state
  v_initial_state := initialize_game_state(p_room_id);
  
  -- Create game state
  INSERT INTO game_states (
    room_id, current_player, deck, hands, table_cards, 
    tricks, scores, trump, phase
  )
  VALUES (
    p_room_id, 0, 
    (v_initial_state->>'deck')::jsonb,
    (v_initial_state->>'hands')::jsonb,
    '[]'::jsonb,
    '[]'::jsonb,
    (v_initial_state->>'scores')::jsonb,
    (v_initial_state->>'trump')::jsonb,
    'initial'
  );
  
  -- Update room status
  UPDATE rooms 
  SET status = 'playing', started_at = NOW() 
  WHERE id = p_room_id;
  
  RETURN json_build_object(
    'success', TRUE,
    'state', v_initial_state
  );
END;
$$;

-- Function to play a card (simplified version)
CREATE OR REPLACE FUNCTION play_card(
  p_room_id UUID,
  p_card_id TEXT,
  p_expected_version INTEGER
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_state game_states%ROWTYPE;
  v_player_position INTEGER;
  v_result JSON;
BEGIN
  -- Get current user
  SELECT id INTO v_user_id FROM users WHERE auth_user_id = auth.uid();
  
  -- Get player position
  SELECT position INTO v_player_position
  FROM room_players
  WHERE room_id = p_room_id AND user_id = v_user_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Not in this room';
  END IF;
  
  -- Lock game state
  SELECT * INTO v_state
  FROM game_states
  WHERE room_id = p_room_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Game not found';
  END IF;
  
  -- Check version for optimistic concurrency control
  IF v_state.version != p_expected_version THEN
    RAISE EXCEPTION 'version_conflict' 
      USING DETAIL = json_build_object('actual', v_state.version)::text;
  END IF;
  
  -- Check if it's this player's turn
  IF v_state.current_player != v_player_position THEN
    RAISE EXCEPTION 'Not your turn';
  END IF;
  
  -- TODO: Implement full game logic
  -- - Validate card is in player's hand
  -- - Apply game rules
  -- - Update table cards
  -- - Check for trick completion
  -- - Calculate scores
  
  -- For now, just update last action and version
  UPDATE game_states
  SET
    last_action = jsonb_build_object(
      'type', 'play_card',
      'card', p_card_id,
      'player', v_player_position,
      'timestamp', NOW()
    ),
    version = v_state.version + 1,
    current_player = (v_state.current_player + 1) % 4
  WHERE id = v_state.id
  RETURNING to_json(game_states) INTO v_result;
  
  RETURN v_result;
END;
$$;

-- Function to add AI player
CREATE OR REPLACE FUNCTION add_ai_player(
  p_room_id UUID,
  p_difficulty TEXT DEFAULT 'medium',
  p_personality TEXT DEFAULT 'balanced'
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_room rooms%ROWTYPE;
  v_ai_id UUID;
  v_position INTEGER;
BEGIN
  -- Get current user
  SELECT id INTO v_user_id FROM users WHERE auth_user_id = auth.uid();
  
  -- Get room and check if user is host
  SELECT * INTO v_room FROM rooms WHERE id = p_room_id FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Room not found';
  END IF;
  
  IF v_room.host_id != v_user_id THEN
    RAISE EXCEPTION 'Only host can add AI players';
  END IF;
  
  IF v_room.status != 'waiting' THEN
    RAISE EXCEPTION 'Cannot add AI after game started';
  END IF;
  
  IF v_room.current_players >= v_room.max_players THEN
    RAISE EXCEPTION 'Room is full';
  END IF;
  
  -- Generate AI user ID
  v_ai_id := gen_random_uuid();
  v_position := v_room.current_players;
  
  -- Add AI player
  INSERT INTO room_players (
    room_id, user_id, position, team, is_ready, 
    is_ai, ai_difficulty, ai_personality
  )
  VALUES (
    p_room_id, v_ai_id, v_position, v_position % 2, TRUE,
    TRUE, p_difficulty, p_personality
  );
  
  -- Update player count
  UPDATE rooms SET current_players = current_players + 1 
  WHERE id = p_room_id;
  
  RETURN json_build_object(
    'success', TRUE,
    'ai_id', v_ai_id,
    'position', v_position
  );
END;
$$;