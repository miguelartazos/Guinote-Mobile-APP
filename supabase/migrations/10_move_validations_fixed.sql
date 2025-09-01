-- Migration: Add move_validations table for audit logging
-- This table tracks all move validation attempts for security and debugging

-- Create move_validations table if not exists
CREATE TABLE IF NOT EXISTS move_validations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_state_id VARCHAR(255) NOT NULL,
  player_id VARCHAR(255) NOT NULL,
  move_type VARCHAR(50) NOT NULL,
  move_data JSONB,
  is_valid BOOLEAN NOT NULL,
  reason TEXT,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_move_validations_game_state 
  ON move_validations(game_state_id);

CREATE INDEX IF NOT EXISTS idx_move_validations_player 
  ON move_validations(player_id);

CREATE INDEX IF NOT EXISTS idx_move_validations_timestamp 
  ON move_validations(timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_move_validations_validity 
  ON move_validations(is_valid, timestamp DESC);

-- Add composite index for common queries
CREATE INDEX IF NOT EXISTS idx_move_validations_game_player 
  ON move_validations(game_state_id, player_id, timestamp DESC);

-- Add RLS policies
ALTER TABLE move_validations ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can insert (for Edge Function)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'move_validations' 
    AND policyname = 'service_role_insert'
  ) THEN
    CREATE POLICY service_role_insert ON move_validations
      FOR INSERT
      TO service_role
      WITH CHECK (true);
  END IF;
END $$;

-- Policy: Authenticated users can read their own validations
-- FIXED: Using proper type casting and correct column name (user_id not player_id)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'move_validations' 
    AND policyname = 'players_read_own'
  ) THEN
    CREATE POLICY players_read_own ON move_validations
      FOR SELECT
      TO authenticated
      USING (
        player_id = auth.uid()::text
        OR 
        EXISTS (
          SELECT 1 FROM rooms r
          JOIN room_players rp ON r.id = rp.room_id
          WHERE r.id = (
            SELECT room_id FROM game_states 
            WHERE id = move_validations.game_state_id::UUID
            LIMIT 1
          )
          AND rp.user_id = auth.uid()  -- FIXED: user_id not player_id
        )
      );
  END IF;
END $$;

-- Add comment for documentation
COMMENT ON TABLE move_validations IS 'Audit log for all move validation attempts in multiplayer games';
COMMENT ON COLUMN move_validations.game_state_id IS 'Reference to the game state being validated';
COMMENT ON COLUMN move_validations.player_id IS 'ID of the player attempting the move';
COMMENT ON COLUMN move_validations.move_type IS 'Type of move (play_card, cambiar_7, declare_cante, declare_victory)';
COMMENT ON COLUMN move_validations.move_data IS 'JSON data containing move details';
COMMENT ON COLUMN move_validations.is_valid IS 'Whether the move passed validation';
COMMENT ON COLUMN move_validations.reason IS 'Reason for validation failure (null if valid)';

-- Function to clean up old validation logs (older than 30 days)
CREATE OR REPLACE FUNCTION cleanup_old_validations()
RETURNS void AS $$
BEGIN
  DELETE FROM move_validations 
  WHERE timestamp < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job to clean up old logs (requires pg_cron extension)
-- Note: Uncomment if pg_cron is available
-- SELECT cron.schedule('cleanup-move-validations', '0 2 * * *', 'SELECT cleanup_old_validations();');