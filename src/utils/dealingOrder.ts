import type { PlayerId } from '../types/game.types';

/**
 * Calculate counter-clockwise order starting from the player after the dealer
 * In Spanish card games, cards are dealt counter-clockwise starting with the player to the dealer's right
 *
 * Player positions in our layout:
 * - 0: Bottom (current player)
 * - 1: Top-left
 * - 2: Top-right
 * - 3: Bottom-left
 *
 * Counter-clockwise order from each position:
 * - From 0: [3, 1, 2, 0] (left, top-left, top-right, bottom)
 * - From 1: [0, 2, 3, 1] (bottom, top-right, left, top-left)
 * - From 2: [1, 3, 0, 2] (top-left, left, bottom, top-right)
 * - From 3: [2, 0, 1, 3] (top-right, bottom, top-left, left)
 */
export function getCounterClockwiseOrder(dealerIndex: number): number[] {
  const order: number[] = [];

  // Start with player to the right of dealer (counter-clockwise)
  let current = (dealerIndex + 3) % 4; // Move one position counter-clockwise

  for (let i = 0; i < 4; i++) {
    order.push(current);
    // Move counter-clockwise: 0->3->2->1->0
    current = current === 0 ? 3 : current - 1;
  }

  return order;
}

/**
 * Get dealing order for post-trick cards
 * Winner gets first card, then counter-clockwise from winner
 */
export function getPostTrickDealingOrder(
  winnerIndex: number,
  players: { id: PlayerId }[],
): PlayerId[] {
  const order: PlayerId[] = [];
  let current = winnerIndex;

  for (let i = 0; i < 4; i++) {
    order.push(players[current].id);
    // Move counter-clockwise
    current = current === 0 ? 3 : current - 1;
  }

  return order;
}

/**
 * Calculate initial dealing rounds
 * Returns 8 rounds (2 rounds of 3 cards each to 4 players)
 */
export function getInitialDealingRounds(
  dealerIndex: number,
  players: { id: PlayerId }[],
  deck: any[],
): Array<{ playerId: PlayerId; cards: any[] }> {
  const order = getCounterClockwiseOrder(dealerIndex);
  const rounds: Array<{ playerId: PlayerId; cards: any[] }> = [];
  let deckIndex = 0;

  // Two rounds of dealing
  for (let round = 0; round < 2; round++) {
    // Deal to each player in order
    for (const playerIndex of order) {
      const cards = [];
      // Deal 3 cards
      for (let i = 0; i < 3; i++) {
        if (deckIndex < deck.length) {
          cards.push(deck[deckIndex++]);
        }
      }
      rounds.push({
        playerId: players[playerIndex].id,
        cards,
      });
    }
  }

  return rounds;
}
