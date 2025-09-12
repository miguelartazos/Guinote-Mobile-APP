#!/usr/bin/env node

/**
 * Test Session Persistence Fix
 * 
 * This script tests if the session persistence fix works correctly:
 * 1. Sign in
 * 2. Store the session
 * 3. Simulate app restart by creating new client
 * 4. Check if session is restored
 */

const { createClient } = require('@supabase/supabase-js');
const AsyncStorage = require('@react-native-async-storage/async-storage').default;

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://mpqmqrcfibzfqjlxbqcm.supabase.co';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1wcW1xcmNmaWJ6ZnFqbHhicWNtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjYzNTU3MzIsImV4cCI6MjA0MTkzMTczMn0.gq64enE6Hjvts7Qdx2La2Iiec8lDhLaSNOVK0L0QA1c';

// Test credentials
const TEST_EMAIL = 'test@example.com';
const TEST_PASSWORD = 'Test123456!';

console.log('🧪 Testing Session Persistence Fix\n');
console.log('=' .repeat(50));

async function createSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  });
}

async function testSessionPersistence() {
  let supabase = null;
  let originalSession = null;

  try {
    // Step 1: Create client and sign in
    console.log('\n1️⃣  Creating client and signing in...');
    supabase = await createSupabaseClient();
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: TEST_EMAIL,
      password: TEST_PASSWORD,
    });

    if (signInError) {
      console.error('❌ Sign in failed:', signInError.message);
      return false;
    }

    originalSession = signInData.session;
    console.log('✅ Signed in successfully');
    console.log('   User ID:', originalSession.user.id);
    console.log('   Email:', originalSession.user.email);

    // Step 2: Wait a bit to ensure session is stored
    console.log('\n2️⃣  Waiting for session to be stored...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Step 3: Simulate app restart - create new client
    console.log('\n3️⃣  Simulating app restart (creating new client)...');
    const newSupabase = await createSupabaseClient();

    // Step 4: Check if session is restored
    console.log('\n4️⃣  Checking if session is restored...');
    
    // Set up auth state listener to detect session restoration
    let sessionRestored = false;
    const authListener = newSupabase.auth.onAuthStateChange((event, session) => {
      console.log('   Auth event:', event);
      if (session) {
        sessionRestored = true;
        console.log('   ✅ Session detected in auth listener');
      }
    });

    // Try to get the session
    const { data: sessionData, error: sessionError } = await newSupabase.auth.getSession();

    if (sessionError) {
      console.error('❌ Error getting session:', sessionError.message);
      return false;
    }

    if (sessionData?.session) {
      console.log('✅ Session restored successfully!');
      console.log('   User ID:', sessionData.session.user.id);
      console.log('   Email:', sessionData.session.user.email);
      console.log('   Session matches original:', sessionData.session.user.id === originalSession.user.id);
      
      // Test refresh
      console.log('\n5️⃣  Testing session refresh...');
      const { data: refreshData, error: refreshError } = await newSupabase.auth.refreshSession();
      
      if (refreshError) {
        console.log('⚠️  Session refresh failed:', refreshError.message);
      } else if (refreshData?.session) {
        console.log('✅ Session refreshed successfully');
      }
      
      // Clean up
      authListener.data.subscription.unsubscribe();
      
      // Sign out
      console.log('\n6️⃣  Cleaning up - signing out...');
      await newSupabase.auth.signOut();
      console.log('✅ Signed out');
      
      return true;
    } else {
      console.error('❌ Session was not restored');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
    return false;
  }
}

// Run the test
testSessionPersistence().then(success => {
  console.log('\n' + '=' .repeat(50));
  if (success) {
    console.log('✅ SESSION PERSISTENCE TEST PASSED!');
    console.log('The fix is working correctly - sessions are being restored after app restart.');
  } else {
    console.log('❌ SESSION PERSISTENCE TEST FAILED');
    console.log('Sessions are not being properly restored.');
  }
  console.log('=' .repeat(50) + '\n');
  process.exit(success ? 0 : 1);
});