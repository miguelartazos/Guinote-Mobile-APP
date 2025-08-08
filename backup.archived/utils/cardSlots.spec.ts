import { describe, expect, test } from '@jest/globals';
import {
  createEmptySlots,
  fillSlots,
  findEmptySlotIndex,
  playCardFromSlot,
  addCardToSlot,
  getCardsFromSlots,
  countCards,
} from './cardSlots';
import type { Card } from '../types/game.types';

describe('cardSlots', () => {
  const mockCard = (id: string): Card => ({
    id,
    suit: 'oros',
    rank: 'as',
    value: 11,
  });

  describe('createEmptySlots', () => {
    test('creates 6 empty slots', () => {
      const slots = createEmptySlots();
      expect(slots).toHaveLength(6);
      slots.forEach((slot, index) => {
        expect(slot.card).toBeNull();
        expect(slot.slotIndex).toBe(index);
      });
    });
  });

  describe('fillSlots', () => {
    test('fills slots with cards from start', () => {
      const cards = [mockCard('1'), mockCard('2'), mockCard('3')];
      const slots = fillSlots(cards);

      expect(slots[0].card).toEqual(mockCard('1'));
      expect(slots[1].card).toEqual(mockCard('2'));
      expect(slots[2].card).toEqual(mockCard('3'));
      expect(slots[3].card).toBeNull();
      expect(slots[4].card).toBeNull();
      expect(slots[5].card).toBeNull();
    });

    test('fills slots with cards from specific index', () => {
      const cards = [mockCard('1'), mockCard('2')];
      const slots = fillSlots(cards, 3);

      expect(slots[0].card).toBeNull();
      expect(slots[1].card).toBeNull();
      expect(slots[2].card).toBeNull();
      expect(slots[3].card).toEqual(mockCard('1'));
      expect(slots[4].card).toEqual(mockCard('2'));
      expect(slots[5].card).toBeNull();
    });

    test('handles overflow gracefully', () => {
      const cards = Array.from({ length: 8 }, (_, i) => mockCard(`${i}`));
      const slots = fillSlots(cards);

      expect(slots).toHaveLength(6);
      expect(slots[5].card).toEqual(mockCard('5'));
    });
  });

  describe('findEmptySlotIndex', () => {
    test('finds first empty slot', () => {
      const slots = fillSlots([mockCard('1'), mockCard('2')]);
      const emptyIndex = findEmptySlotIndex(slots);
      expect(emptyIndex).toBe(2);
    });

    test('returns null when no empty slots', () => {
      const cards = Array.from({ length: 6 }, (_, i) => mockCard(`${i}`));
      const slots = fillSlots(cards);
      const emptyIndex = findEmptySlotIndex(slots);
      expect(emptyIndex).toBeNull();
    });

    test('finds empty slot in middle', () => {
      const slots = fillSlots([mockCard('1'), mockCard('2'), mockCard('3')]);
      // Manually remove middle card
      slots[1] = { card: null, slotIndex: 1 };
      const emptyIndex = findEmptySlotIndex(slots);
      expect(emptyIndex).toBe(1);
    });
  });

  describe('playCardFromSlot', () => {
    test('removes card from specified slot', () => {
      const slots = fillSlots([mockCard('1'), mockCard('2'), mockCard('3')]);
      const { newSlots, playedCard } = playCardFromSlot(slots, 1);

      expect(playedCard).toEqual(mockCard('2'));
      expect(newSlots[1].card).toBeNull();
      expect(newSlots[1].slotIndex).toBe(1);
      expect(newSlots[0].card).toEqual(mockCard('1'));
      expect(newSlots[2].card).toEqual(mockCard('3'));
    });

    test('returns null when playing from empty slot', () => {
      const slots = createEmptySlots();
      const { newSlots, playedCard } = playCardFromSlot(slots, 0);

      expect(playedCard).toBeNull();
      expect(newSlots[0].card).toBeNull();
    });
  });

  describe('addCardToSlot', () => {
    test('adds card to specific empty slot', () => {
      const slots = createEmptySlots();
      const newSlots = addCardToSlot(slots, mockCard('new'), 3);

      expect(newSlots[3].card).toEqual(mockCard('new'));
      expect(newSlots[3].slotIndex).toBe(3);
    });

    test('replaces card in occupied slot', () => {
      const slots = fillSlots([mockCard('1'), mockCard('2')]);
      const newSlots = addCardToSlot(slots, mockCard('new'), 1);

      expect(newSlots[1].card).toEqual(mockCard('new'));
    });

    test('ignores invalid slot indices', () => {
      const slots = createEmptySlots();
      const newSlots1 = addCardToSlot(slots, mockCard('new'), -1);
      const newSlots2 = addCardToSlot(slots, mockCard('new'), 6);

      expect(newSlots1).toEqual(slots);
      expect(newSlots2).toEqual(slots);
    });
  });

  describe('getCardsFromSlots', () => {
    test('extracts non-null cards from slots', () => {
      const slots = fillSlots([mockCard('1'), mockCard('2')]);
      slots[1] = { card: null, slotIndex: 1 }; // Remove middle card
      slots[3] = { card: mockCard('3'), slotIndex: 3 }; // Add card at position 3

      const cards = getCardsFromSlots(slots);
      expect(cards).toHaveLength(2);
      expect(cards[0]).toEqual(mockCard('1'));
      expect(cards[1]).toEqual(mockCard('3'));
    });

    test('returns empty array when all slots are empty', () => {
      const slots = createEmptySlots();
      const cards = getCardsFromSlots(slots);
      expect(cards).toHaveLength(0);
    });
  });

  describe('countCards', () => {
    test('counts non-null cards in slots', () => {
      const slots = fillSlots([mockCard('1'), mockCard('2'), mockCard('3')]);
      expect(countCards(slots)).toBe(3);

      slots[1] = { card: null, slotIndex: 1 };
      expect(countCards(slots)).toBe(2);
    });

    test('returns 0 for empty slots', () => {
      const slots = createEmptySlots();
      expect(countCards(slots)).toBe(0);
    });
  });
});
