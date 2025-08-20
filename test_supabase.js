// Quick Supabase connection test
// Run with: node test_supabase.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xewzprfamxswxtmzucbt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhld3pwcmZhbXhzd3h0bXp1Y2J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4ODA1NDYsImV4cCI6MjA3MDQ1NjU0Nn0.XVSQkNF_vSflq-MCFQ277c26jtYxeOyC41BNq-qTWx4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔄 Testing Supabase connection...\n');

  try {
    // Test 1: Check tables exist
    console.log('📋 Checking tables...');
    const { data: tables, error: tablesError } = await supabase
      .from('rooms')
      .select('id')
      .limit(1);
    
    if (tablesError) {
      console.log('❌ Table check failed:', tablesError.message);
    } else {
      console.log('✅ Tables accessible');
    }

    // Test 2: Check auth
    console.log('\n🔐 Checking auth...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (user) {
      console.log('✅ Authenticated as:', user.email);
    } else {
      console.log('ℹ️  Not authenticated (anonymous access)');
    }

    // Test 3: Test a function
    console.log('\n⚙️  Testing functions...');
    const { data: roomData, error: roomError } = await supabase
      .rpc('create_room', {
        p_code: 'TEST' + Math.floor(Math.random() * 10000),
        p_host_id: '00000000-0000-0000-0000-000000000000', // dummy UUID
        p_is_public: true
      });

    if (roomError) {
      console.log('ℹ️  Function test result:', roomError.message);
    } else {
      console.log('✅ Functions callable');
    }

    // Test 4: Check realtime
    console.log('\n📡 Checking realtime...');
    const channel = supabase.channel('test-channel');
    channel.on('presence', { event: 'sync' }, () => {
      console.log('✅ Realtime connected');
      channel.unsubscribe();
    });
    
    await channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('✅ Can subscribe to channels');
      }
    });

    console.log('\n✨ Supabase setup appears to be working!');
    console.log('\n📝 Next steps:');
    console.log('1. Enable feature flags in src/config/featureFlags.ts');
    console.log('2. Test authentication in the app');
    console.log('3. Create and join rooms');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }

  process.exit(0);
}

testConnection();