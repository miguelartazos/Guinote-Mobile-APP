import type { CardId, PlayerId } from './game.types';
import type { SpanishSuit } from './cardTypes';

export type GameMoveType =
  | 'play_card'
  | 'cambiar_7'
  | 'declare_cante'
  | 'declare_victory';

export interface BaseGameMove {
  type: GameMoveType;
  playerId: PlayerId;
  timestamp: number;
}

export interface PlayCardMove extends BaseGameMove {
  type: 'play_card';
  data: {
    cardId: CardId;
  };
}

export interface Cambiar7Move extends BaseGameMove {
  type: 'cambiar_7';
  data: {};
}

export interface DeclareCanteMove extends BaseGameMove {
  type: 'declare_cante';
  data: {
    suit: SpanishSuit;
  };
}

export interface DeclareVictoryMove extends BaseGameMove {
  type: 'declare_victory';
  data: {};
}

export type GameMove =
  | PlayCardMove
  | Cambiar7Move
  | DeclareCanteMove
  | DeclareVictoryMove;

// Move result types
export interface MoveResult {
  success: boolean;
  gameState?: any; // Updated game state if successful
  error?: string;
}
