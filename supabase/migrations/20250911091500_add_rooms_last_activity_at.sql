-- Add last_activity_at to rooms and index it
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM   information_schema.columns 
    WHERE  table_schema = 'public' 
    AND    table_name   = 'rooms' 
    AND    column_name  = 'last_activity_at'
  ) THEN
    ALTER TABLE public.rooms ADD COLUMN last_activity_at TIMESTAMPTZ;
  END IF;
END $$;

UPDATE public.rooms 
SET last_activity_at = COALESCE(last_activity_at, COALESCE(started_at, created_at, NOW()));

ALTER TABLE public.rooms ALTER COLUMN last_activity_at SET DEFAULT NOW();
ALTER TABLE public.rooms ALTER COLUMN last_activity_at SET NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rooms_last_activity_at 
ON public.rooms (last_activity_at DESC);


