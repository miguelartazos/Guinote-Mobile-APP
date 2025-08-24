import type { Team, Cante, GameState } from '../types/game.types';
import type { SpanishSuit } from '../types/cardTypes';

export type CanteAnimationData = {
  suit: SpanishSuit;
  points: 20 | 40;
  playerIndex: number;
  playerName: string;
  playerAvatar?: string;
};

export function detectNewCante(teams: readonly Team[], previousTotalCantes: number): Cante | null {
  const currentTotalCantes = teams.reduce((sum, team) => sum + team.cantes.length, 0);

  if (currentTotalCantes <= previousTotalCantes) {
    return null;
  }

  for (const team of teams) {
    if (team.cantes.length > 0) {
      const latestCante = team.cantes[team.cantes.length - 1];
      const otherTeam = teams.find(t => t.id !== team.id);
      const otherTeamCantes = otherTeam?.cantes.length || 0;

      const totalCantesBeforeThis = team.cantes.length - 1 + otherTeamCantes;

      if (totalCantesBeforeThis === previousTotalCantes) {
        return latestCante;
      }
    }
  }

  return null;
}

export function getPlayerPositionForIndex(playerIndex: number): { x: number; y: number } {
  const positions = [
    { x: 400, y: 550 }, // Bottom (player 0)
    { x: 700, y: 350 }, // Right (player 1)
    { x: 400, y: 150 }, // Top (player 2)
    { x: 100, y: 350 }, // Left (player 3)
  ];

  return positions[playerIndex] || positions[0];
}

export function createCanteAnimationData(
  gameState: GameState,
  cante: Cante,
): CanteAnimationData | null {
  const declaringPlayer = gameState.players[gameState.currentPlayerIndex];
  if (!declaringPlayer) return null;

  const playerPosition = getPlayerPositionForIndex(gameState.currentPlayerIndex);

  return {
    suit: cante.suit,
    points: cante.points,
    playerIndex: gameState.currentPlayerIndex,
    playerName: declaringPlayer.name,
    playerAvatar: declaringPlayer.avatar,
  };
}

export function shouldShowCanteAnimation(
  currentTotalCantes: number,
  previousTotalCantes: number,
): boolean {
  // Don't show animation on initial load
  if (previousTotalCantes === 0 && currentTotalCantes > 0) {
    return false;
  }

  // Show animation for new cantes
  return currentTotalCantes > previousTotalCantes;
}
