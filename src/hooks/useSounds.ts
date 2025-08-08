import { useCallback } from 'react';

/**
 * Simplified sound hook that provides no-op functions.
 * Audio functionality has been removed from the app.
 */
export function useSounds() {
  const playCardSound = useCallback(async () => {
    // No-op: audio functionality removed
  }, []);

  const playTurnSound = useCallback(async () => {
    // No-op: audio functionality removed
  }, []);

  const playVictorySound = useCallback(async () => {
    // No-op: audio functionality removed
  }, []);

  const playDefeatSound = useCallback(async () => {
    // No-op: audio functionality removed
  }, []);

  const playShuffleSound = useCallback(async () => {
    // No-op: audio functionality removed
  }, []);

  const playDealSound = useCallback(async () => {
    // No-op: audio functionality removed
  }, []);

  const playTrumpRevealSound = useCallback(async () => {
    // No-op: audio functionality removed
  }, []);

  const playCanteSound = useCallback(async () => {
    // No-op: audio functionality removed
  }, []);

  const playTrickCollectSound = useCallback(async () => {
    // No-op: audio functionality removed
  }, []);

  const playReactionSound = useCallback(async (_type?: any) => {
    // No-op: audio functionality removed
  }, []);

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
