import type { Card, PlayerId } from './game.types';

// Core slot types
export type SlotIndex = 0 | 1 | 2 | 3 | 4 | 5;
export type PlayerPosition = 0 | 1 | 2 | 3; // bottom, right, top, left

export type CardSlot = {
  card: Card | null;
  slotIndex: SlotIndex;
};

export type PlayerSlots = {
  playerId: PlayerId;
  slots: CardSlot[];
};

// Animation types
export type DealTarget = {
  playerId: PlayerId;
  slotIndex: SlotIndex;
  card: Card;
};

export type AnimationPhase = 'idle' | 'dealing' | 'playing' | 'collecting' | 'revealing';

export type AnimationState = {
  phase: AnimationPhase;
  targets?: DealTarget[];
  completedCount?: number;
};

// Table slots for all players
export type TableSlots = Map<PlayerId, CardSlot[]>;

// Helper type for slot operations
export type SlotOperation = {
  playerId: PlayerId;
  slotIndex: SlotIndex;
  operation: 'deal' | 'play' | 'clear';
  card?: Card;
};
