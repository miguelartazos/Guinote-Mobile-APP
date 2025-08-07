import { useCallback, useRef, useEffect } from 'react';
import { Platform } from 'react-native';
import { useGameSettings } from './useGameSettings';
import { audioManager } from '../utils/audioManager';
import type { ReactionSoundType } from '../utils/soundAssets';

export function useSounds() {
  const audioContext = useRef<any>(null);
  const { settings } = useGameSettings();

  // Update audio manager volumes when settings change
  useEffect(() => {
    if (settings && audioManager) {
      try {
        audioManager.setMasterVolume(settings.volume || 1.0);
        audioManager.setCategoryVolume(
          'effects',
          settings.soundEffectsEnabled ? settings.effectsVolume || 0.7 : 0,
        );
        audioManager.setCategoryVolume(
          'reactions',
          settings.reactionsVolume || 0.8,
        );
        audioManager.setCategoryVolume(
          'music',
          settings.backgroundMusicEnabled ? settings.musicVolume || 0.3 : 0,
        );
        audioManager.setCategoryVolume(
          'voice',
          settings.globalVoiceEnabled ? 1.0 : 0,
        );
      } catch (error) {
        console.warn('Failed to update audio settings:', error);
      }
    }
  }, [settings]);

  const initAudio = useCallback(() => {
    if (Platform.OS === 'web') {
      // Web-only code for development
      try {
        const globalWindow = global as any;
        if (globalWindow.AudioContext || globalWindow.webkitAudioContext) {
          const AudioContextConstructor =
            globalWindow.AudioContext || globalWindow.webkitAudioContext;
          audioContext.current = new AudioContextConstructor();
        }
      } catch (error) {
        console.log('AudioContext not available');
      }
    }
  }, []);

  const playCardSound = useCallback(async () => {
    if (!settings?.soundEffectsEnabled) return;

    // Use audio manager for native platforms
    if (Platform.OS !== 'web' && audioManager) {
      try {
        await audioManager.playSound('card_play');
        return;
      } catch (error) {
        console.warn('Failed to play card sound:', error);
      }
    }

    // Fallback to Web Audio API for development
    if (!audioContext.current) {
      initAudio();
    }

    if (audioContext.current) {
      const oscillator = audioContext.current.createOscillator();
      const gainNode = audioContext.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.current.destination);

      oscillator.frequency.value = 800;
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.3, audioContext.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.current.currentTime + 0.1,
      );

      oscillator.start(audioContext.current.currentTime);
      oscillator.stop(audioContext.current.currentTime + 0.1);
    }
  }, [initAudio, settings?.soundEffectsEnabled]);

  const playTurnSound = useCallback(async () => {
    if (!settings?.soundEffectsEnabled) return;

    if (Platform.OS !== 'web' && audioManager) {
      try {
        await audioManager.playSound('turn_notify');
        return;
      } catch (error) {
        console.warn('Failed to play turn sound:', error);
      }
    }

    // Fallback for web
    if (!audioContext.current) {
      initAudio();
    }

    if (audioContext.current) {
      [0, 150].forEach(delay => {
        setTimeout(() => {
          const oscillator = audioContext.current!.createOscillator();
          const gainNode = audioContext.current!.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.current!.destination);

          oscillator.frequency.value = 1000;
          oscillator.type = 'sine';

          gainNode.gain.setValueAtTime(0.2, audioContext.current!.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.current!.currentTime + 0.1,
          );

          oscillator.start(audioContext.current!.currentTime);
          oscillator.stop(audioContext.current!.currentTime + 0.1);
        }, delay);
      });
    }
  }, [initAudio, settings?.soundEffectsEnabled]);

  const playVictorySound = useCallback(async () => {
    if (!settings?.soundEffectsEnabled) return;

    if (Platform.OS !== 'web' && audioManager) {
      try {
        await audioManager.playSound('victory');
        return;
      } catch (error) {
        console.warn('Failed to play victory sound:', error);
      }
    }

    // Fallback for web
    if (!audioContext.current) {
      initAudio();
    }

    if (audioContext.current) {
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C, E, G, C
      notes.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = audioContext.current!.createOscillator();
          const gainNode = audioContext.current!.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.current!.destination);

          oscillator.frequency.value = freq;
          oscillator.type = 'sine';

          gainNode.gain.setValueAtTime(0.3, audioContext.current!.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.current!.currentTime + 0.3,
          );

          oscillator.start(audioContext.current!.currentTime);
          oscillator.stop(audioContext.current!.currentTime + 0.3);
        }, index * 150);
      });
    }
  }, [initAudio, settings?.soundEffectsEnabled]);

  const playDefeatSound = useCallback(async () => {
    if (!settings?.soundEffectsEnabled) return;

    if (Platform.OS !== 'web' && audioManager) {
      try {
        await audioManager.playSound('defeat');
        return;
      } catch (error) {
        console.warn('Failed to play defeat sound:', error);
      }
    }

    // Fallback for web
    if (!audioContext.current) {
      initAudio();
    }

    if (audioContext.current) {
      const oscillator = audioContext.current.createOscillator();
      const gainNode = audioContext.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.current.destination);

      oscillator.type = 'sawtooth';
      oscillator.frequency.setValueAtTime(
        200,
        audioContext.current.currentTime,
      );
      oscillator.frequency.exponentialRampToValueAtTime(
        100,
        audioContext.current.currentTime + 0.5,
      );

      gainNode.gain.setValueAtTime(0.2, audioContext.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.current.currentTime + 0.5,
      );

      oscillator.start(audioContext.current.currentTime);
      oscillator.stop(audioContext.current.currentTime + 0.5);
    }
  }, [initAudio, settings?.soundEffectsEnabled]);

  const playShuffleSound = useCallback(async () => {
    if (!settings?.soundEffectsEnabled) return;

    if (Platform.OS !== 'web' && audioManager) {
      try {
        await audioManager.playSound('card_shuffle');
        return;
      } catch (error) {
        console.warn('Failed to play shuffle sound:', error);
      }
    }

    // Fallback for web
    if (!audioContext.current) {
      initAudio();
    }

    if (audioContext.current) {
      for (let i = 0; i < 5; i++) {
        setTimeout(() => {
          const gainNode = audioContext.current!.createGain();
          const noiseBuffer = audioContext.current!.createBufferSource();

          // Create white noise
          const bufferSize = audioContext.current!.sampleRate * 0.05;
          const buffer = audioContext.current!.createBuffer(
            1,
            bufferSize,
            audioContext.current!.sampleRate,
          );
          const output = buffer.getChannelData(0);
          for (let j = 0; j < bufferSize; j++) {
            output[j] = Math.random() * 2 - 1;
          }
          noiseBuffer.buffer = buffer;

          noiseBuffer.connect(gainNode);
          gainNode.connect(audioContext.current!.destination);

          gainNode.gain.setValueAtTime(0.1, audioContext.current!.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.current!.currentTime + 0.05,
          );

          noiseBuffer.start(audioContext.current!.currentTime);
          noiseBuffer.stop(audioContext.current!.currentTime + 0.05);
        }, i * 80);
      }
    }
  }, [initAudio, settings?.soundEffectsEnabled]);

  const playDealSound = useCallback(async () => {
    if (!settings?.soundEffectsEnabled) return;

    if (Platform.OS !== 'web' && audioManager) {
      try {
        await audioManager.playSound('card_flip');
        return;
      } catch (error) {
        console.warn('Failed to play deal sound:', error);
      }
    }

    // Fallback for web
    if (!audioContext.current) {
      initAudio();
    }

    if (audioContext.current) {
      const oscillator = audioContext.current.createOscillator();
      const gainNode = audioContext.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.current.destination);

      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(
        2000,
        audioContext.current.currentTime,
      );
      oscillator.frequency.exponentialRampToValueAtTime(
        200,
        audioContext.current.currentTime + 0.1,
      );

      gainNode.gain.setValueAtTime(0.2, audioContext.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.current.currentTime + 0.1,
      );

      oscillator.start(audioContext.current.currentTime);
      oscillator.stop(audioContext.current.currentTime + 0.1);
    }
  }, [initAudio, settings?.soundEffectsEnabled]);

  const playTrumpRevealSound = useCallback(async () => {
    if (!settings?.soundEffectsEnabled) return;

    if (Platform.OS !== 'web' && audioManager) {
      try {
        await audioManager.playSound('game_start');
        return;
      } catch (error) {
        console.warn('Failed to play trump reveal sound:', error);
      }
    }

    // Fallback for web
    if (!audioContext.current) {
      initAudio();
    }

    if (audioContext.current) {
      const notes = [523.25, 659.25, 783.99]; // C, E, G
      notes.forEach((freq, index) => {
        setTimeout(() => {
          const oscillator = audioContext.current!.createOscillator();
          const gainNode = audioContext.current!.createGain();

          oscillator.connect(gainNode);
          gainNode.connect(audioContext.current!.destination);

          oscillator.frequency.value = freq;
          oscillator.type = 'sine';

          gainNode.gain.setValueAtTime(0.2, audioContext.current!.currentTime);
          gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.current!.currentTime + 0.4,
          );

          oscillator.start(audioContext.current!.currentTime);
          oscillator.stop(audioContext.current!.currentTime + 0.4);
        }, index * 100);
      });
    }
  }, [initAudio, settings?.soundEffectsEnabled]);

  // New sound methods
  const playCanteSound = useCallback(
    async (points: 20 | 40) => {
      if (!settings?.soundEffectsEnabled) return;

      if (Platform.OS !== 'web' && audioManager) {
        try {
          await audioManager.playSound(points === 20 ? 'cante_20' : 'cante_40');
          return;
        } catch (error) {
          console.warn('Failed to play cante sound:', error);
        }
      }

      // Web fallback - simple fanfare
      if (!audioContext.current) initAudio();
      if (audioContext.current) {
        const notes = points === 20 ? [600, 800] : [600, 800, 1000, 1200];
        notes.forEach((freq, index) => {
          setTimeout(() => {
            const osc = audioContext.current!.createOscillator();
            const gain = audioContext.current!.createGain();
            osc.connect(gain);
            gain.connect(audioContext.current!.destination);
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.3, audioContext.current!.currentTime);
            gain.gain.exponentialRampToValueAtTime(
              0.01,
              audioContext.current!.currentTime + 0.2,
            );
            osc.start();
            osc.stop(audioContext.current!.currentTime + 0.2);
          }, index * 100);
        });
      }
    },
    [initAudio, settings?.soundEffectsEnabled],
  );

  const playTrickCollectSound = useCallback(async () => {
    if (!settings?.soundEffectsEnabled) return;

    if (Platform.OS !== 'web' && audioManager) {
      try {
        await audioManager.playSound('trick_collect');
      } catch (error) {
        console.warn('Failed to play trick collect sound:', error);
      }
    }
  }, [settings?.soundEffectsEnabled]);

  const playReactionSound = useCallback(
    async (type: ReactionSoundType) => {
      if (!settings?.soundEffectsEnabled) return;

      if (Platform.OS !== 'web' && audioManager) {
        try {
          await audioManager.playReaction(type);
        } catch (error) {
          console.warn('Failed to play reaction sound:', error);
        }
      }
    },
    [settings?.soundEffectsEnabled],
  );

  return {
    playCardSound,
    playTurnSound,
    playVictorySound,
    playDefeatSound,
    playShuffleSound,
    playDealSound,
    playTrumpRevealSound,
    playCanteSound,
    playTrickCollectSound,
    playReactionSound,
  };
}
