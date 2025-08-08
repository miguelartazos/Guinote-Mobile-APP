import { describe, test, expect } from '@jest/globals';
import {
  createEmptySlots,
  arrayToSlots,
  slotsToArray,
  findEmptySlot,
  findEmptySlots,
  dealCardToSlot,
  playCardFromSlot,
  countCards,
  getCardAtSlot,
  isSlotEmpty,
  rearrangeSlots,
  areAllSlotsEmpty,
  areAllSlotsFull,
  findCardSlotIndex,
} from './slotStateAdapter';
import type { Card, CardId } from '../types/game.types';
import type { SlotIndex } from '../types/slots.types';

const mockCard = (id: string): Card => ({
  id: id as CardId,
  suit: 'espadas',
  rank: 'As',
  value: 11,
  points: 11,
  image: 'test.png',
});

describe('slotStateAdapter', () => {
  describe('createEmptySlots', () => {
    test('creates 6 empty slots', () => {
      const slots = createEmptySlots();
      expect(slots).toHaveLength(6);
      expect(slots.every(s => s.card === null)).toBe(true);
      expect(slots.map(s => s.slotIndex)).toEqual([0, 1, 2, 3, 4, 5]);
    });
  });

  describe('arrayToSlots', () => {
    test('converts array of cards to slots', () => {
      const cards = [mockCard('1'), mockCard('2'), mockCard('3')];
      const slots = arrayToSlots(cards);

      expect(slots).toHaveLength(6);
      expect(slots[0].card?.id).toBe('1');
      expect(slots[1].card?.id).toBe('2');
      expect(slots[2].card?.id).toBe('3');
      expect(slots[3].card).toBeNull();
      expect(slots[4].card).toBeNull();
      expect(slots[5].card).toBeNull();
    });

    test('handles empty array', () => {
      const slots = arrayToSlots([]);
      expect(slots).toHaveLength(6);
      expect(slots.every(s => s.card === null)).toBe(true);
    });

    test('handles more than 6 cards', () => {
      const cards = Array.from({ length: 8 }, (_, i) => mockCard(`${i}`));
      const slots = arrayToSlots(cards);
      expect(slots).toHaveLength(6);
      expect(countCards(slots)).toBe(6);
    });
  });

  describe('slotsToArray', () => {
    test('converts slots to array excluding nulls', () => {
      const slots = createEmptySlots();
      slots[0] = { card: mockCard('1'), slotIndex: 0 };
      slots[2] = { card: mockCard('2'), slotIndex: 2 };
      slots[5] = { card: mockCard('3'), slotIndex: 5 };

      const cards = slotsToArray(slots);
      expect(cards).toHaveLength(3);
      expect(cards.map(c => c.id)).toEqual(['1', '2', '3']);
    });
  });

  describe('findEmptySlot', () => {
    test('finds first empty slot', () => {
      const slots = createEmptySlots();
      slots[0] = { card: mockCard('1'), slotIndex: 0 };
      slots[1] = { card: mockCard('2'), slotIndex: 1 };

      expect(findEmptySlot(slots)).toBe(2);
    });

    test('returns null when all slots are full', () => {
      const cards = Array.from({ length: 6 }, (_, i) => mockCard(`${i}`));
      const slots = arrayToSlots(cards);

      expect(findEmptySlot(slots)).toBeNull();
    });
  });

  describe('findEmptySlots', () => {
    test('finds all empty slots', () => {
      const slots = createEmptySlots();
      slots[1] = { card: mockCard('1'), slotIndex: 1 };
      slots[3] = { card: mockCard('2'), slotIndex: 3 };

      expect(findEmptySlots(slots)).toEqual([0, 2, 4, 5]);
    });
  });

  describe('dealCardToSlot', () => {
    test('deals card to specific slot', () => {
      const slots = createEmptySlots();
      const card = mockCard('1');
      const newSlots = dealCardToSlot(slots, card, 3);

      expect(newSlots[3].card?.id).toBe('1');
      expect(countCards(newSlots)).toBe(1);
    });

    test('overwrites existing card in slot', () => {
      const slots = createEmptySlots();
      slots[3] = { card: mockCard('old'), slotIndex: 3 };

      const newSlots = dealCardToSlot(slots, mockCard('new'), 3);
      expect(newSlots[3].card?.id).toBe('new');
    });
  });

  describe('playCardFromSlot', () => {
    test('removes card from slot', () => {
      const slots = arrayToSlots([mockCard('1'), mockCard('2'), mockCard('3')]);
      const { newSlots, playedCard } = playCardFromSlot(slots, 1);

      expect(playedCard?.id).toBe('2');
      expect(newSlots[1].card).toBeNull();
      expect(countCards(newSlots)).toBe(2);
    });

    test('handles playing from empty slot', () => {
      const slots = createEmptySlots();
      const { newSlots, playedCard } = playCardFromSlot(slots, 2);

      expect(playedCard).toBeNull();
      expect(newSlots[2].card).toBeNull();
    });
  });

  describe('rearrangeSlots', () => {
    test('swaps cards between slots', () => {
      const slots = arrayToSlots([mockCard('1'), mockCard('2'), mockCard('3')]);
      const newSlots = rearrangeSlots(slots, 0, 2);

      expect(newSlots[0].card?.id).toBe('3');
      expect(newSlots[2].card?.id).toBe('1');
      expect(newSlots[1].card?.id).toBe('2');
    });

    test('moves card to empty slot', () => {
      const slots = createEmptySlots();
      slots[1] = { card: mockCard('1'), slotIndex: 1 };

      const newSlots = rearrangeSlots(slots, 1, 4);
      expect(newSlots[1].card).toBeNull();
      expect(newSlots[4].card?.id).toBe('1');
    });
  });

  describe('helper functions', () => {
    test('countCards counts non-null cards', () => {
      const slots = arrayToSlots([mockCard('1'), mockCard('2')]);
      expect(countCards(slots)).toBe(2);
    });

    test('getCardAtSlot returns card or null', () => {
      const slots = arrayToSlots([mockCard('1')]);
      expect(getCardAtSlot(slots, 0)?.id).toBe('1');
      expect(getCardAtSlot(slots, 1)).toBeNull();
    });

    test('isSlotEmpty checks if slot is empty', () => {
      const slots = arrayToSlots([mockCard('1')]);
      expect(isSlotEmpty(slots, 0)).toBe(false);
      expect(isSlotEmpty(slots, 1)).toBe(true);
    });

    test('areAllSlotsEmpty checks all slots', () => {
      expect(areAllSlotsEmpty(createEmptySlots())).toBe(true);
      expect(areAllSlotsEmpty(arrayToSlots([mockCard('1')]))).toBe(false);
    });

    test('areAllSlotsFull checks all slots', () => {
      const fullSlots = arrayToSlots(
        Array.from({ length: 6 }, (_, i) => mockCard(`${i}`)),
      );
      expect(areAllSlotsFull(fullSlots)).toBe(true);
      expect(areAllSlotsFull(createEmptySlots())).toBe(false);
    });

    test('findCardSlotIndex finds card by id', () => {
      const slots = arrayToSlots([mockCard('a'), mockCard('b'), mockCard('c')]);
      expect(findCardSlotIndex(slots, 'b')).toBe(1);
      expect(findCardSlotIndex(slots, 'x')).toBeNull();
    });
  });
});
