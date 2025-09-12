const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabaseFunctions() {
  console.log('Checking database functions...\n');

  try {
    // Check if create_room function exists
    const { data: functions, error: funcError } = await supabase
      .from('pg_proc')
      .select('proname')
      .ilike('proname', '%create_room%');
    
    if (funcError) {
      console.log('Note: Cannot directly query pg_proc. Testing function execution instead...\n');
    } else {
      console.log('Functions found:', functions);
    }

    // Try to test the create_room function
    console.log('Testing create_room function...');
    const { data: createData, error: createError } = await supabase.rpc('create_room', {
      p_game_mode: 'friend',
      p_is_public: false
    });

    if (createError) {
      console.error('❌ create_room function error:', createError.message);
      console.error('Details:', createError);
    } else {
      console.log('✅ create_room function exists and returned:', createData);
    }

    // Check if tables exist
    console.log('\nChecking tables...');
    const tables = ['rooms', 'room_players', 'users'];
    
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ Table ${table}: ${error.message}`);
      } else {
        console.log(`✅ Table ${table} exists`);
      }
    }

    // Check RLS policies
    console.log('\nChecking RLS policies...');
    const { data: policies, error: policyError } = await supabase.rpc('check_rls_policies', {});
    
    if (policyError) {
      console.log('Note: Cannot check RLS policies directly');
    } else {
      console.log('RLS policies:', policies);
    }

  } catch (error) {
    console.error('Error:', error);
  }

  process.exit(0);
}

checkDatabaseFunctions();