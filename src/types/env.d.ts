declare module '@env' {
  export const EXPO_PUBLIC_ENVIRONMENT: 'development' | 'production' | 'test';
  export const EXPO_PUBLIC_ENABLE_AUTH: string;
  export const EXPO_PUBLIC_ENABLE_GUEST_MODE: string;
  export const EXPO_PUBLIC_ENABLE_OFFLINE_MODE: string;
  export const EXPO_PUBLIC_SHOW_AUTH_LOGS: string;
  export const EXPO_PUBLIC_API_TIMEOUT: string;
  export const EXPO_PUBLIC_MAX_RETRY_ATTEMPTS: string;
  export const EXPO_PUBLIC_SUPABASE_URL: string;
  export const EXPO_PUBLIC_SUPABASE_ANON_KEY: string;
}
