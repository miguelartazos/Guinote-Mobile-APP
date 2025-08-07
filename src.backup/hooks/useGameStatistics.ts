import { useState, useEffect, useCallback } from 'react';
import type { GameStatistics } from '../utils/gameStatistics';
import {
  loadStatistics,
  recordGameResult,
  resetStatistics as resetStatsUtil,
  calculateWinRate,
  calculateAverageScore,
} from '../utils/gameStatistics';
import type { DifficultyLevel } from '../types/game.types';

export function useGameStatistics() {
  const [statistics, setStatistics] = useState<GameStatistics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStatistics()
      .then(setStatistics)
      .catch(err => {
        console.error('Failed to load statistics:', err);
        setError('Error al cargar estadísticas');
        // Return default statistics on error
        return loadStatistics().catch(() => null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const recordGame = useCallback(
    async (
      won: boolean,
      score: number,
      partnerName: string,
      difficulty: DifficultyLevel,
    ) => {
      try {
        await recordGameResult(won, score, partnerName, difficulty);
        const updatedStats = await loadStatistics();
        setStatistics(updatedStats);
        setError(null);
      } catch (err) {
        console.error('Failed to record game:', err);
        setError('Error al guardar resultado del juego');
        throw err;
      }
    },
    [],
  );

  const resetStatistics = useCallback(async () => {
    try {
      await resetStatsUtil();
      const defaultStats = await loadStatistics();
      setStatistics(defaultStats);
      setError(null);
    } catch (err) {
      console.error('Failed to reset statistics:', err);
      setError('Error al restablecer estadísticas');
      throw err;
    }
  }, []);

  const winRate = statistics ? calculateWinRate(statistics) : 0;
  const averageScore = statistics ? calculateAverageScore(statistics) : 0;

  return {
    statistics,
    isLoading,
    error,
    recordGame,
    resetStatistics,
    winRate,
    averageScore,
  };
}
