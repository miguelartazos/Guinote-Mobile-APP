-- =====================================================
-- MIGRATION 2: RLS Policies (02_rls_policies.sql)
-- =====================================================

-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE room_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_states ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE matchmaking_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;

-- Helper view to get current user
CREATE OR REPLACE VIEW me AS
  SELECT u.* FROM users u WHERE u.auth_user_id = auth.uid();

-- USERS POLICIES
-- Users can view their own profile
CREATE POLICY users_self_select ON users
  FOR SELECT USING (auth.uid() = auth_user_id);

-- Users can update their own profile
CREATE POLICY users_self_update ON users
  FOR UPDATE USING (auth.uid() = auth_user_id);

-- Users can insert their own profile
CREATE POLICY users_self_insert ON users
  FOR INSERT WITH CHECK (auth.uid() = auth_user_id);

-- Users can view other users' public info (for leaderboards, friends, etc)
CREATE POLICY users_public_select ON users
  FOR SELECT USING (true);

-- ROOMS POLICIES
-- Anyone can view public rooms or rooms they're in
CREATE POLICY rooms_select_public_or_member ON rooms
  FOR SELECT USING (
    is_public
    OR EXISTS(
      SELECT 1 FROM room_players rp 
      JOIN users u ON rp.user_id = u.id
      WHERE rp.room_id = rooms.id 
      AND u.auth_user_id = auth.uid()
    )
  );

-- Users can create rooms
CREATE POLICY rooms_insert ON rooms
  FOR INSERT WITH CHECK (
    EXISTS(
      SELECT 1 FROM users u 
      WHERE u.id = host_id 
      AND u.auth_user_id = auth.uid()
    )
  );

-- Room hosts can update their rooms
CREATE POLICY rooms_update_host ON rooms
  FOR UPDATE USING (
    EXISTS(
      SELECT 1 FROM users u 
      WHERE u.id = host_id 
      AND u.auth_user_id = auth.uid()
    )
  );

-- ROOM_PLAYERS POLICIES
-- Members can view room players
CREATE POLICY room_players_member_select ON room_players
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM users u 
      WHERE u.id = room_players.user_id 
      AND u.auth_user_id = auth.uid()
    )
    OR EXISTS(
      SELECT 1 FROM room_players rp 
      JOIN users u ON rp.user_id = u.id
      WHERE rp.room_id = room_players.room_id 
      AND u.auth_user_id = auth.uid()
    )
  );

-- Users can join rooms
CREATE POLICY room_players_self_insert ON room_players
  FOR INSERT WITH CHECK (
    EXISTS(
      SELECT 1 FROM users u 
      WHERE u.id = user_id 
      AND u.auth_user_id = auth.uid()
    )
  );

-- Users can update their own player status
CREATE POLICY room_players_self_update ON room_players
  FOR UPDATE USING (
    EXISTS(
      SELECT 1 FROM users u 
      WHERE u.id = user_id 
      AND u.auth_user_id = auth.uid()
    )
  );

-- Users can leave rooms
CREATE POLICY room_players_self_delete ON room_players
  FOR DELETE USING (
    EXISTS(
      SELECT 1 FROM users u 
      WHERE u.id = user_id 
      AND u.auth_user_id = auth.uid()
    )
  );

-- GAME_STATES POLICIES
-- Only room members can view game states
CREATE POLICY game_states_member_select ON game_states
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM room_players rp 
      JOIN users u ON rp.user_id = u.id
      WHERE rp.room_id = game_states.room_id 
      AND u.auth_user_id = auth.uid()
    )
  );

-- Only room members can update game states
CREATE POLICY game_states_member_update ON game_states
  FOR UPDATE USING (
    EXISTS(
      SELECT 1 FROM room_players rp 
      JOIN users u ON rp.user_id = u.id
      WHERE rp.room_id = game_states.room_id 
      AND u.auth_user_id = auth.uid()
    )
  );

-- Room host can insert initial game state
CREATE POLICY game_states_host_insert ON game_states
  FOR INSERT WITH CHECK (
    EXISTS(
      SELECT 1 FROM rooms r 
      JOIN users u ON r.host_id = u.id
      WHERE r.id = room_id 
      AND u.auth_user_id = auth.uid()
    )
  );

-- VOICE_MESSAGES POLICIES
-- Room members can view voice messages
CREATE POLICY voice_messages_member_select ON voice_messages
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM room_players rp 
      JOIN users u ON rp.user_id = u.id
      WHERE rp.room_id = voice_messages.room_id 
      AND u.auth_user_id = auth.uid()
    )
  );

-- Room members can send voice messages
CREATE POLICY voice_messages_member_insert ON voice_messages
  FOR INSERT WITH CHECK (
    EXISTS(
      SELECT 1 FROM room_players rp 
      JOIN users u ON rp.user_id = u.id
      WHERE rp.room_id = voice_messages.room_id 
      AND u.auth_user_id = auth.uid()
      AND u.id = voice_messages.user_id
    )
  );

-- MATCHMAKING_QUEUE POLICIES
-- Users can view their own queue status
CREATE POLICY matchmaking_self_select ON matchmaking_queue
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM users u 
      WHERE u.id = user_id 
      AND u.auth_user_id = auth.uid()
    )
  );

-- Users can join the queue
CREATE POLICY matchmaking_self_insert ON matchmaking_queue
  FOR INSERT WITH CHECK (
    EXISTS(
      SELECT 1 FROM users u 
      WHERE u.id = user_id 
      AND u.auth_user_id = auth.uid()
    )
  );

-- Users can leave the queue
CREATE POLICY matchmaking_self_delete ON matchmaking_queue
  FOR DELETE USING (
    EXISTS(
      SELECT 1 FROM users u 
      WHERE u.id = user_id 
      AND u.auth_user_id = auth.uid()
    )
  );

-- FRIENDSHIPS POLICIES
-- Users can view their friendships
CREATE POLICY friendships_self_select ON friendships
  FOR SELECT USING (
    EXISTS(
      SELECT 1 FROM users u 
      WHERE (u.id = user_id OR u.id = friend_id) 
      AND u.auth_user_id = auth.uid()
    )
  );

-- Users can send friend requests
CREATE POLICY friendships_self_insert ON friendships
  FOR INSERT WITH CHECK (
    EXISTS(
      SELECT 1 FROM users u 
      WHERE u.id = user_id 
      AND u.auth_user_id = auth.uid()
    )
  );

-- Users can update friendship status
CREATE POLICY friendships_self_update ON friendships
  FOR UPDATE USING (
    EXISTS(
      SELECT 1 FROM users u 
      WHERE (u.id = user_id OR u.id = friend_id) 
      AND u.auth_user_id = auth.uid()
    )
  );

-- Users can delete friendships
CREATE POLICY friendships_self_delete ON friendships
  FOR DELETE USING (
    EXISTS(
      SELECT 1 FROM users u 
      WHERE (u.id = user_id OR u.id = friend_id) 
      AND u.auth_user_id = auth.uid()
    )
  );

-- GAME_STATS POLICIES
-- Users can view all game stats (for leaderboards)
CREATE POLICY game_stats_public_select ON game_stats
  FOR SELECT USING (true);

-- Check for errors after RLS policies
SELECT 'RLS policies completed successfully' as status;