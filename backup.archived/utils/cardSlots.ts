import type { Card, PlayerId } from '../types/game.types';

// Slot-based card management
export type CardSlot = {
  card: Card | null;
  slotIndex: number; // 0-5, fixed position
};

export type PlayerCardSlots = {
  playerId: PlayerId;
  slots: CardSlot[];
};

export type TableCardSlots = {
  players: Record<PlayerId, CardSlot[]>;
};

// Helper to create empty slots
export function createEmptySlots(): CardSlot[] {
  return Array.from({ length: 6 }, (_, index) => ({
    card: null,
    slotIndex: index,
  }));
}

// Helper to fill slots with cards
export function fillSlots(cards: Card[], startIndex = 0): CardSlot[] {
  const slots = createEmptySlots();
  cards.forEach((card, i) => {
    const slotIndex = startIndex + i;
    if (slotIndex < 6) {
      slots[slotIndex] = { card, slotIndex };
    }
  });
  return slots;
}

// Helper to find empty slot index
export function findEmptySlotIndex(slots: CardSlot[]): number | null {
  const emptySlot = slots.find(slot => slot.card === null);
  return emptySlot ? emptySlot.slotIndex : null;
}

// Helper to play card from slot
export function playCardFromSlot(
  slots: CardSlot[],
  slotIndex: number,
): { newSlots: CardSlot[]; playedCard: Card | null } {
  const newSlots = [...slots];
  const playedCard = newSlots[slotIndex]?.card || null;

  if (newSlots[slotIndex]) {
    newSlots[slotIndex] = { card: null, slotIndex };
  }

  return { newSlots, playedCard };
}

// Helper to add card to specific slot
export function addCardToSlot(
  slots: CardSlot[],
  card: Card,
  slotIndex: number,
): CardSlot[] {
  const newSlots = [...slots];
  if (slotIndex >= 0 && slotIndex < 6) {
    newSlots[slotIndex] = { card, slotIndex };
  }
  return newSlots;
}

// Helper to get cards from slots (excluding empty ones)
export function getCardsFromSlots(slots: CardSlot[]): Card[] {
  return slots
    .filter(slot => slot.card !== null)
    .map(slot => slot.card as Card);
}

// Helper to count cards in slots
export function countCards(slots: CardSlot[]): number {
  return slots.filter(slot => slot.card !== null).length;
}
