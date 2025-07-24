import type { Card, GameState, TrickCard } from '../types/game.types';
import type { SpanishSuit } from '../components/game/SpanishCard';
import { CARD_POINTS } from '../types/game.types';
import { isValidPlay, calculateTrickWinner } from './gameLogic';

function getCardPower(card: Card): number {
  const powerRanking: Record<number, number> = {
    1: 10, // As
    3: 9, // Tres
    12: 8, // Rey
    11: 7, // Caballo
    10: 6, // Sota
    7: 5,
    6: 4,
    5: 3,
    4: 2,
    2: 1, // Dos
  };
  return powerRanking[card.value] || 0;
}

function getCardPoints(card: Card): number {
  return CARD_POINTS[card.value] || 0;
}

function canWinTrick(
  card: Card,
  currentTrick: readonly TrickCard[],
  trumpSuit: SpanishSuit,
): boolean {
  if (currentTrick.length === 0) return true;

  const trickWithAI = [...currentTrick, { playerId: 'ai' as any, card }];
  const winnerId = calculateTrickWinner(trickWithAI, trumpSuit);

  return winnerId === 'ai';
}

function getTrickPoints(trick: readonly TrickCard[]): number {
  return trick.reduce((sum, tc) => sum + getCardPoints(tc.card), 0);
}

function hasCante(hand: readonly Card[], suit: SpanishSuit): boolean {
  const hasRey = hand.some(c => c.suit === suit && c.value === 12);
  const hasSota = hand.some(c => c.suit === suit && c.value === 10);
  return hasRey && hasSota;
}

function shouldPreserveCante(
  card: Card,
  hand: readonly Card[],
  gameState: GameState,
): boolean {
  // Don't preserve cantes if game is almost over
  if (gameState.phase === 'arrastre' || gameState.deck.length < 8) return false;

  // Check if this card is part of a cante
  if (card.value === 12 || card.value === 10) {
    return hasCante(hand, card.suit);
  }

  return false;
}

export function playAICard(
  hand: readonly Card[],
  gameState: GameState,
): Card | null {
  const { currentTrick, trumpSuit, phase } = gameState;

  // Get all valid cards
  const validCards = hand.filter(card =>
    isValidPlay(card, hand, currentTrick, trumpSuit, phase),
  );

  if (validCards.length === 0) return null;
  if (validCards.length === 1) return validCards[0];

  // Starting a trick
  if (currentTrick.length === 0) {
    // Filter out cards that are part of cantes we want to preserve
    const playableCards = validCards.filter(
      card => !shouldPreserveCante(card, hand, gameState),
    );

    // If all cards are part of cantes, use all valid cards
    const cardsToConsider =
      playableCards.length > 0 ? playableCards : validCards;

    // In arrastre phase, be more conservative
    if (phase === 'arrastre') {
      // Lead with low non-trump cards first
      const nonTrumps = cardsToConsider.filter(c => c.suit !== trumpSuit);
      if (nonTrumps.length > 0) {
        return nonTrumps.sort((a, b) => getCardPower(a) - getCardPower(b))[0];
      }
    }

    // Normal phase: lead with highest non-trump
    const nonTrumps = cardsToConsider.filter(c => c.suit !== trumpSuit);
    if (nonTrumps.length > 0) {
      return nonTrumps.sort((a, b) => getCardPower(b) - getCardPower(a))[0];
    }

    // Only trumps left, play lowest
    return cardsToConsider.sort((a, b) => getCardPower(a) - getCardPower(b))[0];
  }

  // Following in a trick
  const trickValue = getTrickPoints(currentTrick);

  // Can we win the trick?
  const winningCards = validCards.filter(card =>
    canWinTrick(card, currentTrick, trumpSuit),
  );

  if (winningCards.length > 0) {
    // Trick has valuable points, try to win it
    if (trickValue >= 10) {
      // Win with lowest possible winning card
      return winningCards.sort((a, b) => getCardPower(a) - getCardPower(b))[0];
    }

    // Low value trick in early game, maybe let it go
    if (phase === 'playing' && gameState.deck.length > 20 && trickValue < 5) {
      // 50% chance to duck
      if (Math.random() < 0.5) {
        const losingCards = validCards.filter(c => !winningCards.includes(c));
        if (losingCards.length > 0) {
          return losingCards.sort(
            (a, b) => getCardPoints(a) - getCardPoints(b),
          )[0];
        }
      }
    }

    // Default: win with lowest winning card
    return winningCards.sort((a, b) => getCardPower(a) - getCardPower(b))[0];
  }

  // Can't win, play lowest point card
  const sortedByPoints = validCards.sort((a, b) => {
    const pointDiff = getCardPoints(a) - getCardPoints(b);
    if (pointDiff !== 0) return pointDiff;
    return getCardPower(a) - getCardPower(b);
  });

  return sortedByPoints[0];
}
