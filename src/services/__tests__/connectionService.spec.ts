/**
 * Tests for connectionService
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectionService } from '../connectionService';
import type { QueuedAction } from '../connectionService';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(() => Promise.resolve()),
  getItem: jest.fn(() => Promise.resolve(null)),
  removeItem: jest.fn(() => Promise.resolve()),
}));

describe('connectionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    connectionService.clearQueue();
  });

  describe('queueAction', () => {
    it('should execute action immediately when online', async () => {
      const mockExecutor = jest.fn().mockResolvedValue({ id: 'result-123' });
      connectionService.setActionExecutor(mockExecutor);

      const result = await connectionService.queueAction(
        'CREATE_ROOM',
        { code: 'ABC123', hostId: 'user-123' },
        undefined,
        true, // online
      );

      expect(mockExecutor).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'CREATE_ROOM',
          payload: { code: 'ABC123', hostId: 'user-123' },
        }),
      );
      expect(result.result).toEqual({ id: 'result-123' });
      expect(result.queued).toBe(false);
    });

    it('should queue action when offline', async () => {
      const optimisticResponse = { id: 'temp-123', status: 'pending' };

      const result = await connectionService.queueAction(
        'JOIN_ROOM',
        { code: 'XYZ789', userId: 'user-456' },
        optimisticResponse,
        false, // offline
      );

      expect(result.result).toEqual(optimisticResponse);
      expect(result.queued).toBe(true);
      expect(connectionService.getQueuedCount()).toBe(1);

      // Should save to AsyncStorage
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@guinote/offline_queue',
        expect.any(String),
      );
    });

    it('should queue action on execution failure', async () => {
      const mockExecutor = jest.fn().mockRejectedValue(new Error('Network error'));
      connectionService.setActionExecutor(mockExecutor);

      const optimisticResponse = { id: 'temp-123' };

      const result = await connectionService.queueAction(
        'LEAVE_ROOM',
        { roomId: 'room-123' },
        optimisticResponse,
        true, // online
      );

      expect(mockExecutor).toHaveBeenCalled();
      expect(result.result).toEqual(optimisticResponse);
      expect(result.queued).toBe(true);
      expect(connectionService.getQueuedCount()).toBe(1);
    });

    it('should queue action when no executor is set', async () => {
      // Don't set executor
      const result = await connectionService.queueAction(
        'ADD_AI_PLAYER',
        { roomId: 'room-123', config: { difficulty: 'hard' } },
        undefined,
        true, // online
      );

      expect(result.queued).toBe(true);
      expect(connectionService.getQueuedCount()).toBe(1);
    });
  });

  describe('processQueue', () => {
    it('should process all queued actions', async () => {
      const mockExecutor = jest.fn().mockResolvedValue({ success: true });
      connectionService.setActionExecutor(mockExecutor);

      // Queue some actions while offline
      await connectionService.queueAction('CREATE_ROOM', { code: 'ABC' }, undefined, false);
      await connectionService.queueAction('JOIN_ROOM', { code: 'XYZ' }, undefined, false);

      expect(connectionService.getQueuedCount()).toBe(2);

      // Process queue
      const summary = await connectionService.processQueue();

      expect(mockExecutor).toHaveBeenCalledTimes(2);
      expect(summary.processed).toBe(2);
      expect(summary.failed).toBe(0);
      expect(summary.remaining).toBe(0);
      expect(connectionService.getQueuedCount()).toBe(0);
    });

    it('should retry failed actions with exponential backoff', async () => {
      let attempts = 0;
      const mockExecutor = jest.fn().mockImplementation(() => {
        attempts++;
        if (attempts < 2) {
          return Promise.reject(new Error('Temporary failure'));
        }
        return Promise.resolve({ success: true });
      });
      connectionService.setActionExecutor(mockExecutor);

      // Queue an action
      await connectionService.queueAction('START_GAME', { roomId: 'room-123' }, undefined, false);

      // First process - should fail and retry
      const summary1 = await connectionService.processQueue();
      expect(summary1.processed).toBe(0);
      expect(summary1.failed).toBe(1);
      expect(connectionService.getQueuedCount()).toBe(1);

      // Second process - should succeed
      const summary2 = await connectionService.processQueue();
      expect(summary2.processed).toBe(1);
      expect(summary2.failed).toBe(0);
      expect(connectionService.getQueuedCount()).toBe(0);
    });

    it('should remove actions after max retries', async () => {
      const mockExecutor = jest.fn().mockRejectedValue(new Error('Permanent failure'));
      connectionService.setActionExecutor(mockExecutor);

      // Queue an action
      await connectionService.queueAction(
        'UPDATE_READY_STATUS',
        { roomId: 'room-123' },
        undefined,
        false,
      );

      // Process queue multiple times until max retries
      for (let i = 0; i < 3; i++) {
        await connectionService.processQueue();
      }

      // Action should be removed after max retries
      expect(connectionService.getQueuedCount()).toBe(0);
      expect(mockExecutor).toHaveBeenCalledTimes(3);
    });

    it('should apply exponential backoff between retries', async () => {
      jest.useFakeTimers();

      const mockExecutor = jest.fn().mockRejectedValue(new Error('Failure'));
      connectionService.setActionExecutor(mockExecutor);

      // Queue an action with retry count already incremented
      const action: QueuedAction = {
        id: 'test-action' as any,
        type: 'CREATE_ROOM',
        payload: {},
        timestamp: Date.now(),
        retryCount: 1,
        maxRetries: 3,
      };

      // Manually add to queue to control retry count
      (connectionService as any).actionQueue = [action];

      const processPromise = connectionService.processQueue();

      // Should wait 1000ms for first retry (1000 * 2^0)
      jest.advanceTimersByTime(999);
      expect(mockExecutor).not.toHaveBeenCalled();

      jest.advanceTimersByTime(1);
      await processPromise;

      expect(mockExecutor).toHaveBeenCalled();

      jest.useRealTimers();
    });

    it('should return correct summary when no actions to process', async () => {
      const summary = await connectionService.processQueue();

      expect(summary.processed).toBe(0);
      expect(summary.failed).toBe(0);
      expect(summary.remaining).toBe(0);
    });

    it('should not process if already processing', async () => {
      const mockExecutor = jest
        .fn()
        .mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));
      connectionService.setActionExecutor(mockExecutor);

      await connectionService.queueAction('CREATE_ROOM', { code: 'ABC' }, undefined, false);

      // Start processing
      const promise1 = connectionService.processQueue();
      const promise2 = connectionService.processQueue();

      const [summary1, summary2] = await Promise.all([promise1, promise2]);

      // Only one should actually process
      expect(mockExecutor).toHaveBeenCalledTimes(1);
      expect(summary1.processed + summary2.processed).toBe(1);
    });
  });

  describe('storage persistence', () => {
    it('should load queue from storage on initialization', async () => {
      const storedQueue = JSON.stringify([
        {
          id: 'stored-action',
          type: 'JOIN_ROOM',
          payload: { code: 'STORED' },
          timestamp: Date.now(),
          retryCount: 0,
          maxRetries: 3,
        },
      ]);

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(storedQueue);

      // Create new instance to trigger load
      const ConnectionService = (connectionService as any).constructor;
      const newInstance = new ConnectionService();

      // Wait for async load
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(AsyncStorage.getItem).toHaveBeenCalledWith('@guinote/offline_queue');
      expect(newInstance.getQueuedCount()).toBe(1);
    });

    it('should save queue to storage when actions are queued', async () => {
      await connectionService.queueAction(
        'CREATE_ROOM',
        { code: 'TEST' },
        undefined,
        false, // offline
      );

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@guinote/offline_queue',
        expect.stringContaining('CREATE_ROOM'),
      );
    });

    it('should handle storage errors gracefully', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(new Error('Storage full'));

      // Should not throw
      await expect(
        connectionService.queueAction('JOIN_ROOM', { code: 'TEST' }, undefined, false),
      ).resolves.toBeTruthy();

      // Action should still be queued in memory
      expect(connectionService.getQueuedCount()).toBe(1);
    });
  });

  describe('clearQueue', () => {
    it('should clear all queued actions', async () => {
      // Queue some actions
      await connectionService.queueAction('CREATE_ROOM', { code: 'ABC' }, undefined, false);
      await connectionService.queueAction('JOIN_ROOM', { code: 'XYZ' }, undefined, false);

      expect(connectionService.getQueuedCount()).toBe(2);

      await connectionService.clearQueue();

      expect(connectionService.getQueuedCount()).toBe(0);
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith('@guinote/offline_queue');
    });
  });

  describe('getQueuedActions', () => {
    it('should return copy of queued actions', async () => {
      await connectionService.queueAction('CREATE_ROOM', { code: 'ABC' }, undefined, false);
      await connectionService.queueAction('JOIN_ROOM', { code: 'XYZ' }, undefined, false);

      const actions = connectionService.getQueuedActions();

      expect(actions).toHaveLength(2);
      expect(actions[0].type).toBe('CREATE_ROOM');
      expect(actions[1].type).toBe('JOIN_ROOM');

      // Should be a copy, not reference
      actions.pop();
      expect(connectionService.getQueuedCount()).toBe(2);
    });
  });

  describe('getOptimisticUpdate', () => {
    it('should store and retrieve optimistic updates', async () => {
      const optimisticResponse = { id: 'temp-123', status: 'pending' };

      const result = await connectionService.queueAction(
        'CREATE_ROOM',
        { code: 'ABC' },
        optimisticResponse,
        false, // offline
      );

      const update = connectionService.getOptimisticUpdate(result.actionId);

      expect(update).toBeDefined();
      expect(update?.applyState).toEqual(optimisticResponse);
    });

    it('should return undefined for non-existent action', () => {
      const update = connectionService.getOptimisticUpdate('non-existent' as any);
      expect(update).toBeUndefined();
    });
  });
});
