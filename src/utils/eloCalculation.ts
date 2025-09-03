import type { Brand } from '../types/game.types';

export type EloRating = Brand<number, 'EloRating'>;

/**
 * Calculate expected score for a player against an opponent
 * Uses standard ELO probability formula
 */
export function getExpectedScore(playerElo: EloRating, opponentElo: EloRating): number {
  const difference = (opponentElo - playerElo) / 400;
  return 1 / (1 + Math.pow(10, difference));
}

/**
 * Calculate ELO rating changes for winner and loser
 * Returns positive change for winner, negative for loser
 * Maintains zero-sum property (winner gain = loser loss)
 */
export function calculateEloChange(
  winnerElo: EloRating,
  loserElo: EloRating,
  kFactor = 32,
): { winnerChange: number; loserChange: number } {
  const winnerExpected = getExpectedScore(winnerElo, loserElo);
  const loserExpected = getExpectedScore(loserElo, winnerElo);

  const winnerChange = Math.round(kFactor * (1 - winnerExpected));
  const loserChange = Math.round(kFactor * (0 - loserExpected));

  return {
    winnerChange,
    loserChange,
  };
}

/**
 * Calculate average ELO for a team of players
 * Used for team-based game modes
 */
export function calculateTeamElo(playerElos: EloRating[]): EloRating {
  if (playerElos.length === 0) {
    return 1000 as EloRating;
  }

  const sum = playerElos.reduce((acc, elo) => acc + elo, 0);
  return Math.round(sum / playerElos.length) as EloRating;
}
