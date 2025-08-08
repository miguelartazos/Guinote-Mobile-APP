import { describe, expect, test } from '@jest/globals';
import type { Card, CardId, PlayerId } from '../types/game.types';
import type { SpanishSuit } from '../components/game/SpanishCard';
import {
  createMemory,
  updateMemory,
  getPlayedCards,
  getPlayedCardsByPlayer,
  hasCardBeenPlayed,
  getRemainingHighCards,
  countPlayedPoints,
} from './aiMemory';

function createCard(suit: SpanishSuit, value: number): Card {
  return {
    id: `${suit}_${value}` as CardId,
    suit,
    value: value as any,
  };
}

describe('aiMemory', () => {
  describe('createMemory', () => {
    test('creates empty memory', () => {
      const memory = createMemory();
      expect(memory.size).toBe(0);
    });
  });

  describe('updateMemory', () => {
    test('adds card to player memory', () => {
      const memory = createMemory();
      const playerId = 'p1' as PlayerId;
      const card = createCard('oros', 1);

      const updated = updateMemory(memory, playerId, card);

      expect(updated.get(playerId)).toEqual([card]);
    });

    test('appends card to existing player memory', () => {
      let memory = createMemory();
      const playerId = 'p1' as PlayerId;
      const card1 = createCard('oros', 1);
      const card2 = createCard('copas', 3);

      memory = updateMemory(memory, playerId, card1);
      memory = updateMemory(memory, playerId, card2);

      expect(memory.get(playerId)).toEqual([card1, card2]);
    });

    test('maintains immutability', () => {
      const memory = createMemory();
      const playerId = 'p1' as PlayerId;
      const card = createCard('oros', 1);

      const updated = updateMemory(memory, playerId, card);

      expect(memory).not.toBe(updated);
      expect(memory.size).toBe(0);
      expect(updated.size).toBe(1);
    });
  });

  describe('getPlayedCards', () => {
    test('returns all played cards', () => {
      let memory = createMemory();
      const card1 = createCard('oros', 1);
      const card2 = createCard('copas', 3);
      const card3 = createCard('espadas', 12);

      memory = updateMemory(memory, 'p1' as PlayerId, card1);
      memory = updateMemory(memory, 'p2' as PlayerId, card2);
      memory = updateMemory(memory, 'p1' as PlayerId, card3);

      const allCards = getPlayedCards(memory);
      expect(allCards).toHaveLength(3);
      expect(allCards).toContainEqual(card1);
      expect(allCards).toContainEqual(card2);
      expect(allCards).toContainEqual(card3);
    });

    test('filters cards by suit', () => {
      let memory = createMemory();
      const orosCard = createCard('oros', 1);
      const copasCard = createCard('copas', 3);
      const orosCard2 = createCard('oros', 10);

      memory = updateMemory(memory, 'p1' as PlayerId, orosCard);
      memory = updateMemory(memory, 'p2' as PlayerId, copasCard);
      memory = updateMemory(memory, 'p3' as PlayerId, orosCard2);

      const orosCards = getPlayedCards(memory, 'oros');
      expect(orosCards).toHaveLength(2);
      expect(orosCards).toContainEqual(orosCard);
      expect(orosCards).toContainEqual(orosCard2);
    });
  });

  describe('getPlayedCardsByPlayer', () => {
    test('returns cards played by specific player', () => {
      let memory = createMemory();
      const playerId = 'p1' as PlayerId;
      const card1 = createCard('oros', 1);
      const card2 = createCard('copas', 3);

      memory = updateMemory(memory, playerId, card1);
      memory = updateMemory(memory, 'p2' as PlayerId, createCard('espadas', 7));
      memory = updateMemory(memory, playerId, card2);

      const playerCards = getPlayedCardsByPlayer(memory, playerId);
      expect(playerCards).toEqual([card1, card2]);
    });

    test('returns empty array for player with no cards', () => {
      const memory = createMemory();
      const cards = getPlayedCardsByPlayer(memory, 'unknown' as PlayerId);
      expect(cards).toEqual([]);
    });
  });

  describe('hasCardBeenPlayed', () => {
    test('returns true for played card', () => {
      let memory = createMemory();
      const card = createCard('oros', 1);
      memory = updateMemory(memory, 'p1' as PlayerId, card);

      expect(hasCardBeenPlayed(memory, card.id)).toBe(true);
    });

    test('returns false for unplayed card', () => {
      const memory = createMemory();
      const cardId = 'oros_1' as CardId;
      expect(hasCardBeenPlayed(memory, cardId)).toBe(false);
    });
  });

  describe('getRemainingHighCards', () => {
    test('returns 5 when no high cards played', () => {
      const memory = createMemory();
      expect(getRemainingHighCards(memory, 'oros')).toBe(5);
    });

    test('counts remaining high cards correctly', () => {
      let memory = createMemory();
      memory = updateMemory(memory, 'p1' as PlayerId, createCard('oros', 1)); // As
      memory = updateMemory(memory, 'p2' as PlayerId, createCard('oros', 3)); // Tres
      memory = updateMemory(memory, 'p3' as PlayerId, createCard('oros', 7)); // Not high

      expect(getRemainingHighCards(memory, 'oros')).toBe(3);
    });

    test('handles all high cards played', () => {
      let memory = createMemory();
      const highValues = [1, 3, 12, 11, 10];
      highValues.forEach(value => {
        memory = updateMemory(
          memory,
          'p1' as PlayerId,
          createCard('oros', value),
        );
      });

      expect(getRemainingHighCards(memory, 'oros')).toBe(0);
    });
  });

  describe('countPlayedPoints', () => {
    test('counts zero for no cards', () => {
      const memory = createMemory();
      expect(countPlayedPoints(memory)).toBe(0);
    });

    test('counts points correctly', () => {
      let memory = createMemory();
      memory = updateMemory(memory, 'p1' as PlayerId, createCard('oros', 1)); // 11 points
      memory = updateMemory(memory, 'p2' as PlayerId, createCard('copas', 3)); // 10 points
      memory = updateMemory(
        memory,
        'p3' as PlayerId,
        createCard('espadas', 12),
      ); // 4 points
      memory = updateMemory(memory, 'p4' as PlayerId, createCard('bastos', 7)); // 0 points

      expect(countPlayedPoints(memory)).toBe(25);
    });
  });
});
