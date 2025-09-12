const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAuthAndRoom() {
  console.log('Testing authentication and room creation...\n');

  try {
    // Step 1: Sign in with a test user
    console.log('Step 1: Signing in...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'test123456'
    });

    if (authError) {
      console.log('Sign in failed, trying to create account...');
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: 'test@example.com',
        password: 'test123456',
        options: {
          data: {
            username: 'testuser',
            display_name: 'Test User'
          }
        }
      });

      if (signUpError) {
        console.error('❌ Sign up error:', signUpError.message);
        process.exit(1);
      }
      console.log('✅ Account created:', signUpData.user?.email);
    } else {
      console.log('✅ Signed in as:', authData.user?.email);
    }

    // Step 2: Check current session
    console.log('\nStep 2: Checking session...');
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !sessionData.session) {
      console.error('❌ No active session');
      process.exit(1);
    }
    console.log('✅ Session active, user ID:', sessionData.session.user.id);

    // Step 3: Test create_room function
    console.log('\nStep 3: Testing create_room function...');
    const { data: roomData, error: roomError } = await supabase.rpc('create_room', {
      p_game_mode: 'friend',
      p_is_public: false
    });

    if (roomError) {
      console.error('❌ create_room error:', roomError.message);
      console.error('Full error:', roomError);
    } else {
      console.log('✅ Room created successfully!');
      console.log('Response:', roomData);
      
      if (roomData.success) {
        console.log(`  Room ID: ${roomData.room_id}`);
        console.log(`  Room Code: ${roomData.code}`);
      }
    }

    // Step 4: Sign out
    console.log('\nStep 4: Signing out...');
    await supabase.auth.signOut();
    console.log('✅ Signed out');

  } catch (error) {
    console.error('Unexpected error:', error);
  }

  process.exit(0);
}

testAuthAndRoom();