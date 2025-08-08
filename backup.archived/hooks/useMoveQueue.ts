import { useState, useCallback, useRef } from 'react';
import type { GameMove } from '../types/gameMove.types';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MOVE_QUEUE_KEY = 'guinate_move_queue';

interface QueuedMove extends GameMove {
  id: string;
  retryCount: number;
}

export function useMoveQueue() {
  const [queue, setQueue] = useState<QueuedMove[]>([]);
  const isProcessing = useRef(false);

  // Load queue from storage on mount
  const loadQueue = useCallback(async () => {
    try {
      const stored = await AsyncStorage.getItem(MOVE_QUEUE_KEY);
      if (stored) {
        setQueue(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading move queue:', error);
    }
  }, []);

  // Save queue to storage
  const saveQueue = useCallback(async (newQueue: QueuedMove[]) => {
    try {
      await AsyncStorage.setItem(MOVE_QUEUE_KEY, JSON.stringify(newQueue));
    } catch (error) {
      console.error('Error saving move queue:', error);
    }
  }, []);

  // Add move to queue
  const queueMove = useCallback(
    (move: GameMove) => {
      const queuedMove: QueuedMove = {
        ...move,
        id: `${move.playerId}_${move.timestamp}`,
        retryCount: 0,
      };

      setQueue(prev => {
        const newQueue = [...prev, queuedMove];
        saveQueue(newQueue);
        return newQueue;
      });
    },
    [saveQueue],
  );

  // Remove move from queue
  const dequeueMove = useCallback(
    (moveId: string) => {
      setQueue(prev => {
        const newQueue = prev.filter(m => m.id !== moveId);
        saveQueue(newQueue);
        return newQueue;
      });
    },
    [saveQueue],
  );

  // Process queue
  const processQueue = useCallback(
    async (sendMove: (move: GameMove) => Promise<boolean>) => {
      if (isProcessing.current || queue.length === 0) return;

      isProcessing.current = true;

      for (const queuedMove of queue) {
        try {
          const success = await sendMove(queuedMove);

          if (success) {
            dequeueMove(queuedMove.id);
          } else {
            // Increment retry count
            setQueue(prev =>
              prev.map(m =>
                m.id === queuedMove.id
                  ? { ...m, retryCount: m.retryCount + 1 }
                  : m,
              ),
            );

            // Remove if too many retries
            if (queuedMove.retryCount >= 3) {
              dequeueMove(queuedMove.id);
              console.error('Move failed after 3 retries:', queuedMove);
            }
          }
        } catch (error) {
          console.error('Error processing queued move:', error);
        }
      }

      isProcessing.current = false;
    },
    [queue, dequeueMove],
  );

  // Clear queue
  const clearQueue = useCallback(() => {
    setQueue([]);
    AsyncStorage.removeItem(MOVE_QUEUE_KEY).catch(console.error);
  }, []);

  return {
    queue,
    queueMove,
    dequeueMove,
    processQueue,
    clearQueue,
    loadQueue,
  };
}
