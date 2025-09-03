#!/usr/bin/env node
require('dotenv').config();

async function checkSetup() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('🔍 Checking Supabase setup...\n');
  
  const tables = ['users', 'rooms', 'room_players', 'friendships', 'game_moves'];
  
  for (const table of tables) {
    try {
      const response = await fetch(`${url}/rest/v1/${table}?limit=1`, {
        headers: {
          'apikey': key,
          'Authorization': `Bearer ${key}`,
          'Prefer': 'count=exact'
        }
      });
      
      if (response.ok) {
        const count = response.headers.get('content-range');
        console.log(`✅ ${table.padEnd(15)} - exists`);
      } else if (response.status === 404 || response.status === 400) {
        console.log(`❌ ${table.padEnd(15)} - NOT FOUND`);
      } else {
        console.log(`⚠️  ${table.padEnd(15)} - status: ${response.status}`);
      }
    } catch (error) {
      console.log(`❌ ${table.padEnd(15)} - error: ${error.message}`);
    }
  }
  
  console.log('\n🔍 Checking RPC functions...\n');
  
  // Test if create_room RPC exists
  try {
    const response = await fetch(`${url}/rest/v1/rpc/create_room`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    // 401 means function exists but needs auth
    // 404 means function doesn't exist
    if (response.status === 401) {
      console.log('✅ create_room RPC   - exists (auth required)');
    } else if (response.status === 404) {
      console.log('❌ create_room RPC   - NOT FOUND');
    } else {
      console.log(`⚠️  create_room RPC   - status: ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ create_room RPC   - error: ${error.message}`);
  }
}

checkSetup();
