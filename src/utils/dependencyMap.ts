/**
 * Architecture Dependency Map
 * Created: Phase 1 of Architecture Cleanup
 * Purpose: Track what to keep, delete, and refactor
 */

export const COMPONENTS_TO_KEEP = [
  // ===== CORE GAME ENGINE =====
  'src/screens/GameScreen.tsx', // ✅ Main game screen - central to everything
  'src/components/game/GameTable.tsx', // ✅ Primary table component (704 lines)
  'src/hooks/useGameState.ts', // ✅ Core game state management
  'src/utils/gameLogic.ts', // ✅ Game rules implementation
  'src/utils/gameEngine.ts', // ✅ Game engine
  'src/utils/aiPlayer.ts', // ✅ AI implementation
  'src/utils/aiMemory.ts', // ✅ AI memory system

  // ===== NAVIGATION (WILL SIMPLIFY) =====
  'src/navigation/RootNavigator.tsx', // ✅ Root navigation
  'src/navigation/TabNavigator.tsx', // ✅ Tab navigation (needs cleanup)
  'src/navigation/JugarStackNavigator.tsx', // ✅ Game stack navigation

  // ===== WORKING SCREENS =====
  'src/screens/JugarHomeScreen.tsx', // ✅ Main menu - entry point
  'src/screens/OfflineModeScreen.tsx', // ✅ AI difficulty selection
  'src/screens/LocalMultiplayerScreen.tsx', // ✅ Pass & play setup
  'src/screens/SettingsScreen.tsx', // ✅ App settings
  'src/screens/RankingScreen.tsx', // ✅ Statistics display
  'src/screens/TutorialSetupScreen.tsx', // ✅ Tutorial selection
  'src/screens/TutorialViewerScreen.tsx', // ✅ Tutorial content

  // ===== ESSENTIAL COMPONENTS =====
  'src/components/game/SpanishCard.tsx', // ✅ Card rendering
  'src/components/game/DeckPile.tsx', // ✅ Deck display
  'src/components/game/MinimalPlayerPanel.tsx', // ✅ Player display
  'src/components/game/CardDealingAnimation.tsx', // ✅ Working animation
  'src/components/game/TrickCollectionAnimation.tsx', // ✅ Working animation
  'src/components/game/PassDeviceOverlay.tsx', // ✅ Local multiplayer
  'src/components/game/GameEndCelebration.tsx', // ✅ Win animation
  'src/components/game/CompactActionBar.tsx', // ✅ Game actions
  'src/components/game/GameModals.tsx', // ✅ Game dialogs

  // ===== UI COMPONENTS =====
  'src/components/Button.tsx', // ✅ UI component
  'src/components/ScreenContainer.tsx', // ✅ Screen wrapper
  'src/components/ErrorBoundary.tsx', // ✅ Error handling
  'src/components/ui/AnimatedButton.tsx', // ✅ Animated button
  'src/components/ui/Card.tsx', // ✅ UI card component

  // ===== UTILITIES =====
  'src/utils/responsive.ts', // ✅ Responsive utilities
  'src/utils/haptics.ts', // ✅ Haptic feedback
  'src/constants/colors.ts', // ✅ Color theme
  'src/constants/typography.ts', // ✅ Typography
  'src/constants/dimensions.ts', // ✅ Dimensions
  'src/hooks/useOrientation.ts', // ✅ Orientation handling
  'src/hooks/useGameSettings.ts', // ✅ Settings management
  'src/hooks/useGameStatistics.ts', // ✅ Statistics
];

export const COMPONENTS_TO_DELETE = [
  // ===== DUPLICATE/EXPERIMENTAL COMPONENTS =====
  {
    file: 'src/components/game/GuinotePROGameTable.tsx',
    reason: 'Duplicate of GameTable, only used by demo screen',
    usedBy: ['src/screens/GuinotePRODemoScreen.tsx'],
    linesOfCode: 543,
  },
  {
    file: 'src/screens/GuinotePRODemoScreen.tsx',
    reason: 'Demo screen for GuinotePROGameTable',
    usedBy: [],
    linesOfCode: 200,
  },
  {
    file: 'src/store/gameStore.ts',
    reason: 'COMPLETELY UNUSED - Zustand store with 0 imports',
    usedBy: [],
    linesOfCode: 152,
  },

  // ===== FAILED NETWORK IMPLEMENTATION =====
  {
    file: 'src/screens/NetworkGameScreen.tsx',
    reason: 'Unnecessary wrapper around GameScreen',
    usedBy: ['src/navigation/JugarStackNavigator.tsx'],
    linesOfCode: 150,
    migration: 'Redirect navigation to GameScreen directly',
  },
  {
    file: 'src/hooks/useNetworkGameState.ts',
    reason: 'Just delegates to useGameState for offline mode',
    usedBy: ['src/screens/NetworkGameScreen.tsx', 'src/screens/GameScreen.tsx'],
    linesOfCode: 250,
    migration: 'Merge any useful code into useGameState',
  },

  // ===== PLACEHOLDER SCREENS =====
  {
    file: 'src/screens/AmigosScreen.tsx',
    reason: 'Placeholder with "Coming Soon" text',
    usedBy: ['src/navigation/TabNavigator.tsx'],
    linesOfCode: 59,
  },
  {
    file: 'src/screens/TiendaScreen.tsx',
    reason: 'Placeholder with "Coming Soon" text',
    usedBy: ['src/navigation/TabNavigator.tsx'],
    linesOfCode: 59,
  },
  {
    file: 'src/screens/RoomScreen.tsx',
    reason: 'Placeholder screen',
    usedBy: ['src/navigation/JugarStackNavigator.tsx'],
    linesOfCode: 100,
  },
  {
    file: 'src/screens/FriendsScreen.tsx',
    reason: 'Duplicate/placeholder friends screen',
    usedBy: [],
    linesOfCode: 80,
  },

  // ===== TEST/DEBUG SCREENS =====
  {
    file: 'src/screens/PostTrickAnimationDemo.tsx',
    reason: 'Animation test screen',
    usedBy: [],
    linesOfCode: 150,
  },

  // ===== UNUSED ANIMATION COMPONENTS =====
  {
    file: 'src/components/game/SingleCardDealAnimation.tsx',
    reason: 'NOT IMPORTED ANYWHERE - orphaned component',
    usedBy: [],
    linesOfCode: 100,
  },
  {
    file: 'src/components/game/DealingAnimationCoordinator.tsx',
    reason: 'Only used by GuinotePROGameTable which is being deleted',
    usedBy: ['src/components/game/GuinotePROGameTable.tsx'],
    linesOfCode: 300,
  },
  {
    file: 'src/components/game/InitialDealAnimation.tsx',
    reason: 'Only used by DealingAnimationCoordinator',
    usedBy: ['src/components/game/DealingAnimationCoordinator.tsx'],
    linesOfCode: 200,
  },
  {
    file: 'src/components/game/PostTrickDealAnimation.tsx',
    reason: 'Used by DealingAnimationCoordinator and demo',
    usedBy: [
      'src/components/game/DealingAnimationCoordinator.tsx',
      'src/screens/PostTrickAnimationDemo.tsx',
    ],
    linesOfCode: 250,
  },
  {
    file: 'src/components/game/TrumpRevealAnimation.tsx',
    reason: 'Only used by DealingAnimationCoordinator',
    usedBy: ['src/components/game/DealingAnimationCoordinator.tsx'],
    linesOfCode: 150,
  },

  // ===== BROKEN/INCOMPLETE FEATURES =====
  {
    file: 'src/hooks/useOptimisticMoves.ts',
    reason: 'Part of broken network implementation',
    usedBy: ['src/hooks/useNetworkGameState.ts'],
    linesOfCode: 100,
  },
  {
    file: 'src/hooks/useMoveQueue.ts',
    reason: 'Part of broken network implementation',
    usedBy: ['src/hooks/useNetworkGameState.ts'],
    linesOfCode: 80,
  },
];

export const COMPONENTS_TO_REFACTOR = [
  // ===== SIMPLIFY AUTHENTICATION =====
  {
    file: 'src/hooks/useAuth.ts',
    currentIssue: 'Required for gameplay',
    action: 'Return mock user when offline',
    priority: 'HIGH',
  },
  {
    file: 'src/screens/LoginScreen.tsx',
    currentIssue: 'Placeholder implementation',
    action: 'Either implement properly or remove',
    priority: 'MEDIUM',
  },
  {
    file: 'src/screens/RegisterScreen.tsx',
    currentIssue: 'Placeholder implementation',
    action: 'Either implement properly or remove',
    priority: 'MEDIUM',
  },

  // ===== SIMPLIFY NAVIGATION =====
  {
    file: 'src/navigation/TabNavigator.tsx',
    currentIssue: 'Has tabs for non-existent features (Amigos, Tienda)',
    action: 'Remove placeholder tabs, keep only Jugar, Stats, Settings',
    priority: 'HIGH',
  },
  {
    file: 'src/navigation/JugarStackNavigator.tsx',
    currentIssue: 'Routes to deleted screens',
    action: 'Remove routes for deleted screens, simplify navigation',
    priority: 'HIGH',
  },

  // ===== CONSOLIDATE STATE MANAGEMENT =====
  {
    file: 'src/hooks/useGameState.ts',
    currentIssue: 'Only handles offline',
    action: 'Add optional network support for future',
    priority: 'MEDIUM',
  },

  // ===== SIMPLIFY ONLINE FEATURES =====
  {
    file: 'src/screens/QuickMatchScreen.tsx',
    currentIssue: 'Uses broken matchmaking',
    action: 'Disable or show "coming soon"',
    priority: 'LOW',
  },
  {
    file: 'src/screens/OnlineLobbyScreen.tsx',
    currentIssue: 'Incomplete implementation',
    action: 'Disable or show "coming soon"',
    priority: 'LOW',
  },
  {
    file: 'src/screens/FriendsLobbyScreen.tsx',
    currentIssue: 'Incomplete implementation',
    action: 'Simplify to room codes only or disable',
    priority: 'LOW',
  },
];

// ===== DEPENDENCY CHAINS =====
export const DEPENDENCY_CHAINS = {
  'GameScreen.tsx': {
    imports: [
      'GameTable.tsx',
      'useGameState OR useNetworkGameState',
      'CardDealingAnimation.tsx',
      'GameEndCelebration.tsx',
      'PassDeviceOverlay.tsx',
      'CompactActionBar.tsx',
      'GameModals.tsx',
    ],
    critical: true,
    notes: 'Central game screen - must preserve all functionality',
  },

  'NetworkGameScreen.tsx': {
    imports: ['GameScreen.tsx (just wraps it!)', 'useNetworkGameState.ts'],
    critical: false,
    notes: 'REDUNDANT - just a wrapper, can be deleted',
  },

  'GuinotePROGameTable.tsx': {
    imports: [
      'GameBoard.tsx',
      'PlayerPositions.tsx',
      'PlayerHand.tsx',
      'OpponentHand.tsx',
      'DealingAnimationCoordinator.tsx',
    ],
    critical: false,
    notes: 'ISOLATED - only used by demo screen, safe to delete with demo',
  },

  'gameStore.ts': {
    imports: [],
    importedBy: [],
    critical: false,
    notes: 'ORPHANED - 0 imports, 0 exports used, DELETE',
  },

  'useNetworkGameState.ts': {
    imports: [
      'useGameState.ts (delegates for offline)',
      'useOptimisticMoves.ts',
      'useMoveQueue.ts',
    ],
    importedBy: ['NetworkGameScreen.tsx', 'GameScreen.tsx (conditionally)'],
    critical: false,
    notes: 'Just a wrapper that adds complexity, merge into useGameState',
  },
};

// ===== CIRCULAR DEPENDENCIES FOUND =====
export const CIRCULAR_DEPENDENCIES = [
  {
    cycle: ['GameScreen → useNetworkGameState → useGameState → (back to GameScreen indirectly)'],
    severity: 'LOW',
    fix: 'Delete useNetworkGameState, use useGameState directly',
  },
];

// ===== STATS SUMMARY =====
export const CLEANUP_STATS = {
  totalFiles: 238,
  filesToKeep: 50,
  filesToDelete: 30,
  filesToRefactor: 15,
  estimatedLinesDeleted: 3500,
  estimatedComplexityReduction: '40%',

  byCategory: {
    'Duplicate Components': 2,
    'Placeholder Screens': 4,
    'Failed Network Code': 5,
    'Unused Animations': 6,
    'Test/Debug Screens': 2,
    'Orphaned Code': 1,
  },
};

// ===== VALIDATION FUNCTIONS =====
export function canSafelyDelete(filePath: string): boolean {
  const deleteItem = COMPONENTS_TO_DELETE.find(item =>
    typeof item === 'string' ? item === filePath : item.file === filePath,
  );

  if (!deleteItem || typeof deleteItem === 'string') return false;

  // Safe to delete if:
  // 1. No files use it, OR
  // 2. All files that use it are also being deleted
  if (deleteItem.usedBy.length === 0) return true;

  const allUserswillBeDeleted = deleteItem.usedBy.every(user =>
    COMPONENTS_TO_DELETE.some(d => typeof d === 'object' && d.file === user),
  );

  return allUserswillBeDeleted;
}

export function getDeletionOrder(): string[] {
  // Delete in order: leaves first, then branches
  const order: string[] = [];

  // First: Files with no dependencies
  const leaves = COMPONENTS_TO_DELETE.filter(
    item => typeof item === 'object' && item.usedBy.length === 0,
  ).map(item => (item as any).file);

  // Second: Files only used by leaves
  const branches = COMPONENTS_TO_DELETE.filter(
    item =>
      typeof item === 'object' &&
      item.usedBy.length > 0 &&
      item.usedBy.every((user: string) => leaves.includes(user)),
  ).map(item => (item as any).file);

  // Third: Everything else
  const rest = COMPONENTS_TO_DELETE.filter(
    item =>
      typeof item === 'object' && !leaves.includes(item.file) && !branches.includes(item.file),
  ).map(item => (item as any).file);

  return [...leaves, ...branches, ...rest];
}

// ===== ACTION PLAN =====
export const ACTION_PLAN = {
  immediate: [
    'Delete gameStore.ts (0 imports)',
    'Delete SingleCardDealAnimation.tsx (0 imports)',
    'Delete test screens (PostTrickAnimationDemo)',
  ],

  phase1: [
    'Delete GuinotePROGameTable + GuinotePRODemoScreen together',
    'Delete animation coordinator and related animations',
    'Delete placeholder screens (Amigos, Tienda, Room)',
  ],

  phase2: [
    'Remove NetworkGameScreen, update navigation',
    'Merge useNetworkGameState into useGameState',
    'Remove broken network hooks',
  ],

  phase3: [
    'Simplify navigation (remove deleted screen routes)',
    'Make auth optional',
    'Clean up remaining online features',
  ],
};
