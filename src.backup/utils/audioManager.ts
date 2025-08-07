import AudioRecorderPlayer from 'react-native-audio-recorder-player';
import { AppState, AppStateStatus, Platform } from 'react-native';
import type { SoundType, ReactionSoundType, MusicType } from './soundAssets';
import {
  SOUND_ASSETS,
  MUSIC_ASSETS,
  VOLUME_PRESETS,
  getRandomReactionSound,
  getSoundPath,
} from './soundAssets';

type LoadedSound = {
  path: string;
  type: 'effect' | 'reaction' | 'music' | 'voice';
  volume: number;
};

class AudioManager {
  private static instance: AudioManager;
  private audioRecorderPlayer: AudioRecorderPlayer;
  private currentlyPlaying: Map<string, LoadedSound> = new Map();
  private musicPlayer: AudioRecorderPlayer | null = null;
  private isMusicPlaying = false;
  private masterVolume = 1.0;
  private categoryVolumes = {
    effects: 1.0,
    reactions: 1.0,
    music: 1.0,
    voice: 1.0,
  };
  private isDucking = false;
  private appStateSubscription: any;
  private isSystemMuted = false;

  private constructor() {
    try {
      // Only initialize audio on real devices, not in development/simulator
      if (Platform.OS === 'web' || __DEV__) {
        console.log(
          'AudioManager: Running in development mode, audio features limited',
        );
      }
      this.audioRecorderPlayer = new AudioRecorderPlayer();
      this.setupAppStateListener();
    } catch (error) {
      console.warn(
        'AudioManager: Failed to initialize AudioRecorderPlayer',
        error,
      );
      // Create a null object pattern for audioRecorderPlayer
      this.audioRecorderPlayer = this.createMockAudioPlayer();
    }
  }

  private createMockAudioPlayer(): any {
    return {
      startPlayer: async () => {},
      stopPlayer: async () => {},
      pausePlayer: async () => {},
      resumePlayer: async () => {},
      seekToPlayer: async () => {},
      setVolume: async () => {},
      addPlayBackListener: () => {},
      removePlayBackListener: () => {},
    };
  }

  static getInstance(): AudioManager {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  private setupAppStateListener() {
    this.appStateSubscription = AppState.addEventListener(
      'change',
      this.handleAppStateChange,
    );
  }

  private handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'background' || nextAppState === 'inactive') {
      this.pauseAllSounds();
    } else if (nextAppState === 'active') {
      this.resumeMusic();
    }
  };

  // Master volume control
  setMasterVolume(volume: number) {
    this.masterVolume = Math.max(0, Math.min(1, volume));
  }

  // Category volume control
  setCategoryVolume(
    category: keyof typeof this.categoryVolumes,
    volume: number,
  ) {
    this.categoryVolumes[category] = Math.max(0, Math.min(1, volume));
  }

  // Check system mute state
  setSystemMuted(muted: boolean) {
    this.isSystemMuted = muted;
  }

  // Calculate final volume for a sound
  private calculateVolume(
    baseVolume: number,
    category: keyof typeof this.categoryVolumes,
  ): number {
    if (this.isSystemMuted) return 0;

    let volume =
      baseVolume * this.categoryVolumes[category] * this.masterVolume;

    // Apply ducking if voice is playing
    if (this.isDucking && category !== 'voice') {
      volume *= 0.3; // Duck to 30% when voice is playing
    }

    return volume;
  }

  // Play a sound effect
  async playSound(type: SoundType): Promise<void> {
    try {
      const soundPath = getSoundPath(SOUND_ASSETS[type]);
      const volume = this.calculateVolume(VOLUME_PRESETS.effects, 'effects');

      if (volume === 0) return;

      // Skip audio playback in development/web
      if (Platform.OS === 'web' || __DEV__) {
        console.log(`AudioManager: Would play sound ${type}`);
        return;
      }

      // For short sounds, we can create a new instance
      const player = new AudioRecorderPlayer();
      await player.startPlayer(soundPath);
      await player.setVolume(volume);

      // Auto-cleanup after sound finishes
      player.addPlayBackListener(e => {
        if (e.currentPosition >= e.duration) {
          player.stopPlayer();
          player.removePlayBackListener();
        }
      });
    } catch (error) {
      console.warn(`Failed to play sound ${type}:`, error);
    }
  }

  // Play a reaction sound
  async playReaction(type: ReactionSoundType): Promise<void> {
    try {
      // Validate reaction type exists
      if (!REACTION_SOUNDS[type]) {
        console.warn(`Invalid reaction type: ${type}`);
        return;
      }

      const soundPath = getSoundPath(getRandomReactionSound(type));
      const volume = this.calculateVolume(
        VOLUME_PRESETS.reactions,
        'reactions',
      );

      if (volume === 0) return;

      // Skip audio playback in development/web
      if (Platform.OS === 'web' || __DEV__) {
        console.log(`AudioManager: Would play reaction ${type}`);
        return;
      }

      const player = new AudioRecorderPlayer();
      await player.startPlayer(soundPath);
      await player.setVolume(volume);

      player.addPlayBackListener(e => {
        if (e.currentPosition >= e.duration) {
          player.stopPlayer();
          player.removePlayBackListener();
        }
      });
    } catch (error) {
      console.warn(`Failed to play reaction ${type}:`, error);
    }
  }

  // Start background music
  async startMusic(type: MusicType): Promise<void> {
    try {
      await this.stopMusic();

      const soundPath = getSoundPath(MUSIC_ASSETS[type]);
      const volume = this.calculateVolume(VOLUME_PRESETS.music, 'music');

      if (volume === 0) return;

      // Skip audio playback in development/web
      if (Platform.OS === 'web' || __DEV__) {
        console.log(`AudioManager: Would play music ${type}`);
        this.isMusicPlaying = true;
        return;
      }

      this.musicPlayer = new AudioRecorderPlayer();
      await this.musicPlayer.startPlayer(soundPath);
      await this.musicPlayer.setVolume(volume);
      this.isMusicPlaying = true;

      // Loop music
      this.musicPlayer.addPlayBackListener(e => {
        if (e.currentPosition >= e.duration - 100) {
          // Small buffer before end
          this.musicPlayer?.seekToPlayer(0);
        }
      });
    } catch (error) {
      console.warn(`Failed to start music ${type}:`, error);
    }
  }

  // Stop background music
  async stopMusic(): Promise<void> {
    if (this.musicPlayer && this.isMusicPlaying) {
      try {
        await this.musicPlayer.stopPlayer();
        this.musicPlayer.removePlayBackListener();
        this.musicPlayer = null;
        this.isMusicPlaying = false;
      } catch (error) {
        console.warn('Failed to stop music:', error);
      }
    }
  }

  // Pause music (for resuming later)
  async pauseMusic(): Promise<void> {
    if (this.musicPlayer && this.isMusicPlaying) {
      try {
        await this.musicPlayer.pausePlayer();
        this.isMusicPlaying = false;
      } catch (error) {
        console.warn('Failed to pause music:', error);
      }
    }
  }

  // Resume music
  async resumeMusic(): Promise<void> {
    if (this.musicPlayer && !this.isMusicPlaying) {
      try {
        await this.musicPlayer.resumePlayer();
        this.isMusicPlaying = true;
      } catch (error) {
        console.warn('Failed to resume music:', error);
      }
    }
  }

  // Audio ducking for voice
  startDucking() {
    this.isDucking = true;
    // Update music volume if playing
    if (this.musicPlayer && this.isMusicPlaying) {
      const duckVolume = this.calculateVolume(VOLUME_PRESETS.music, 'music');
      this.musicPlayer.setVolume(duckVolume);
    }
  }

  stopDucking() {
    this.isDucking = false;
    // Restore music volume if playing
    if (this.musicPlayer && this.isMusicPlaying) {
      const normalVolume = this.calculateVolume(VOLUME_PRESETS.music, 'music');
      this.musicPlayer.setVolume(normalVolume);
    }
  }

  // Pause all sounds (for app backgrounding)
  private pauseAllSounds() {
    this.pauseMusic();
    // Effects are short and will finish naturally
  }

  // Cleanup
  destroy() {
    this.stopMusic();
    if (this.appStateSubscription) {
      this.appStateSubscription.remove();
    }
  }
}

export const audioManager = AudioManager.getInstance();
