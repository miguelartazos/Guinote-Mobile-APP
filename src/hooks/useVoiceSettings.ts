import { useState, useCallback, useEffect, useRef } from 'react';
import {
  VoiceSettings,
  getVoiceSettings,
  updateVoiceSettings,
  mutePlayer,
  unmutePlayer,
  isPlayerMuted,
  togglePlayerMuted,
  resetVoiceSettings,
} from '../utils/voiceSettings';

type VoiceSettingsState = VoiceSettings & {
  isLoading: boolean;
};

export function useVoiceSettings() {
  const [settingsState, setSettingsState] = useState<VoiceSettingsState>(() => ({
    ...getVoiceSettings(),
    isLoading: false,
  }));

  const listenersRef = useRef<Set<() => void>>(new Set());

  // Refresh settings from storage
  const refreshSettings = useCallback(() => {
    setSettingsState(prev => ({
      ...getVoiceSettings(),
      isLoading: prev.isLoading,
    }));
  }, []);

  // Update settings with optimistic update
  const updateSettings = useCallback((updates: Partial<Omit<VoiceSettings, 'mutedPlayers'>>) => {
    setSettingsState(prev => ({
      ...prev,
      ...updates,
    }));

    updateVoiceSettings(updates);

    // Notify other instances
    listenersRef.current.forEach(listener => listener());
  }, []);

  const mutePlayerById = useCallback(
    (playerId: string) => {
      mutePlayer(playerId);
      refreshSettings();
      listenersRef.current.forEach(listener => listener());
    },
    [refreshSettings],
  );

  const unmutePlayerById = useCallback(
    (playerId: string) => {
      unmutePlayer(playerId);
      refreshSettings();
      listenersRef.current.forEach(listener => listener());
    },
    [refreshSettings],
  );

  const togglePlayerMutedById = useCallback(
    (playerId: string): boolean => {
      const result = togglePlayerMuted(playerId);
      refreshSettings();
      listenersRef.current.forEach(listener => listener());
      return result;
    },
    [refreshSettings],
  );

  const resetSettings = useCallback(() => {
    resetVoiceSettings();
    refreshSettings();
    listenersRef.current.forEach(listener => listener());
  }, [refreshSettings]);

  const isPlayerMutedById = useCallback((playerId: string): boolean => {
    return isPlayerMuted(playerId);
  }, []);

  // Subscribe to changes from other hook instances
  useEffect(() => {
    const listener = () => {
      refreshSettings();
    };

    const listeners = listenersRef.current;
    listeners.add(listener);

    return () => {
      listeners.delete(listener);
    };
  }, [refreshSettings]);

  return {
    // Settings state
    autoPlay: settingsState.autoPlay,
    mutedPlayers: settingsState.mutedPlayers,
    isLoading: settingsState.isLoading,

    // Settings actions
    updateSettings,
    resetSettings,

    // Player muting
    mutePlayer: mutePlayerById,
    unmutePlayer: unmutePlayerById,
    togglePlayerMuted: togglePlayerMutedById,
    isPlayerMuted: isPlayerMutedById,

    // Utilities
    refreshSettings,
  };
}
