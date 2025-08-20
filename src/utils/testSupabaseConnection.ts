import { supabase } from '../lib/supabase';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/envConfig';

export async function testSupabaseConnection() {
  console.log('🔄 Testing Supabase connection...');

  // Bail early if env vars are missing or empty
  if (!SUPABASE_URL?.trim() || !SUPABASE_ANON_KEY?.trim()) {
    console.warn('⚠️  Supabase environment variables not set');
    console.log(
      '   Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are in .env',
    );
    return false;
  }

  try {
    // Simple connection test via auth
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Supabase connection error:', error);
      return false;
    }

    console.log('✅ Supabase connected successfully');
    console.log('📊 Session status:', data.session ? 'Active' : 'No session');

    return true;
  } catch (err) {
    console.error('❌ Unexpected error testing Supabase:', err);
    return false;
  }
}

// Function to test auth signup
export async function testSupabaseAuth() {
  console.log('🔄 Testing Supabase Auth...');

  try {
    // Generate a test email
    const testEmail = `test_${Date.now()}@example.com`;
    const testPassword = 'TestPassword123!';

    console.log('📧 Testing with email:', testEmail);

    // Try to sign up
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          username: `testuser_${Date.now()}`,
        },
      },
    });

    if (error) {
      console.error('❌ Auth signup error:', error);
      return false;
    }

    console.log('✅ Auth signup successful');
    console.log('👤 User created:', data.user?.id);

    // Clean up - sign out
    await supabase.auth.signOut();

    return true;
  } catch (err) {
    console.error('❌ Unexpected auth error:', err);
    return false;
  }
}
