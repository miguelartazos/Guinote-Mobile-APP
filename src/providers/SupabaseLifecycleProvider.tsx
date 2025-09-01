import React, { useEffect } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';
import { useFeatureFlag } from '../config/featureFlags';

/**
 * SupabaseLifecycleProvider
 *
 * Manages Supabase auth token auto-refresh based on app state.
 * Only mounts and imports Supabase when the master enableMultiplayer flag is enabled.
 * This prevents loading Supabase on app startup when running in offline mode.
 *
 * CRITICAL: This is part of the Hermes safety boundary.
 * No Supabase imports occur when enableMultiplayer is false.
 */
export function SupabaseLifecycleProvider({ children }: { children: React.ReactNode }) {
  // Use the master multiplayer flag - this controls ALL Supabase imports
  const isMultiplayerEnabled = useFeatureFlag('enableMultiplayer');

  useEffect(() => {
    if (!isMultiplayerEnabled || Platform.OS === 'web') {
      return;
    }

    let appStateSubscription: any;

    // Dynamically import Supabase only when needed
    const setupAutoRefresh = async () => {
      try {
        const { getSupabaseClient } = await import('../lib/supabase');
        const supabase = await getSupabaseClient();

        const handleAppStateChange = (nextAppState: AppStateStatus) => {
          if (nextAppState === 'active') {
            // App is in foreground - start auto refresh
            supabase.auth.startAutoRefresh();
          } else {
            // App is in background/inactive - stop auto refresh
            supabase.auth.stopAutoRefresh();
          }
        };

        // Set initial state
        handleAppStateChange(AppState.currentState);

        // Listen for app state changes
        appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
      } catch (error) {
        console.error('Failed to setup Supabase auto-refresh:', error);
      }
    };

    setupAutoRefresh();

    // Cleanup
    return () => {
      if (appStateSubscription?.remove) {
        appStateSubscription.remove();
      }
    };
  }, [isMultiplayerEnabled]);

  return <>{children}</>;
}
