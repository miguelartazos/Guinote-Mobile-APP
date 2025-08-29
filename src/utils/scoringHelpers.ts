import type { TrickCard, TeamId } from '../types/game.types';
import { CARD_POINTS } from '../types/game.types';

/**
 * Calculate total points from a team's collected tricks
 */
export function calculateHandPoints(tricks: ReadonlyArray<TrickCard[]> | TrickCard[][]): number {
  return tricks.flat().reduce((sum, trickCard) => sum + CARD_POINTS[trickCard.card.value], 0);
}

/**
 * Get the 10 de últimas bonus if team won last trick
 */
export function getLastTrickBonus(lastTrickWinnerTeam: TeamId | undefined, teamId: TeamId): number {
  return lastTrickWinnerTeam === teamId ? 10 : 0;
}
