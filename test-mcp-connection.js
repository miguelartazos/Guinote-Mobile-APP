#!/usr/bin/env node

const { spawn } = require('child_process');

console.log('🔍 Testing Supabase MCP Server Connection...\n');

// Environment setup
const env = {
  ...process.env,
  SUPABASE_ACCESS_TOKEN: 'sbp_f043815f9c646af89f83ce55a385a6872037a95f'  // Updated token from .mcp.json
};

console.log('Starting MCP server with parameters:');
console.log('- Project Ref: xewzprfamxswxtmzucbt');
console.log('- Mode: read-only');
console.log('- Access Token: sbp_...5460 (from Claude config)');
console.log('');

// Start the MCP server
const mcp = spawn('npx', [
  '-y',
  '@supabase/mcp-server-supabase@latest',
  '--read-only',
  '--project-ref=xewzprfamxswxtmzucbt'
], {
  env: env,
  stdio: ['pipe', 'pipe', 'pipe']
});

// Set up timeout
const timeout = setTimeout(() => {
  console.log('\n⏱️  Timeout after 10 seconds');
  mcp.kill();
  process.exit(1);
}, 10000);

// Handle stdout
mcp.stdout.on('data', (data) => {
  const output = data.toString();
  console.log('📤 STDOUT:', output);
  
  // Look for successful initialization
  if (output.includes('initialized') || output.includes('ready')) {
    console.log('\n✅ MCP Server initialized successfully!');
    clearTimeout(timeout);
    mcp.kill();
    process.exit(0);
  }
});

// Handle stderr
mcp.stderr.on('data', (data) => {
  console.error('❌ STDERR:', data.toString());
});

// Handle process events
mcp.on('error', (error) => {
  console.error('❌ Failed to start MCP server:', error);
  clearTimeout(timeout);
  process.exit(1);
});

mcp.on('close', (code) => {
  clearTimeout(timeout);
  if (code !== 0 && code !== null) {
    console.log(`\n❌ MCP server exited with code ${code}`);
    process.exit(1);
  }
});

// Send initialization request
setTimeout(() => {
  console.log('\n📨 Sending initialization request...');
  const initRequest = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2025-06-18",
      capabilities: {},
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    }
  }) + '\n';
  
  mcp.stdin.write(initRequest);
  
  // After initialization, send initialized notification
  setTimeout(() => {
    console.log('📨 Sending initialized notification...');
    const initializedNotification = JSON.stringify({
      jsonrpc: "2.0",
      method: "notifications/initialized"
    }) + '\n';
    
    mcp.stdin.write(initializedNotification);
    
    // List available tools
    setTimeout(() => {
      console.log('📨 Requesting available tools...');
      const toolsRequest = JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list"
      }) + '\n';
      
      mcp.stdin.write(toolsRequest);
    }, 500);
  }, 500);
}, 1000);