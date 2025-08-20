// Minimal Supabase connectivity + realtime test (no auth required)
// Run: node scripts/test_supabase_min.js

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://xewzprfamxswxtmzucbt.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhld3pwcmZhbXhzd3h0bXp1Y2J0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ4ODA1NDYsImV4cCI6MjA3MDQ1NjU0Nn0.XVSQkNF_vSflq-MCFQ277c26jtYxeOyC41BNq-qTWx4';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function main() {
  try {
    console.log('📡 Checking table access...');
    const { count, error } = await supabase
      .from('rooms')
      .select('*', { count: 'exact', head: true });
    if (error) throw error;
    console.log('✅ rooms table reachable. count =', count ?? 0);

    console.log('🔔 Testing realtime subscribe...');
    const channel = supabase
      .channel('test-min')
      .on('presence', { event: 'sync' }, () => {
        console.log('✅ Presence sync');
      });

    const status = await channel.subscribe();
    console.log('✅ Realtime subscribed with status:', status);
    await channel.unsubscribe();

    console.log('\n✨ Minimal connectivity + realtime test OK');
    process.exit(0);
  } catch (e) {
    console.error('❌ Test failed:', e.message || e);
    process.exit(1);
  }
}

main();

