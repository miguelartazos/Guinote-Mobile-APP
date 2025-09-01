import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { MultiplayerGameService } from '../multiplayerGameService';
import type { GameMove } from '../../types/gameMove.types';
import type { RealtimeGameState } from '../../types/realtime.types';
import type { PlayerId, GameId, TeamId, Card } from '../../types/game.types';

// Mock the dependencies
jest.mock('../realtimeClient.native', () => ({
  createRealtimeClient: jest.fn(),
}));

jest.mock('../../config/featureFlags', () => ({
  isMultiplayerEnabled: jest.fn(() => true),
}));

// Mock fetch for server validation
global.fetch = jest.fn() as any;

describe('MultiplayerGameService - Server Validation', () => {
  let service: MultiplayerGameService;
  let mockChannel: any;
  let mockClient: any;
  
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Reset singleton instance
    (MultiplayerGameService as any).instance = null;
    service = MultiplayerGameService.getInstance();
    
    // Setup mock channel
    mockChannel = {
      subscribe: jest.fn().mockResolvedValue(undefined),
      unsubscribe: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue(undefined),
      on: jest.fn().mockReturnThis(),
    };
    
    // Setup mock client
    mockClient = {
      channel: jest.fn().mockReturnValue(mockChannel),
      removeChannel: jest.fn().mockResolvedValue(undefined),
      supabaseUrl: 'https://test.supabase.co',
      supabaseKey: 'test-key',
    };
    
    // Mock createRealtimeClient
    const { createRealtimeClient } = require('../realtimeClient.native');
    createRealtimeClient.mockResolvedValue(mockClient);
    
    // Set up initial state
    const mockState: RealtimeGameState = {
      id: 'game-123' as GameId,
      phase: 'playing',
      players: [
        { id: 'player-1' as PlayerId, name: 'Player 1', teamId: 'team-1' as TeamId, avatar: '', ranking: 1000, isBot: false },
        { id: 'player-2' as PlayerId, name: 'Player 2', teamId: 'team-2' as TeamId, avatar: '', ranking: 1000, isBot: false },
      ],
      teams: [
        { id: 'team-1' as TeamId, score: 0, members: ['player-1' as PlayerId, 'player-3' as PlayerId] },
        { id: 'team-2' as TeamId, score: 0, members: ['player-2' as PlayerId, 'player-4' as PlayerId] },
      ],
      currentPlayerIndex: 0,
      currentTrick: [],
      trumpSuit: 'oros',
      trumpCard: { id: 'card-1', suit: 'oros', value: 3, rank: 3 } as Card,
      hands: new Map(),
      deck: [],
      cantes: [],
      teamTrickPiles: new Map(),
      version: 1 as any,
      lastModified: Date.now(),
      lastModifiedBy: 'player-1' as PlayerId,
    };
    
    service.setCurrentState(mockState);
    service.setConnectionState({ isConnected: true });
  });
  
  describe('sendAction with server validation', () => {
    it('should validate move on server before broadcasting', async () => {
      // Mock successful validation
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true }),
      });
      
      await service.connect('room-123' as any, 'player-1' as PlayerId);
      
      const move: GameMove = {
        type: 'play_card',
        playerId: 'player-1' as PlayerId,
        data: { cardId: 'card-1' },
        timestamp: Date.now(),
      };
      
      const result = await service.sendAction(move);
      
      expect(global.fetch).toHaveBeenCalledWith(
        'https://test.supabase.co/functions/v1/validate-move',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('gameState'),
        })
      );
      
      expect(result.success).toBe(true);
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            validated: true,
          }),
        })
      );
    });
    
    it('should rollback on validation failure', async () => {
      // Mock validation failure
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          valid: false, 
          reason: 'Not your turn' 
        }),
      });
      
      await service.connect('room-123' as any, 'player-1' as PlayerId);
      
      const move: GameMove = {
        type: 'play_card',
        playerId: 'player-2' as PlayerId,
        data: { cardId: 'card-1' },
        timestamp: Date.now(),
      };
      
      const handleValidationFailureSpy = jest.spyOn(service, 'handleValidationFailure');
      
      const result = await service.sendAction(move);
      
      expect(result.success).toBe(false);
      expect(result.queued).toBe(false);
      expect(handleValidationFailureSpy).toHaveBeenCalledWith(move, 'Not your turn');
      expect(mockChannel.send).not.toHaveBeenCalled();
    });
    
    it('should queue action on network error', async () => {
      // Mock network error
      (global.fetch as any).mockRejectedValueOnce(new Error('Network error'));
      
      await service.connect('room-123' as any, 'player-1' as PlayerId);
      
      const move: GameMove = {
        type: 'play_card',
        playerId: 'player-1' as PlayerId,
        data: { cardId: 'card-1' },
        timestamp: Date.now(),
      };
      
      const result = await service.sendAction(move);
      
      expect(result.success).toBe(false);
      expect(result.queued).toBe(true);
      
      const connectionState = service.getConnectionState();
      expect(connectionState.queuedActions).toHaveLength(1);
      expect(connectionState.queuedActions[0]).toEqual(move);
    });
    
    it('should allow optimistic moves on validation server error', async () => {
      // Mock server error (500)
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
      });
      
      await service.connect('room-123' as any, 'player-1' as PlayerId);
      
      const move: GameMove = {
        type: 'play_card',
        playerId: 'player-1' as PlayerId,
        data: { cardId: 'card-1' },
        timestamp: Date.now(),
      };
      
      const result = await service.sendAction(move);
      
      // Should proceed optimistically on server error
      expect(result.success).toBe(true);
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            validated: true, // Still marked as validated optimistically
          }),
        })
      );
    });
    
    it('should skip validation when multiplayer is disabled', async () => {
      const { isMultiplayerEnabled } = require('../../config/featureFlags');
      isMultiplayerEnabled.mockReturnValueOnce(false);
      
      await service.connect('room-123' as any, 'player-1' as PlayerId);
      
      const move: GameMove = {
        type: 'play_card',
        playerId: 'player-1' as PlayerId,
        data: { cardId: 'card-1' },
        timestamp: Date.now(),
      };
      
      const result = await service.sendAction(move);
      
      expect(global.fetch).not.toHaveBeenCalled();
      expect(result.success).toBe(true);
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            validated: true, // Marked as validated without server check
          }),
        })
      );
    });
  });
  
  describe('validateMoveOnServer', () => {
    it('should include all required parameters in validation request', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ valid: true }),
      });
      
      await service.connect('room-123' as any, 'player-1' as PlayerId);
      
      const move: GameMove = {
        type: 'cambiar_7',
        playerId: 'player-1' as PlayerId,
        data: {},
        timestamp: Date.now(),
      };
      
      await service.sendAction(move);
      
      const fetchCall = (global.fetch as any).mock.calls[0];
      const body = JSON.parse(fetchCall[1].body);
      
      expect(body).toHaveProperty('gameState');
      expect(body).toHaveProperty('move');
      expect(body).toHaveProperty('playerId');
      expect(body.playerId).toBe('player-1');
      expect(body.move.type).toBe('cambiar_7');
    });
    
    it('should handle validation response with reason', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ 
          valid: false, 
          reason: 'You do not have the 7 of trump' 
        }),
      });
      
      await service.connect('room-123' as any, 'player-1' as PlayerId);
      
      const move: GameMove = {
        type: 'cambiar_7',
        playerId: 'player-1' as PlayerId,
        data: {},
        timestamp: Date.now(),
      };
      
      const handleValidationFailureSpy = jest.spyOn(service, 'handleValidationFailure');
      
      await service.sendAction(move);
      
      expect(handleValidationFailureSpy).toHaveBeenCalledWith(
        move,
        'You do not have the 7 of trump'
      );
    });
  });
});