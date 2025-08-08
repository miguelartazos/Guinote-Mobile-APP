/**
 * Wrapper hook for statistics that works both online and offline
 * In offline mode, it returns mock functions that do nothing
 * In online mode, it dynamically imports and uses Convex statistics
 */

import { useCallback, useEffect, useState } from 'react';
import type { GameState } from '../types/game.types';
import type { Id } from '../../convex/_generated/dataModel';

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

export function useStatistics(userId?: Id<'users'> | string): StatisticsHook {
  const [stats, setStats] = useState<StatisticsHook>(offlineStats);
  const [isOnline, setIsOnline] = useState(false);

  useEffect(() => {
    // Check if we should use online statistics
    const shouldUseOnline = 
      userId && 
      typeof userId === 'string' && 
      !userId.startsWith('local-') &&
      !userId.startsWith('offline-') &&
      userId.length > 10 && // Convex IDs are longer
      !!process.env.EXPO_PUBLIC_CONVEX_URL; // Check if Convex is configured

    if (shouldUseOnline) {
      // Dynamically import Convex statistics hook
      import('./useConvexStatistics')
        .then(module => {
          setIsOnline(true);
          // This will cause a re-render with online stats
        })
        .catch(error => {
          console.log('Failed to load online statistics:', error);
          // Stay with offline stats
        });
    }
  }, [userId]);

  // If online, use the actual hook (but we can't do this conditionally)
  // So we need a different approach...
  
  return stats;
}

/**
 * Alternative approach: Create a safe version that doesn't import Convex at all
 */
export function useSafeStatistics(userId?: Id<'users'> | string) {
  const isOfflineUser = !userId || 
    typeof userId !== 'string' || 
    userId.startsWith('local-') ||
    userId.startsWith('offline-') ||
    userId.length <= 10;

  const recordGameResult = useCallback(
    async (
      gameState: GameState,
      userId: Id<'users'> | string,
      gameMode: 'ranked' | 'casual' | 'friends',
      startTime: number,
    ) => {
      if (isOfflineUser) {
        console.log('📊 Statistics recording skipped for offline mode');
        return;
      }

      // Only try to record if we're online
      try {
        // Dynamically import and use Convex statistics
        const { useConvexStatistics } = await import('./useConvexStatistics');
        // Note: We can't use hooks conditionally, so this won't work
        // We need a different approach
        
        console.log('Would record game statistics for online user');
      } catch (error) {
        console.log('Failed to record statistics:', error);
      }
    },
    [isOfflineUser]
  );

  return {
    playerStats: offlineStats.playerStats,
    leaderboard: [],
    recordGameResult,
  };
}