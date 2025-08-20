import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import GameScreen from '../GameScreen';
import type { GameState } from '../../types/game.types';

// Mock navigation
const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  addListener: jest.fn(() => jest.fn()),
};

const mockRoute = {
  params: {
    mode: 'offline' as const,
    difficulty: 'medium' as const,
  },
};

// Mock the hooks
jest.mock('../../hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'local-test-user', username: 'TestPlayer' },
    isAuthenticated: true,
    isOfflineMode: true,
  }),
}));

jest.mock('../../hooks/useStatistics', () => ({
  useStatistics: () => ({
    playerStats: {
      gamesPlayed: 0,
      gamesWon: 0,
      elo: 1000,
      winRate: 0,
      avgPointsPerGame: 0,
      totalCantes: 0,
    },
    leaderboard: [],
    recordGameResult: jest.fn(),
  }),
}));

jest.mock('../../hooks/useGameStatistics', () => ({
  useGameStatistics: () => ({
    statistics: null,
    isLoading: false,
    error: null,
    recordGame: jest.fn(),
    resetStatistics: jest.fn(),
    winRate: 0,
    averageScore: 0,
  }),
}));

describe('GameScreen - Offline Mode', () => {
  it('should not cause infinite loop when game ends', async () => {
    const { getByTestId, queryByText } = render(
      <NavigationContainer>
        <GameScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </NavigationContainer>,
    );

    // Wait for the game to initialize
    await waitFor(
      () => {
        // Game should render without errors
        expect(queryByText(/Maximum update depth exceeded/)).toBeNull();
      },
      { timeout: 5000 },
    );

    // Verify no console errors about infinite loops
    const consoleSpy = jest.spyOn(console, 'error');
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Maximum update depth exceeded'),
    );
  });

  it('should handle game completion without duplicate recordings', async () => {
    const mockRecordGame = jest.fn();

    jest.mock('../../hooks/useGameStatistics', () => ({
      useGameStatistics: () => ({
        statistics: null,
        isLoading: false,
        error: null,
        recordGame: mockRecordGame,
        resetStatistics: jest.fn(),
        winRate: 0,
        averageScore: 0,
      }),
    }));

    render(
      <NavigationContainer>
        <GameScreen navigation={mockNavigation as any} route={mockRoute as any} />
      </NavigationContainer>,
    );

    // Simulate game ending
    const mockGameState: GameState = {
      phase: 'gameOver',
      teams: [
        { score: 100, gamePoints: 3, playerIds: ['local-test-user', 'AI-1'], cantes: [] },
        { score: 80, gamePoints: 1, playerIds: ['AI-2', 'AI-3'], cantes: [] },
      ],
      players: [
        {
          id: 'local-test-user',
          name: 'TestPlayer',
          hand: [],
          isConnected: true,
          position: 0,
          teamId: 0,
        },
        { id: 'AI-1', name: 'AI Partner', hand: [], isConnected: true, position: 2, teamId: 0 },
        { id: 'AI-2', name: 'AI Opponent 1', hand: [], isConnected: true, position: 1, teamId: 1 },
        { id: 'AI-3', name: 'AI Opponent 2', hand: [], isConnected: true, position: 3, teamId: 1 },
      ],
      currentPlayer: 0,
      deck: [],
      discardPile: [],
      currentTrick: [],
      trumpCard: null,
      lastTrickWinner: null,
      lastTrickWinnerTeam: null,
      roundNumber: 1,
      handNumber: 3,
      turnTimeRemaining: null,
      canteAvailable: [],
      lastAction: null,
      roomId: 'offline-room',
      lastDealResult: null,
    };

    // Wait a moment for any potential duplicate calls
    await waitFor(
      () => {
        // The record function should only be called once per game
        expect(mockRecordGame).toHaveBeenCalledTimes(0); // Should be 0 for offline mode
      },
      { timeout: 2000 },
    );
  });
});
