// Jest test file
import type { Id } from '../../convex/_generated/dataModel';
import type { GameMove } from '../types/gameMove.types';
import {
  createActionHandlers,
  createMoveSender,
  isPlayCardMove,
  isDeclareCanteMove,
  isCambiar7Move,
  isDeclareVictoryMove,
  type GameActions,
} from './moveHandlers';

describe('moveHandlers', () => {
  describe('Type Guards', () => {
    it('should correctly identify play_card moves', () => {
      const validMove: GameMove = {
        type: 'play_card',
        playerId: 'player1' as any,
        data: { cardId: 'card123' },
        timestamp: Date.now(),
      };
      const invalidMove: GameMove = { type: 'play_card' } as any;

      expect(isPlayCardMove(validMove)).toBe(true);
      expect(isPlayCardMove(invalidMove)).toBe(false);
    });

    it('should correctly identify declare_cante moves', () => {
      const validMove: GameMove = {
        type: 'declare_cante',
        playerId: 'player1' as any,
        data: { suit: 'oros' },
        timestamp: Date.now(),
      };
      const invalidMove: GameMove = { type: 'declare_cante' } as any;

      expect(isDeclareCanteMove(validMove)).toBe(true);
      expect(isDeclareCanteMove(invalidMove)).toBe(false);
    });

    it('should correctly identify cambiar_7 moves', () => {
      const validMove: GameMove = {
        type: 'cambiar_7',
        playerId: 'player1' as any,
        data: {},
        timestamp: Date.now(),
      };
      const invalidMove: GameMove = { type: 'OTHER' } as any;

      expect(isCambiar7Move(validMove)).toBe(true);
      expect(isCambiar7Move(invalidMove)).toBe(false);
    });

    it('should correctly identify declare_victory moves', () => {
      const validMove: GameMove = {
        type: 'declare_victory',
        playerId: 'player1' as any,
        data: {},
        timestamp: Date.now(),
      };
      const invalidMove: GameMove = { type: 'OTHER' } as any;

      expect(isDeclareVictoryMove(validMove)).toBe(true);
      expect(isDeclareVictoryMove(invalidMove)).toBe(false);
    });
  });

  describe('createActionHandlers', () => {
    let mockActions: GameActions;
    const userId = 'user123' as Id<'users'>;

    beforeEach(() => {
      mockActions = {
        playCard: jest.fn(),
        cantar: jest.fn(),
        cambiar7: jest.fn(),
        toggleReady: jest.fn(),
      };
    });

    it('should create a map with all action types', () => {
      const handlers = createActionHandlers(mockActions, userId);

      expect(handlers.size).toBe(4);
      expect(handlers.has('play_card')).toBe(true);
      expect(handlers.has('declare_cante')).toBe(true);
      expect(handlers.has('cambiar_7')).toBe(true);
      expect(handlers.has('declare_victory')).toBe(true);
    });

    it('should handle play_card moves correctly', async () => {
      const handlers = createActionHandlers(mockActions, userId);
      const move: GameMove = {
        type: 'play_card',
        playerId: 'player1' as any,
        data: { cardId: 'card123' },
        timestamp: Date.now(),
      };

      await handlers.get('play_card')!(move);

      expect(mockActions.playCard).toHaveBeenCalledWith('card123', userId);
    });

    it('should handle declare_cante moves correctly', async () => {
      const handlers = createActionHandlers(mockActions, userId);
      const move: GameMove = {
        type: 'declare_cante',
        playerId: 'player1' as any,
        data: { suit: 'copas' },
        timestamp: Date.now(),
      };

      await handlers.get('declare_cante')!(move);

      expect(mockActions.cantar).toHaveBeenCalledWith('copas', userId);
    });

    it('should handle cambiar_7 moves correctly', async () => {
      const handlers = createActionHandlers(mockActions, userId);
      const move: GameMove = {
        type: 'cambiar_7',
        playerId: 'player1' as any,
        data: {},
        timestamp: Date.now(),
      };

      await handlers.get('cambiar_7')!(move);

      expect(mockActions.cambiar7).toHaveBeenCalledWith(userId);
    });

    it('should throw error for invalid move structure', async () => {
      const handlers = createActionHandlers(mockActions, userId);
      const invalidMove: GameMove = { type: 'play_card' } as any;

      await expect(handlers.get('play_card')!(invalidMove)).rejects.toThrow(
        'Invalid play_card move: missing data.cardId',
      );
    });

    it('should handle errors from actions.playCard', async () => {
      mockActions.playCard.mockRejectedValue(new Error('Network error'));
      const handlers = createActionHandlers(mockActions, userId);
      const move: GameMove = {
        type: 'play_card',
        playerId: 'player1' as any,
        data: { cardId: 'card123' },
        timestamp: Date.now(),
      };

      await expect(handlers.get('play_card')!(move)).rejects.toThrow(
        'Network error',
      );
    });

    it('should handle errors from actions.cantar', async () => {
      mockActions.cantar.mockRejectedValue(new Error('Invalid suit'));
      const handlers = createActionHandlers(mockActions, userId);
      const move: GameMove = {
        type: 'declare_cante',
        playerId: 'player1' as any,
        data: { suit: 'copas' },
        timestamp: Date.now(),
      };

      await expect(handlers.get('declare_cante')!(move)).rejects.toThrow(
        'Invalid suit',
      );
    });
  });

  describe('createMoveSender', () => {
    it('should return true for successful moves', async () => {
      const mockHandler = jest.fn().mockResolvedValue(undefined);
      const handlers = new Map([['TEST_MOVE', mockHandler]]);
      const sender = createMoveSender(handlers);

      const result = await sender({ type: 'TEST_MOVE' } as any);

      expect(result).toBe(true);
      expect(mockHandler).toHaveBeenCalledWith({ type: 'TEST_MOVE' });
    });

    it('should return false for unimplemented move types', async () => {
      const handlers = new Map();
      const sender = createMoveSender(handlers);
      const consoleSpy = jest
        .spyOn(console, 'warn')
        .mockImplementation(() => {});

      const result = await sender({ type: 'UNKNOWN_MOVE' } as any);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Move type not implemented:',
        'UNKNOWN_MOVE',
      );

      consoleSpy.mockRestore();
    });

    it('should return false and log error for failed moves', async () => {
      const mockHandler = jest
        .fn()
        .mockRejectedValue(new Error('Network error'));
      const handlers = new Map([['TEST_MOVE', mockHandler]]);
      const sender = createMoveSender(handlers);
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = await sender({ type: 'TEST_MOVE' } as any);

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to send move:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });
});
