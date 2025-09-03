import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient, processLock } from '@supabase/supabase-js';
import type { SupabaseClient } from '@supabase/supabase-js';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../config/envConfig';
import { isMultiplayerEnabled } from '../config/featureFlags';

let supabaseClient: SupabaseClient | null = null;
let initializationPromise: Promise<SupabaseClient> | null = null;

/**
 * Get or create the Supabase client instance
 * Uses lazy initialization to prevent loading at app startup
 */
export async function getSupabaseClient(): Promise<SupabaseClient> {
  // Return existing client if already initialized
  if (supabaseClient) {
    return supabaseClient;
  }

  // Return existing initialization promise if in progress
  if (initializationPromise) {
    return initializationPromise;
  }

  // Start initialization
  initializationPromise = initializeSupabase();
  return initializationPromise;
}

async function initializeSupabase(): Promise<SupabaseClient> {
  // Check if multiplayer is enabled
  if (!isMultiplayerEnabled()) {
    throw new Error('Multiplayer features are disabled');
  }

  const supabaseUrl = SUPABASE_URL;
  const supabaseAnonKey = SUPABASE_ANON_KEY;

  // Validate environment variables with better error messages
  if (!supabaseUrl || supabaseUrl.trim() === '') {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_URL environment variable. ' +
      'Please add it to your .env file. Example: EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co'
    );
  }

  if (!supabaseAnonKey || supabaseAnonKey.trim() === '') {
    throw new Error(
      'Missing EXPO_PUBLIC_SUPABASE_ANON_KEY environment variable. ' +
      'Please add it to your .env file. You can find this in your Supabase project settings.'
    );
  }

  // Create the client
  supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      storage: AsyncStorage,
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
      flowType: 'pkce',
      lock: processLock, // Prevents token refresh contention
    },
    realtime: {
      params: {
        eventsPerSecond: 10,
      },
    },
  });

  if (__DEV__) {
    console.log('[Supabase] Client initialized successfully');
  }

  return supabaseClient;
}

/**
 * Legacy export for backward compatibility
 * Will be removed once all imports are updated to use getSupabaseClient()
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    if (!supabaseClient) {
      throw new Error('Supabase client not initialized. Call getSupabaseClient() first.');
    }
    return supabaseClient[prop as keyof SupabaseClient];
  },
});
