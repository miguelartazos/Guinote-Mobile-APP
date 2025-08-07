import type { PlayerId } from '../types/game.types';
import type { Card } from '../types/game.types';

/**
 * Calculate counter-clockwise order starting from the player after the dealer
 * In Spanish card games, cards are dealt counter-clockwise starting with the player to the dealer's right
 *
 * Player positions in our layout:
 * - 0: Bottom (current player/user)
 * - 1: Right (counter-clockwise from bottom)
 * - 2: Top
 * - 3: Left
 *
 * Counter-clockwise order from each position:
 * - From 0 (Bottom): [1, 2, 3, 0] (right, top, left, bottom)
 * - From 1 (Right): [2, 3, 0, 1] (top, left, bottom, right)
 * - From 2 (Top): [3, 0, 1, 2] (left, bottom, right, top)
 * - From 3 (Left): [0, 1, 2, 3] (bottom, right, top, left)
 */
export function getCounterClockwiseOrder(dealerIndex: number): number[] {
  const order: number[] = [];

  // Start with player to the right of dealer (counter-clockwise)
  // Counter-clockwise: 0->1->2->3->0
  let current = (dealerIndex + 1) % 4;

  for (let i = 0; i < 4; i++) {
    order.push(current);
    current = (current + 1) % 4; // Move counter-clockwise
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
    // Move counter-clockwise: 0->1->2->3->0
    current = (current + 1) % 4;
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
  deck: Card[],
): Array<{ playerId: PlayerId; cards: Card[]; cardIndices: number[] }> {
  const order = getCounterClockwiseOrder(dealerIndex);
  const rounds: Array<{
    playerId: PlayerId;
    cards: Card[];
    cardIndices: number[];
  }> = [];
  let deckIndex = 0;

  // Two rounds of dealing
  for (let round = 0; round < 2; round++) {
    // Deal to each player in order
    for (const playerIndex of order) {
      const cards: Card[] = [];
      const cardIndices: number[] = [];

      // Deal 3 cards
      for (let i = 0; i < 3; i++) {
        if (deckIndex < deck.length) {
          cards.push(deck[deckIndex]);
          // Card position within player's hand (0-5)
          cardIndices.push(round * 3 + i);
          deckIndex++;
        }
      }

      rounds.push({
        playerId: players[playerIndex].id,
        cards,
        cardIndices,
      });
    }
  }

  return rounds;
}

/**
 * Get animation sequence for initial dealing
 * Returns detailed information for each card animation
 */
export interface DealAnimationStep {
  playerIndex: number;
  cardIndex: number; // Position in player's hand (0-5)
  card: Card;
  delay: number; // Milliseconds before starting this animation
}

export function getInitialDealAnimationSequence(
  dealerIndex: number,
  players: { id: PlayerId }[],
  deck: Card[],
): DealAnimationStep[] {
  const order = getCounterClockwiseOrder(dealerIndex);
  const animations: DealAnimationStep[] = [];
  let deckIndex = 0;
  let totalDelay = 0;
  const ANIMATION_DURATION = 100; // 100ms delay between cards for faster dealing

  // Two rounds of dealing
  for (let round = 0; round < 2; round++) {
    // Deal to each player in order
    for (const playerIndex of order) {
      // Deal 3 cards to this player
      for (let i = 0; i < 3; i++) {
        if (deckIndex < deck.length) {
          animations.push({
            playerIndex,
            cardIndex: round * 3 + i, // 0-2 for first round, 3-5 for second round
            card: deck[deckIndex],
            delay: totalDelay,
          });
          deckIndex++;
          totalDelay += ANIMATION_DURATION;
        }
      }
    }
  }

  return animations;
}
