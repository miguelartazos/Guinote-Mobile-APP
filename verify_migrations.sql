-- Verification Script - Run this after migrations to check everything is set up

-- Check tables exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;

-- Check functions exist
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_type = 'FUNCTION'
ORDER BY routine_name;

-- Check RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';

-- Check policies exist
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;

-- Check storage bucket and policies
SELECT 'storage bucket voice-messages exists' AS check, EXISTS (
  SELECT 1 FROM storage.buckets WHERE id = 'voice-messages'
) AS ok;

SELECT 'storage policy public read exists' AS check, EXISTS (
  SELECT 1 FROM pg_policies 
  WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Public read access for voice messages'
) AS ok;

SELECT 'storage policy authenticated insert exists' AS check, EXISTS (
  SELECT 1 FROM pg_policies 
  WHERE schemaname = 'storage' AND tablename = 'objects' 
    AND policyname = 'Authenticated users can upload voice messages'
) AS ok;