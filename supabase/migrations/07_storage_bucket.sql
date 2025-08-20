-- Create public storage bucket for voice messages if it doesn't exist

INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-messages', 'voice-messages', true)
ON CONFLICT (id) DO NOTHING;

-- Allow public read access to voice-messages bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Public read access for voice messages'
  ) THEN
    CREATE POLICY "Public read access for voice messages"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'voice-messages');
  END IF;
END $$;

-- Allow authenticated users to insert into voice-messages bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'storage' 
      AND tablename = 'objects' 
      AND policyname = 'Authenticated users can upload voice messages'
  ) THEN
    CREATE POLICY "Authenticated users can upload voice messages"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'voice-messages' AND auth.role() = 'authenticated'
      );
  END IF;
END $$;

