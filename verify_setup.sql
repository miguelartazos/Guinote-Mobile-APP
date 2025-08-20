-- Comprehensive verification of Supabase setup

-- 1. Check all tables exist
SELECT '📋 Tables Created:' as check_type, count(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'users', 'rooms', 'room_players', 'game_states', 
  'game_moves', 'voice_messages', 'friendships', 
  'friend_requests', 'matchmaking_queue', 'game_stats'
);

-- 2. Check all functions exist
SELECT '⚙️ Functions Created:' as check_type, count(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
AND routine_name IN (
  'create_room', 'join_room', 'leave_room', 'start_game',
  'play_card', 'cantar', 'end_trick', 'initialize_game_state'
);

-- 3. Check RLS is enabled on all tables
SELECT '🔒 RLS Enabled Tables:' as check_type, count(*) as count
FROM pg_tables 
WHERE schemaname = 'public' 
AND rowsecurity = true;

-- 4. Check policies exist
SELECT '📜 Security Policies:' as check_type, count(*) as count
FROM pg_policies 
WHERE schemaname = 'public';

-- 5. Check realtime is enabled
SELECT '📡 Realtime Enabled Tables:' as check_type, 
       array_agg(table_name) as tables
FROM (
  SELECT tablename as table_name 
  FROM pg_tables 
  WHERE schemaname = 'public'
  AND tablename IN ('rooms', 'room_players', 'game_states', 'game_moves')
) t;

-- 6. Show detailed table list
SELECT '📊 Detailed Table List:' as section;
SELECT table_name, 
       (SELECT count(*) FROM information_schema.columns 
        WHERE table_name = t.table_name 
        AND table_schema = 'public') as columns
FROM information_schema.tables t
WHERE table_schema = 'public'
ORDER BY table_name;

-- 7. Show function signatures
SELECT '🔧 Function Signatures:' as section;
SELECT routine_name, 
       pg_get_function_identity_arguments(p.oid) as arguments,
       data_type as returns
FROM information_schema.routines r
JOIN pg_proc p ON p.proname = r.routine_name
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;