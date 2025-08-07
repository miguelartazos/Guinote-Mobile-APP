/**
 * Optional authentication hook
 * Returns mock user for offline play, real auth when available
 */

import { APP_CONFIG } from '../config/appConfig';

export interface MockUser {
  _id: string;
  username: string;
  email?: string;
  isSignedIn: boolean;
}

export function useOptionalAuth() {
  // Always return a mock user for now since auth is not working
  // When auth is properly implemented, check APP_CONFIG.ENABLE_AUTH
  
  const mockUser: MockUser = {
    _id: 'local-player',
    username: 'Jugador',
    email: undefined,
    isSignedIn: false,
  };

  return {
    user: mockUser,
    isLoaded: true,
    isSignedIn: false,
    signIn: async () => {
      console.log('Sign in not implemented in offline mode');
      return false;
    },
    signOut: async () => {
      console.log('Sign out not implemented in offline mode');
      return false;
    },
  };
}

// Re-export as useAuth for compatibility
export const useAuth = useOptionalAuth;