-- Complete fixed version - Run this entire script at once in Supabase SQL Editor
-- This replaces the broken trigger with the correct one

-- Step 1: Drop the existing broken trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Step 2: Create the CORRECT function with all required fields
CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  -- Insert with ALL required fields including id
  INSERT INTO public.users (
    id,                    -- UUID PRIMARY KEY (was missing in your current trigger)
    auth_user_id,          -- Reference to auth.users
    username, 
    display_name,
    created_at             -- Timestamp (was missing in your current trigger)
  )
  VALUES (
    gen_random_uuid(),     -- Generate new UUID for the users table id
    NEW.id,                -- The auth user's ID
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'username', ''),
      NULLIF(split_part(NEW.email, '@', 1), ''),
      'player_' || substr(NEW.id::text, 1, 8)
    ),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
      NULLIF(split_part(NEW.email, '@', 1), ''),
      'Player'
    ),
    NOW()                  -- Current timestamp
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth signup
    RAISE WARNING 'Failed to create user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Recreate the trigger with the correct function
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();