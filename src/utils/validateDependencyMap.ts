/**
 * Validation script for dependency map
 * Run this to verify our deletion plan is safe
 */

import { COMPONENTS_TO_DELETE, canSafelyDelete, getDeletionOrder } from './dependencyMap';

// Test that we can safely delete files
export function validateDeletionPlan(): void {
  console.log('🔍 Validating Deletion Plan...\n');

  const deletionOrder = getDeletionOrder();

  console.log('📋 Recommended Deletion Order:');
  deletionOrder.forEach((file, index) => {
    const canDelete = canSafelyDelete(file);
    const emoji = canDelete ? '✅' : '⚠️';
    console.log(`${index + 1}. ${emoji} ${file}`);
  });

  console.log('\n📊 Deletion Safety Analysis:');

  let safeCount = 0;
  let unsafeCount = 0;

  COMPONENTS_TO_DELETE.forEach(item => {
    if (typeof item === 'object') {
      const safe = canSafelyDelete(item.file);
      if (safe) {
        safeCount++;
        console.log(`✅ SAFE: ${item.file}`);
        if (item.usedBy.length === 0) {
          console.log(`   └─ No dependencies`);
        } else {
          console.log(`   └─ All dependencies also being deleted`);
        }
      } else {
        unsafeCount++;
        console.log(`⚠️  UNSAFE: ${item.file}`);
        console.log(`   └─ Used by: ${item.usedBy.join(', ')}`);
        console.log(`   └─ Action needed: Update these files first`);
      }
    }
  });

  console.log('\n📈 Summary:');
  console.log(`Safe to delete: ${safeCount} files`);
  console.log(`Need attention: ${unsafeCount} files`);
  console.log(`Total to delete: ${COMPONENTS_TO_DELETE.length} files`);

  // Check for test files that need deletion
  console.log('\n🧪 Test Files to Delete:');
  const testFiles = [
    'src/hooks/useNetworkGameState.spec.ts',
    'src/components/game/PostTrickDealAnimation.spec.tsx',
    'src/components/game/GuinotePROGameTable.spec.tsx',
  ];

  testFiles.forEach(test => {
    console.log(`   - ${test}`);
  });
}

// Run validation if this file is executed directly
if (require.main === module) {
  validateDeletionPlan();
}
