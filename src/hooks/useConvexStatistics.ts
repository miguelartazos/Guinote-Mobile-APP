import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useCallback } from 'react';
import type { GameState } from '../types/game.types';

export function useConvexStatistics(userId?: Id<'users'> | string) {
  // Check if this is a valid Convex user ID (not the mock offline ID)
  const isValidConvexId = userId && 
    typeof userId === 'string' && 
    !userId.startsWith('local-') &&
    userId.length > 10; // Convex IDs are longer
  
  // Queries - skip if no userId or if it's an offline/mock user
  const playerStats = useQuery(
    api.statistics.getPlayerStats,
    isValidConvexId ? { userId: userId as Id<'users'> } : 'skip',
  );

  const leaderboard = useQuery(
    api.statistics.getLeaderboard,
    isValidConvexId ? { gameMode: 'all', limit: 100 } : 'skip',
  );

  // Mutations
  const updateStats = useMutation(api.statistics.updatePlayerStats);

  // Calculate game stats from final game state
  const recordGameResult = useCallback(
    async (
      gameState: GameState,
      userId: Id<'users'> | string,
      gameMode: 'ranked' | 'casual' | 'friends',
      startTime: number,
    ) => {
      // Skip recording if no userId or if it's an offline/mock user
      if (!userId || typeof userId !== 'string' || userId.startsWith('local-')) {
        console.log('Skipping statistics recording for offline user');
        return;
      }

      if (gameState.phase !== 'gameOver' && gameState.phase !== 'finished') {
        throw new Error('Game not finished');
      }

      // Find player's team
      const player = gameState.players.find(p => p.id === (userId as any));
      if (!player) {
        throw new Error('Player not found in game');
      }

      const playerTeamIndex = gameState.teams.findIndex(team =>
        team.playerIds.includes(userId as any),
      );

      if (playerTeamIndex === -1) {
        throw new Error('Player team not found');
      }

      // Determine winner by checking which team has higher score
      const won =
        gameState.teams[playerTeamIndex].score >
        gameState.teams[1 - playerTeamIndex].score;
      const playerTeam = gameState.teams[playerTeamIndex];
      const opponentTeam = gameState.teams[1 - playerTeamIndex];

      // Calculate ELO change (simplified)
      const eloChange = won ? 25 : -20;

      // Game duration in seconds
      const gameDuration = Math.floor((Date.now() - startTime) / 1000);

      // Count cantes and victories
      let cantes = 0;
      let victories20 = 0;
      let victories40 = 0;

      playerTeam.cantes.forEach(cante => {
        cantes++;
        if (cante === 20) victories20++;
        if (cante === 40) victories40++;
      });

      // Only update stats if we have a valid Convex user ID
      const validUserId = userId && 
        typeof userId === 'string' && 
        !userId.startsWith('local-') &&
        userId.length > 10;
        
      if (validUserId) {
        await updateStats({
          userId: userId as Id<'users'>,
          won,
          eloChange,
          gameMode,
          gameDuration,
          pointsScored: playerTeam.gamePoints,
          pointsConceded: opponentTeam.gamePoints,
          cantes,
          victories20,
          victories40,
        });
      }
    },
    [updateStats],
  );

  // Return default values for offline mode
  return {
    playerStats: playerStats || {
      gamesPlayed: 0,
      gamesWon: 0,
      elo: 1000,
      winRate: 0,
      avgPointsPerGame: 0,
      totalCantes: 0,
    },
    leaderboard: leaderboard || [],
    recordGameResult,
  };
}

// Hook for head-to-head stats
export function useHeadToHeadStats(
  userId1?: Id<'users'> | string,
  userId2?: Id<'users'> | string,
) {
  // Check if both are valid Convex user IDs
  const areValidIds = 
    userId1 && userId2 &&
    typeof userId1 === 'string' && 
    typeof userId2 === 'string' &&
    !userId1.startsWith('local-') &&
    !userId2.startsWith('local-') &&
    userId1.length > 10 &&
    userId2.length > 10;
    
  const h2hStats = useQuery(
    api.statistics.getHeadToHeadStats,
    areValidIds ? { userId1: userId1 as Id<'users'>, userId2: userId2 as Id<'users'> } : 'skip',
  );

  return h2hStats;
}
