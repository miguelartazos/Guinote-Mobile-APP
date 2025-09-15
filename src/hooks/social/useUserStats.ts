import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

type UserStats = {
  coins: number;
  gems: number;
};

const STORAGE_KEY = '@guinote/user_stats_v1';
const DEFAULT_STATS: UserStats = { coins: 500, gems: 0 };

export function useUserStats() {
  const [stats, setStats] = useState<UserStats>(DEFAULT_STATS);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then(json => (json ? JSON.parse(json) : DEFAULT_STATS))
      .then(setStats)
      .finally(() => setLoaded(true));
  }, []);

  const persist = useCallback(async (next: UserStats) => {
    setStats(next);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch (err) {
      // Non-fatal: keep in-memory state
      if (__DEV__) console.warn('[useUserStats] Failed to persist stats', err);
    }
  }, []);

  const addCoins = useCallback(async (amount: number) => {
    if (!amount) return;
    const next = { ...stats, coins: Math.max(0, stats.coins + amount) };
    await persist(next);
  }, [persist, stats]);

  const addGems = useCallback(async (amount: number) => {
    if (!amount) return;
    const next = { ...stats, gems: Math.max(0, stats.gems + amount) };
    await persist(next);
  }, [persist, stats]);

  const spendCoins = useCallback(async (amount: number) => {
    if (!amount) return false;
    if (stats.coins < amount) return false;
    const next = { ...stats, coins: stats.coins - amount };
    await persist(next);
    return true;
  }, [persist, stats]);

  const spendGems = useCallback(async (amount: number) => {
    if (!amount) return false;
    if (stats.gems < amount) return false;
    const next = { ...stats, gems: stats.gems - amount };
    await persist(next);
    return true;
  }, [persist, stats]);

  return {
    stats,
    loaded,
    addCoins,
    addGems,
    spendCoins,
    spendGems,
  };
}


