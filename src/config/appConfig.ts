// Hardcoded configuration for React Native
// In production, use react-native-config or expo-constants
export const APP_CONFIG = {
  // Clerk Configuration
  // NOTE: This is a TEST key. In test mode, emails must use format: your_email+clerk_test@example.com
  CLERK_PUBLISHABLE_KEY:
    'pk_test_dXNlZnVsLW1vc3F1aXRvLTMzLmNsZXJrLmFjY291bnRzLmRldiQ',

  // Convex Configuration
  CONVEX_URL: 'https://industrious-civet-236.convex.cloud',

  // Feature Flags
  ENABLE_AUTH: true,
  ENABLE_GUEST_MODE: true,
  ENABLE_OFFLINE_MODE: true,

  // Development Settings
  IS_DEVELOPMENT: __DEV__,
  SHOW_AUTH_LOGS: __DEV__,

  // API Configuration
  API_TIMEOUT: 30000, // 30 seconds
  MAX_RETRY_ATTEMPTS: 3,
} as const;

// Validate critical configuration
if (!APP_CONFIG.CLERK_PUBLISHABLE_KEY && APP_CONFIG.ENABLE_AUTH) {
  console.error('[Config] Missing Clerk publishable key!');
}

if (!APP_CONFIG.CONVEX_URL) {
  console.error('[Config] Missing Convex URL!');
}
