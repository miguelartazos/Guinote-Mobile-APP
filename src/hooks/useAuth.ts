/**
 * Authentication hook that works offline-first
 * Returns mock user for offline play
 * Can be extended for real auth when online is implemented
 */

import { APP_CONFIG } from '../config/appConfig';

export interface AuthUser {
  _id: string;
  username: string;
  email?: string;
  clerkId?: string;
}

export interface AuthState {
  // User data
  user: AuthUser | null;
  
  // Loading states  
  isLoading: boolean;
  isLoaded: boolean;
  
  // Auth states
  isAuthenticated: boolean;
  isSignedIn: boolean;
  
  // Actions
  signIn: () => void;
  signUp: () => void;
  signOut: () => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

/**
 * Unified authentication hook - works offline by default
 */
export function useAuth(): AuthState {
  // For now, always return a mock user for offline play
  // This makes the app work without any authentication setup
  
  const mockUser: AuthUser = {
    _id: 'local-player-1',
    username: 'Jugador',
    email: undefined,
  };
  
  return {
    user: mockUser,
    isLoading: false,
    isLoaded: true,
    isAuthenticated: true, // Always "authenticated" for offline play
    isSignedIn: true,
    signIn: () => {
      console.log('Sign in not needed for offline play');
    },
    signUp: () => {
      console.log('Sign up not needed for offline play');
    },
    signOut: async () => {
      console.log('Sign out not needed for offline play');
    },
    error: null,
    clearError: () => {},
  };
}