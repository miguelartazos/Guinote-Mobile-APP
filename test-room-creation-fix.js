#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testRoomCreationFix() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('🔍 Testing Room Creation Fix\n');
  console.log('================================\n');
  
  // Create Supabase client
  const supabase = createClient(url, key, {
    auth: {
      autoRefreshToken: true,
      persistSession: false,
      detectSessionInUrl: false,
    }
  });
  
  try {
    // Step 1: Try to sign in with an existing user or create a new one
    console.log('📝 Step 1: Authentication\n');
    
    let session = null;
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    // Try to sign up a new test user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          username: `testuser_${Date.now()}`,
          display_name: 'Test User'
        }
      }
    });
    
    if (signUpError) {
      console.log('⚠️  Sign up failed:', signUpError.message);
      console.log('   Trying with existing test account...\n');
      
      // Try with a known test account
      const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
        email: 'maiky@guinote.com',  // Use a known test account
        password: 'TestPassword123!'
      });
      
      if (signInError) {
        console.log('❌ Could not authenticate:', signInError.message);
        console.log('\n📋 Please ensure you have a test user in Supabase');
        return;
      }
      
      session = signInData.session;
      console.log('✅ Signed in with existing account\n');
    } else {
      session = signUpData.session;
      console.log('✅ Created and signed in new test user\n');
    }
    
    if (!session) {
      console.log('❌ No session available');
      return;
    }
    
    console.log('📍 Session details:');
    console.log('   User ID:', session.user.id);
    console.log('   Email:', session.user.email);
    console.log('   Access Token:', session.access_token.substring(0, 20) + '...\n');
    
    // Step 2: Refresh the session to ensure it's valid
    console.log('🔄 Step 2: Refreshing session\n');
    
    const { data: refreshData, error: refreshError } = await supabase.auth.refreshSession();
    if (refreshError) {
      console.log('⚠️  Could not refresh session:', refreshError.message);
      console.log('   Using existing session...\n');
    } else {
      console.log('✅ Session refreshed successfully\n');
      session = refreshData.session;
    }
    
    // Step 3: Test the create_room RPC function
    console.log('📦 Step 3: Testing create_room RPC\n');
    
    const { data: roomData, error: roomError } = await supabase.rpc('create_room', {
      p_game_mode: 'friend',
      p_is_public: false
    });
    
    if (roomError) {
      console.log('❌ RPC Error:', roomError);
      console.log('\nError details:');
      console.log('  Message:', roomError.message);
      console.log('  Code:', roomError.code);
      console.log('  Details:', roomError.details);
      console.log('  Hint:', roomError.hint);
      return;
    }
    
    console.log('📥 RPC Response:', JSON.stringify(roomData, null, 2));
    
    // Check the response structure
    if (roomData && typeof roomData === 'object') {
      if ('success' in roomData) {
        if (roomData.success) {
          console.log('\n✅ SUCCESS! Room created:');
          console.log('   Room ID:', roomData.room_id);
          console.log('   Room Code:', roomData.code);
        } else {
          console.log('\n❌ Room creation failed:');
          console.log('   Error:', roomData.error);
        }
      } else if (roomData.room_id && roomData.code) {
        // Direct success response
        console.log('\n✅ SUCCESS! Room created:');
        console.log('   Room ID:', roomData.room_id);
        console.log('   Room Code:', roomData.code);
      }
    }
    
    // Step 4: Verify the room exists
    if (roomData && (roomData.room_id || (roomData.success && roomData.room_id))) {
      console.log('\n🔍 Step 4: Verifying room exists\n');
      
      const roomId = roomData.room_id;
      const { data: room, error: fetchError } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', roomId)
        .single();
      
      if (fetchError) {
        console.log('⚠️  Could not fetch room:', fetchError.message);
      } else {
        console.log('✅ Room verified in database:');
        console.log('   Code:', room.code);
        console.log('   Status:', room.status);
        console.log('   Game Mode:', room.game_mode);
        console.log('   Max Players:', room.max_players);
      }
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error);
  }
  
  console.log('\n================================\n');
}

testRoomCreationFix();