import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';
import { useCallback } from 'react';
import type { GameState } from '../types/game.types';

export function useConvexStatistics(userId?: Id<'users'>) {
  // Queries - skip if no userId (offline mode)
  const playerStats = useQuery(
    api.statistics.getPlayerStats,
    userId ? { userId } : 'skip',
  );

  const leaderboard = useQuery(
    api.statistics.getLeaderboard,
    userId ? { gameMode: 'all', limit: 100 } : 'skip',
  );

  // Mutations
  const updateStats = useMutation(api.statistics.updatePlayerStats);

  // Calculate game stats from final game state
  const recordGameResult = useCallback(
    async (
      gameState: GameState,
      userId: Id<'users'>,
      gameMode: 'ranked' | 'casual' | 'friends',
      startTime: number,
    ) => {
      // Skip recording if no userId (offline mode)
      if (!userId) {
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

      await updateStats({
        userId,
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
    },
    [updateStats],
  );

  return {
    playerStats,
    leaderboard,
    recordGameResult,
  };
}

// Hook for head-to-head stats
export function useHeadToHeadStats(
  userId1?: Id<'users'>,
  userId2?: Id<'users'>,
) {
  const h2hStats = useQuery(
    api.statistics.getHeadToHeadStats,
    userId1 && userId2 ? { userId1, userId2 } : 'skip',
  );

  return h2hStats;
}
