import AsyncStorage from '@react-native-async-storage/async-storage';
import type { DifficultyLevel } from '../types/game.types';

const STATS_KEY = '@guinote2_statistics';

export type GameStatistics = {
  gamesPlayed: number;
  gamesWon: number;
  gamesLost: number;
  bestScore: number;
  totalPoints: number;
  favoritePartner: {
    name: string;
    gamesPlayed: number;
  } | null;
  difficultyStats: {
    easy: { played: number; won: number };
    medium: { played: number; won: number };
    hard: { played: number; won: number };
  };
  lastPlayed: string; // ISO date
  longestWinStreak: number;
  currentWinStreak: number;
  // Online stats
  elo: number;
  onlineGamesPlayed: number;
  onlineWins: number;
  onlineLosses: number;
};

const DEFAULT_STATISTICS: GameStatistics = {
  gamesPlayed: 0,
  gamesWon: 0,
  gamesLost: 0,
  bestScore: 0,
  totalPoints: 0,
  favoritePartner: null,
  difficultyStats: {
    easy: { played: 0, won: 0 },
    medium: { played: 0, won: 0 },
    hard: { played: 0, won: 0 },
  },
  lastPlayed: new Date().toISOString(),
  longestWinStreak: 0,
  currentWinStreak: 0,
  // Online stats
  elo: 1000,
  onlineGamesPlayed: 0,
  onlineWins: 0,
  onlineLosses: 0,
};

export async function loadStatistics(): Promise<GameStatistics> {
  try {
    const storedStats = await AsyncStorage.getItem(STATS_KEY);
    if (storedStats) {
      return { ...DEFAULT_STATISTICS, ...JSON.parse(storedStats) };
    }
  } catch (error) {
    console.error('Error loading statistics:', error);
    throw new Error('Failed to load statistics');
  }
  return DEFAULT_STATISTICS;
}

export async function saveStatistics(stats: GameStatistics): Promise<void> {
  try {
    await AsyncStorage.setItem(STATS_KEY, JSON.stringify(stats));
  } catch (error) {
    console.error('Error saving statistics:', error);
    throw new Error('Failed to save statistics');
  }
}

function updateBasicStats(stats: GameStatistics, won: boolean): void {
  stats.gamesPlayed++;
  if (won) {
    stats.gamesWon++;
    stats.currentWinStreak++;
    stats.longestWinStreak = Math.max(
      stats.longestWinStreak,
      stats.currentWinStreak,
    );
  } else {
    stats.gamesLost++;
    stats.currentWinStreak = 0;
  }
}

function updateScoreStats(stats: GameStatistics, score: number): void {
  stats.totalPoints += score;
  if (score > stats.bestScore) {
    stats.bestScore = score;
  }
}

function updateDifficultyStats(
  stats: GameStatistics,
  difficulty: DifficultyLevel,
  won: boolean,
): void {
  stats.difficultyStats[difficulty].played++;
  if (won) {
    stats.difficultyStats[difficulty].won++;
  }
}

function updateFavoritePartner(
  stats: GameStatistics,
  partnerName: string,
): void {
  if (!stats.favoritePartner || partnerName === stats.favoritePartner.name) {
    stats.favoritePartner = {
      name: partnerName,
      gamesPlayed: (stats.favoritePartner?.gamesPlayed || 0) + 1,
    };
  }
}

export async function recordGameResult(
  won: boolean,
  score: number,
  partnerName: string,
  difficulty: DifficultyLevel,
): Promise<void> {
  const stats = await loadStatistics();

  updateBasicStats(stats, won);
  updateScoreStats(stats, score);
  updateDifficultyStats(stats, difficulty, won);
  updateFavoritePartner(stats, partnerName);

  stats.lastPlayed = new Date().toISOString();

  await saveStatistics(stats);
}

export async function resetStatistics(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STATS_KEY);
  } catch (error) {
    console.error('Error resetting statistics:', error);
    throw new Error('Failed to reset statistics');
  }
}

export function calculateWinRate(stats: GameStatistics): number {
  if (stats.gamesPlayed === 0) return 0;
  return Math.round((stats.gamesWon / stats.gamesPlayed) * 100);
}

export function calculateAverageScore(stats: GameStatistics): number {
  if (stats.gamesPlayed === 0) return 0;
  return Math.round(stats.totalPoints / stats.gamesPlayed);
}
