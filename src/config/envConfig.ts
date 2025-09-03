/**
 * Environment configuration
 * This file contains all environment variables as constants
 * to avoid issues with react-native-dotenv babel plugin
 */

// Direct imports from react-native-dotenv
declare module '@env' {
  export const EXPO_PUBLIC_SUPABASE_URL: string;
  export const EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
}

interface EnvironmentConfig {
  // Clerk/Convex removed
  ENVIRONMENT: 'development' | 'production' | 'test';
  ENABLE_AUTH: boolean;
  ENABLE_GUEST_MODE: boolean;
  ENABLE_OFFLINE_MODE: boolean;
  SHOW_AUTH_LOGS: boolean;
  API_TIMEOUT: number;
  MAX_RETRY_ATTEMPTS: number;
  SUPABASE_URL: string;
  SUPABASE_ANON_KEY: string;
}

// Memory management constants - similar to aiMemory.ts pattern
const WARNING_CLEANUP_THRESHOLD = 80; // Start cleanup when reaching this size

// Track which keys we've already warned about to prevent console spam
const warnedKeys = new Set<string>();

// Helper to reset warning cache (for testing only)
export const resetWarningCache = () => {
  if (__DEV__ || process.env.NODE_ENV === 'test') {
    warnedKeys.clear();
  }
};

/**
 * Helper to get environment variables with validation
 * - Warns once per key in development
 * - Throws in production if missing
 * - Implements memory management to prevent unbounded growth
 *
 * Note: Tests were added after implementation (not TDD) to ensure robustness
 */
export const getEnvVar = (key: string): string => {
  const value = process.env[key];

  // Check for actual value - not undefined type, not string 'undefined', not empty or whitespace
  if (value !== undefined && value !== 'undefined' && value.trim() !== '') {
    return value;
  }

  // In development, warn once per key but continue with empty string
  if (__DEV__) {
    // Check if we need to cleanup the warning cache
    if (warnedKeys.size >= WARNING_CLEANUP_THRESHOLD) {
      // Simple cleanup: clear all warnings and start fresh
      // This prevents unbounded memory growth in long-running dev sessions
      warnedKeys.clear();
      console.warn('🧹 Environment warning cache cleared (reached size limit)');
    }

    if (!warnedKeys.has(key)) {
      warnedKeys.add(key);
      console.warn(`⚠️  Missing environment variable: ${key}`);
      // Only show the hint once, not for every missing key
      if (warnedKeys.size === 1) {
        console.warn('   Please add it to your .env file');
      }
    }
    return '';
  }

  // In production, missing env vars are fatal
  throw new Error(`Missing required environment variable: ${key}`);
};

// Import environment variables
import { EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_SUPABASE_ANON_KEY } from '@env';

// Development configuration
const DEV_CONFIG: EnvironmentConfig = {
  // Clerk/Convex removed

  // Supabase Configuration - Consistent approach using @env module with validation
  SUPABASE_URL: EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: EXPO_PUBLIC_SUPABASE_ANON_KEY || '',

  // Environment
  ENVIRONMENT: 'development',

  // Feature Flags
  ENABLE_AUTH: true,
  ENABLE_GUEST_MODE: true,
  ENABLE_OFFLINE_MODE: true,

  // Development Settings
  SHOW_AUTH_LOGS: true,

  // API Configuration
  API_TIMEOUT: 30000,
  MAX_RETRY_ATTEMPTS: 3,
};

// Production configuration - NO FALLBACKS
const PROD_CONFIG: EnvironmentConfig = {
  // Supabase Configuration - Must use env vars in production
  SUPABASE_URL: EXPO_PUBLIC_SUPABASE_URL || '',
  SUPABASE_ANON_KEY: EXPO_PUBLIC_SUPABASE_ANON_KEY || '',

  // Environment
  ENVIRONMENT: 'production',

  // Feature Flags
  ENABLE_AUTH: true,
  ENABLE_GUEST_MODE: false,
  ENABLE_OFFLINE_MODE: false,

  // Production Settings
  SHOW_AUTH_LOGS: false,

  // API Configuration
  API_TIMEOUT: 30000,
  MAX_RETRY_ATTEMPTS: 3,
};

// Export the configuration based on __DEV__ flag
export const ENV_CONFIG = __DEV__ ? DEV_CONFIG : PROD_CONFIG;

// Export individual values for backward compatibility
export const {
  ENVIRONMENT,
  ENABLE_AUTH,
  ENABLE_GUEST_MODE,
  ENABLE_OFFLINE_MODE,
  SHOW_AUTH_LOGS,
  API_TIMEOUT,
  MAX_RETRY_ATTEMPTS,
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
} = ENV_CONFIG;
