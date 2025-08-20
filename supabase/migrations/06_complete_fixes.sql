-- Complete fixes for Supabase implementation
-- This migration addresses all remaining issues

-- ================================================
-- 1. FIX RLS POLICIES FOR room_players
-- ================================================
DROP POLICY IF EXISTS "room_players_select" ON room_players;
DROP POLICY IF EXISTS "room_players_insert" ON room_players;
DROP POLICY IF EXISTS "room_players_update" ON room_players;
DROP POLICY IF EXISTS "room_players_delete" ON room_players;

-- Simplified policies to avoid recursion
CREATE POLICY "room_players_select" ON room_players FOR SELECT
  USING (true);

CREATE POLICY "room_players_insert" ON room_players FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "room_players_update" ON room_players FOR UPDATE
  USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

CREATE POLICY "room_players_delete" ON room_players FOR DELETE
  USING (
    user_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- ================================================
-- 2. COMPLETE GAME INITIALIZATION FUNCTION
-- ================================================
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
  v_card JSONB;
  i INTEGER;
  player_count INTEGER;
BEGIN
  -- Get players in position order
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', user_id,
      'position', position,
      'team', team,
      'is_ai', is_ai
    ) ORDER BY position
  ) INTO v_players
  FROM room_players
  WHERE room_id = p_room_id;

  player_count := jsonb_array_length(v_players);
  
  IF player_count != 4 THEN
    RAISE EXCEPTION 'Game requires exactly 4 players';
  END IF;

  -- Create Spanish deck (40 cards)
  v_deck := '[]'::jsonb;
  FOR suit IN SELECT unnest(ARRAY['oros', 'copas', 'espadas', 'bastos'])
  LOOP
    FOR value IN SELECT unnest(ARRAY[1, 2, 3, 4, 5, 6, 7, 10, 11, 12])
    LOOP
      v_deck := v_deck || jsonb_build_object(
        'suit', suit,
        'value', value,
        'id', suit || '_' || value
      );
    END LOOP;
  END LOOP;

  -- Shuffle deck using random ordering
  WITH shuffled AS (
    SELECT jsonb_array_elements(v_deck) AS card
    ORDER BY random()
  )
  SELECT jsonb_agg(card) INTO v_deck FROM shuffled;

  -- Deal 6 cards to each player
  v_hands := jsonb_build_object(
    '0', jsonb_build_array(),
    '1', jsonb_build_array(),
    '2', jsonb_build_array(),
    '3', jsonb_build_array()
  );

  -- Deal cards (6 per player)
  FOR i IN 0..23 LOOP
    v_card := v_deck->i;
    v_hands := jsonb_set(
      v_hands,
      ARRAY[(i % 4)::text],
      (v_hands->((i % 4)::text)) || v_card
    );
  END LOOP;

  -- Remove dealt cards from deck and set trump
  v_trump_card := v_deck->24;
  v_trump_suit := v_trump_card->>'suit';
  
  -- Keep remaining cards in deck (cards 25-39)
  WITH remaining AS (
    SELECT jsonb_array_elements(v_deck) WITH ORDINALITY AS t(card, idx)
    WHERE idx > 25
  )
  SELECT jsonb_agg(card) INTO v_deck FROM remaining;

  -- Create game state
  INSERT INTO game_states (
    room_id,
    players,
    hands,
    deck,
    trump_card,
    trump_suit,
    table_cards,
    tricks,
    scores,
    current_player,
    round_winner,
    phase,
    cantes,
    arrastre_declared,
    vueltas_given,
    last_trick_winner,
    version
  ) VALUES (
    p_room_id,
    v_players,
    v_hands,
    v_deck,
    v_trump_card,
    v_trump_suit,
    '[]'::jsonb,
    '[]'::jsonb,
    jsonb_build_object('0', 0, '1', 0),
    0,
    null,
    'playing',
    '[]'::jsonb,
    false,
    false,
    null,
    0
  ) RETURNING id INTO v_state_id;

  -- Update room status
  UPDATE rooms 
  SET status = 'playing', started_at = NOW()
  WHERE id = p_room_id;

  RETURN json_build_object(
    'success', true,
    'state_id', v_state_id,
    'trump_suit', v_trump_suit
  );
END;
$$;

-- ================================================
-- 3. UPDATE start_game TO USE initialize_game_state
-- ================================================
CREATE OR REPLACE FUNCTION start_game(
  p_room_id UUID
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_result JSON;
  v_player_count INTEGER;
BEGIN
  -- Check room exists and is waiting
  IF NOT EXISTS (
    SELECT 1 FROM rooms 
    WHERE id = p_room_id 
    AND status = 'waiting'
  ) THEN
    RAISE EXCEPTION 'Room not found or not in waiting status';
  END IF;

  -- Check we have exactly 4 players
  SELECT COUNT(*) INTO v_player_count
  FROM room_players
  WHERE room_id = p_room_id;

  IF v_player_count != 4 THEN
    RAISE EXCEPTION 'Game requires exactly 4 players, found %', v_player_count;
  END IF;

  -- Initialize the game state
  SELECT initialize_game_state(p_room_id) INTO v_result;

  RETURN v_result;
END;
$$;

-- ================================================
-- 4. ADD game_stats INSERT POLICY
-- ================================================
CREATE POLICY "game_stats_insert" ON game_stats FOR INSERT
  WITH CHECK (
    player_id IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- ================================================
-- 5. CREATE STORAGE BUCKET FOR VOICE MESSAGES
-- ================================================
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES (
  'voice-messages',
  'voice-messages',
  false,
  false,
  5242880, -- 5MB limit
  ARRAY['audio/mpeg', 'audio/mp4', 'audio/webm', 'audio/ogg', 'audio/wav']
) ON CONFLICT (id) DO NOTHING;

-- Storage policies for voice messages
CREATE POLICY "voice_messages_upload" ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-messages' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM room_players rp
    JOIN users u ON u.id = rp.user_id
    WHERE u.auth_user_id = auth.uid()
    AND rp.room_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "voice_messages_download" ON storage.objects FOR SELECT
USING (
  bucket_id = 'voice-messages' AND
  EXISTS (
    SELECT 1 FROM room_players rp
    WHERE rp.room_id::text = (storage.foldername(name))[1]
  )
);

CREATE POLICY "voice_messages_delete" ON storage.objects FOR DELETE
USING (
  bucket_id = 'voice-messages' AND
  auth.uid() IS NOT NULL AND
  EXISTS (
    SELECT 1 FROM room_players rp
    JOIN users u ON u.id = rp.user_id
    WHERE u.auth_user_id = auth.uid()
    AND rp.room_id::text = (storage.foldername(name))[1]
  )
);

-- ================================================
-- 6. ADD REALTIME PRESENCE FUNCTION
-- ================================================
CREATE OR REPLACE FUNCTION update_user_presence(
  p_is_online BOOLEAN DEFAULT true
) RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  -- Get user id
  SELECT id INTO v_user_id
  FROM users
  WHERE auth_user_id = auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User not found';
  END IF;

  -- Update presence
  UPDATE users
  SET 
    is_online = p_is_online,
    last_seen_at = NOW()
  WHERE id = v_user_id;

  RETURN json_build_object(
    'success', true,
    'user_id', v_user_id,
    'is_online', p_is_online
  );
END;
$$;

-- ================================================
-- 7. GRANT PERMISSIONS
-- ================================================
GRANT USAGE ON SCHEMA storage TO authenticated;
GRANT ALL ON storage.objects TO authenticated;
GRANT ALL ON storage.buckets TO authenticated;