import {
  EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY,
  EXPO_PUBLIC_CONVEX_URL,
  EXPO_PUBLIC_ENVIRONMENT,
  EXPO_PUBLIC_ENABLE_AUTH,
  EXPO_PUBLIC_ENABLE_GUEST_MODE,
  EXPO_PUBLIC_ENABLE_OFFLINE_MODE,
  EXPO_PUBLIC_SHOW_AUTH_LOGS,
  EXPO_PUBLIC_API_TIMEOUT,
  EXPO_PUBLIC_MAX_RETRY_ATTEMPTS,
} from '@env';

// Configuration that combines environment variables with defaults
export const APP_CONFIG = {
  // Clerk Configuration
  // NOTE: This is a TEST key. In test mode, emails must use format: your_email+clerk_test@example.com
  CLERK_PUBLISHABLE_KEY:
    EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ||
    'pk_test_dXNlZnVsLW1vc3F1aXRvLTMzLmNsZXJrLmFjY291bnRzLmRldiQ',

  // Convex Configuration
  CONVEX_URL:
    EXPO_PUBLIC_CONVEX_URL || 'https://industrious-civet-236.convex.cloud',

  // Feature Flags
  ENABLE_AUTH: EXPO_PUBLIC_ENABLE_AUTH === 'true',
  ENABLE_GUEST_MODE: EXPO_PUBLIC_ENABLE_GUEST_MODE === 'true',
  ENABLE_OFFLINE_MODE: EXPO_PUBLIC_ENABLE_OFFLINE_MODE === 'true',

  // Development Settings
  IS_DEVELOPMENT: EXPO_PUBLIC_ENVIRONMENT !== 'production',
  SHOW_AUTH_LOGS:
    EXPO_PUBLIC_SHOW_AUTH_LOGS === 'true' ||
    EXPO_PUBLIC_ENVIRONMENT === 'development',

  // API Configuration
  API_TIMEOUT: parseInt(EXPO_PUBLIC_API_TIMEOUT || '30000', 10),
  MAX_RETRY_ATTEMPTS: parseInt(EXPO_PUBLIC_MAX_RETRY_ATTEMPTS || '3', 10),

  // Environment
  ENVIRONMENT: EXPO_PUBLIC_ENVIRONMENT || 'development',
} as const;

// Validate critical configuration
if (!APP_CONFIG.CLERK_PUBLISHABLE_KEY && APP_CONFIG.ENABLE_AUTH) {
  console.error('[Config] Missing Clerk publishable key!');
}

if (!APP_CONFIG.CONVEX_URL) {
  console.error('[Config] Missing Convex URL!');
}
