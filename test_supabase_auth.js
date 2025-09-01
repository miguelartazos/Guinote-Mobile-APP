#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://xewzprfamxswxtmzucbt.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhld3pwcmZhbXhzd3h0bXp1Y2J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4ODA1NDYsImV4cCI6MjA3MDQ1NjU0Nn0.XVSQkNF_vSflq-MCFQ277c26jtYxeOyC41BNq-qTWx4';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuth() {
  console.log('🔧 Testing Supabase authentication...\n');

  // Generate unique test credentials
  const timestamp = Date.now();
  const testEmail = `test${timestamp}@example.com`;
  const testPassword = 'TestPassword123!';
  const testUsername = `TestUser${timestamp}`;

  try {
    // Step 1: Sign up with metadata
    console.log('📝 Step 1: Creating auth user...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: { 
          username: testUsername,
          display_name: testUsername
        }
      }
    });

    if (signUpError) {
      console.error('❌ Sign up failed:', signUpError);
      return;
    }

    console.log('✅ Auth user created:', signUpData.user?.id);
    console.log('   Email:', signUpData.user?.email);
    console.log('   Metadata:', signUpData.user?.user_metadata);

    // Step 2: Check if profile was created
    console.log('\n📝 Step 2: Checking user profile...');
    
    // Wait a moment for trigger to execute
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('auth_user_id', signUpData.user.id)
      .single();

    if (profileError) {
      console.error('❌ Profile not found:', profileError);
      console.log('\n🔍 Debugging: Checking all users...');
      
      const { data: allUsers, error: allUsersError } = await supabase
        .from('users')
        .select('id, auth_user_id, username')
        .limit(5);
      
      if (allUsersError) {
        console.error('❌ Cannot read users table:', allUsersError);
      } else {
        console.log('Users in database:', allUsers);
      }
    } else {
      console.log('✅ Profile created successfully:', profile);
    }

    // Step 3: Test sign in
    console.log('\n📝 Step 3: Testing sign in...');
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError);
    } else {
      console.log('✅ Sign in successful');
    }

    // Clean up
    await supabase.auth.signOut();
    console.log('\n✅ Test completed');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run test
testAuth().catch(console.error);