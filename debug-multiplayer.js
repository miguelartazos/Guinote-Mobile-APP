#!/usr/bin/env node

/**
 * Comprehensive Multiplayer Debugging Script
 * This script helps identify exactly what's working and what's not
 */

require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

// Colors for terminal output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, type = 'info') {
  const typeColors = {
    error: colors.red,
    success: colors.green,
    warning: colors.yellow,
    info: colors.cyan,
    header: colors.magenta + colors.bright,
  };
  console.log(`${typeColors[type]}${message}${colors.reset}`);
}

async function testConnection() {
  log('\n🔌 TESTING CONNECTION', 'header');
  log('================================\n', 'header');
  
  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        'apikey': supabaseKey,
        'Authorization': `Bearer ${supabaseKey}`
      }
    });
    
    if (response.ok) {
      log('✅ Connected to Supabase', 'success');
      log(`   URL: ${supabaseUrl}`, 'info');
      return true;
    } else {
      log(`❌ Connection failed: ${response.status}`, 'error');
      return false;
    }
  } catch (error) {
    log(`❌ Connection error: ${error.message}`, 'error');
    return false;
  }
}

async function checkTables() {
  log('\n📊 CHECKING TABLES', 'header');
  log('================================\n', 'header');
  
  const tables = [
    'users',
    'rooms',
    'room_players',
    'friendships',
    'game_moves'
  ];
  
  let allExist = true;
  
  for (const table of tables) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/${table}?limit=1`, {
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
        }
      });
      
      if (response.ok) {
        log(`✅ ${table.padEnd(15)} - EXISTS`, 'success');
      } else if (response.status === 404 || response.status === 400) {
        log(`❌ ${table.padEnd(15)} - NOT FOUND`, 'error');
        allExist = false;
      } else {
        log(`⚠️  ${table.padEnd(15)} - Status: ${response.status}`, 'warning');
      }
    } catch (error) {
      log(`❌ ${table.padEnd(15)} - Error: ${error.message}`, 'error');
      allExist = false;
    }
  }
  
  return allExist;
}

async function checkRPCFunctions() {
  log('\n⚙️  CHECKING RPC FUNCTIONS', 'header');
  log('================================\n', 'header');
  
  const rpcs = [
    { name: 'ensure_user_exists', critical: true },
    { name: 'create_room', critical: true },
    { name: 'join_room', critical: true },
    { name: 'leave_room', critical: true },
    { name: 'toggle_ready', critical: true },
    { name: 'start_game', critical: true },
    { name: 'add_ai_player', critical: false },
    { name: 'get_online_friends', critical: false },
    { name: 'generate_room_code', critical: false },
  ];
  
  let criticalMissing = false;
  
  for (const rpc of rpcs) {
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/${rpc.name}`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${supabaseKey}`,
          'Content-Type': 'application/json'
        },
        body: '{}'
      });
      
      if (response.status === 401) {
        log(`✅ ${rpc.name.padEnd(20)} - EXISTS (auth required)`, 'success');
      } else if (response.status === 404) {
        const severity = rpc.critical ? '❌' : '⚠️ ';
        log(`${severity} ${rpc.name.padEnd(20)} - NOT FOUND ${rpc.critical ? '(CRITICAL)' : ''}`, rpc.critical ? 'error' : 'warning');
        if (rpc.critical) criticalMissing = true;
      } else if (response.status === 400) {
        const text = await response.text();
        if (text.includes('function') && text.includes('not exist')) {
          const severity = rpc.critical ? '❌' : '⚠️ ';
          log(`${severity} ${rpc.name.padEnd(20)} - NOT FOUND ${rpc.critical ? '(CRITICAL)' : ''}`, rpc.critical ? 'error' : 'warning');
          if (rpc.critical) criticalMissing = true;
        } else {
          log(`✅ ${rpc.name.padEnd(20)} - EXISTS (params required)`, 'success');
        }
      } else {
        log(`❓ ${rpc.name.padEnd(20)} - Status: ${response.status}`, 'warning');
      }
    } catch (error) {
      log(`❌ ${rpc.name.padEnd(20)} - Error: ${error.message}`, 'error');
      if (rpc.critical) criticalMissing = true;
    }
  }
  
  return !criticalMissing;
}

async function checkRealtimeStatus() {
  log('\n📡 CHECKING REALTIME', 'header');
  log('================================\n', 'header');
  
  try {
    // Create a test channel
    const channel = supabase
      .channel('test-channel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'rooms' }, () => {})
      .subscribe();
    
    // Wait for subscription
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    if (channel.state === 'SUBSCRIBED') {
      log('✅ Realtime is ENABLED and working', 'success');
      await supabase.removeChannel(channel);
      return true;
    } else {
      log(`⚠️  Realtime status: ${channel.state}`, 'warning');
      log('   You need to enable realtime in Supabase Dashboard', 'info');
      await supabase.removeChannel(channel);
      return false;
    }
  } catch (error) {
    log(`❌ Realtime error: ${error.message}`, 'error');
    return false;
  }
}

async function testAuthFlow() {
  log('\n🔐 TESTING AUTH FLOW', 'header');
  log('================================\n', 'header');
  
  try {
    // Try to get current session
    const { data: session, error } = await supabase.auth.getSession();
    
    if (session?.session) {
      log('✅ Active session found', 'success');
      log(`   User ID: ${session.session.user.id}`, 'info');
      
      // Check if user exists in public.users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('auth_user_id', session.session.user.id)
        .single();
      
      if (userData) {
        log('✅ User exists in public.users table', 'success');
        log(`   Username: ${userData.username}`, 'info');
        return { success: true, userId: userData.id };
      } else {
        log('⚠️  User missing from public.users table', 'warning');
        log('   The ensure_user_exists() function should fix this', 'info');
        return { success: false };
      }
    } else {
      log('ℹ️  No active session', 'info');
      log('   Users will need to sign in first', 'info');
      return { success: false };
    }
  } catch (error) {
    log(`❌ Auth check error: ${error.message}`, 'error');
    return { success: false };
  }
}

async function generateDiagnosis() {
  log('\n📋 DIAGNOSIS', 'header');
  log('================================\n', 'header');
  
  const connectionOk = await testConnection();
  if (!connectionOk) {
    log('\n❌ CRITICAL: Cannot connect to Supabase', 'error');
    log('   Check your .env file and internet connection', 'info');
    return;
  }
  
  const tablesOk = await checkTables();
  const rpcsOk = await checkRPCFunctions();
  const realtimeOk = await checkRealtimeStatus();
  const authStatus = await testAuthFlow();
  
  log('\n📊 SUMMARY', 'header');
  log('================================\n', 'header');
  
  if (tablesOk && rpcsOk && realtimeOk) {
    log('🎉 MULTIPLAYER IS READY!', 'success');
    log('\nEverything is properly configured. The "Jugar con Amigos" tab should work.', 'success');
  } else {
    log('⚠️  MULTIPLAYER NEEDS SETUP', 'warning');
    
    if (!tablesOk) {
      log('\n❌ Missing Tables:', 'error');
      log('   Run the initial schema migrations', 'info');
    }
    
    if (!rpcsOk) {
      log('\n❌ Missing RPC Functions:', 'error');
      log('   1. Open Supabase Dashboard > SQL Editor', 'info');
      log('   2. Copy contents of FIX_MULTIPLAYER_NOW.sql', 'info');
      log('   3. Paste and run in SQL Editor', 'info');
    }
    
    if (!realtimeOk) {
      log('\n⚠️  Realtime Not Enabled:', 'warning');
      log('   1. Open Supabase Dashboard > Database > Replication', 'info');
      log('   2. Enable realtime for:', 'info');
      log('      - users', 'info');
      log('      - rooms', 'info');
      log('      - room_players', 'info');
      log('      - friendships', 'info');
    }
  }
  
  log('\n💡 NEXT STEPS', 'header');
  log('================================\n', 'header');
  
  if (!rpcsOk) {
    log('1. Apply the SQL migration (FIX_MULTIPLAYER_NOW.sql)', 'info');
  }
  if (!realtimeOk) {
    log('2. Enable realtime in Supabase Dashboard', 'info');
  }
  if (rpcsOk && realtimeOk) {
    log('1. Test in your React Native app', 'info');
    log('2. Create account or sign in', 'info');
    log('3. Create a room and share the code', 'info');
    log('4. Join from another device/account', 'info');
  }
}

// Run diagnosis
generateDiagnosis().catch(console.error);