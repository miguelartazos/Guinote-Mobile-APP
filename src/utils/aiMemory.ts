import type { Card, CardId, PlayerId } from '../types/game.types';
import type { SpanishSuit, CardValue } from '../types/cardTypes';

export type CardMemory = ReadonlyMap<PlayerId, ReadonlyArray<Card>>;

const MAX_MEMORY_SIZE = 100; // Maximum number of cards to remember
const MEMORY_CLEANUP_THRESHOLD = 80; // Start cleanup when reaching this size
const LRU_KEEP_SIZE = 60; // Keep this many most recent cards after cleanup

export function createMemory(): CardMemory {
  return new Map();
}

export function updateMemory(
  memory: CardMemory,
  playerId: PlayerId,
  card: Card,
): CardMemory {
  const currentSize = getMemorySize(memory);

  // Check if we need to cleanup memory
  if (currentSize >= MEMORY_CLEANUP_THRESHOLD) {
    console.log('🧹 AI Memory cleanup triggered, size:', currentSize);
    memory = performLRUCleanup(memory);
  }

  const playerCards = memory.get(playerId) || [];
  const updatedCards = [...playerCards, card];
  return new Map(memory).set(playerId, updatedCards);
}

/**
 * Perform LRU cleanup - keep only the most recent cards
 */
function performLRUCleanup(memory: CardMemory): CardMemory {
  const allCardsWithPlayer: Array<{
    playerId: PlayerId;
    card: Card;
    index: number;
  }> = [];
  let index = 0;

  // Collect all cards with their order
  memory.forEach((cards, playerId) => {
    cards.forEach(card => {
      allCardsWithPlayer.push({ playerId, card, index: index++ });
    });
  });

  // Keep only the most recent cards
  const toKeep = allCardsWithPlayer
    .sort((a, b) => b.index - a.index) // Most recent first
    .slice(0, LRU_KEEP_SIZE);

  // Rebuild memory with kept cards
  const newMemory = new Map<PlayerId, Card[]>();
  toKeep.forEach(({ playerId, card }) => {
    const playerCards = newMemory.get(playerId) || [];
    playerCards.push(card);
    newMemory.set(playerId, playerCards);
  });

  console.log(
    `✅ Memory cleaned: ${allCardsWithPlayer.length} → ${toKeep.length} cards`,
  );
  return newMemory;
}

export function getPlayedCards(
  memory: CardMemory,
  suit?: SpanishSuit,
): ReadonlyArray<Card> {
  const allCards: Card[] = [];
  memory.forEach(cards => {
    allCards.push(...cards);
  });

  if (suit) {
    return allCards.filter(card => card.suit === suit);
  }
  return allCards;
}

export function getPlayedCardsByPlayer(
  memory: CardMemory,
  playerId: PlayerId,
): ReadonlyArray<Card> {
  return memory.get(playerId) || [];
}

export function hasCardBeenPlayed(memory: CardMemory, cardId: CardId): boolean {
  return getPlayedCards(memory).some(card => card.id === cardId);
}

export function getRemainingHighCards(
  memory: CardMemory,
  suit: SpanishSuit,
): number {
  const playedCards = getPlayedCards(memory, suit);
  const highValues = [1, 3, 12, 11, 10]; // As, 3, Rey, Caballo, Sota
  const playedHighCards = playedCards.filter(card =>
    highValues.includes(card.value),
  ).length;
  return 5 - playedHighCards; // 5 high cards per suit
}

export function countPlayedPoints(memory: CardMemory): number {
  const cardPoints: Record<number, number> = {
    1: 11, // As
    3: 10, // Tres
    12: 4, // Rey
    11: 3, // Caballo
    10: 2, // Sota
  };

  return getPlayedCards(memory).reduce(
    (total, card) => total + (cardPoints[card.value] || 0),
    0,
  );
}

export function clearMemory(): CardMemory {
  return new Map();
}

export function clearMemoryForPlayer(
  memory: CardMemory,
  playerId: PlayerId,
): CardMemory {
  const newMemory = new Map(memory);
  newMemory.delete(playerId);
  return newMemory;
}

export function getMemorySize(memory: CardMemory): number {
  let totalCards = 0;
  memory.forEach(cards => {
    totalCards += cards.length;
  });
  return totalCards;
}

export function shouldClearMemory(memory: CardMemory): boolean {
  // Clear memory after a full hand (40 cards) or when size exceeds maximum
  const size = getMemorySize(memory);
  return size >= 40 || size >= MAX_MEMORY_SIZE;
}

/**
 * Clear memory on phase transitions to prevent unbounded growth
 */
export function clearMemoryOnPhaseChange(
  memory: CardMemory,
  newPhase: string,
): CardMemory {
  if (
    newPhase === 'scoring' ||
    newPhase === 'gameOver' ||
    newPhase === 'dealing'
  ) {
    console.log(`🧹 Clearing AI memory on phase change to: ${newPhase}`);
    return clearMemory();
  }
  return memory;
}

/**
 * Return how many trump cards remain unplayed (out of 10 per suit)
 */
export function getRemainingTrumps(
  memory: CardMemory,
  trumpSuit: SpanishSuit,
): number {
  const playedTrumps = getPlayedCards(memory, trumpSuit).length;
  // Spanish deck has 10 cards per suit
  const remaining = 10 - playedTrumps;
  return remaining < 0 ? 0 : remaining;
}

/**
 * Check if a specific card has been played already.
 */
export function isCardOut(
  memory: CardMemory,
  suit: SpanishSuit,
  value: CardValue,
): boolean {
  return getPlayedCards(memory, suit).some(c => c.value === value);
}

/**
 * Returns true if the highest outstanding trump (by rank) is in our hand.
 * Walk down the trump rank order and check the first not-yet-played card.
 * If we hold that card, we have the highest outstanding trump.
 */
export function hasHighestTrump(
  memory: CardMemory,
  hand: ReadonlyArray<Card>,
  trumpSuit: SpanishSuit,
): boolean {
  // Trick-taking rank order for Guiñote
  const trumpRankOrder: CardValue[] = [1, 3, 12, 10, 11, 7, 6, 5, 4, 2];
  for (const value of trumpRankOrder) {
    if (isCardOut(memory, trumpSuit, value)) {
      // Already played, skip to next
      continue;
    }
    // First outstanding trump found; check if we hold it
    const inHand = hand.some(c => c.suit === trumpSuit && c.value === value);
    return inHand;
  }
  // All trumps are out (shouldn't happen mid-hand). Return false by default.
  return false;
}
