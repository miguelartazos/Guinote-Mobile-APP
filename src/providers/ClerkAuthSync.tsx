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

    async function syncAuth() {
      try {
        if (isSignedIn && user) {
          if (APP_CONFIG.SHOW_AUTH_LOGS) {
            console.log(
              '[ClerkAuthSync] User signed in, syncing with Convex...',
            );
          }

          // Get token for Convex
          const token = await getToken({ template: 'convex' });

          if (token) {
            // Set auth on Convex client
            convexClient.setAuth(token);
            setIsAuthSynced(true);
            setAuthError(null);

            if (APP_CONFIG.SHOW_AUTH_LOGS) {
              console.log('[ClerkAuthSync] Auth synced successfully');
            }
          } else {
            // Try without template if that fails
            const basicToken = await getToken();
            if (basicToken) {
              convexClient.setAuth(basicToken);
              setIsAuthSynced(true);
              setAuthError(null);

              if (APP_CONFIG.SHOW_AUTH_LOGS) {
                console.log('[ClerkAuthSync] Auth synced with basic token');
              }
            } else {
              throw new Error('Unable to get auth token from Clerk');
            }
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
      } catch (error) {
        console.error('[ClerkAuthSync] Auth sync error:', error);
        setAuthError(
          error instanceof Error ? error.message : 'Auth sync failed',
        );

        // Clear auth on error
        convexClient.clearAuth();
        setIsAuthSynced(false);
      }
    }

    syncAuth();

    // Set up interval to refresh token
    const interval = setInterval(() => {
      if (isSignedIn) {
        syncAuth();
      }
    }, 50 * 60 * 1000); // Refresh every 50 minutes

    return () => clearInterval(interval);
  }, [isLoaded, isSignedIn, user, getToken, convexClient]);

  // Log auth state in development
  if (APP_CONFIG.SHOW_AUTH_LOGS) {
    useEffect(() => {
      console.log('[ClerkAuthSync] State:', {
        isLoaded,
        isSignedIn,
        isAuthSynced,
        hasUser: !!user,
        authError,
      });
    }, [isLoaded, isSignedIn, isAuthSynced, user, authError]);
  }

  return <>{children}</>;
}
