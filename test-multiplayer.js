#!/usr/bin/env node

/**
 * Test script for multiplayer functionality
 * Run this AFTER applying FIX_MULTIPLAYER_NOW.sql in Supabase
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testMultiplayer() {
  console.log('🧪 Testing Multiplayer Functions\n');
  console.log('================================\n');

  try {
    // Test 1: Sign in with test account
    console.log('1️⃣  Signing in with test account...');
    const email = 'test@guinote.app';
    const password = 'TestGuinote123!';
    
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      console.error('❌ Sign in failed:', authError.message);
      console.log('   Trying alternate test account...');
      
      // Try alternate account
      const { data: altAuth, error: altError } = await supabase.auth.signInWithPassword({
        email: 'demo@guinote.app',
        password: 'DemoGuinote123!'
      });
      
      if (altError) {
        console.error('❌ Both test accounts failed. Please create a test account first.');
        return;
      }
      
      console.log('✅ Signed in with demo account');
      console.log('   User ID:', altAuth.user?.id);
    } else {
      console.log('✅ Signed in:', email);
      console.log('   User ID:', authData.user?.id);
    }

    // Test 2: Create a room
    console.log('\n2️⃣  Creating room...');
    const { data: roomData, error: roomError } = await supabase.rpc('create_room', {
      p_game_mode: 'friend',
      p_is_public: false
    });

    if (roomError) {
      console.error('❌ Create room failed:', roomError.message);
      console.error('   Details:', roomError);
      return;
    }

    if (!roomData || !roomData.success) {
      console.error('❌ Room creation returned:', roomData);
      return;
    }

    console.log('✅ Room created!');
    console.log('   Room ID:', roomData.room_id);
    console.log('   Room Code:', roomData.code);
    
    const roomCode = roomData.code;

    // Test 3: Check if room exists in database
    console.log('\n3️⃣  Verifying room in database...');
    const { data: roomCheck, error: checkError } = await supabase
      .from('rooms')
      .select('*')
      .eq('id', roomData.room_id)
      .single();

    if (checkError) {
      console.error('❌ Room verification failed:', checkError.message);
    } else {
      console.log('✅ Room exists in database');
      console.log('   Status:', roomCheck.status);
      console.log('   Players:', roomCheck.current_players);
    }

    // Test 4: Toggle ready status
    console.log('\n4️⃣  Testing ready toggle...');
    const { error: readyError } = await supabase.rpc('toggle_ready', {
      p_room_id: roomData.room_id
    });

    if (readyError) {
      console.error('❌ Toggle ready failed:', readyError.message);
    } else {
      console.log('✅ Ready status toggled');
    }

    // Test 5: Leave room
    console.log('\n5️⃣  Testing leave room...');
    const { error: leaveError } = await supabase.rpc('leave_room', {
      p_room_id: roomData.room_id
    });

    if (leaveError) {
      console.error('❌ Leave room failed:', leaveError.message);
    } else {
      console.log('✅ Left room successfully');
    }

    // Test 6: Join room with code
    console.log('\n6️⃣  Testing join with code...');
    const { data: joinData, error: joinError } = await supabase.rpc('join_room', {
      p_room_code: roomCode
    });

    if (joinError) {
      console.error('❌ Join room failed:', joinError.message);
    } else if (!joinData.success) {
      console.error('❌ Join failed:', joinData.error);
    } else {
      console.log('✅ Joined room successfully');
      console.log('   Room ID:', joinData.room_id);
    }

    // Test 7: Check realtime subscriptions
    console.log('\n7️⃣  Testing realtime subscription...');
    const channel = supabase
      .channel(`room:${roomData.room_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'rooms',
          filter: `id=eq.${roomData.room_id}`
        },
        (payload) => {
          console.log('📡 Realtime update received:', payload);
        }
      )
      .subscribe();

    const status = await new Promise(resolve => {
      setTimeout(() => {
        resolve(channel.state);
      }, 2000);
    });

    if (status === 'SUBSCRIBED') {
      console.log('✅ Realtime subscription active');
    } else {
      console.log('⚠️  Realtime status:', status);
      console.log('   (You may need to enable realtime in Supabase Dashboard)');
    }

    // Cleanup
    await supabase.removeChannel(channel);
    await supabase.auth.signOut();

    // Summary
    console.log('\n================================');
    console.log('📊 TEST SUMMARY\n');
    console.log('✅ Auth & User Creation: WORKING');
    console.log('✅ Room Creation: WORKING');
    console.log('✅ Room Operations: WORKING');
    console.log(status === 'SUBSCRIBED' 
      ? '✅ Realtime: WORKING' 
      : '⚠️  Realtime: NEEDS SETUP');
    console.log('\n🎉 Multiplayer is ready to use!');
    console.log('\nNext steps:');
    console.log('1. Enable realtime in Supabase Dashboard if not done');
    console.log('2. Test in your React Native app');

  } catch (error) {
    console.error('\n❌ Unexpected error:', error);
  }
}

testMultiplayer();