import { describe, test, expect, beforeEach } from '@jest/globals';
import {
  VoiceSettings,
  getVoiceSettings,
  updateVoiceSettings,
  mutePlayer,
  unmutePlayer,
  isPlayerMuted,
  togglePlayerMuted,
  resetVoiceSettings,
  getEffectiveVolume,
} from './voiceSettings';

const PLAYER_ID = 'player_123';
const ANOTHER_PLAYER_ID = 'player_456';

describe('voiceSettings', () => {
  beforeEach(() => {
    resetVoiceSettings();
  });

  describe('getVoiceSettings', () => {
    test('returns default settings initially', () => {
      const expected: VoiceSettings = {
        globalVoiceEnabled: true,
        autoPlay: true,
        volume: 0.8,
        mutedPlayers: new Set(),
      };

      expect(getVoiceSettings()).toEqual(expected);
    });

    test('returns a copy of muted players set', () => {
      mutePlayer(PLAYER_ID);
      const settings1 = getVoiceSettings();
      const settings2 = getVoiceSettings();

      expect(settings1.mutedPlayers).not.toBe(settings2.mutedPlayers);
      expect(settings1.mutedPlayers).toEqual(settings2.mutedPlayers);
    });
  });

  describe('updateVoiceSettings', () => {
    test('updates global voice enabled', () => {
      updateVoiceSettings({ globalVoiceEnabled: false });

      expect(getVoiceSettings().globalVoiceEnabled).toBe(false);
    });

    test('updates auto play setting', () => {
      updateVoiceSettings({ autoPlay: false });

      expect(getVoiceSettings().autoPlay).toBe(false);
    });

    test('updates volume setting', () => {
      const newVolume = 0.5;
      updateVoiceSettings({ volume: newVolume });

      expect(getVoiceSettings().volume).toBe(newVolume);
    });

    test('updates multiple settings at once', () => {
      updateVoiceSettings({
        globalVoiceEnabled: false,
        volume: 0.3,
      });

      const settings = getVoiceSettings();
      expect(settings.globalVoiceEnabled).toBe(false);
      expect(settings.volume).toBe(0.3);
      expect(settings.autoPlay).toBe(true); // unchanged
    });
  });

  describe('mutePlayer', () => {
    test('adds player to muted list', () => {
      mutePlayer(PLAYER_ID);

      expect(isPlayerMuted(PLAYER_ID)).toBe(true);
    });

    test('handles multiple muted players', () => {
      mutePlayer(PLAYER_ID);
      mutePlayer(ANOTHER_PLAYER_ID);

      expect(isPlayerMuted(PLAYER_ID)).toBe(true);
      expect(isPlayerMuted(ANOTHER_PLAYER_ID)).toBe(true);
    });
  });

  describe('unmutePlayer', () => {
    test('removes player from muted list', () => {
      mutePlayer(PLAYER_ID);
      unmutePlayer(PLAYER_ID);

      expect(isPlayerMuted(PLAYER_ID)).toBe(false);
    });

    test('handles unmuting non-muted player', () => {
      unmutePlayer(PLAYER_ID);

      expect(isPlayerMuted(PLAYER_ID)).toBe(false);
    });
  });

  describe('isPlayerMuted', () => {
    test('returns false for non-muted player', () => {
      expect(isPlayerMuted(PLAYER_ID)).toBe(false);
    });

    test('returns true for muted player', () => {
      mutePlayer(PLAYER_ID);

      expect(isPlayerMuted(PLAYER_ID)).toBe(true);
    });
  });

  describe('togglePlayerMuted', () => {
    test('mutes unmuted player and returns true', () => {
      const result = togglePlayerMuted(PLAYER_ID);

      expect(result).toBe(true);
      expect(isPlayerMuted(PLAYER_ID)).toBe(true);
    });

    test('unmutes muted player and returns false', () => {
      mutePlayer(PLAYER_ID);
      const result = togglePlayerMuted(PLAYER_ID);

      expect(result).toBe(false);
      expect(isPlayerMuted(PLAYER_ID)).toBe(false);
    });
  });

  describe('resetVoiceSettings', () => {
    test('resets all settings to defaults', () => {
      updateVoiceSettings({
        globalVoiceEnabled: false,
        autoPlay: false,
        volume: 0.1,
      });
      mutePlayer(PLAYER_ID);

      resetVoiceSettings();

      const expected: VoiceSettings = {
        globalVoiceEnabled: true,
        autoPlay: true,
        volume: 0.8,
        mutedPlayers: new Set(),
      };
      expect(getVoiceSettings()).toEqual(expected);
    });
  });

  describe('getEffectiveVolume', () => {
    test('multiplies global volume by player volume', () => {
      updateVoiceSettings({ volume: 0.5 });

      expect(getEffectiveVolume(0.8)).toBe(0.4);
    });

    test('uses default player volume of 1 when not provided', () => {
      updateVoiceSettings({ volume: 0.6 });

      expect(getEffectiveVolume()).toBe(0.6);
    });

    test('handles edge cases', () => {
      updateVoiceSettings({ volume: 0 });
      expect(getEffectiveVolume(1)).toBe(0);

      updateVoiceSettings({ volume: 1 });
      expect(getEffectiveVolume(0)).toBe(0);
    });
  });
});
