import { useEffect, useMemo, useState } from 'react';
import { useAuth } from './useAuth';
import { useFeatureFlag } from '../config/featureFlags';

interface UnifiedAuthReturn {
  user: any;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, username: string) => Promise<void>;
  signOut: () => Promise<void>;
}

/**
 * Unified auth hook
 * - Uses Supabase auth when feature flag `useSupabaseAuth` is true
 * - Falls back to offline auth otherwise
 * - Lazy-imports Supabase client to preserve Hermes startup safety
 */
export function useUnifiedAuth(): UnifiedAuthReturn {
  const useSupabaseAuth = useFeatureFlag('useSupabaseAuth');
  const offline = useAuth();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [initialized, setInitialized] = useState<boolean>(false);

  useEffect(() => {
    let canceled = false;

    async function init() {
      if (!useSupabaseAuth) {
        // Initialize in offline mode
        setUser(offline.user);
        setInitialized(true);
        return;
      }

      try {
        const { getSupabaseClient } = await import('../lib/supabase');
        const supabase = await getSupabaseClient();
        const { data, error } = await supabase.auth.getUser();
        if (!canceled) {
          if (error) {
            setUser(null);
          } else {
            const u = data.user;
            setUser(
              u
                ? {
                    id: u.id,
                    email: u.email,
                    username:
                      (u.user_metadata && (u.user_metadata as any).username) ||
                      (u.email ? u.email.split('@')[0] : 'Jugador'),
                  }
                : null,
            );
          }
        }
      } catch (e) {
        if (!canceled) setUser(null);
      } finally {
        if (!canceled) setInitialized(true);
      }
    }

    init();
    return () => {
      canceled = true;
    };
  }, [useSupabaseAuth, offline.user]);

  const api = useMemo<UnifiedAuthReturn>(() => {
    if (!useSupabaseAuth) {
      // Pure offline passthrough
      return {
        user: offline.user,
        isLoading: offline.isLoading,
        isAuthenticated: offline.isAuthenticated,
        signIn: async () => {},
        signUp: async () => {},
        signOut: async () => {},
      };
    }

    // Supabase-backed auth
    return {
      user,
      isLoading: !initialized || loading,
      isAuthenticated: !!user,
      signIn: async (email: string, password: string) => {
        setLoading(true);
        try {
          const { getSupabaseClient } = await import('../lib/supabase');
          const supabase = await getSupabaseClient();
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (error) throw error;
          const u = data.user;
          setUser(
            u
              ? {
                  id: u.id,
                  email: u.email,
                  username:
                    (u.user_metadata && (u.user_metadata as any).username) ||
                    (u.email ? u.email.split('@')[0] : 'Jugador'),
                }
              : null,
          );
        } finally {
          setLoading(false);
        }
      },
      signUp: async (email: string, password: string, username: string) => {
        setLoading(true);
        try {
          const { getSupabaseClient } = await import('../lib/supabase');
          const supabase = await getSupabaseClient();
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { username } },
          });
          if (error) throw error;
          const u = data.user;
          setUser(
            u
              ? {
                  id: u.id,
                  email: u.email,
                  username,
                }
              : null,
          );
        } finally {
          setLoading(false);
        }
      },
      signOut: async () => {
        setLoading(true);
        try {
          const { getSupabaseClient } = await import('../lib/supabase');
          const supabase = await getSupabaseClient();
          await supabase.auth.signOut();
          setUser(null);
        } finally {
          setLoading(false);
        }
      },
    };
  }, [useSupabaseAuth, offline.user, offline.isLoading, offline.isAuthenticated, initialized, loading, user]);

  return api;
}
