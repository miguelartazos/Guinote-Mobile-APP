import { useAuth, useUser, useClerk } from '@clerk/clerk-expo';
import type { UserResource } from '@clerk/clerk-expo';
import { APP_CONFIG } from '../config/appConfig';

export interface ClerkDiagnosticInfo {
  instance: {
    publishableKey: string;
    keyType: 'development' | 'production' | 'unknown';
    domain: string;
  };
  auth: {
    isLoaded: boolean;
    isSignedIn: boolean;
    userId: string | null;
    sessionId: string | null;
  };
  user: {
    id: string | null;
    email: string | null;
    emailVerified: boolean;
    username: string | null;
    createdAt: Date | null;
  };
  errors: string[];
}

export function getClerkDiagnostics(
  auth: {
    isLoaded: boolean;
    isSignedIn: boolean | null | undefined;
    userId: string | null;
    sessionId: string | null;
  },
  user: UserResource | null | undefined,
  clerk: ReturnType<typeof useClerk>,
): ClerkDiagnosticInfo {
  const publishableKey = APP_CONFIG.CLERK_PUBLISHABLE_KEY;
  const keyType = publishableKey.startsWith('pk_test_')
    ? 'development'
    : publishableKey.startsWith('pk_live_')
    ? 'production'
    : 'unknown';

  // Extract domain from publishable key (base64 decoded)
  let domain = 'unknown';
  try {
    const keyPart = publishableKey.split('_').pop()?.replace('$', '') || '';
    domain = atob(keyPart);
  } catch (e) {
    console.error('[ClerkDiagnostics] Failed to decode domain:', e);
  }

  const errors: string[] = [];

  if (!publishableKey) {
    errors.push('No publishable key configured');
  }

  if (!auth.isLoaded) {
    errors.push('Clerk not loaded');
  }

  if (user && !user.emailAddresses?.[0]?.verification?.status) {
    errors.push('User email not verified');
  }

  return {
    instance: {
      publishableKey: publishableKey
        ? `${publishableKey.substring(0, 20)}...`
        : 'none',
      keyType,
      domain,
    },
    auth: {
      isLoaded: auth.isLoaded,
      isSignedIn: auth.isSignedIn || false,
      userId: auth.userId,
      sessionId: auth.sessionId,
    },
    user: {
      id: user?.id || null,
      email: user?.emailAddresses?.[0]?.emailAddress || null,
      emailVerified:
        user?.emailAddresses?.[0]?.verification?.status === 'verified',
      username: user?.username || null,
      createdAt: user?.createdAt || null,
    },
    errors,
  };
}

export function logClerkState(
  context: string,
  diagnostics: ClerkDiagnosticInfo,
) {
  console.log(`[ClerkDiagnostics] ${context}:`, {
    timestamp: new Date().toISOString(),
    ...diagnostics,
  });
}

export function useClerkDiagnostics(): ClerkDiagnosticInfo {
  const auth = useAuth();
  const { user } = useUser();
  const clerk = useClerk();

  return getClerkDiagnostics(auth, user, clerk);
}

export async function checkUserExists(email: string): Promise<boolean> {
  try {
    // This is a client-side check only
    // In a real app, you'd have a server endpoint to check this
    console.log('[ClerkDiagnostics] Checking if user exists:', email);
    return false; // Placeholder
  } catch (error) {
    console.error('[ClerkDiagnostics] Error checking user:', error);
    return false;
  }
}
