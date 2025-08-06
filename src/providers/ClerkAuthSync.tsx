import React, { useEffect, useState } from 'react';
import { useAuth as useClerkAuth, useUser } from '@clerk/clerk-expo';
import { ConvexReactClient } from 'convex/react';
import { APP_CONFIG } from '../config/appConfig';

interface ClerkAuthSyncProps {
  children: React.ReactNode;
  convexClient: ConvexReactClient;
}

export function ClerkAuthSync({ children, convexClient }: ClerkAuthSyncProps) {
  const { isLoaded, isSignedIn, getToken } = useClerkAuth();
  const { user } = useUser();
  const [isAuthSynced, setIsAuthSynced] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) {
      if (APP_CONFIG.SHOW_AUTH_LOGS) {
        console.log('[ClerkAuthSync] Waiting for Clerk to load...');
      }
      return;
    }

    if (isSignedIn && user) {
      if (APP_CONFIG.SHOW_AUTH_LOGS) {
        console.log('[ClerkAuthSync] User signed in, syncing with Convex...');
      }

      // Create async function to fetch token
      // This function will be called by Convex whenever it needs a fresh token
      const fetchToken = async () => {
        try {
          // Try to get token with convex template first
          const token = await getToken({ template: 'convex' });
          if (token) {
            if (APP_CONFIG.SHOW_AUTH_LOGS) {
              console.log('[ClerkAuthSync] Fetched token with convex template');
            }
            return token;
          }

          // Fallback to basic token
          const basicToken = await getToken();
          if (basicToken) {
            if (APP_CONFIG.SHOW_AUTH_LOGS) {
              console.log('[ClerkAuthSync] Fetched basic token');
            }
            return basicToken;
          }

          // No token available
          if (APP_CONFIG.SHOW_AUTH_LOGS) {
            console.log('[ClerkAuthSync] No token available');
          }
          return null;
        } catch (error) {
          console.error('[ClerkAuthSync] Error fetching token:', error);
          setAuthError(
            error instanceof Error
              ? error.message
              : 'Failed to fetch auth token',
          );
          return null;
        }
      };

      try {
        // Set auth with async function
        convexClient.setAuth(fetchToken);
        setIsAuthSynced(true);
        setAuthError(null);

        if (APP_CONFIG.SHOW_AUTH_LOGS) {
          console.log('[ClerkAuthSync] Auth function set successfully');
        }
      } catch (error) {
        console.error('[ClerkAuthSync] Error setting auth:', error);
        setAuthError(
          error instanceof Error ? error.message : 'Failed to set auth',
        );
        setIsAuthSynced(false);
      }
    } else {
      // User not signed in, clear Convex auth
      if (APP_CONFIG.SHOW_AUTH_LOGS) {
        console.log('[ClerkAuthSync] User not signed in, clearing auth');
      }

      convexClient.clearAuth();
      setIsAuthSynced(false);
      setAuthError(null);
    }

    // No need for manual token refresh interval - Convex will call fetchToken as needed
  }, [isLoaded, isSignedIn, user, getToken, convexClient]);

  // Log auth state in development
  useEffect(() => {
    if (APP_CONFIG.SHOW_AUTH_LOGS) {
      console.log('[ClerkAuthSync] State:', {
        isLoaded,
        isSignedIn,
        isAuthSynced,
        hasUser: !!user,
        authError,
      });
    }
  }, [isLoaded, isSignedIn, isAuthSynced, user, authError]);

  return <>{children}</>;
}
