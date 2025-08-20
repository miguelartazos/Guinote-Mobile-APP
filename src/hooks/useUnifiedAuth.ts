import { useAuth } from './useAuth';

interface UnifiedAuthReturn {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
}

export function useUnifiedAuth(): UnifiedAuthReturn {
  const offline = useAuth();

  return {
    user: offline.user,
    isLoading: offline.isLoading,
    isAuthenticated: offline.isAuthenticated,
    signIn: async () => {
      // No-op in offline mode
      return;
    },
    signUp: async () => {
      // No-op in offline mode
      return;
    },
    signOut: async () => {
      // No-op in offline mode
      return;
    },
  };
}
