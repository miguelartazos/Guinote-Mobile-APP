import type { GameState, TeamId, PlayerId } from '../types/game.types';
import type { UserId } from '../types/friend.types';
import type { EloRating } from './eloCalculation';
import { calculateEloChange, calculateTeamElo } from './eloCalculation';

export interface EloUpdateResult {
  updates: Map<UserId, EloRating>;
  changes: Map<UserId, number>;
}

export interface EloUpdatePayload {
  gameId: string;
  updates: Array<{
    userId: string;
    newElo: number;
    change: number;
  }>;
}

/**
 * Check if ELO should be updated for this game
 */
export function shouldUpdateElo(gameState: GameState): boolean {
  // Only update ELO for online games with a winner
  if (gameState.gameMode !== 'online' || !gameState.winner) {
    return false;
  }

  // Don't update ELO if any player is AI
  const hasAI = gameState.players.some(p => p.isAI);
  if (hasAI) {
    return false;
  }

  return true;
}

/**
 * Calculate post-game ELO updates for all players
 */
export function calculatePostGameElo(
  gameState: GameState,
  playerElos: Map<UserId, EloRating>,
): EloUpdateResult {
  const updates = new Map<UserId, EloRating>();
  const changes = new Map<UserId, number>();

  if (!shouldUpdateElo(gameState)) {
    return { updates, changes };
  }

  const winnerTeam = gameState.winner;
  if (!winnerTeam) {
    return { updates, changes };
  }

  // Get players for each team
  const team1Players: UserId[] = [];
  const team2Players: UserId[] = [];

  // Handle both array and object teams format
  const teamsArray = Array.isArray(gameState.teams)
    ? gameState.teams
    : [gameState.teams.team1, gameState.teams.team2];
  const team1Id = teamsArray[0]?.id;
  const team2Id = teamsArray[1]?.id;

  gameState.players.forEach(player => {
    if (!player.userId) return;

    // Direct team assignment from player object
    if (player.teamId === team1Id) {
      team1Players.push(player.userId);
    } else if (player.teamId === team2Id) {
      team2Players.push(player.userId);
    }
  });

  // Get ELOs for each team (use default 1000 if not found)
  const team1Elos = team1Players.map(userId => playerElos.get(userId) || (1000 as EloRating));
  const team2Elos = team2Players.map(userId => playerElos.get(userId) || (1000 as EloRating));

  // Calculate average team ELOs
  const team1AvgElo = calculateTeamElo(team1Elos);
  const team2AvgElo = calculateTeamElo(team2Elos);

  // Calculate ELO changes
  const isTeam1Winner = winnerTeam === team1Id;
  const eloChanges = isTeam1Winner
    ? calculateEloChange(team1AvgElo, team2AvgElo)
    : calculateEloChange(team2AvgElo, team1AvgElo);

  // Apply changes to individual players
  team1Players.forEach((userId, index) => {
    const currentElo = team1Elos[index];
    const change = isTeam1Winner ? eloChanges.winnerChange : eloChanges.loserChange;
    const newElo = (currentElo + change) as EloRating;

    updates.set(userId, newElo);
    changes.set(userId, change);
  });

  team2Players.forEach((userId, index) => {
    const currentElo = team2Elos[index];
    const change = isTeam1Winner ? eloChanges.loserChange : eloChanges.winnerChange;
    const newElo = (currentElo + change) as EloRating;

    updates.set(userId, newElo);
    changes.set(userId, change);
  });

  return { updates, changes };
}

/**
 * Prepare ELO update payload for Supabase RPC
 */
export function prepareEloUpdatePayload(
  updates: Map<UserId, EloRating>,
  changes: Map<UserId, number>,
  gameId: string,
): EloUpdatePayload {
  const updateArray = Array.from(updates.entries()).map(([userId, newElo]) => ({
    userId,
    newElo,
    change: changes.get(userId) || 0,
  }));

  return {
    gameId,
    updates: updateArray,
  };
}
