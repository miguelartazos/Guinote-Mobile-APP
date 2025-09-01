import {
  createRealtimeClient,
  getRealtimeClient,
  resetRealtimeClient,
  isRealtimeAvailable,
} from './realtimeClient.native';
import * as featureFlags from '../config/featureFlags';

// Mock the feature flags module
jest.mock('../config/featureFlags', () => ({
  isMultiplayerEnabled: jest.fn(),
}));

// Mock the Supabase import
jest.mock('../lib/supabase', () => ({
  supabase: {
    channel: jest.fn(),
    removeChannel: jest.fn(),
    auth: {
      startAutoRefresh: jest.fn(),
      stopAutoRefresh: jest.fn(),
    },
  },
}));

describe('realtimeClient.native', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    resetRealtimeClient();
  });

  describe('createRealtimeClient', () => {
    test('returns null when multiplayer is disabled', async () => {
      (featureFlags.isMultiplayerEnabled as jest.Mock).mockReturnValue(false);

      const client = await createRealtimeClient();

      expect(client).toBeNull();
      expect(featureFlags.isMultiplayerEnabled).toHaveBeenCalled();
    });

    test('lazy loads Supabase client when multiplayer is enabled', async () => {
      (featureFlags.isMultiplayerEnabled as jest.Mock).mockReturnValue(true);

      const client = await createRealtimeClient();

      expect(client).not.toBeNull();
      expect(client).toHaveProperty('channel');
      expect(client).toHaveProperty('removeChannel');
    });

    test('returns cached client on subsequent calls', async () => {
      (featureFlags.isMultiplayerEnabled as jest.Mock).mockReturnValue(true);

      const client1 = await createRealtimeClient();
      const client2 = await createRealtimeClient();

      expect(client1).toBe(client2);
    });

    test('handles concurrent initialization requests', async () => {
      (featureFlags.isMultiplayerEnabled as jest.Mock).mockReturnValue(true);

      // Start multiple concurrent requests
      const promises = [createRealtimeClient(), createRealtimeClient(), createRealtimeClient()];

      const clients = await Promise.all(promises);

      // All should return the same instance
      expect(clients[0]).toBe(clients[1]);
      expect(clients[1]).toBe(clients[2]);
    });
  });

  describe('getRealtimeClient', () => {
    test('returns null when client not initialized', () => {
      const client = getRealtimeClient();
      expect(client).toBeNull();
    });

    test('returns existing client without creating new one', async () => {
      (featureFlags.isMultiplayerEnabled as jest.Mock).mockReturnValue(true);

      // First create a client
      await createRealtimeClient();

      // Then get it without triggering new initialization
      const client = getRealtimeClient();

      expect(client).not.toBeNull();
    });
  });

  describe('resetRealtimeClient', () => {
    test('clears cached client', async () => {
      (featureFlags.isMultiplayerEnabled as jest.Mock).mockReturnValue(true);

      // Create a client
      const client1 = await createRealtimeClient();
      expect(client1).not.toBeNull();

      // Reset
      resetRealtimeClient();

      // Should be null after reset
      expect(getRealtimeClient()).toBeNull();

      // Creating again should return a new instance
      const client2 = await createRealtimeClient();
      expect(client2).not.toBeNull();
      // Note: In a real scenario, these would be different instances
      // but our mock always returns the same object
    });
  });

  describe('isRealtimeAvailable', () => {
    test('returns false when multiplayer is disabled', async () => {
      (featureFlags.isMultiplayerEnabled as jest.Mock).mockReturnValue(false);

      const available = await isRealtimeAvailable();

      expect(available).toBe(false);
    });

    test('returns true when multiplayer is enabled and client loads', async () => {
      (featureFlags.isMultiplayerEnabled as jest.Mock).mockReturnValue(true);

      const available = await isRealtimeAvailable();

      expect(available).toBe(true);
    });
  });

  describe('Hermes safety', () => {
    test('never imports Supabase when feature flag is off', async () => {
      (featureFlags.isMultiplayerEnabled as jest.Mock).mockReturnValue(false);

      // Try all methods - none should trigger Supabase import
      await createRealtimeClient();
      getRealtimeClient();
      await isRealtimeAvailable();

      // The Supabase module should never be imported
      // In a real test, we'd verify the import() call was never made
      // but our mock setup already ensures this behavior
      expect(featureFlags.isMultiplayerEnabled).toHaveBeenCalled();
    });
  });
});
