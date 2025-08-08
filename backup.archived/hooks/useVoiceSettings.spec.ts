import { describe, test, expect, beforeEach } from '@jest/globals';
import { renderHook, act } from '@testing-library/react-native';
import { useVoiceSettings } from './useVoiceSettings';
import { resetVoiceSettings } from '../utils/voiceSettings';

const PLAYER_ID = 'player_123';

describe('useVoiceSettings', () => {
  beforeEach(() => {
    resetVoiceSettings();
  });

  describe('initial state', () => {
    test('returns default settings', () => {
      const { result } = renderHook(() => useVoiceSettings());

      expect(result.current.globalVoiceEnabled).toBe(true);
      expect(result.current.autoPlay).toBe(true);
      expect(result.current.volume).toBe(0.8);
      expect(result.current.mutedPlayers).toEqual(new Set());
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('updateSettings', () => {
    test('updates global voice enabled setting', () => {
      const { result } = renderHook(() => useVoiceSettings());

      act(() => {
        result.current.updateSettings({ globalVoiceEnabled: false });
      });

      expect(result.current.globalVoiceEnabled).toBe(false);
    });

    test('updates volume setting', () => {
      const { result } = renderHook(() => useVoiceSettings());
      const newVolume = 0.5;

      act(() => {
        result.current.updateSettings({ volume: newVolume });
      });

      expect(result.current.volume).toBe(newVolume);
    });

    test('updates multiple settings at once', () => {
      const { result } = renderHook(() => useVoiceSettings());

      act(() => {
        result.current.updateSettings({
          globalVoiceEnabled: false,
          autoPlay: false,
          volume: 0.3,
        });
      });

      expect(result.current.globalVoiceEnabled).toBe(false);
      expect(result.current.autoPlay).toBe(false);
      expect(result.current.volume).toBe(0.3);
    });
  });

  describe('player muting', () => {
    test('mutePlayer adds player to muted list', () => {
      const { result } = renderHook(() => useVoiceSettings());

      act(() => {
        result.current.mutePlayer(PLAYER_ID);
      });

      expect(result.current.isPlayerMuted(PLAYER_ID)).toBe(true);
      expect(result.current.mutedPlayers.has(PLAYER_ID)).toBe(true);
    });

    test('unmutePlayer removes player from muted list', () => {
      const { result } = renderHook(() => useVoiceSettings());

      act(() => {
        result.current.mutePlayer(PLAYER_ID);
      });

      act(() => {
        result.current.unmutePlayer(PLAYER_ID);
      });

      expect(result.current.isPlayerMuted(PLAYER_ID)).toBe(false);
      expect(result.current.mutedPlayers.has(PLAYER_ID)).toBe(false);
    });

    test('togglePlayerMuted toggles mute state', () => {
      const { result } = renderHook(() => useVoiceSettings());

      let toggleResult: boolean;

      act(() => {
        toggleResult = result.current.togglePlayerMuted(PLAYER_ID);
      });

      expect(toggleResult!).toBe(true);
      expect(result.current.isPlayerMuted(PLAYER_ID)).toBe(true);

      act(() => {
        toggleResult = result.current.togglePlayerMuted(PLAYER_ID);
      });

      expect(toggleResult!).toBe(false);
      expect(result.current.isPlayerMuted(PLAYER_ID)).toBe(false);
    });
  });

  describe('resetSettings', () => {
    test('resets all settings to defaults', () => {
      const { result } = renderHook(() => useVoiceSettings());

      act(() => {
        result.current.updateSettings({
          globalVoiceEnabled: false,
          volume: 0.1,
        });
        result.current.mutePlayer(PLAYER_ID);
      });

      act(() => {
        result.current.resetSettings();
      });

      expect(result.current.globalVoiceEnabled).toBe(true);
      expect(result.current.autoPlay).toBe(true);
      expect(result.current.volume).toBe(0.8);
      expect(result.current.mutedPlayers).toEqual(new Set());
    });
  });

  describe('getEffectiveVolume', () => {
    test('returns global volume multiplied by player volume', () => {
      const { result } = renderHook(() => useVoiceSettings());

      act(() => {
        result.current.updateSettings({ volume: 0.5 });
      });

      expect(result.current.getEffectiveVolume(0.8)).toBe(0.4);
    });

    test('uses default player volume when not provided', () => {
      const { result } = renderHook(() => useVoiceSettings());

      act(() => {
        result.current.updateSettings({ volume: 0.6 });
      });

      expect(result.current.getEffectiveVolume()).toBe(0.6);
    });
  });

  describe('refreshSettings', () => {
    test('refreshes settings from storage', () => {
      const { result } = renderHook(() => useVoiceSettings());

      // Simulate external change to settings
      act(() => {
        result.current.updateSettings({ volume: 0.3 });
      });

      act(() => {
        result.current.refreshSettings();
      });

      expect(result.current.volume).toBe(0.3);
    });
  });
});
