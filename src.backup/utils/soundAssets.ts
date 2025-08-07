import { Platform } from 'react-native';
import type { ReactionType } from '../utils/voiceReactions';

export type SoundType =
  | 'card_play'
  | 'card_shuffle'
  | 'card_flip'
  | 'trick_collect'
  | 'turn_notify'
  | 'cante_20'
  | 'cante_40'
  | 'victory'
  | 'defeat'
  | 'game_start';

export type ReactionSoundType =
  | 'ole'
  | 'vaya'
  | 'laugh'
  | 'applause'
  | 'bien'
  | 'uy';

export type MusicType = 'spanish_guitar' | 'cafe_ambiance' | 'nature_sounds';

// Map emoji reactions to audio reaction types
export const REACTION_TO_AUDIO_MAP: Partial<
  Record<ReactionType, ReactionSoundType>
> = {
  '👍': 'bien',
  '😂': 'laugh',
  '😮': 'uy',
  '👏': 'applause',
  '❤️': 'ole',
};

// Sound file paths - these would be actual audio files in production
// For now, we'll use these as identifiers
export const SOUND_ASSETS: Record<SoundType, string> = {
  card_play: 'sounds/effects/card_play.mp3',
  card_shuffle: 'sounds/effects/card_shuffle.mp3',
  card_flip: 'sounds/effects/card_flip.mp3',
  trick_collect: 'sounds/effects/trick_collect.mp3',
  turn_notify: 'sounds/effects/turn_notify.mp3',
  cante_20: 'sounds/effects/cante_20.mp3',
  cante_40: 'sounds/effects/cante_40.mp3',
  victory: 'sounds/effects/victory.mp3',
  defeat: 'sounds/effects/defeat.mp3',
  game_start: 'sounds/effects/game_start.mp3',
};

export const REACTION_SOUNDS: Record<ReactionSoundType, string[]> = {
  ole: [
    'sounds/reactions/ole_1.mp3',
    'sounds/reactions/ole_2.mp3',
    'sounds/reactions/ole_3.mp3',
  ],
  vaya: [
    'sounds/reactions/vaya_1.mp3',
    'sounds/reactions/vaya_2.mp3',
    'sounds/reactions/vaya_3.mp3',
  ],
  laugh: [
    'sounds/reactions/laugh_1.mp3',
    'sounds/reactions/laugh_2.mp3',
    'sounds/reactions/laugh_3.mp3',
  ],
  applause: [
    'sounds/reactions/applause_1.mp3',
    'sounds/reactions/applause_2.mp3',
  ],
  bien: ['sounds/reactions/bien_1.mp3', 'sounds/reactions/bien_2.mp3'],
  uy: ['sounds/reactions/uy_1.mp3', 'sounds/reactions/uy_2.mp3'],
};

export const MUSIC_ASSETS: Record<MusicType, string> = {
  spanish_guitar: 'sounds/music/spanish_guitar_loop.mp3',
  cafe_ambiance: 'sounds/music/cafe_ambiance.mp3',
  nature_sounds: 'sounds/music/nature_sounds.mp3',
};

// Helper to get a random reaction sound
export function getRandomReactionSound(type: ReactionSoundType): string {
  const sounds = REACTION_SOUNDS[type];
  if (!sounds || sounds.length === 0) {
    console.warn(`No sounds found for reaction type: ${type}`);
    // Return a default sound as fallback
    return REACTION_SOUNDS.bien[0];
  }
  return sounds[Math.floor(Math.random() * sounds.length)];
}

// Volume presets for different sound types
export const VOLUME_PRESETS = {
  effects: 0.7,
  reactions: 0.8,
  music: 0.3,
  voice: 1.0,
};

// Sound priorities for mixing
export const SOUND_PRIORITY = {
  voice: 1,
  reactions: 2,
  effects: 3,
  music: 4,
};

// Platform-specific sound format support
export function getSoundFormat(): string {
  if (Platform.OS === 'ios') {
    return '.m4a'; // Better compression for iOS
  }
  return '.mp3'; // Universal format
}

// Get the full sound path with proper format
export function getSoundPath(basePath: string): string {
  // In production, this would handle bundled assets
  // For now, return the path as-is
  return basePath;
}
