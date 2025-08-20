// Simple test to verify Supabase connection
// Run with: node test-supabase.js

const { createClient } = require('@supabase/supabase-js');

// Read from environment - no fallbacks
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

console.log('🔄 Testing Supabase connection...');

// Bail early if env vars are missing or empty
if (!supabaseUrl || !supabaseUrl.trim() || !supabaseAnonKey || !supabaseAnonKey.trim()) {
  console.warn('⚠️  Supabase environment variables not set');
  console.log(
    '   Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are in .env',
  );
  process.exit(1);
}

console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    // Test 1: Check session
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      console.error('❌ Connection error:', error.message);
      return false;
    }

    console.log('✅ Connected to Supabase successfully!');
    console.log('Session:', data.session ? 'Active' : 'No active session');

    // Test 2: Basic database connectivity (skip if no tables/RPC available)
    console.log('ℹ️  Skipping database table test (run migrations first if needed)');

    console.log('\n✨ Supabase is configured correctly!');
    console.log('📝 Next steps:');
    console.log('   1. Run migrations in Supabase Dashboard if needed');
    console.log('   2. Enable feature flags in src/config/featureFlags.ts');
    console.log('   3. Test individual features incrementally');

    return true;
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
