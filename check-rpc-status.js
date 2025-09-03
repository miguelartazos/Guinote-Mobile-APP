#!/usr/bin/env node

require('dotenv').config();

async function checkRPCStatus() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('🔍 Checking RPC Function Status\n');
  console.log('================================\n');
  
  const rpcs = [
    'create_room',
    'join_room', 
    'leave_room',
    'toggle_ready',
    'start_game',
    'add_ai_player',
    'ensure_user_exists',
    'get_online_friends'
  ];
  
  for (const rpc of rpcs) {
    try {
      const response = await fetch(`${url}/rest/v1/rpc/${rpc}`, {
        method: 'POST',
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Content-Type': 'application/json'
        },
        body: '{}'
      });
      
      if (response.status === 401) {
        console.log(`✅ ${rpc.padEnd(20)} - EXISTS (needs auth)`);
      } else if (response.status === 404) {
        console.log(`❌ ${rpc.padEnd(20)} - NOT FOUND`);
      } else if (response.status === 400) {
        // Could be missing params or could not exist
        const text = await response.text();
        if (text.includes('function') && text.includes('not exist')) {
          console.log(`❌ ${rpc.padEnd(20)} - NOT FOUND`);
        } else {
          console.log(`⚠️  ${rpc.padEnd(20)} - EXISTS (missing params)`);
        }
      } else {
        console.log(`❓ ${rpc.padEnd(20)} - Status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${rpc.padEnd(20)} - Error: ${error.message}`);
    }
  }
  
  console.log('\n================================\n');
  console.log('📋 INSTRUCTIONS:\n');
  console.log('If you see ❌ NOT FOUND above:');
  console.log('1. Go to Supabase Dashboard > SQL Editor');
  console.log('2. Copy the entire contents of FIX_MULTIPLAYER_NOW.sql');
  console.log('3. Paste and run it in the SQL Editor');
  console.log('4. Run this script again to verify');
}

checkRPCStatus();