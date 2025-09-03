import type { Brand } from '../types/game.types';

export type VoiceSettingsId = Brand<string, 'VoiceSettingsId'>;

export type VoiceSettings = {
  autoPlay: boolean; // true for auto-play, false for tap-to-play
  mutedPlayers: Set<string>;
};

const DEFAULT_SETTINGS: VoiceSettings = {
  autoPlay: true,
  mutedPlayers: new Set(),
};

// In-memory storage for voice settings
let voiceSettings: VoiceSettings = { ...DEFAULT_SETTINGS };

export function getVoiceSettings(): VoiceSettings {
  return {
    ...voiceSettings,
    mutedPlayers: new Set(voiceSettings.mutedPlayers),
  };
}

export function updateVoiceSettings(updates: Partial<Omit<VoiceSettings, 'mutedPlayers'>>): void {
  voiceSettings = {
    ...voiceSettings,
    ...updates,
  };
}

export function mutePlayer(playerId: string): void {
  voiceSettings.mutedPlayers.add(playerId);
}

export function unmutePlayer(playerId: string): void {
  voiceSettings.mutedPlayers.delete(playerId);
}

export function isPlayerMuted(playerId: string): boolean {
  return voiceSettings.mutedPlayers.has(playerId);
}

export function togglePlayerMuted(playerId: string): boolean {
  if (isPlayerMuted(playerId)) {
    unmutePlayer(playerId);
    return false;
  } else {
    mutePlayer(playerId);
    return true;
  }
}

export function resetVoiceSettings(): void {
  voiceSettings = {
    ...DEFAULT_SETTINGS,
    mutedPlayers: new Set(),
  };
}

// Volume is now handled by gameSettings.masterVolume
