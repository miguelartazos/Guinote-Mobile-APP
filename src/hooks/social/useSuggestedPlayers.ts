import { useCallback, useEffect, useState } from 'react';
import { useFeatureFlag } from '../../config/featureFlags';
import { createRealtimeClient } from '../../services/realtimeClient.native';

export type SuggestedPlayer = {
  id: string;
  username: string;
  displayName?: string | null;
  avatarUrl?: string | null;
  reason?: string | null;
  score?: number | null;
};

export function useSuggestedPlayers() {
  const enableMultiplayer = useFeatureFlag('enableMultiplayer');
  const useSupabaseFriends = useFeatureFlag('useSupabaseFriends');
  const [suggested, setSuggested] = useState<SuggestedPlayer[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!enableMultiplayer || !useSupabaseFriends) {
      setSuggested([]);
      return [] as SuggestedPlayer[];
    }

    setLoading(true);
    try {
      const client = await createRealtimeClient();
      if (!client) return [] as SuggestedPlayer[];

      // Try RPC first
      const rpc = await (client as any).rpc('get_suggested_players');
      if (!rpc.error && Array.isArray(rpc.data)) {
        const mapped = rpc.data.map((r: any) => ({
          id: r.suggested_id as string,
          username: r.username as string,
          displayName: r.display_name as string | null,
          avatarUrl: r.avatar_url as string | null,
          reason: r.reason as string | null,
          score: r.score as number | null,
        }));
        setSuggested(mapped);
        return mapped;
      }

      // Fallback: basic heuristic - top users by elo not already friends
      const { data, error } = await client
        .from('users')
        .select('id, username, display_name, avatar_url, elo')
        .order('elo', { ascending: false })
        .limit(10);
      if (!error && Array.isArray(data)) {
        const mapped = data.map((u: any) => ({
          id: u.id as string,
          username: u.username as string,
          displayName: u.display_name as string | null,
          avatarUrl: u.avatar_url as string | null,
          reason: 'Jugadores destacados',
          score: u.elo as number | null,
        }));
        setSuggested(mapped);
        return mapped;
      }

      setSuggested([]);
      return [] as SuggestedPlayer[];
    } catch (err) {
      if (__DEV__) console.warn('[useSuggestedPlayers] failed', err);
      setSuggested([]);
      return [] as SuggestedPlayer[];
    } finally {
      setLoading(false);
    }
  }, [enableMultiplayer, useSupabaseFriends]);

  useEffect(() => {
    load();
  }, [load]);

  return { suggested, loading, reload: load };
}


