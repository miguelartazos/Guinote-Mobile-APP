import type { Id } from '../../convex/_generated/dataModel';
import type {
  GameMove,
  PlayCardMove,
  DeclareCanteMove,
  Cambiar7Move,
  DeclareVictoryMove,
} from '../types/gameMove.types';

// Type guards for move validation
export const isPlayCardMove = (move: GameMove): move is PlayCardMove =>
  move.type === 'play_card' && 'data' in move;

export const isDeclareCanteMove = (move: GameMove): move is DeclareCanteMove =>
  move.type === 'declare_cante' && 'data' in move;

export const isCambiar7Move = (move: GameMove): move is Cambiar7Move =>
  move.type === 'cambiar_7';

export const isDeclareVictoryMove = (
  move: GameMove,
): move is DeclareVictoryMove => move.type === 'declare_victory';

// Game actions interface
export interface GameActions {
  playCard: (cardId: string, userId: Id<'users'>) => Promise<void>;
  cantar: (
    suit: 'oros' | 'copas' | 'espadas' | 'bastos',
    userId: Id<'users'>,
  ) => Promise<void>;
  cambiar7: (userId: Id<'users'>) => Promise<void>;
  toggleReady?: (userId: Id<'users'>) => Promise<void>;
}

// Create action handler map
export const createActionHandlers = (
  actions: GameActions,
  userId: Id<'users'>,
): Map<string, (move: GameMove) => Promise<void>> => {
  const handlers = new Map<string, (move: GameMove) => Promise<void>>();

  handlers.set('play_card', async (move: GameMove) => {
    if (!isPlayCardMove(move)) {
      throw new Error('Invalid play_card move: missing data.cardId');
    }
    await actions.playCard(move.data.cardId, userId);
  });

  handlers.set('declare_cante', async (move: GameMove) => {
    if (!isDeclareCanteMove(move)) {
      throw new Error('Invalid declare_cante move: missing data.suit');
    }
    await actions.cantar(move.data.suit, userId);
  });

  handlers.set('cambiar_7', async (move: GameMove) => {
    if (!isCambiar7Move(move)) {
      throw new Error('Invalid cambiar_7 move: incorrect structure');
    }
    await actions.cambiar7(userId);
  });

  if (actions.toggleReady) {
    handlers.set('declare_victory', async (move: GameMove) => {
      if (!isDeclareVictoryMove(move)) {
        throw new Error('Invalid declare_victory move: incorrect structure');
      }
      await actions.toggleReady(userId);
    });
  }

  return handlers;
};

// Create testable move sender
export const createMoveSender = (
  handlers: Map<string, (move: GameMove) => Promise<void>>,
) => {
  return async (move: GameMove): Promise<boolean> => {
    const handler = handlers.get(move.type);
    if (!handler) {
      console.warn('Move type not implemented:', move.type);
      return false;
    }

    try {
      await handler(move);
      return true;
    } catch (error) {
      console.error('Failed to send move:', error);
      return false;
    }
  };
};
