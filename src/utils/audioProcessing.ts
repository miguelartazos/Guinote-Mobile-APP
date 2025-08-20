export type AudioProcessingOptions = {
  normalizeVolume?: boolean;
  fadeInOut?: boolean;
  fadeInDuration?: number; // milliseconds
  fadeOutDuration?: number; // milliseconds
};

const DEFAULT_OPTIONS: AudioProcessingOptions = {
  normalizeVolume: true,
  fadeInOut: true,
  fadeInDuration: 50,
  fadeOutDuration: 100,
};

// Audio level utilities for visual feedback
export function calculateAudioLevel(currentPosition: number, duration: number): number {
  // Simulate audio level based on position
  // In a real implementation, this would analyze actual audio data
  const progress = currentPosition / duration;
  const baseLevel = 0.3 + Math.random() * 0.4;

  // Add some variation
  const wave = Math.sin(progress * Math.PI * 10) * 0.2;

  return Math.max(0, Math.min(1, baseLevel + wave));
}

// Volume normalization utilities
export function getVolumeMultiplier(
  playerVolume: number = 1,
  globalVolume: number = 1,
  autoNormalize: boolean = true,
): number {
  const baseMultiplier = playerVolume * globalVolume;

  if (autoNormalize) {
    // Apply gentle normalization curve
    return Math.pow(baseMultiplier, 0.8);
  }

  return baseMultiplier;
}

// Fade utilities
export function getFadeMultiplier(
  currentPosition: number,
  duration: number,
  options: AudioProcessingOptions = DEFAULT_OPTIONS,
): number {
  if (!options.fadeInOut) return 1;

  const fadeIn = options.fadeInDuration || DEFAULT_OPTIONS.fadeInDuration!;
  const fadeOut = options.fadeOutDuration || DEFAULT_OPTIONS.fadeOutDuration!;

  // Fade in
  if (currentPosition < fadeIn) {
    return currentPosition / fadeIn;
  }

  // Fade out
  const fadeOutStart = duration - fadeOut;
  if (currentPosition > fadeOutStart) {
    return (duration - currentPosition) / fadeOut;
  }

  return 1;
}

// Playback speed utilities
export enum PlaybackSpeed {
  SLOW = 0.5,
  NORMAL = 1.0,
  FAST = 1.5,
}

export function getPlaybackSpeedLabel(speed: PlaybackSpeed): string {
  switch (speed) {
    case PlaybackSpeed.SLOW:
      return '0.5x';
    case PlaybackSpeed.NORMAL:
      return '1x';
    case PlaybackSpeed.FAST:
      return '1.5x';
  }
}

// Duck other audio when voice plays
export function getDuckingLevel(isVoicePlaying: boolean): number {
  return isVoicePlaying ? 0.3 : 1.0; // Reduce other audio to 30% when voice plays
}
