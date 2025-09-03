#!/usr/bin/env node

/**
 * Script to apply RPC functions individually for debugging
 * This helps identify which specific function might be causing issues
 */

require('dotenv').config();

const functions = {
  ensure_user_exists: `
CREATE OR REPLACE FUNCTION ensure_user_exists()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_auth_id UUID;
  v_email TEXT;
  v_metadata JSONB;
BEGIN
  v_auth_id := auth.uid();
  
  IF v_auth_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  
  SELECT id INTO v_user_id FROM public.users WHERE auth_user_id = v_auth_id;
  
  IF v_user_id IS NOT NULL THEN
    RETURN v_user_id;
  END IF;
  
  SELECT email, raw_user_meta_data INTO v_email, v_metadata
  FROM auth.users 
  WHERE id = v_auth_id;
  
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'Auth user not found';
  END IF;
  
  INSERT INTO public.users (
    id, auth_user_id, username, display_name, created_at
  )
  VALUES (
    gen_random_uuid(),
    v_auth_id,
    COALESCE(v_metadata->>'username', split_part(v_email, '@', 1)),
    COALESCE(v_metadata->>'display_name', v_metadata->>'username', split_part(v_email, '@', 1)),
    NOW()
  )
  ON CONFLICT (auth_user_id) DO UPDATE
    SET username = COALESCE(EXCLUDED.username, public.users.username)
  RETURNING id INTO v_user_id;
  
  RETURN v_user_id;
END;
$$;`,

  join_room: `
CREATE OR REPLACE FUNCTION join_room(p_room_code TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_room_id UUID;
  v_current_players INT;
  v_max_players INT;
  v_position INT;
  v_room_status TEXT;
BEGIN
  v_user_id := ensure_user_exists();
  
  SELECT id, current_players, max_players, status
  INTO v_room_id, v_current_players, v_max_players, v_room_status
  FROM rooms 
  WHERE UPPER(code) = UPPER(p_room_code)
  FOR UPDATE;
  
  IF v_room_id IS NULL THEN
    RETURN json_build_object('success', FALSE, 'error', 'Room not found');
  END IF;
  
  IF v_room_status != 'waiting' THEN
    RETURN json_build_object('success', FALSE, 'error', 'Game already started');
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM room_players 
    WHERE room_id = v_room_id AND user_id = v_user_id
  ) THEN
    RETURN json_build_object('success', TRUE, 'room_id', v_room_id, 'code', p_room_code, 'already_joined', TRUE);
  END IF;
  
  IF v_current_players >= v_max_players THEN
    RETURN json_build_object('success', FALSE, 'error', 'Room is full');
  END IF;
  
  v_position := v_current_players;
  INSERT INTO room_players (room_id, user_id, position, team, is_ready, joined_at)
  VALUES (v_room_id, v_user_id, v_position, v_position % 2, FALSE, NOW());
  
  UPDATE rooms 
  SET current_players = current_players + 1, last_activity_at = NOW()
  WHERE id = v_room_id;
  
  RETURN json_build_object('success', TRUE, 'room_id', v_room_id, 'code', p_room_code);
EXCEPTION
  WHEN OTHERS THEN
    RETURN json_build_object('success', FALSE, 'error', SQLERRM);
END;
$$;`,

  leave_room: `
CREATE OR REPLACE FUNCTION leave_room(p_room_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_host_id UUID;
  v_current_players INT;
BEGIN
  v_user_id := ensure_user_exists();
  
  SELECT host_id, current_players 
  INTO v_host_id, v_current_players
  FROM rooms 
  WHERE id = p_room_id;
  
  DELETE FROM room_players 
  WHERE room_id = p_room_id AND user_id = v_user_id;
  
  UPDATE rooms 
  SET current_players = GREATEST(0, current_players - 1), last_activity_at = NOW()
  WHERE id = p_room_id;
  
  IF v_host_id = v_user_id AND v_current_players > 1 THEN
    UPDATE rooms 
    SET host_id = (
      SELECT user_id FROM room_players 
      WHERE room_id = p_room_id 
      ORDER BY joined_at LIMIT 1
    )
    WHERE id = p_room_id;
  END IF;
  
  IF v_current_players <= 1 THEN
    UPDATE rooms 
    SET status = 'finished', finished_at = NOW()
    WHERE id = p_room_id;
  END IF;
END;
$$;`,

  toggle_ready: `
CREATE OR REPLACE FUNCTION toggle_ready(p_room_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := ensure_user_exists();
  
  UPDATE room_players 
  SET is_ready = NOT is_ready 
  WHERE room_id = p_room_id AND user_id = v_user_id;
  
  UPDATE rooms 
  SET last_activity_at = NOW()
  WHERE id = p_room_id;
END;
$$;`,

  start_game: `
CREATE OR REPLACE FUNCTION start_game(p_room_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_host_id UUID;
  v_ready_count INT;
BEGIN
  v_user_id := ensure_user_exists();
  
  SELECT host_id INTO v_host_id FROM rooms WHERE id = p_room_id;
  
  IF v_host_id != v_user_id THEN
    RETURN json_build_object('success', FALSE, 'error', 'Only host can start the game');
  END IF;
  
  SELECT COUNT(*) INTO v_ready_count
  FROM room_players 
  WHERE room_id = p_room_id AND is_ready = TRUE;
  
  IF v_ready_count < 4 THEN
    RETURN json_build_object('success', FALSE, 'error', 'All players must be ready');
  END IF;
  
  UPDATE rooms 
  SET status = 'playing', started_at = NOW(), last_activity_at = NOW()
  WHERE id = p_room_id;
  
  RETURN json_build_object('success', TRUE, 'room_id', p_room_id);
END;
$$;`
};

const permissions = `
-- Grant permissions
GRANT EXECUTE ON FUNCTION ensure_user_exists() TO authenticated;
GRANT EXECUTE ON FUNCTION join_room(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION leave_room(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_ready(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION start_game(UUID) TO authenticated;
`;

console.log('📝 SQL FUNCTIONS TO APPLY\n');
console.log('Copy each function below and run it in Supabase SQL Editor:\n');
console.log('================================\n');

Object.entries(functions).forEach(([name, sql], index) => {
  console.log(`-- ${index + 1}. ${name.toUpperCase()}`);
  console.log('-- Copy from here ---');
  console.log(sql.trim());
  console.log('-- Copy to here ---\n');
});

console.log('-- FINAL STEP: PERMISSIONS');
console.log('-- Copy from here ---');
console.log(permissions.trim());
console.log('-- Copy to here ---\n');

console.log('================================');
console.log('📋 INSTRUCTIONS:');
console.log('1. Go to Supabase Dashboard > SQL Editor');
console.log('2. Copy and run each function one by one');
console.log('3. Run the permissions at the end');
console.log('4. Test with: node check-rpc-status.js');