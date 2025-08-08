import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DifficultyLevel } from '../types/game.types';

const SETTINGS_KEY = '@guinote2_settings';

export type CardSize = 'normal' | 'large';
export type TableColor = 'green' | 'blue' | 'red' | 'wood';

export type GameSettings = {
  // Voice settings (already exist)
  globalVoiceEnabled: boolean;
  autoPlay: boolean;
  volume: number;
  // New game settings
  difficulty: DifficultyLevel;
  soundEffectsEnabled: boolean;
  cardSize: CardSize;
  tableColor: TableColor;
  // Audio settings
  backgroundMusicEnabled: boolean;
  musicVolume: number;
  effectsVolume: number;
  reactionsVolume: number;
  backgroundMusicType: 'spanish_guitar' | 'cafe_ambiance' | 'nature_sounds';
  // Accessibility settings
  accessibilityAudioCues: boolean;
  voiceAnnouncements: boolean;
  highContrastMode: boolean;
};

const DEFAULT_SETTINGS: GameSettings = {
  globalVoiceEnabled: true,
  autoPlay: true,
  volume: 0.8,
  difficulty: 'medium',
  soundEffectsEnabled: true,
  cardSize: 'normal',
  tableColor: 'green',
  backgroundMusicEnabled: false,
  musicVolume: 0.3,
  effectsVolume: 0.7,
  reactionsVolume: 0.8,
  backgroundMusicType: 'spanish_guitar',
  accessibilityAudioCues: false,
  voiceAnnouncements: false,
  highContrastMode: false,
};

export async function loadSettings(): Promise<GameSettings> {
  try {
    const storedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
    if (storedSettings) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(storedSettings) };
    }
  } catch (error) {
    console.error('Error loading settings:', error);
    throw new Error('Failed to load settings');
  }
  return DEFAULT_SETTINGS;
}

export async function saveSettings(settings: GameSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (error) {
    console.error('Error saving settings:', error);
    throw new Error('Failed to save settings');
  }
}

export async function resetSettings(): Promise<GameSettings> {
  try {
    await AsyncStorage.removeItem(SETTINGS_KEY);
  } catch (error) {
    console.error('Error resetting settings:', error);
    throw new Error('Failed to reset settings');
  }
  return DEFAULT_SETTINGS;
}
