import type { Card, CardId, PlayerId } from '../types/game.types';
import type { SpanishSuit } from '../types/cardTypes';

export type CardMemory = ReadonlyMap<PlayerId, ReadonlyArray<Card>>;

export function createMemory(): CardMemory {
  return new Map();
}

export function updateMemory(
  memory: CardMemory,
  playerId: PlayerId,
  card: Card,
): CardMemory {
  const playerCards = memory.get(playerId) || [];
  const updatedCards = [...playerCards, card];
  return new Map(memory).set(playerId, updatedCards);
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
  // Clear memory after a full hand (40 cards) or when vueltas starts
  return getMemorySize(memory) >= 40;
}
