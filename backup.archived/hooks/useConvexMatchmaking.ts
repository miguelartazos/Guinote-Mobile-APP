import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useNavigation } from '@react-navigation/native';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';
import type { JugarStackNavigationProp } from '../types/navigation';

interface MatchmakingStatus {
  status: 'idle' | 'searching' | 'found' | 'error';
  playersInQueue: number;
  waitTime: number;
  estimatedTime: number;
  eloRange: number;
}

export function useConvexMatchmaking() {
  const navigation = useNavigation<JugarStackNavigationProp>();
  const [status, setStatus] = useState<MatchmakingStatus>({
    status: 'idle',
    playersInQueue: 0,
    waitTime: 0,
    estimatedTime: 45,
    eloRange: 100,
  });
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);

  // Convex mutations
  const joinQueue = useMutation(api.matchmaking.joinQueue);
  const leaveQueue = useMutation(api.matchmaking.leaveQueue);

  // Query queue status
  const queueStatus = useQuery(
    api.matchmaking.getQueueStatus,
    status.status === 'searching' ? { gameMode: 'ranked' } : 'skip',
  );

  // Update status based on queue
  useEffect(() => {
    if (queueStatus && status.status === 'searching') {
      setStatus(prev => ({
        ...prev,
        playersInQueue: queueStatus.playersInQueue,
      }));
    }
  }, [queueStatus, status.status]);

  // Update wait time
  useEffect(() => {
    if (status.status === 'searching' && startTime) {
      const interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime) / 1000);
        setStatus(prev => ({
          ...prev,
          waitTime: elapsed,
          eloRange: Math.min(500, 100 + Math.floor(elapsed / 10) * 50),
        }));
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status.status, startTime]);

  const startMatchmaking = useCallback(
    async (userId: Id<'users'>, gameMode: 'ranked' | 'casual' = 'ranked') => {
      try {
        setError(null);
        setStatus(prev => ({ ...prev, status: 'searching' }));
        setStartTime(Date.now());

        await joinQueue({ userId, gameMode });

        // TODO: Subscribe to match results from Convex
        // For now, just show searching status
        // The actual room creation will be handled by the matchmaking system
      } catch (err) {
        console.error('Failed to start matchmaking:', err);
        setError('Error al buscar partida');
        setStatus(prev => ({ ...prev, status: 'error' }));
      }
    },
    [joinQueue, navigation],
  );

  const cancelMatchmaking = useCallback(
    async (userId: Id<'users'>) => {
      try {
        await leaveQueue({ userId });
        setStatus(prev => ({ ...prev, status: 'idle' }));
        setStartTime(null);
      } catch (err) {
        console.error('Failed to cancel matchmaking:', err);
      }
    },
    [leaveQueue],
  );

  return {
    status,
    error,
    startMatchmaking,
    cancelMatchmaking,
  };
}
