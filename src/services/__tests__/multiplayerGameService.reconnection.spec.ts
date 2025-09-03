import { MultiplayerGameService } from '../multiplayerGameService';
import { createRealtimeClient } from '../realtimeClient.native';
import * as featureFlags from '../../config/featureFlags';
import type { RoomId, PlayerId } from '../../types/game.types';

// Mock dependencies
jest.mock('../realtimeClient.native');
jest.mock('../../config/featureFlags');

describe('MultiplayerGameService - Reconnection & Error Recovery', () => {
  let service: MultiplayerGameService;
  let mockClient: any;
  let mockChannel: any;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
    
    // Mock feature flag
    (featureFlags.isMultiplayerEnabled as jest.Mock).mockReturnValue(true);

    // Mock channel
    mockChannel = {
      subscribe: jest.fn().mockResolvedValue(undefined),
      unsubscribe: jest.fn().mockResolvedValue(undefined),
      send: jest.fn().mockResolvedValue({ success: true }),
      on: jest.fn().mockReturnThis(),
    };

    // Mock client
    mockClient = {
      channel: jest.fn().mockReturnValue(mockChannel),
      removeChannel: jest.fn().mockResolvedValue(undefined),
    };

    (createRealtimeClient as jest.Mock).mockResolvedValue(mockClient);
    
    service = MultiplayerGameService.getInstance();
    service.reset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('Exponential Backoff', () => {
    it('should reconnect with exponential backoff on connection failure', async () => {
      const roomId = 'room-123' as RoomId;
      const playerId = 'player-456' as PlayerId;

      // First connection attempt fails
      mockChannel.subscribe.mockRejectedValueOnce(new Error('Connection failed'));
      
      // Subsequent attempts succeed on third try
      mockChannel.subscribe.mockRejectedValueOnce(new Error('Connection failed'));
      mockChannel.subscribe.mockResolvedValueOnce(undefined);

      const connectPromise = service.connect(roomId, playerId);
      
      // First attempt fails immediately
      await expect(connectPromise).rejects.toThrow('Connection failed');
      
      // Verify reconnection attempts with exponential backoff
      // First retry after 1000ms (base delay)
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 1000);
      
      // Advance timer for first retry
      jest.advanceTimersByTime(1000);
      await Promise.resolve(); // Let promises settle
      
      // Second retry after 2000ms (exponential backoff)
      expect(setTimeout).toHaveBeenCalledWith(expect.any(Function), 2000);
      
      // Advance timer for second retry (successful)
      jest.advanceTimersByTime(2000);
      await Promise.resolve(); // Let promises settle
      
      // Verify connection was attempted 3 times total
      expect(mockChannel.subscribe).toHaveBeenCalledTimes(3);
    });

    it('should cap backoff delay at maximum', async () => {
      const roomId = 'room-123' as RoomId;
      const playerId = 'player-456' as PlayerId;

      // Make connection fail many times to test max delay
      for (let i = 0; i < 10; i++) {
        mockChannel.subscribe.mockRejectedValueOnce(new Error('Connection failed'));
      }

      await expect(service.connect(roomId, playerId)).rejects.toThrow();

      // Advance through multiple reconnection attempts
      for (let attempt = 0; attempt < 8; attempt++) {
        jest.runOnlyPendingTimers();
        await Promise.resolve();
      }

      // Check that delays don't exceed max (30000ms)
      const calls = (setTimeout as jest.Mock).mock.calls;
      const delays = calls.map(call => call[1]);
      
      // Later delays should be capped at 30000ms
      const laterDelays = delays.slice(-3);
      laterDelays.forEach(delay => {
        expect(delay).toBeLessThanOrEqual(30000);
      });
    });

    it('should stop reconnecting after max attempts', async () => {
      const roomId = 'room-123' as RoomId;
      const playerId = 'player-456' as PlayerId;

      // Make all connection attempts fail
      mockChannel.subscribe.mockRejectedValue(new Error('Connection failed'));

      // Register conflict handler to detect connection loss notification
      const conflictHandler = jest.fn();
      service.on('conflict', conflictHandler);

      await expect(service.connect(roomId, playerId)).rejects.toThrow();

      // Advance through all reconnection attempts
      for (let i = 0; i < 10; i++) {
        jest.runOnlyPendingTimers();
        await Promise.resolve();
      }

      // Should notify about connection loss after max attempts
      expect(conflictHandler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'conflict',
          conflictType: 'connection_lost',
        })
      );
    });
  });

  describe('Heartbeat Monitoring', () => {
    it('should start heartbeat monitoring on successful connection', async () => {
      const roomId = 'room-123' as RoomId;
      const playerId = 'player-456' as PlayerId;

      await service.connect(roomId, playerId);

      // Advance time to trigger heartbeat
      jest.advanceTimersByTime(30000);

      // Verify heartbeat was sent
      expect(mockChannel.send).toHaveBeenCalledWith({
        type: 'broadcast',
        event: 'heartbeat',
        payload: expect.objectContaining({
          playerId,
          timestamp: expect.any(Number),
        }),
      });
    });

    it('should reconnect if heartbeat timeout exceeded', async () => {
      const roomId = 'room-123' as RoomId;
      const playerId = 'player-456' as PlayerId;

      await service.connect(roomId, playerId);
      
      // Simulate no heartbeat responses for 60+ seconds
      const connectionState = (service as any).connectionState;
      connectionState.lastHeartbeat = Date.now() - 61000;

      // Trigger heartbeat check
      jest.advanceTimersByTime(30000);

      // Should trigger reconnection
      expect(setTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        expect.any(Number)
      );
    });

    it('should update heartbeat timestamp on receiving heartbeats', async () => {
      const roomId = 'room-123' as RoomId;
      const playerId = 'player-456' as PlayerId;

      // Setup channel event handlers
      const eventHandlers: { [key: string]: Function } = {};
      mockChannel.on.mockImplementation((event: string, options: any, handler?: Function) => {
        const callback = handler || options;
        if (typeof callback === 'function') {
          const key = typeof options === 'object' ? `${event}:${options.event}` : event;
          eventHandlers[key] = callback;
        }
        return mockChannel;
      });

      await service.connect(roomId, playerId);

      const initialHeartbeat = (service as any).connectionState.lastHeartbeat;

      // Simulate receiving heartbeat from another player
      jest.advanceTimersByTime(1000);
      
      if (eventHandlers['broadcast:heartbeat']) {
        eventHandlers['broadcast:heartbeat']({
          payload: {
            playerId: 'other-player',
            timestamp: Date.now(),
          },
        });
      }

      const updatedHeartbeat = (service as any).connectionState.lastHeartbeat;
      expect(updatedHeartbeat).toBeGreaterThan(initialHeartbeat);
    });
  });

  describe('Queue Processing', () => {
    it('should process queued actions after reconnection', async () => {
      const roomId = 'room-123' as RoomId;
      const playerId = 'player-456' as PlayerId;

      await service.connect(roomId, playerId);

      // Queue some actions while connected
      const action1 = { type: 'PLAY_CARD' as const, playerId, card: 'test-card' };
      const action2 = { type: 'DRAW_CARD' as const, playerId };
      
      // Simulate connection loss
      (service as any).connectionState.isConnected = false;
      
      // Try to send actions (should be queued)
      await service.sendAction(action1);
      await service.sendAction(action2);
      
      // Verify actions were queued
      expect((service as any).connectionState.queuedActions).toHaveLength(2);

      // Simulate reconnection
      (service as any).connectionState.isConnected = true;
      await service.processQueuedActions();

      // Verify queued actions were sent
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'broadcast',
          event: 'game_action',
          payload: expect.objectContaining(action1),
        })
      );
      expect(mockChannel.send).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'broadcast',
          event: 'game_action',
          payload: expect.objectContaining(action2),
        })
      );

      // Queue should be cleared
      expect((service as any).connectionState.queuedActions).toHaveLength(0);
    });

    it('should handle queue processing errors gracefully', async () => {
      const roomId = 'room-123' as RoomId;
      const playerId = 'player-456' as PlayerId;

      await service.connect(roomId, playerId);

      const action = { type: 'PLAY_CARD' as const, playerId, card: 'test-card' };
      
      // Queue an action
      (service as any).connectionState.isConnected = false;
      await service.sendAction(action);
      
      // Make send fail during queue processing
      mockChannel.send.mockRejectedValueOnce(new Error('Send failed'));
      
      // Process queue
      (service as any).connectionState.isConnected = true;
      await service.processQueuedActions();

      // Action should be re-queued on failure
      expect((service as any).connectionState.queuedActions).toHaveLength(1);
    });
  });

  describe('Cleanup', () => {
    it('should clear timers on disconnect', async () => {
      const roomId = 'room-123' as RoomId;
      const playerId = 'player-456' as PlayerId;

      await service.connect(roomId, playerId);
      
      // Verify timers were set
      expect(setInterval).toHaveBeenCalled();
      
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      
      await service.disconnect();
      
      // Verify timers were cleared
      expect(clearIntervalSpy).toHaveBeenCalled();
      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should reset reconnection attempts on successful connection', async () => {
      const roomId = 'room-123' as RoomId;
      const playerId = 'player-456' as PlayerId;

      // First connection fails
      mockChannel.subscribe.mockRejectedValueOnce(new Error('Connection failed'));
      // Second attempt succeeds
      mockChannel.subscribe.mockResolvedValueOnce(undefined);

      await expect(service.connect(roomId, playerId)).rejects.toThrow();
      
      // Trigger reconnection
      jest.runOnlyPendingTimers();
      await Promise.resolve();
      
      // Verify attempt counter was incremented
      expect((service as any).reconnectionConfig.currentAttempt).toBeGreaterThan(0);
      
      // Now connect successfully
      mockChannel.subscribe.mockResolvedValue(undefined);
      await service.connect(roomId, playerId);
      
      // Verify attempt counter was reset
      expect((service as any).reconnectionConfig.currentAttempt).toBe(0);
    });
  });
});