const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testWithExistingAuth() {
  console.log('Testing with manual authentication...\n');

  try {
    // Try common test credentials
    const testAccounts = [
      { email: 'test@test.com', password: 'test123' },
      { email: 'maiky@example.com', password: 'password123' },
      { email: 'player1@test.com', password: 'test123' },
    ];

    let authenticated = false;
    
    for (const account of testAccounts) {
      console.log(`Trying ${account.email}...`);
      const { data, error } = await supabase.auth.signInWithPassword(account);
      
      if (!error && data.user) {
        console.log(`✅ Successfully signed in as: ${data.user.email}`);
        authenticated = true;
        
        // Test room creation
        console.log('\nTesting room creation...');
        const { data: roomData, error: roomError } = await supabase.rpc('create_room', {
          p_game_mode: 'friend',
          p_is_public: false
        });

        if (roomError) {
          console.error('❌ Room creation failed:', roomError.message);
          console.log('\nFull error details:', JSON.stringify(roomError, null, 2));
        } else {
          console.log('✅ Room created successfully!');
          console.log('Room data:', roomData);
        }
        
        break;
      }
    }
    
    if (!authenticated) {
      console.log('\n❌ Could not authenticate with any test account');
      console.log('\nTo fix this issue:');
      console.log('1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/xewzprfamxswxtmzucbt/auth/users');
      console.log('2. Create a new user or use existing credentials');
      console.log('3. Make sure email confirmation is disabled for testing');
    }

  } catch (error) {
    console.error('Unexpected error:', error);
  }

  process.exit(0);
}

testWithExistingAuth();