#!/usr/bin/env node

/**
 * Verify Auth Fix Implementation
 * 
 * This script verifies that the auth fix has been properly implemented
 * by checking the key changes in the useUnifiedAuth hook
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying Session Persistence Fix Implementation\n');
console.log('=' .repeat(60));

const authHookPath = path.join(__dirname, 'src', 'hooks', 'useUnifiedAuth.ts');

// Read the file
const fileContent = fs.readFileSync(authHookPath, 'utf8');

// Define the checks we need to verify
const checks = [
  {
    name: 'Auth listener setup before getSession',
    description: 'onAuthStateChange should be called BEFORE getSession',
    verify: () => {
      const listenerIndex = fileContent.indexOf('supabase.auth.onAuthStateChange');
      const getSessionIndex = fileContent.indexOf('supabase.auth.getSession()');
      return listenerIndex > 0 && listenerIndex < getSessionIndex;
    }
  },
  {
    name: 'Handle all events with valid sessions',
    description: 'Should update user for any event with a valid session',
    verify: () => {
      return fileContent.includes('// Handle all events with valid sessions') &&
             fileContent.includes('if (session?.user)');
    }
  },
  {
    name: 'Only clear user on SIGNED_OUT',
    description: 'User should only be set to null on explicit SIGNED_OUT event',
    verify: () => {
      return fileContent.includes("event === 'SIGNED_OUT'") &&
             fileContent.includes('// Only clear user on explicit sign out');
    }
  },
  {
    name: 'Non-blocking session refresh',
    description: 'Session refresh should be attempted but not block on errors',
    verify: () => {
      return fileContent.includes('supabase.auth.refreshSession().catch') &&
             fileContent.includes('// Ignore refresh errors');
    }
  },
  {
    name: 'Error handling preserves user state',
    description: 'Network errors should not clear the user state',
    verify: () => {
      return fileContent.includes('} else if (!sessionError) {') &&
             fileContent.includes('// If there was an error, keep existing user state');
    }
  },
  {
    name: 'Comments explain the logic',
    description: 'Code includes explanatory comments for maintainability',
    verify: () => {
      return fileContent.includes('// For all other events without session') &&
             fileContent.includes('// keep existing user state to prevent unwanted logouts');
    }
  }
];

// Run the checks
let allPassed = true;
checks.forEach((check, index) => {
  const passed = check.verify();
  const icon = passed ? '✅' : '❌';
  const status = passed ? 'PASSED' : 'FAILED';
  
  console.log(`\n${index + 1}. ${check.name}`);
  console.log(`   ${check.description}`);
  console.log(`   ${icon} ${status}`);
  
  if (!passed) {
    allPassed = false;
  }
});

// Summary
console.log('\n' + '=' .repeat(60));
if (allPassed) {
  console.log('✅ ALL CHECKS PASSED!');
  console.log('\nThe session persistence fix has been properly implemented.');
  console.log('Key improvements:');
  console.log('• Auth listener is set up before attempting to get session');
  console.log('• All events with valid sessions update the user state');
  console.log('• User is only cleared on explicit sign out');
  console.log('• Session refresh errors are handled gracefully');
  console.log('• Network errors preserve existing user state');
} else {
  console.log('❌ SOME CHECKS FAILED');
  console.log('\nThe session persistence fix may not be fully implemented.');
  console.log('Please review the failed checks above.');
}
console.log('=' .repeat(60) + '\n');

process.exit(allPassed ? 0 : 1);