-- Fix the user profile creation trigger to include all required fields
-- This fixes the "Database error saving new user" issue

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id,                    -- Generate new UUID for users table (was missing)
    auth_user_id,          -- Reference to auth.users
    username,
    display_name,
    created_at             -- Add timestamp (was missing)
  )
  VALUES (
    gen_random_uuid(),     -- Generate UUID for id
    NEW.id,                -- Auth user's ID from Supabase Auth
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'username', ''),
      substring(NEW.email FROM '^[^@]+')
    ),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
      substring(NEW.email FROM '^[^@]+')
    ),
    NOW()                  -- Current timestamp
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;