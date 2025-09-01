-- Fixed version of profile setup that handles missing columns
-- Create a profile row in public.users whenever a new auth user is created

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  -- Only insert required fields first
  INSERT INTO public.users (
    id,
    auth_user_id, 
    username, 
    display_name,
    created_at
  )
  VALUES (
    gen_random_uuid(),
    NEW.id,
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
    NOW()
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

-- Drop and recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();