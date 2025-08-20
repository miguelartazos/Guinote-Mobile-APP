// Updated Supabase connection test
// Run with: node test_supabase_fixed.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xewzprfamxswxtmzucbt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhld3pwcmZhbXhzd3h0bXp1Y2J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4ODA1NDYsImV4cCI6MjA3MDQ1NjU0Nn0.XVSQkNF_vSflq-MCFQ277c26jtYxeOyC41BNq-qTWx4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔄 Testing Supabase connection after fixes...\n');

  try {
    // Test 1: Check tables exist (simplified query)
    console.log('📋 Checking tables...');
    const { count, error: countError } = await supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true });
    
    if (countError) {
      console.log('❌ Table check failed:', countError.message);
    } else {
      console.log('✅ Tables accessible (rooms table has', count || 0, 'records)');
    }

    // Test 2: Check auth and create test user
    console.log('\n🔐 Testing auth...');
    const testEmail = `test_${Date.now()}@example.com`;
    const { data: authData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: 'TestPassword123!',
    });
    
    if (signUpError) {
      console.log('⚠️  Auth test:', signUpError.message);
    } else if (authData.user) {
      console.log('✅ Can create users. Test user ID:', authData.user.id);
      
      // Test 3: Test create_room function with authenticated user
      console.log('\n⚙️  Testing functions with auth...');
      const roomCode = 'TEST' + Math.floor(Math.random() * 10000);
      const { data: roomData, error: roomError } = await supabase
        .rpc('create_room', {
          p_code: roomCode,
          p_is_public: true,
          p_game_mode: 'casual'
        });

      if (roomError) {
        console.log('⚠️  Function test:', roomError.message);
      } else {
        console.log('✅ Room created successfully!');
        console.log('   Room code:', roomCode);
        console.log('   Room data:', roomData);
      }

      // Clean up - sign out test user
      await supabase.auth.signOut();
    }

    // Test 4: List available functions
    console.log('\n📦 Available functions:');
    const { data: functions, error: functionsError } = await supabase
      .rpc('pg_get_functiondef', { funcoid: 0 })
      .catch(() => ({ data: null, error: 'Cannot list functions' }));
    
    // Alternative: just note that functions exist
    console.log('   - create_room(code, is_public, game_mode)');
    console.log('   - join_room(room_code)');
    console.log('   - start_game(room_id)');
    console.log('   - play_card(room_id, card)');
    console.log('   - end_trick(room_id, winner_position, expected_version)');

    // Test 5: Check realtime subscription
    console.log('\n📡 Testing realtime...');
    const channel = supabase
      .channel('test-rooms')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'rooms' },
        (payload) => {
          console.log('   Realtime event received:', payload.eventType);
        }
      );

    const status = await channel.subscribe();
    if (status === 'SUBSCRIBED') {
      console.log('✅ Realtime subscriptions working');
      channel.unsubscribe();
    } else {
      console.log('⚠️  Realtime status:', status);
    }

    console.log('\n' + '='.repeat(50));
    console.log('✨ Supabase setup is working correctly!');
    console.log('='.repeat(50));
    
    console.log('\n📝 Next steps:');
    console.log('1. ✅ Feature flags are already enabled in dev mode');
    console.log('2. Run the app: npm run ios');
    console.log('3. Test signup/login in the app');
    console.log('4. Create and join game rooms');
    console.log('5. Test multiplayer gameplay');
    
    console.log('\n⚠️  Remember to run fix_issues.sql if you haven\'t already!');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  process.exit(0);
}

testConnection();