import AsyncStorage from '@react-native-async-storage/async-storage';

export interface FeatureFlags {
  // Master switch for all multiplayer features - MUST be OFF for Hermes safety
  enableMultiplayer: boolean;

  // Individual Supabase features (require enableMultiplayer to be true)
  useSupabaseAuth: boolean;
  useSupabaseRooms: boolean;
  useSupabaseGame: boolean;
  useSupabaseMatchmaking: boolean;
  useSupabaseFriends: boolean;
  useSupabaseVoice: boolean;
  useSupabaseStatistics: boolean;

  // Additional feature flags from the multiplayer plan
  enableVoiceChat: boolean;
  enableTournaments: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  // CRITICAL: Keep OFF for Hermes safety - no Supabase imports at startup
  enableMultiplayer: false,

  // Individual Supabase features (ignored if enableMultiplayer is false)
  useSupabaseAuth: false,
  useSupabaseRooms: false,
  useSupabaseGame: false,
  useSupabaseMatchmaking: false,
  useSupabaseFriends: false,
  useSupabaseVoice: false,
  useSupabaseStatistics: false,

  // Additional features
  enableVoiceChat: false,
  enableTournaments: false,
};

// Keep all features OFF by default - enable one at a time for testing
const DEVELOPMENT_FLAGS: FeatureFlags = {
  // CRITICAL: Keep OFF for Hermes safety - no Supabase imports at startup
  enableMultiplayer: false,

  // Individual Supabase features (ignored if enableMultiplayer is false)
  useSupabaseAuth: false, // Enable when ready to test auth
  useSupabaseRooms: false, // Enable when ready to test rooms
  useSupabaseGame: false, // Enable when ready to test game
  useSupabaseMatchmaking: false, // Enable when ready to test matchmaking
  useSupabaseFriends: false, // Enable when ready to test friends
  useSupabaseVoice: false, // Enable when ready to test voice
  useSupabaseStatistics: false, // Enable when ready to test stats

  // Additional features
  enableVoiceChat: false,
  enableTournaments: false,
};

class FeatureFlagManager {
  private flags: FeatureFlags = DEFAULT_FLAGS;
  private listeners: Set<(flags: FeatureFlags) => void> = new Set();
  private initialized = false;

  async initialize() {
    if (this.initialized) return;

    try {
      // Load flags from AsyncStorage
      const stored = await AsyncStorage.getItem('featureFlags');
      if (stored) {
        this.flags = { ...DEFAULT_FLAGS, ...JSON.parse(stored) };
      } else if (__DEV__) {
        // Use development flags in dev mode
        this.flags = DEVELOPMENT_FLAGS;
      }
      this.initialized = true;
    } catch (error) {
      console.error('Error loading feature flags:', error);
      this.flags = __DEV__ ? DEVELOPMENT_FLAGS : DEFAULT_FLAGS;
    }
  }

  getFlags(): FeatureFlags {
    return { ...this.flags };
  }

  getFlag<K extends keyof FeatureFlags>(key: K): FeatureFlags[K] {
    return this.flags[key];
  }

  async setFlag<K extends keyof FeatureFlags>(key: K, value: FeatureFlags[K]) {
    this.flags[key] = value;
    await this.saveFlags();
    this.notifyListeners();
  }

  async setFlags(flags: Partial<FeatureFlags>) {
    this.flags = { ...this.flags, ...flags };
    await this.saveFlags();
    this.notifyListeners();
  }

  async resetFlags() {
    this.flags = __DEV__ ? DEVELOPMENT_FLAGS : DEFAULT_FLAGS;
    await AsyncStorage.removeItem('featureFlags');
    this.notifyListeners();
  }

  subscribe(listener: (flags: FeatureFlags) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private async saveFlags() {
    try {
      await AsyncStorage.setItem('featureFlags', JSON.stringify(this.flags));
    } catch (error) {
      console.error('Error saving feature flags:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.flags));
  }
}

export const featureFlags = new FeatureFlagManager();

/**
 * Check if multiplayer features are available
 * This is the master switch that controls all Supabase imports
 */
export function isMultiplayerEnabled(): boolean {
  return featureFlags.getFlag('enableMultiplayer');
}

/**
 * Check if a specific Supabase feature is available
 * Returns false if multiplayer is disabled (master switch is off)
 */
export function isSupabaseFeatureEnabled(feature: keyof FeatureFlags): boolean {
  if (!isMultiplayerEnabled()) {
    return false;
  }
  return featureFlags.getFlag(feature);
}

// Hook to use feature flags in components
import { useState, useEffect } from 'react';

export function useFeatureFlags(): FeatureFlags {
  const [flags, setFlags] = useState<FeatureFlags>(featureFlags.getFlags());

  useEffect(() => {
    // Initialize on mount
    featureFlags.initialize().catch(error => {
      console.error('Failed to initialize feature flags:', error);
    });

    // Subscribe to changes
    const unsubscribe = featureFlags.subscribe(setFlags);
    return unsubscribe;
  }, []);

  return flags;
}

export function useFeatureFlag<K extends keyof FeatureFlags>(key: K): FeatureFlags[K] {
  const flags = useFeatureFlags();
  return flags[key];
}
