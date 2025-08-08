// Mock Platform before importing the module
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios',
  },
}));

import {
  SOUND_ASSETS,
  REACTION_SOUNDS,
  MUSIC_ASSETS,
  VOLUME_PRESETS,
  SOUND_PRIORITY,
  getRandomReactionSound,
  getSoundFormat,
  getSoundPath,
} from './soundAssets';

describe('soundAssets', () => {
  describe('SOUND_ASSETS', () => {
    test('contains all required sound types', () => {
      const requiredSounds = [
        'card_play',
        'card_shuffle',
        'card_flip',
        'trick_collect',
        'turn_notify',
        'cante_20',
        'cante_40',
        'victory',
        'defeat',
        'game_start',
      ];

      requiredSounds.forEach(sound => {
        expect(SOUND_ASSETS).toHaveProperty(sound);
        expect(SOUND_ASSETS[sound as keyof typeof SOUND_ASSETS]).toMatch(
          /\.mp3$/,
        );
      });
    });
  });

  describe('REACTION_SOUNDS', () => {
    test('contains all reaction types with multiple variations', () => {
      const reactionTypes = ['ole', 'vaya', 'laugh', 'applause', 'bien', 'uy'];

      reactionTypes.forEach(reaction => {
        expect(REACTION_SOUNDS).toHaveProperty(reaction);
        expect(
          REACTION_SOUNDS[reaction as keyof typeof REACTION_SOUNDS].length,
        ).toBeGreaterThan(0);
      });
    });

    test('all reaction sound paths end with .mp3', () => {
      Object.values(REACTION_SOUNDS).forEach(sounds => {
        sounds.forEach(sound => {
          expect(sound).toMatch(/\.mp3$/);
        });
      });
    });
  });

  describe('MUSIC_ASSETS', () => {
    test('contains all music types', () => {
      expect(MUSIC_ASSETS).toHaveProperty('spanish_guitar');
      expect(MUSIC_ASSETS).toHaveProperty('cafe_ambiance');
      expect(MUSIC_ASSETS).toHaveProperty('nature_sounds');
    });
  });

  describe('VOLUME_PRESETS', () => {
    test('contains valid volume levels', () => {
      expect(VOLUME_PRESETS.effects).toBeGreaterThanOrEqual(0);
      expect(VOLUME_PRESETS.effects).toBeLessThanOrEqual(1);
      expect(VOLUME_PRESETS.reactions).toBeGreaterThanOrEqual(0);
      expect(VOLUME_PRESETS.reactions).toBeLessThanOrEqual(1);
      expect(VOLUME_PRESETS.music).toBeGreaterThanOrEqual(0);
      expect(VOLUME_PRESETS.music).toBeLessThanOrEqual(1);
      expect(VOLUME_PRESETS.voice).toBeGreaterThanOrEqual(0);
      expect(VOLUME_PRESETS.voice).toBeLessThanOrEqual(1);
    });
  });

  describe('SOUND_PRIORITY', () => {
    test('has correct priority order', () => {
      expect(SOUND_PRIORITY.voice).toBeLessThan(SOUND_PRIORITY.reactions);
      expect(SOUND_PRIORITY.reactions).toBeLessThan(SOUND_PRIORITY.effects);
      expect(SOUND_PRIORITY.effects).toBeLessThan(SOUND_PRIORITY.music);
    });
  });

  describe('getRandomReactionSound', () => {
    test('returns a valid sound path for each reaction type', () => {
      const reactionTypes = [
        'ole',
        'vaya',
        'laugh',
        'applause',
        'bien',
        'uy',
      ] as const;

      reactionTypes.forEach(type => {
        const sound = getRandomReactionSound(type);
        expect(REACTION_SOUNDS[type]).toContain(sound);
      });
    });

    test('returns different values on multiple calls (probabilistic)', () => {
      // For reactions with multiple variations
      const results = new Set<string>();
      for (let i = 0; i < 20; i++) {
        results.add(getRandomReactionSound('ole'));
      }

      // Should get at least 2 different results if there are 3 variations
      if (REACTION_SOUNDS.ole.length >= 3) {
        expect(results.size).toBeGreaterThanOrEqual(2);
      }
    });
  });

  describe('getSoundFormat', () => {
    test('returns .m4a for iOS', () => {
      const { Platform } = require('react-native');
      Platform.OS = 'ios';
      expect(getSoundFormat()).toBe('.m4a');
    });

    test('returns .mp3 for Android', () => {
      const { Platform } = require('react-native');
      Platform.OS = 'android';
      expect(getSoundFormat()).toBe('.mp3');
    });

    test('returns .mp3 for web', () => {
      const { Platform } = require('react-native');
      Platform.OS = 'web';
      expect(getSoundFormat()).toBe('.mp3');
    });
  });

  describe('getSoundPath', () => {
    test('returns the path as-is', () => {
      const testPath = 'sounds/test/sound.mp3';
      expect(getSoundPath(testPath)).toBe(testPath);
    });
  });
});
