import type { PlayerId, TeamId, GameState } from '../types/game.types';
import { findPlayerTeam } from './gameLogic';

/**
 * Type guard to check if player has valid team assignment
 */
export function hasTeam(
  playerId: PlayerId | undefined,
  gameState: GameState,
): playerId is PlayerId {
  return playerId !== undefined && findPlayerTeam(playerId, gameState) !== undefined;
}

/**
 * Get player's team with type narrowing support
 */
export function getPlayerTeamSafe(playerId: PlayerId, gameState: GameState): TeamId | undefined {
  return findPlayerTeam(playerId, gameState);
}

/**
 * Check if two players are on the same team
 */
export function areTeammates(player1: PlayerId, player2: PlayerId, gameState: GameState): boolean {
  const team1 = findPlayerTeam(player1, gameState);
  const team2 = findPlayerTeam(player2, gameState);
  return team1 !== undefined && team1 === team2;
}

/**
 * Check if a player is on a specific team
 */
export function isOnTeam(playerId: PlayerId, teamId: TeamId, gameState: GameState): boolean {
  return findPlayerTeam(playerId, gameState) === teamId;
}

/**
 * Get opposing team ID
 */
export function getOpposingTeam(teamId: TeamId, gameState: GameState): TeamId | undefined {
  // First check if the provided teamId actually exists
  const teamExists = gameState.teams.some(t => t.id === teamId);
  if (!teamExists) {
    return undefined;
  }

  const otherTeam = gameState.teams.find(t => t.id !== teamId);
  return otherTeam?.id;
}

/**
 * Safely get both teams for two players
 */
export function getPlayerTeams(
  player1: PlayerId,
  player2: PlayerId,
  gameState: GameState,
): { team1: TeamId | undefined; team2: TeamId | undefined } {
  return {
    team1: findPlayerTeam(player1, gameState),
    team2: findPlayerTeam(player2, gameState),
  };
}

/**
 * Type guard that asserts team exists (throws if not)
 */
export function assertTeamExists(
  playerId: PlayerId,
  gameState: GameState,
): asserts playerId is PlayerId {
  const team = findPlayerTeam(playerId, gameState);
  if (!team) {
    throw new Error(`Player ${playerId} has no team assignment`);
  }
}
