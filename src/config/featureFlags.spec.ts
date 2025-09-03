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
    test('enableMultiplayer is ON in development mode', () => {
      const flags = featureFlags.getFlags();
      // In development (__DEV__ is true in tests), multiplayer is enabled
      expect(flags.enableMultiplayer).toBe(true);
    });

    test('essential Supabase features are enabled in development mode', () => {
      const flags = featureFlags.getFlags();
      // In development, these essential features are enabled
      expect(flags.useSupabaseAuth).toBe(true);
      expect(flags.useSupabaseRooms).toBe(true);
      expect(flags.useSupabaseFriends).toBe(true);

      // These are disabled until ready for testing
      expect(flags.useSupabaseGame).toBe(false);
      expect(flags.useSupabaseMatchmaking).toBe(false);
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
    test('returns true in development mode by default', () => {
      // In development, multiplayer is enabled by default
      expect(isMultiplayerEnabled()).toBe(true);
    });

    test('can be toggled with setFlag', async () => {
      // Turn it off
      await featureFlags.setFlag('enableMultiplayer', false);
      expect(isMultiplayerEnabled()).toBe(false);

      // Turn it back on
      await featureFlags.setFlag('enableMultiplayer', true);
      expect(isMultiplayerEnabled()).toBe(true);
    });
  });

  describe('isSupabaseFeatureEnabled', () => {
    test('returns true for enabled features in development by default', () => {
      // In development, multiplayer is on and some features are enabled
      expect(isSupabaseFeatureEnabled('useSupabaseAuth')).toBe(true);
      expect(isSupabaseFeatureEnabled('useSupabaseRooms')).toBe(true);
      expect(isSupabaseFeatureEnabled('useSupabaseFriends')).toBe(true);

      // But some features are still disabled for now
      expect(isSupabaseFeatureEnabled('useSupabaseGame')).toBe(false);
    });

    test('returns false when master flag is turned off', async () => {
      await featureFlags.setFlag('enableMultiplayer', false);

      expect(isSupabaseFeatureEnabled('useSupabaseAuth')).toBe(false);
      expect(isSupabaseFeatureEnabled('useSupabaseRooms')).toBe(false);

      // Reset
      await featureFlags.setFlag('enableMultiplayer', true);
    });

    test('returns false when specific feature is turned off', async () => {
      // Master flag is on by default in dev
      await featureFlags.setFlag('useSupabaseAuth', false);

      expect(isSupabaseFeatureEnabled('useSupabaseAuth')).toBe(false);

      // Reset
      await featureFlags.setFlag('useSupabaseAuth', true);
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

    test('ignores stored flags in development mode', async () => {
      const storedFlags: Partial<FeatureFlags> = {
        enableVoiceChat: true,
        enableTournaments: true,
        enableMultiplayer: false, // Try to override development default
      };

      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(JSON.stringify(storedFlags));

      await featureFlags.initialize();
      const flags = featureFlags.getFlags();

      // In development, stored flags are ignored
      expect(flags.enableMultiplayer).toBe(true); // Should use DEVELOPMENT_FLAGS
      expect(flags.enableVoiceChat).toBe(false); // Should use DEVELOPMENT_FLAGS
      expect(flags.enableTournaments).toBe(false); // Should use DEVELOPMENT_FLAGS

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
      // Manually disable multiplayer to test safety
      await featureFlags.setFlag('enableMultiplayer', false);

      // Ensure master flag is off
      expect(isMultiplayerEnabled()).toBe(false);

      // Even if we try to enable an individual Supabase feature
      await featureFlags.setFlag('useSupabaseAuth', true);

      // The safety check should still prevent access because master flag is off
      expect(isSupabaseFeatureEnabled('useSupabaseAuth')).toBe(false);

      // Reset to development defaults
      await featureFlags.resetFlags();
    });
  });
});
