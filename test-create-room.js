#!/usr/bin/env node

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

async function testCreateRoom() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('🔍 Testing create_room RPC function\n');
  console.log('================================\n');
  
  // Create Supabase client
  const supabase = createClient(url, key);
  
  try {
    // First, try to sign in with test user
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'test@example.com',
      password: 'test123456'
    });
    
    if (authError) {
      console.log('⚠️  Auth failed, trying to create test user...');
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
        console.log('❌ Could not create or sign in test user:', signUpError.message);
        console.log('\nPlease create a test user manually or use existing credentials');
        return;
      }
      console.log('✅ Test user created');
    } else {
      console.log('✅ Authenticated as test user');
    }
    
    // Now test the create_room function
    console.log('\n📦 Calling create_room RPC...\n');
    
    const { data, error } = await supabase.rpc('create_room', {
      p_game_mode: 'friend',
      p_is_public: false
    });
    
    if (error) {
      console.log('❌ Error calling create_room:', error);
      console.log('\nError details:');
      console.log('  Message:', error.message);
      console.log('  Code:', error.code);
      console.log('  Details:', error.details);
      console.log('  Hint:', error.hint);
    } else {
      console.log('✅ Success! Room created:');
      console.log('  Response:', JSON.stringify(data, null, 2));
      
      if (data && data.room_id) {
        console.log('\n📍 Room Details:');
        console.log('  Room ID:', data.room_id);
        console.log('  Room Code:', data.code);
      }
    }
    
  } catch (error) {
    console.log('❌ Unexpected error:', error);
  }
  
  console.log('\n================================\n');
}

testCreateRoom();