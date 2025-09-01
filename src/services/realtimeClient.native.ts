/**
 * Safe Supabase Realtime Client Wrapper
 *
 * CRITICAL: This module provides a safe boundary for Supabase imports.
 * It ONLY imports Supabase when the enableMultiplayer flag is true.
 * This ensures the app remains Hermes-safe with no Supabase imports at startup.
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { isMultiplayerEnabled } from '../config/featureFlags';

let realtimeClient: SupabaseClient | null = null;
let initializationPromise: Promise<SupabaseClient | null> | null = null;

/**
 * Creates or returns the existing Supabase realtime client
 * Returns null if multiplayer is disabled (feature flag OFF)
 *
 * This function uses lazy loading to only import Supabase when needed,
 * preventing any Supabase code from being loaded at app startup.
 */
export async function createRealtimeClient(): Promise<SupabaseClient | null> {
  // Check feature flag first - no imports if disabled
  if (!isMultiplayerEnabled()) {
    if (__DEV__) {
      console.log('[RealtimeClient] Multiplayer disabled - returning null client');
    }
    return null;
  }

  // Return existing client if already initialized
  if (realtimeClient) {
    return realtimeClient;
  }

  // Return existing initialization promise if in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  initializationPromise = initializeClient();
  return initializationPromise;
}

async function initializeClient(): Promise<SupabaseClient | null> {
  try {
    if (__DEV__) {
      console.log('[RealtimeClient] Multiplayer enabled - lazy loading Supabase client');
    }

    // Lazy import Supabase ONLY when multiplayer is enabled
    // This is the ONLY place where Supabase is imported for realtime features
    const { getSupabaseClient } = await import('../lib/supabase');

    realtimeClient = await getSupabaseClient();

    if (__DEV__) {
      console.log('[RealtimeClient] Supabase client loaded successfully');
    }

    return realtimeClient;
  } catch (error) {
    console.error('[RealtimeClient] Failed to load Supabase client:', error);
    return null;
  }
}

/**
 * Get the current realtime client if it exists
 * Does NOT create a new client - returns null if not initialized
 */
export function getRealtimeClient(): SupabaseClient | null {
  return realtimeClient;
}

/**
 * Reset the realtime client (useful for testing)
 * This will force a new lazy load on next createRealtimeClient call
 */
export function resetRealtimeClient(): void {
  realtimeClient = null;
  initializationPromise = null;
}

/**
 * Check if realtime features are available
 * This checks both the feature flag and client initialization
 */
export async function isRealtimeAvailable(): Promise<boolean> {
  if (!isMultiplayerEnabled()) {
    return false;
  }

  const client = await createRealtimeClient();
  return client !== null;
}
