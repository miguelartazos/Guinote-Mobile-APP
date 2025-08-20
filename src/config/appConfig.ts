import {
  ENVIRONMENT,
  ENABLE_AUTH,
  ENABLE_GUEST_MODE,
  ENABLE_OFFLINE_MODE,
  SHOW_AUTH_LOGS,
  API_TIMEOUT,
  MAX_RETRY_ATTEMPTS,
} from './envConfig';

// Configuration that combines environment variables with defaults
export const APP_CONFIG = {
  // Feature Flags
  ENABLE_AUTH: ENABLE_AUTH,
  ENABLE_GUEST_MODE: ENABLE_GUEST_MODE,
  ENABLE_OFFLINE_MODE: ENABLE_OFFLINE_MODE,

  // Development Settings
  IS_DEVELOPMENT: ENVIRONMENT !== 'production',
  SHOW_AUTH_LOGS: SHOW_AUTH_LOGS || ENVIRONMENT === 'development',

  // API Configuration
  API_TIMEOUT: API_TIMEOUT,
  MAX_RETRY_ATTEMPTS: MAX_RETRY_ATTEMPTS,

  // Environment
  ENVIRONMENT: ENVIRONMENT || 'development',
} as const;

// Validate critical configuration (none required for offline)
