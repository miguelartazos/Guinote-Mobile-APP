/**
 * Wrapper hook for statistics that works both online and offline
 * In offline mode, it returns mock functions that do nothing
 * Online providers are disabled
 */

import { useCallback, useEffect, useState } from 'react';
import type { GameState } from '../types/game.types';
// Convex types removed

interface StatisticsHook {
  playerStats: {
    gamesPlayed: number;
    gamesWon: number;
    elo: number;
    winRate: number;
    avgPointsPerGame: number;
    totalCantes: number;
  };
  leaderboard: any[];
  recordGameResult: (
    gameState: GameState,
    userId: Id<'users'> | string,
    gameMode: 'ranked' | 'casual' | 'friends',
    startTime: number,
  ) => Promise<void>;
}

// Default offline statistics (no-op)
const offlineStats: StatisticsHook = {
  playerStats: {
    gamesPlayed: 0,
    gamesWon: 0,
    elo: 1000,
    winRate: 0,
    avgPointsPerGame: 0,
    totalCantes: 0,
  },
  leaderboard: [],
  recordGameResult: async () => {
    console.log('Statistics recording skipped in offline mode');
  },
};

export function useStatistics(userId?: string): StatisticsHook {
  const [stats, setStats] = useState<StatisticsHook>(offlineStats);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Check if we should use online statistics
    const shouldUseOnline =
      userId &&
      typeof userId === 'string' &&
      !userId.startsWith('local-') &&
      !userId.startsWith('offline-') &&
      userId.length > 10; // Convex IDs are longer
    // Note: Removed process.env check as it doesn't work in React Native

    // Online stats disabled
  }, [userId]);

  // If online, use the actual hook (but we can't do this conditionally)
  // So we need a different approach...

  return stats;
}

/**
 * Alternative approach: Create a safe version without external dependencies
 */
export function useSafeStatistics(userId?: string) {
  const isOfflineUser =
    !userId ||
    typeof userId !== 'string' ||
    userId.startsWith('local-') ||
    userId.startsWith('offline-') ||
    userId.length <= 10;

  const recordGameResult = useCallback(
    async (
      gameState: GameState,
      userId: string,
      gameMode: 'ranked' | 'casual' | 'friends',
      startTime: number,
    ) => {
      if (isOfflineUser) {
        console.log('📊 Statistics recording skipped for offline mode');
        return;
      }

      // Only try to record if we're online
      try {
        console.log('Would record game statistics for online user (disabled)');
      } catch (error) {
        console.log('Failed to record statistics:', error);
      }
    },
    [isOfflineUser],
  );

  return {
    playerStats: offlineStats.playerStats,
    leaderboard: [],
    recordGameResult,
  };
}
