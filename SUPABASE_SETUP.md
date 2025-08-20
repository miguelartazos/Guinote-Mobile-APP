# Supabase Setup Guide

## Step 1: Create Supabase Account & Project

1. Go to https://supabase.com
2. Click "Start your project" 
3. Sign up with GitHub or email
4. Click "New project"
5. Fill in:
   - Project name: `guinote2` (or your preferred name)
   - Database Password: (save this securely)
   - Region: Choose closest to your users
   - Pricing Plan: Free tier is fine to start
6. Click "Create new project" and wait ~2 minutes for setup

## Step 2: Get Your API Keys

1. Once project is created, go to Settings (gear icon in sidebar)
2. Click on "API" in the settings menu
3. You'll see two important values:

   - **Project URL**: Something like `https://xyzabc123.supabase.co`
   - **Anon/Public Key**: A long string starting with `eyJ...`

## Step 3: Update Your .env File

Replace the placeholder values in your `.env` file:

```env
# Replace these with your actual values from Step 2
EXPO_PUBLIC_SUPABASE_URL=https://xyzabc123.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **Important**: 
- The URL should NOT have a trailing slash
- The anon key is safe to use in client-side code (it's meant to be public)
- Never commit the service role key to your repository

## Step 4: Run Database Migrations

1. In Supabase dashboard, click "SQL Editor" in the sidebar
2. Click "New query"
3. Copy and paste each migration file in order:
   - First: `supabase/migrations/01_initial_schema.sql`
   - Second: `supabase/migrations/02_rls_policies.sql`
   - Third: `supabase/migrations/03_game_functions.sql`
   - Fourth: `supabase/migrations/04_realtime_setup.sql`
4. Run each migration by clicking "Run" (or Cmd/Ctrl + Enter)
5. You should see "Success" messages for each

## Step 5: Create Storage Bucket

1. In Supabase dashboard, click "Storage" in the sidebar
2. Click "Create bucket"
3. Name it: `voice-messages`
4. Set it as "Public bucket" (for easier access)
5. Click "Create bucket"

## Step 6: Enable Authentication Providers (Optional)

1. Go to "Authentication" in the sidebar
2. Click "Providers"
3. Enable providers you want:
   - Email/Password (enabled by default)
   - Google OAuth
   - Apple Sign In
   - etc.

## Step 7: Test Your Connection

After updating your `.env` file, restart your React Native app:

```bash
# Stop the metro bundler (Ctrl+C)
# Then restart:
npm start

# In another terminal, run your app:
npm run ios
# or
npm run android
```

## Step 8: Verify Setup

You can test if Supabase is working by:

1. Opening your app
2. Check the console for any connection errors
3. Try creating an account or logging in

If you see errors like "Invalid API key" or "Project not found", double-check:
- Your `.env` values match exactly what's in Supabase dashboard
- You've restarted Metro bundler after changing `.env`
- The URL doesn't have a trailing slash

## Troubleshooting

### Common Issues:

**"Invalid API key"**
- Check that you copied the entire anon key
- Make sure you're using the anon key, not the service role key

**"Project not found"**
- Verify the URL is correct (including the random ID part)
- Ensure there's no trailing slash

**"Failed to fetch"**
- Check your internet connection
- Verify the project is active in Supabase dashboard

**Changes not taking effect**
- Clear Metro bundler cache: `npx react-native start --reset-cache`
- Delete `node_modules` and reinstall: `rm -rf node_modules && npm install`
- For iOS: `cd ios && pod install`

## Next Steps

Once connected, the app will automatically use Supabase instead of Convex when the feature flags are enabled (they're enabled by default in development mode).

To manually control features, you can modify the feature flags in the app or through the debug menu.