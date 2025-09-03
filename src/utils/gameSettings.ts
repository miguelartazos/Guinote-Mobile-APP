import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DifficultyLevel } from '../types/game.types';

const SETTINGS_KEY = '@guinote2_settings';

export type CardSize = 'normal' | 'large';
export type TableColor = 'green' | 'blue' | 'red' | 'wood';

export type GameSettings = {
  // Gameplay settings
  difficulty: DifficultyLevel;
  cardSize: CardSize;
  tableColor: TableColor;
  // Audio settings (simplified)
  masterVolume: number;
  soundEffectsEnabled: boolean;
  voiceMessagesEnabled: boolean;
  backgroundMusicEnabled: boolean;
  // Accessibility settings
  highContrastMode: boolean;
};

const DEFAULT_SETTINGS: GameSettings = {
  // Gameplay
  difficulty: 'medium',
  cardSize: 'normal',
  tableColor: 'green',
  // Audio
  masterVolume: 0.7,
  soundEffectsEnabled: true,
  voiceMessagesEnabled: true,
  backgroundMusicEnabled: false,
  // Accessibility
  highContrastMode: false,
};

// Migration helper to convert old settings format to new
function migrateSettings(oldSettings: any): GameSettings {
  return {
    // Gameplay settings remain the same
    difficulty: oldSettings.difficulty || DEFAULT_SETTINGS.difficulty,
    cardSize: oldSettings.cardSize || DEFAULT_SETTINGS.cardSize,
    tableColor: oldSettings.tableColor || DEFAULT_SETTINGS.tableColor,
    // Audio settings migration
    masterVolume: oldSettings.volume || oldSettings.masterVolume || DEFAULT_SETTINGS.masterVolume,
    soundEffectsEnabled: oldSettings.soundEffectsEnabled ?? DEFAULT_SETTINGS.soundEffectsEnabled,
    voiceMessagesEnabled:
      oldSettings.globalVoiceEnabled ??
      oldSettings.voiceMessagesEnabled ??
      DEFAULT_SETTINGS.voiceMessagesEnabled,
    backgroundMusicEnabled:
      oldSettings.backgroundMusicEnabled ?? DEFAULT_SETTINGS.backgroundMusicEnabled,
    // Accessibility
    highContrastMode: oldSettings.highContrastMode ?? DEFAULT_SETTINGS.highContrastMode,
  };
}

export async function loadSettings(): Promise<GameSettings> {
  try {
    const storedSettings = await AsyncStorage.getItem(SETTINGS_KEY);
    if (storedSettings) {
      const parsed = JSON.parse(storedSettings);
      // Migrate old settings format if needed
      return migrateSettings(parsed);
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
