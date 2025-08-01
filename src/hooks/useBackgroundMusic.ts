import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { audioManager } from '../utils/audioManager';
import { useGameSettings } from './useGameSettings';
import type { MusicType } from '../utils/soundAssets';

export function useBackgroundMusic() {
  const { settings } = useGameSettings();
  const [currentMusic, setCurrentMusic] = useState<MusicType | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const appStateRef = useRef(AppState.currentState);
  const wasPlayingBeforeBackgroundRef = useRef(false);

  // Handle app state changes
  useEffect(() => {
    const subscription = AppState.addEventListener(
      'change',
      (nextAppState: AppStateStatus) => {
        if (
          appStateRef.current === 'active' &&
          nextAppState.match(/inactive|background/)
        ) {
          // Going to background
          wasPlayingBeforeBackgroundRef.current = isPlaying;
          if (isPlaying && audioManager) {
            audioManager
              .pauseMusic()
              .catch(err => console.warn('Failed to pause music:', err));
            setIsPlaying(false);
          }
        } else if (
          appStateRef.current.match(/inactive|background/) &&
          nextAppState === 'active'
        ) {
          // Coming back to foreground
          if (
            wasPlayingBeforeBackgroundRef.current &&
            settings?.backgroundMusicEnabled &&
            audioManager
          ) {
            audioManager
              .resumeMusic()
              .catch(err => console.warn('Failed to resume music:', err));
            setIsPlaying(true);
          }
        }
        appStateRef.current = nextAppState;
      },
    );

    return () => {
      subscription.remove();
    };
  }, [isPlaying, settings?.backgroundMusicEnabled]);

  // Start music
  const startMusic = useCallback(
    async (type: MusicType) => {
      if (!settings?.backgroundMusicEnabled || !audioManager) return;

      try {
        await audioManager.startMusic(type);
        setCurrentMusic(type);
        setIsPlaying(true);
      } catch (error) {
        console.warn('Failed to start background music:', error);
      }
    },
    [settings?.backgroundMusicEnabled],
  );

  // Stop music
  const stopMusic = useCallback(async () => {
    if (!audioManager) return;

    try {
      await audioManager.stopMusic();
      setCurrentMusic(null);
      setIsPlaying(false);
    } catch (error) {
      console.warn('Failed to stop background music:', error);
    }
  }, []);

  // Pause music
  const pauseMusic = useCallback(async () => {
    if (!audioManager) return;

    try {
      await audioManager.pauseMusic();
      setIsPlaying(false);
    } catch (error) {
      console.warn('Failed to pause background music:', error);
    }
  }, []);

  // Resume music
  const resumeMusic = useCallback(async () => {
    if (!settings?.backgroundMusicEnabled || !currentMusic || !audioManager)
      return;

    try {
      await audioManager.resumeMusic();
      setIsPlaying(true);
    } catch (error) {
      console.warn('Failed to resume background music:', error);
    }
  }, [settings?.backgroundMusicEnabled, currentMusic]);

  // Switch music type
  const switchMusic = useCallback(
    async (type: MusicType) => {
      if (currentMusic === type && isPlaying) return;

      await stopMusic();
      await startMusic(type);
    },
    [currentMusic, isPlaying, stopMusic, startMusic],
  );

  // Handle settings changes
  useEffect(() => {
    if (!settings?.backgroundMusicEnabled && isPlaying) {
      stopMusic();
    } else if (settings?.backgroundMusicEnabled && !isPlaying && currentMusic) {
      resumeMusic();
    }

    // Update volume
    if (settings?.musicVolume !== undefined && audioManager) {
      audioManager.setCategoryVolume('music', settings.musicVolume);
    }
  }, [
    settings?.backgroundMusicEnabled,
    settings?.musicVolume,
    isPlaying,
    currentMusic,
    stopMusic,
    resumeMusic,
  ]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioManager) {
        audioManager
          .stopMusic()
          .catch(err => console.warn('Failed to stop music on unmount:', err));
      }
    };
  }, []);

  return {
    currentMusic,
    isPlaying,
    startMusic,
    stopMusic,
    pauseMusic,
    resumeMusic,
    switchMusic,
  };
}
