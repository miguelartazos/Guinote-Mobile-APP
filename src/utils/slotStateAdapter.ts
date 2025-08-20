import type { Card, PlayerId } from '../types/game.types';
import type { CardSlot, SlotIndex, TableSlots, DealTarget } from '../types/slots.types';

/**
 * Adapter for converting between array-based and slot-based card systems
 */

// Create empty slots (6 slots, all null)
export function createEmptySlots(): CardSlot[] {
  return Array.from({ length: 6 }, (_, index) => ({
    card: null,
    slotIndex: index as SlotIndex,
  }));
}

// Convert array of cards to slots (fills from left)
export function arrayToSlots(cards: Card[]): CardSlot[] {
  const slots = createEmptySlots();
  cards.forEach((card, index) => {
    if (index < 6) {
      slots[index] = { card, slotIndex: index as SlotIndex };
    }
  });
  return slots;
}

// Convert slots to array (excludes nulls)
export function slotsToArray(slots: CardSlot[]): Card[] {
  return slots.filter(slot => slot.card !== null).map(slot => slot.card as Card);
}

// Find first empty slot
export function findEmptySlot(slots: CardSlot[]): SlotIndex | null {
  const emptySlot = slots.find(slot => slot.card === null);
  return emptySlot ? emptySlot.slotIndex : null;
}

// Find all empty slots
export function findEmptySlots(slots: CardSlot[]): SlotIndex[] {
  return slots.filter(slot => slot.card === null).map(slot => slot.slotIndex);
}

// Deal card to specific slot
export function dealCardToSlot(slots: CardSlot[], card: Card, slotIndex: SlotIndex): CardSlot[] {
  const newSlots = [...slots];
  if (slotIndex >= 0 && slotIndex < 6) {
    newSlots[slotIndex] = { card, slotIndex };
  }
  return newSlots;
}

// Play card from slot (removes it)
export function playCardFromSlot(
  slots: CardSlot[],
  slotIndex: SlotIndex,
): { newSlots: CardSlot[]; playedCard: Card | null } {
  const newSlots = [...slots];
  const playedCard = newSlots[slotIndex]?.card || null;

  if (newSlots[slotIndex]) {
    newSlots[slotIndex] = { card: null, slotIndex };
  }

  return { newSlots, playedCard };
}

// Count cards in slots
export function countCards(slots: CardSlot[]): number {
  return slots.filter(slot => slot.card !== null).length;
}

// Get card at specific slot
export function getCardAtSlot(slots: CardSlot[], slotIndex: SlotIndex): Card | null {
  return slots[slotIndex]?.card || null;
}

// Check if slot is empty
export function isSlotEmpty(slots: CardSlot[], slotIndex: SlotIndex): boolean {
  return slots[slotIndex]?.card === null;
}

// Create initial table slots for all players
export function createTableSlots(playerIds: PlayerId[]): TableSlots {
  const tableSlots: TableSlots = new Map();
  playerIds.forEach(id => {
    tableSlots.set(id, createEmptySlots());
  });
  return tableSlots;
}

// Deal initial cards to table slots
export function dealInitialCards(tableSlots: TableSlots, dealTargets: DealTarget[]): TableSlots {
  const newTableSlots = new Map(tableSlots);

  dealTargets.forEach(target => {
    const playerSlots = newTableSlots.get(target.playerId);
    if (playerSlots) {
      const updatedSlots = dealCardToSlot(playerSlots, target.card, target.slotIndex);
      newTableSlots.set(target.playerId, updatedSlots);
    }
  });

  return newTableSlots;
}

// Get valid card indices from slots (for compatibility)
export function getSlotsWithCards(slots: CardSlot[]): SlotIndex[] {
  return slots.filter(slot => slot.card !== null).map(slot => slot.slotIndex);
}

// Rearrange cards in slots (for drag reordering)
export function rearrangeSlots(
  slots: CardSlot[],
  fromIndex: SlotIndex,
  toIndex: SlotIndex,
): CardSlot[] {
  const newSlots = [...slots];
  const fromCard = newSlots[fromIndex]?.card;
  const toCard = newSlots[toIndex]?.card;

  if (fromCard) {
    newSlots[toIndex] = { card: fromCard, slotIndex: toIndex };
    newSlots[fromIndex] = { card: toCard || null, slotIndex: fromIndex };
  }

  return newSlots;
}

// Check if all slots are empty
export function areAllSlotsEmpty(slots: CardSlot[]): boolean {
  return slots.every(slot => slot.card === null);
}

// Check if all slots are full
export function areAllSlotsFull(slots: CardSlot[]): boolean {
  return slots.every(slot => slot.card !== null);
}

// Get slot index of a specific card
export function findCardSlotIndex(slots: CardSlot[], cardId: string): SlotIndex | null {
  const slot = slots.find(s => s.card?.id === cardId);
  return slot ? slot.slotIndex : null;
}
