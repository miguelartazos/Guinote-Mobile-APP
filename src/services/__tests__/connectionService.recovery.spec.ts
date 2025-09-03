import AsyncStorage from '@react-native-async-storage/async-storage';
import { connectionService } from '../connectionService';
import type { QueuedAction } from '../connectionService';

jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

describe('ConnectionService Recovery', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    connectionService['actionQueue'] = [];
    connectionService['lastSyncVersion'] = 0;
    connectionService['isRecovering'] = false;
  });

  describe('handleReconnect', () => {
    test('should handle recovery with state sync', async () => {
      const mockStateSync = jest.fn().mockResolvedValue({
        version: 5,
        state: { version: 5, data: 'synced' },
      });

      connectionService.setStateSyncCallback(mockStateSync);

      const result = await connectionService.handleReconnect();

      expect(result).toEqual({
        synced: true,
        processed: 0,
        failed: 0,
      });
      expect(mockStateSync).toHaveBeenCalled();
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@guinote/last_sync_version', '5');
    });

    test('should skip sync if version is not newer', async () => {
      connectionService['lastSyncVersion'] = 10;

      const mockStateSync = jest.fn().mockResolvedValue({
        version: 5,
        state: { version: 5, data: 'old' },
      });

      connectionService.setStateSyncCallback(mockStateSync);

      await connectionService.handleReconnect();

      expect(AsyncStorage.setItem).not.toHaveBeenCalledWith('@guinote/last_sync_version', '5');
    });

    test('should process queued actions after sync', async () => {
      const mockAction: QueuedAction = {
        id: 'action_1' as any,
        type: 'CREATE_ROOM',
        payload: { code: 'TEST123' },
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: 3,
      };

      connectionService['actionQueue'] = [mockAction];

      const mockExecutor = jest.fn().mockResolvedValue({ success: true });
      connectionService.setActionExecutor(mockExecutor);

      const result = await connectionService.handleReconnect();

      expect(result.processed).toBe(1);
      expect(mockExecutor).toHaveBeenCalledWith(mockAction);
    });

    test('should handle sync failure gracefully', async () => {
      const mockStateSync = jest.fn().mockRejectedValue(new Error('Sync failed'));
      connectionService.setStateSyncCallback(mockStateSync);

      const result = await connectionService.handleReconnect();

      expect(result.synced).toBe(true);
      expect(result.processed).toBe(0);
      expect(result.failed).toBe(0);
    });

    test('should prevent concurrent recovery', async () => {
      connectionService['isRecovering'] = true;

      const result = await connectionService.handleReconnect();

      expect(result).toEqual({
        synced: false,
        processed: 0,
        failed: 0,
      });
    });

    test('should reset recovery flag after completion', async () => {
      await connectionService.handleReconnect();

      expect(connectionService['isRecovering']).toBe(false);
    });
  });

  describe('getRecoveryState', () => {
    test('should return current recovery state', () => {
      connectionService['lastSyncVersion'] = 42;
      connectionService['isRecovering'] = true;
      connectionService['actionQueue'] = [
        {
          id: 'action_1' as any,
          type: 'CREATE_ROOM',
          payload: {},
          timestamp: Date.now(),
          retryCount: 0,
          maxRetries: 3,
        },
      ];

      const state = connectionService.getRecoveryState();

      expect(state).toEqual({
        lastSyncVersion: 42,
        isRecovering: true,
        queuedActions: 1,
      });
    });
  });

  describe('updateSyncVersion', () => {
    test('should update and persist sync version', async () => {
      await connectionService.updateSyncVersion(100);

      expect(connectionService['lastSyncVersion']).toBe(100);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith('@guinote/last_sync_version', '100');
    });
  });

  describe('loadSyncVersion', () => {
    test('should load sync version from storage', async () => {
      (AsyncStorage.getItem as any).mockResolvedValue('75');

      await connectionService['loadSyncVersion']();

      expect(connectionService['lastSyncVersion']).toBe(75);
    });

    test('should handle missing sync version', async () => {
      (AsyncStorage.getItem as any).mockResolvedValue(null);

      await connectionService['loadSyncVersion']();

      expect(connectionService['lastSyncVersion']).toBe(0);
    });
  });
});
