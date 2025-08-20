-- Create a profile row in public.users whenever a new auth user is created
-- This makes RPCs that rely on users(auth_user_id = auth.uid()) work out of the box

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (auth_user_id, username, display_name)
  VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'username', ''),
      substring(NEW.email FROM '^[^@]+')
    ),
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'display_name', ''),
      substring(NEW.email FROM '^[^@]+')
    )
  )
  ON CONFLICT (auth_user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

