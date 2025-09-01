import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  featureFlags,
  isMultiplayerEnabled,
  isSupabaseFeatureEnabled,
  type FeatureFlags,
} from './featureFlags';

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));

describe('featureFlags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    featureFlags.resetFlags();
  });

  describe('default configuration', () => {
    test('enableMultiplayer is OFF by default for Hermes safety', () => {
      const flags = featureFlags.getFlags();
      expect(flags.enableMultiplayer).toBe(false);
    });

    test('all Supabase features are OFF by default', () => {
      const flags = featureFlags.getFlags();
      expect(flags.useSupabaseAuth).toBe(false);
      expect(flags.useSupabaseRooms).toBe(false);
      expect(flags.useSupabaseGame).toBe(false);
      expect(flags.useSupabaseMatchmaking).toBe(false);
      expect(flags.useSupabaseFriends).toBe(false);
      expect(flags.useSupabaseVoice).toBe(false);
      expect(flags.useSupabaseStatistics).toBe(false);
    });

    test('additional features are OFF by default', () => {
      const flags = featureFlags.getFlags();
      expect(flags.enableVoiceChat).toBe(false);
      expect(flags.enableTournaments).toBe(false);
    });
  });

  describe('isMultiplayerEnabled', () => {
    test('returns false when enableMultiplayer flag is off', () => {
      expect(isMultiplayerEnabled()).toBe(false);
    });

    test('returns true when enableMultiplayer flag is on', async () => {
      await featureFlags.setFlag('enableMultiplayer', true);
      expect(isMultiplayerEnabled()).toBe(true);
      // Clean up for next tests
      await featureFlags.setFlag('enableMultiplayer', false);
    });
  });

  describe('isSupabaseFeatureEnabled', () => {
    test('returns false for any feature when master flag is off', () => {
      expect(isSupabaseFeatureEnabled('useSupabaseAuth')).toBe(false);
      expect(isSupabaseFeatureEnabled('useSupabaseRooms')).toBe(false);
      expect(isSupabaseFeatureEnabled('useSupabaseGame')).toBe(false);
    });

    test('returns false when master flag is on but specific feature is off', async () => {
      await featureFlags.setFlag('enableMultiplayer', true);
      await featureFlags.setFlag('useSupabaseAuth', false);

      expect(isSupabaseFeatureEnabled('useSupabaseAuth')).toBe(false);
    });

    test('returns true when both master flag and specific feature are on', async () => {
      await featureFlags.setFlag('enableMultiplayer', true);
      await featureFlags.setFlag('useSupabaseAuth', true);

      expect(isSupabaseFeatureEnabled('useSupabaseAuth')).toBe(true);

      // Clean up
      await featureFlags.setFlag('enableMultiplayer', false);
      await featureFlags.setFlag('useSupabaseAuth', false);
    });
  });

  describe('flag persistence', () => {
    test('saves flags to AsyncStorage when updated', async () => {
      await featureFlags.setFlag('enableDebugMode', true);

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'featureFlags',
        expect.stringContaining('"enableDebugMode":true'),
      );

      // Clean up
      await featureFlags.setFlag('enableDebugMode', false);
    });

    test('loads flags from AsyncStorage on initialization', async () => {
      const storedFlags: Partial<FeatureFlags> = {
        enableVoiceChat: true,
        enableTournaments: true,
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedFlags));

      await featureFlags.initialize();
      const flags = featureFlags.getFlags();

      expect(flags.enableVoiceChat).toBe(true);
      expect(flags.enableTournaments).toBe(true);

      // Reset after test
      await featureFlags.resetFlags();
    });
  });

  describe('flag subscription', () => {
    test('notifies listeners when flags change', async () => {
      const listener = jest.fn();
      const unsubscribe = featureFlags.subscribe(listener);

      // Use a different flag for testing to avoid affecting enableMultiplayer
      await featureFlags.setFlag('enableVoiceChat', true);

      expect(listener).toHaveBeenCalledWith(
        expect.objectContaining({
          enableVoiceChat: true,
        }),
      );

      unsubscribe();
      // Clean up
      await featureFlags.setFlag('enableVoiceChat', false);
    });

    test('stops notifying after unsubscribe', async () => {
      const listener = jest.fn();
      const unsubscribe = featureFlags.subscribe(listener);

      unsubscribe();
      await featureFlags.setFlag('enableTournaments', true);

      expect(listener).not.toHaveBeenCalled();

      // Clean up
      await featureFlags.setFlag('enableTournaments', false);
    });
  });

  describe('Hermes safety', () => {
    test('no Supabase features are accessible when multiplayer is disabled', async () => {
      // Reset to ensure clean state
      await featureFlags.resetFlags();

      // Ensure master flag is off
      expect(isMultiplayerEnabled()).toBe(false);

      // Even if we try to enable an individual Supabase feature
      await featureFlags.setFlag('useSupabaseAuth', true);

      // The safety check should still prevent access because master flag is off
      expect(isSupabaseFeatureEnabled('useSupabaseAuth')).toBe(false);
    });
  });
});
