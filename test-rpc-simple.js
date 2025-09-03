#!/usr/bin/env node

require('dotenv').config();

async function testRPCDirect() {
  const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
  const key = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY;
  
  console.log('🔍 Testing RPC functions directly\n');
  console.log('================================\n');
  
  // Test create_room without auth (should fail but tell us if function exists)
  console.log('Testing create_room (no auth)...');
  try {
    const response = await fetch(`${url}/rest/v1/rpc/create_room`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        p_game_mode: 'friend',
        p_is_public: false
      })
    });
    
    const text = await response.text();
    console.log('  Status:', response.status);
    console.log('  Response:', text);
    
    // Try to parse as JSON if possible
    try {
      const json = JSON.parse(text);
      console.log('  Parsed:', JSON.stringify(json, null, 2));
    } catch (e) {
      // Not JSON, that's ok
    }
  } catch (error) {
    console.log('  Error:', error.message);
  }
  
  console.log('\n================================\n');
  
  // Test ensure_user_exists
  console.log('Testing ensure_user_exists (no auth)...');
  try {
    const response = await fetch(`${url}/rest/v1/rpc/ensure_user_exists`, {
      method: 'POST',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    const text = await response.text();
    console.log('  Status:', response.status);
    console.log('  Response:', text);
  } catch (error) {
    console.log('  Error:', error.message);
  }
  
  console.log('\n================================\n');
}

testRPCDirect();