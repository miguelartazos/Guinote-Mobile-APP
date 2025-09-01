#!/usr/bin/env node

// Quick test to verify Supabase auth is working
const { createClient } = require('@supabase/supabase-js');

// Read env vars
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing environment variables');
  console.error('EXPO_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✅' : '❌');
  console.error('EXPO_PUBLIC_SUPABASE_ANON_KEY:', SUPABASE_ANON_KEY ? '✅' : '❌');
  process.exit(1);
}

console.log('🔧 Testing Supabase connection...');
console.log('URL:', SUPABASE_URL);

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAuth() {
  try {
    // Test anonymous sign in
    console.log('\n📝 Testing anonymous auth...');
    const { data: anonData, error: anonError } = await supabase.auth.signInAnonymously();
    
    if (anonError) {
      console.error('❌ Anonymous auth failed:', anonError.message);
    } else {
      console.log('✅ Anonymous auth successful');
      console.log('User ID:', anonData.user?.id);
    }

    // Test sign up with email
    const testEmail = `test${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';
    
    console.log('\n📝 Testing sign up...');
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: { username: 'TestPlayer' }
      }
    });
    
    if (signUpError) {
      console.error('❌ Sign up failed:', signUpError.message);
    } else {
      console.log('✅ Sign up successful');
      console.log('User ID:', signUpData.user?.id);
      console.log('Email:', signUpData.user?.email);
      
      // Check if user profile was created
      const { data: profile, error: profileError } = await supabase
        .from('users')
        .select('*')
        .eq('id', signUpData.user.id)
        .single();
      
      if (profileError) {
        console.error('❌ Profile not found:', profileError.message);
      } else {
        console.log('✅ Profile created:', profile);
      }
    }
    
    // Clean up - sign out
    await supabase.auth.signOut();
    console.log('\n✅ All tests completed');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testAuth();