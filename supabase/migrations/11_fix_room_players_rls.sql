-- Fix recursive RLS policy on room_players
-- Context: earlier migrations defined `room_players_member_select` that referenced
--          room_players within its own USING clause, causing recursion errors.

-- 1) Drop the recursive SELECT policy if it exists
DROP POLICY IF EXISTS room_players_member_select ON room_players;

-- 2) Ensure there is at least one non-recursive SELECT policy for room_players
--    If a suitable one already exists (e.g. from 06_complete_fixes.sql), this does nothing.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = 'room_players'
      AND policyname = 'room_players_select'
  ) THEN
    CREATE POLICY room_players_select ON room_players
      FOR SELECT
      USING (auth.uid() IS NOT NULL);
  END IF;
END $$;

