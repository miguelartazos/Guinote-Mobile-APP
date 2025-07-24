import { useCallback, useRef } from 'react';
import { Platform } from 'react-native';

// Simple sound effects using web audio API for development
// In production, use react-native-sound or expo-av
export function useSounds() {
  const audioContext = useRef<AudioContext | null>(null);

  const initAudio = useCallback(() => {
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      window.AudioContext
    ) {
      audioContext.current = new window.AudioContext();
    }
  }, []);

  const playCardSound = useCallback(() => {
    if (!audioContext.current) {
      initAudio();
    }

    // Simple click sound
    if (audioContext.current && Platform.OS === 'web') {
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
  }, [initAudio]);

  const playTurnSound = useCallback(() => {
    if (!audioContext.current) {
      initAudio();
    }

    // Double beep for turn notification
    if (audioContext.current && Platform.OS === 'web') {
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
  }, [initAudio]);

  const playVictorySound = useCallback(() => {
    if (!audioContext.current) {
      initAudio();
    }

    // Victory fanfare
    if (audioContext.current && Platform.OS === 'web') {
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
  }, [initAudio]);

  const playDefeatSound = useCallback(() => {
    if (!audioContext.current) {
      initAudio();
    }

    // Sad trombone
    if (audioContext.current && Platform.OS === 'web') {
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
  }, [initAudio]);

  return {
    playCardSound,
    playTurnSound,
    playVictorySound,
    playDefeatSound,
  };
}
