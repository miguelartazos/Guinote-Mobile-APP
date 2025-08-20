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
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_self_select'
  ) THEN
    CREATE POLICY users_self_select ON users
      FOR SELECT USING (auth.uid() = auth_user_id);
  END IF;
END $$;

-- Users can update their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_self_update'
  ) THEN
    CREATE POLICY users_self_update ON users
      FOR UPDATE USING (auth.uid() = auth_user_id);
  END IF;
END $$;

-- Users can insert their own profile
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_self_insert'
  ) THEN
    CREATE POLICY users_self_insert ON users
      FOR INSERT WITH CHECK (auth.uid() = auth_user_id);
  END IF;
END $$;

-- Users can view other users' public info (for leaderboards, friends, etc)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'users_public_select'
  ) THEN
    CREATE POLICY users_public_select ON users
      FOR SELECT USING (true);
  END IF;
END $$;

-- ROOMS POLICIES
-- Anyone can view public rooms or rooms they're in
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rooms' AND policyname = 'rooms_select_public_or_member'
  ) THEN
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
  END IF;
END $$;

-- Users can create rooms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rooms' AND policyname = 'rooms_insert'
  ) THEN
    CREATE POLICY rooms_insert ON rooms
      FOR INSERT WITH CHECK (
        EXISTS(
          SELECT 1 FROM users u 
          WHERE u.id = host_id 
          AND u.auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Room hosts can update their rooms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'rooms' AND policyname = 'rooms_update_host'
  ) THEN
    CREATE POLICY rooms_update_host ON rooms
      FOR UPDATE USING (
        EXISTS(
          SELECT 1 FROM users u 
          WHERE u.id = host_id 
          AND u.auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- ROOM_PLAYERS POLICIES
-- Members can view room players
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'room_players' AND policyname = 'room_players_member_select'
  ) THEN
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
  END IF;
END $$;

-- Users can join rooms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'room_players' AND policyname = 'room_players_self_insert'
  ) THEN
    CREATE POLICY room_players_self_insert ON room_players
      FOR INSERT WITH CHECK (
        EXISTS(
          SELECT 1 FROM users u 
          WHERE u.id = user_id 
          AND u.auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Users can update their own player status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'room_players' AND policyname = 'room_players_self_update'
  ) THEN
    CREATE POLICY room_players_self_update ON room_players
      FOR UPDATE USING (
        EXISTS(
          SELECT 1 FROM users u 
          WHERE u.id = user_id 
          AND u.auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Users can leave rooms
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'room_players' AND policyname = 'room_players_self_delete'
  ) THEN
    CREATE POLICY room_players_self_delete ON room_players
      FOR DELETE USING (
        EXISTS(
          SELECT 1 FROM users u 
          WHERE u.id = user_id 
          AND u.auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- GAME_STATES POLICIES
-- Only room members can view game states
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'game_states' AND policyname = 'game_states_member_select'
  ) THEN
    CREATE POLICY game_states_member_select ON game_states
      FOR SELECT USING (
        EXISTS(
          SELECT 1 FROM room_players rp 
          JOIN users u ON rp.user_id = u.id
          WHERE rp.room_id = game_states.room_id 
          AND u.auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Only room members can update game states
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'game_states' AND policyname = 'game_states_member_update'
  ) THEN
    CREATE POLICY game_states_member_update ON game_states
      FOR UPDATE USING (
        EXISTS(
          SELECT 1 FROM room_players rp 
          JOIN users u ON rp.user_id = u.id
          WHERE rp.room_id = game_states.room_id 
          AND u.auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Room host can insert initial game state
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'game_states' AND policyname = 'game_states_host_insert'
  ) THEN
    CREATE POLICY game_states_host_insert ON game_states
      FOR INSERT WITH CHECK (
        EXISTS(
          SELECT 1 FROM rooms r 
          JOIN users u ON r.host_id = u.id
          WHERE r.id = room_id 
          AND u.auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- VOICE_MESSAGES POLICIES
-- Room members can view voice messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'voice_messages' AND policyname = 'voice_messages_member_select'
  ) THEN
    CREATE POLICY voice_messages_member_select ON voice_messages
      FOR SELECT USING (
        EXISTS(
          SELECT 1 FROM room_players rp 
          JOIN users u ON rp.user_id = u.id
          WHERE rp.room_id = voice_messages.room_id 
          AND u.auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Room members can send voice messages
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'voice_messages' AND policyname = 'voice_messages_member_insert'
  ) THEN
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
  END IF;
END $$;

-- MATCHMAKING_QUEUE POLICIES
-- Users can view their own queue status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'matchmaking_queue' AND policyname = 'matchmaking_self_select'
  ) THEN
    CREATE POLICY matchmaking_self_select ON matchmaking_queue
      FOR SELECT USING (
        EXISTS(
          SELECT 1 FROM users u 
          WHERE u.id = user_id 
          AND u.auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Users can join the queue
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'matchmaking_queue' AND policyname = 'matchmaking_self_insert'
  ) THEN
    CREATE POLICY matchmaking_self_insert ON matchmaking_queue
      FOR INSERT WITH CHECK (
        EXISTS(
          SELECT 1 FROM users u 
          WHERE u.id = user_id 
          AND u.auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Users can leave the queue
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'matchmaking_queue' AND policyname = 'matchmaking_self_delete'
  ) THEN
    CREATE POLICY matchmaking_self_delete ON matchmaking_queue
      FOR DELETE USING (
        EXISTS(
          SELECT 1 FROM users u 
          WHERE u.id = user_id 
          AND u.auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- FRIENDSHIPS POLICIES
-- Users can view their friendships
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'friendships' AND policyname = 'friendships_self_select'
  ) THEN
    CREATE POLICY friendships_self_select ON friendships
      FOR SELECT USING (
        EXISTS(
          SELECT 1 FROM users u 
          WHERE (u.id = user_id OR u.id = friend_id) 
          AND u.auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Users can send friend requests
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'friendships' AND policyname = 'friendships_self_insert'
  ) THEN
    CREATE POLICY friendships_self_insert ON friendships
      FOR INSERT WITH CHECK (
        EXISTS(
          SELECT 1 FROM users u 
          WHERE u.id = user_id 
          AND u.auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Users can update friendship status
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'friendships' AND policyname = 'friendships_self_update'
  ) THEN
    CREATE POLICY friendships_self_update ON friendships
      FOR UPDATE USING (
        EXISTS(
          SELECT 1 FROM users u 
          WHERE (u.id = user_id OR u.id = friend_id) 
          AND u.auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- Users can delete friendships
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'friendships' AND policyname = 'friendships_self_delete'
  ) THEN
    CREATE POLICY friendships_self_delete ON friendships
      FOR DELETE USING (
        EXISTS(
          SELECT 1 FROM users u 
          WHERE (u.id = user_id OR u.id = friend_id) 
          AND u.auth_user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- GAME_STATS POLICIES
-- Users can view all game stats (for leaderboards)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'game_stats' AND policyname = 'game_stats_public_select'
  ) THEN
    CREATE POLICY game_stats_public_select ON game_stats
      FOR SELECT USING (true);
  END IF;
END $$;

-- System can insert game stats (through functions)
-- No direct insert policy needed as this will be done through functions