/**
 * Authentication hook that works offline-first
 * Returns mock user for offline play
 * Can be extended for real auth when online is implemented
 */

import { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../config/appConfig';

export interface AuthUser {
  _id: string;
  username: string;
  email?: string;
  clerkId?: string;
  isOffline?: boolean;
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
  updateUsername: (username: string) => Promise<void>;
  
  // Error handling
  error: string | null;
  clearError: () => void;
}

const OFFLINE_USER_KEY = '@guinote/offline_user';

/**
 * Unified authentication hook - works offline by default
 * Checks for game mode and conditionally loads online auth
 */
export function useAuth(): AuthState {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      // Check if we're in offline mode (no Convex/Clerk available)
      const isOfflineMode = !process.env.EXPO_PUBLIC_CONVEX_URL || 
                           !process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY;

      if (isOfflineMode) {
        // Load or create offline user
        const savedUser = await AsyncStorage.getItem(OFFLINE_USER_KEY);
        if (savedUser) {
          setUser(JSON.parse(savedUser));
        } else {
          const newUser: AuthUser = {
            _id: 'offline-' + Date.now(),
            username: 'Jugador',
            isOffline: true,
          };
          await AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(newUser));
          setUser(newUser);
        }
      } else {
        // TODO: Load online user from Clerk when online mode is ready
        // For now, still use offline user
        const offlineUser: AuthUser = {
          _id: 'temp-offline-1',
          username: 'Jugador',
          isOffline: true,
        };
        setUser(offlineUser);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      // Fallback to offline user
      setUser({
        _id: 'fallback-1',
        username: 'Jugador',
        isOffline: true,
      });
    } finally {
      setIsLoaded(true);
    }
  };

  const updateUsername = async (username: string) => {
    if (!user) return;
    
    const updatedUser = { ...user, username };
    setUser(updatedUser);
    
    try {
      await AsyncStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Error saving username:', error);
    }
  };
  
  return {
    user,
    isLoading: !isLoaded,
    isLoaded,
    isAuthenticated: !!user,
    isSignedIn: !!user,
    signIn: () => {
      console.log('Sign in not needed for offline play');
    },
    signUp: () => {
      console.log('Sign up not needed for offline play');
    },
    signOut: async () => {
      console.log('Sign out not needed for offline play');
    },
    updateUsername,
    error: null,
    clearError: () => {},
  };
}