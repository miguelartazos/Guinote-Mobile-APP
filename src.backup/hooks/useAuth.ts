import { useEffect, useState } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import { useConvexAuth } from 'convex/react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { APP_CONFIG } from '../config/appConfig';

export interface AuthState {
  // User data
  user: any | null; // Convex user
  clerkUser: any | null; // Clerk user

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
 * Unified authentication hook that combines Clerk and Convex auth
 * This is the single source of truth for authentication in the app
 */
export function useAuth(): AuthState {
  const [error, setError] = useState<string | null>(null);

  // Clerk hooks
  const clerkAuth = useClerkAuth();
  const { user: clerkUser } = useUser();
  
  // Convex auth state
  const convexAuth = useConvexAuth();

  // Convex hooks
  const syncUser = useMutation(api.auth.syncUser);
  const convexUser = useQuery(
    api.auth.getUserByClerkId,
    clerkUser?.id ? { clerkId: clerkUser.id } : 'skip',
  );

  // Sync Clerk user to Convex when authenticated
  useEffect(() => {
    if (
      clerkAuth.isLoaded &&
      clerkAuth.isSignedIn &&
      clerkUser &&
      !convexUser
    ) {
      if (APP_CONFIG.SHOW_AUTH_LOGS) {
        console.log('[useAuth] Syncing user to Convex...');
      }

      syncUser({
        clerkId: clerkUser.id,
        username: clerkUser.username || clerkUser.firstName || 'Player',
        displayName: clerkUser.fullName || undefined,
        avatar: clerkUser.imageUrl || undefined,
      }).catch(err => {
        console.error('[useAuth] Failed to sync user:', err);
        setError('Failed to sync user data');
      });
    }
  }, [
    clerkAuth.isLoaded,
    clerkAuth.isSignedIn,
    clerkUser,
    convexUser,
    syncUser,
  ]);

  // Sign out function
  const signOut = async () => {
    try {
      setError(null);
      await clerkAuth.signOut();
    } catch (err) {
      console.error('[useAuth] Sign out error:', err);
      setError('Failed to sign out');
      throw err;
    }
  };

  // Navigation to auth screens
  const signIn = () => {
    // This will be handled by navigation
    // For now, just log
    console.log('[useAuth] Sign in requested');
  };

  const signUp = () => {
    // This will be handled by navigation
    // For now, just log
    console.log('[useAuth] Sign up requested');
  };

  const clearError = () => setError(null);

  // Determine auth state - use Convex auth state which already handles the sync
  const isAuthenticated = convexAuth.isAuthenticated && !!convexUser;
  const isLoading = convexAuth.isLoading || (convexAuth.isAuthenticated && !convexUser);

  // Log auth state in development
  if (APP_CONFIG.SHOW_AUTH_LOGS) {
    useEffect(() => {
      console.log('[useAuth] Auth state:', {
        isLoaded: clerkAuth.isLoaded,
        isSignedIn: clerkAuth.isSignedIn,
        hasClerkUser: !!clerkUser,
        hasConvexUser: !!convexUser,
        convexAuthState: convexAuth,
        isAuthenticated,
        isLoading,
      });
    }, [
      clerkAuth.isLoaded,
      clerkAuth.isSignedIn,
      clerkUser,
      convexUser,
      convexAuth,
      isAuthenticated,
      isLoading,
    ]);
  }

  return {
    // User data
    user: convexUser,
    clerkUser,

    // Loading states
    isLoading,
    isLoaded: !convexAuth.isLoading,

    // Auth states
    isAuthenticated,
    isSignedIn: convexAuth.isAuthenticated,

    // Actions
    signIn,
    signUp,
    signOut,

    // Error handling
    error,
    clearError,
  };
}
