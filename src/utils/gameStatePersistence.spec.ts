import { describe, it, expect, vi, beforeEach } from 'vitest';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  saveGameState,
  loadGameState,
  clearGameState,
  hasSavedGame,
} from './gameStatePersistence';
import type { GameState, PlayerId, TeamId, CardId } from '../types/game.types';

// Mock AsyncStorage
vi.mock('@react-native-async-storage/async-storage', () => ({
  default: {
    setItem: vi.fn(),
    getItem: vi.fn(),
    multiRemove: vi.fn(),
  },
}));

describe('gameStatePersistence', () => {
  const mockGameState: GameState = {
    id: 'game123' as any,
    phase: 'playing',
    players: [
      {
        id: 'player1' as PlayerId,
        name: 'Player 1',
        avatar: 'avatar1',
        ranking: 1000,
        teamId: 'team1' as TeamId,
        isBot: false,
      },
    ],
    teams: [
      {
        id: 'team1' as TeamId,
        playerIds: ['player1' as PlayerId, 'player2' as PlayerId],
        score: 50,
        cardPoints: 20,
        cantes: [],
      },
      {
        id: 'team2' as TeamId,
        playerIds: ['player3' as PlayerId, 'player4' as PlayerId],
        score: 40,
        cardPoints: 15,
        cantes: [],
      },
    ],
    deck: [],
    hands: new Map([
      [
        'player1' as PlayerId,
        [
          {
            id: 'card1' as CardId,
            suit: 'oros',
            value: 1,
          },
        ],
      ],
    ]),
    trumpSuit: 'oros',
    trumpCard: {
      id: 'trump' as CardId,
      suit: 'oros',
      value: 7,
    },
    currentTrick: [],
    currentPlayerIndex: 0,
    dealerIndex: 0,
    trickCount: 5,
    trickWins: new Map([
      ['team1' as TeamId, 3],
      ['team2' as TeamId, 2],
    ]),
    canCambiar7: true,
    gameHistory: [],
    isVueltas: false,
    canDeclareVictory: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('saveGameState', () => {
    it('should save game state to AsyncStorage', async () => {
      await saveGameState(mockGameState);

      expect(AsyncStorage.setItem).toHaveBeenCalledTimes(2);
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@guinote/current_game_state',
        expect.any(String),
      );
      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        '@guinote/has_saved_game',
        'true',
      );

      // Verify the serialized state
      const serializedCall = (AsyncStorage.setItem as any).mock.calls[0][1];
      const parsed = JSON.parse(serializedCall);
      expect(parsed.hands).toEqual({ player1: expect.any(Array) });
      expect(parsed.trickWins).toEqual({ team1: 3, team2: 2 });
    });

    it('should handle save errors gracefully', async () => {
      (AsyncStorage.setItem as any).mockRejectedValueOnce(
        new Error('Storage error'),
      );
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await saveGameState(mockGameState);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save game state:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('loadGameState', () => {
    it('should return null if no saved game exists', async () => {
      (AsyncStorage.getItem as any).mockResolvedValueOnce(null);

      const result = await loadGameState();

      expect(result).toBeNull();
    });

    it('should load and deserialize game state', async () => {
      const serializedState = {
        ...mockGameState,
        hands: { player1: [{ id: 'card1', suit: 'oros', value: 1 }] },
        trickWins: { team1: 3, team2: 2 },
      };

      (AsyncStorage.getItem as any)
        .mockResolvedValueOnce('true')
        .mockResolvedValueOnce(JSON.stringify(serializedState));

      const result = await loadGameState();

      expect(result).not.toBeNull();
      expect(result?.hands).toBeInstanceOf(Map);
      expect(result?.hands.get('player1' as PlayerId)).toHaveLength(1);
      expect(result?.trickWins).toBeInstanceOf(Map);
      expect(result?.trickWins.get('team1' as TeamId)).toBe(3);
    });

    it('should handle load errors gracefully', async () => {
      (AsyncStorage.getItem as any).mockRejectedValueOnce(
        new Error('Storage error'),
      );
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = await loadGameState();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to load game state:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('clearGameState', () => {
    it('should remove game state keys from storage', async () => {
      await clearGameState();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        '@guinote/current_game_state',
        '@guinote/has_saved_game',
      ]);
    });

    it('should handle clear errors gracefully', async () => {
      (AsyncStorage.multiRemove as any).mockRejectedValueOnce(
        new Error('Storage error'),
      );
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      await clearGameState();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to clear game state:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });

  describe('hasSavedGame', () => {
    it('should return true if saved game exists', async () => {
      (AsyncStorage.getItem as any).mockResolvedValueOnce('true');

      const result = await hasSavedGame();

      expect(result).toBe(true);
    });

    it('should return false if no saved game exists', async () => {
      (AsyncStorage.getItem as any).mockResolvedValueOnce(null);

      const result = await hasSavedGame();

      expect(result).toBe(false);
    });

    it('should handle check errors gracefully', async () => {
      (AsyncStorage.getItem as any).mockRejectedValueOnce(
        new Error('Storage error'),
      );
      const consoleSpy = vi
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      const result = await hasSavedGame();

      expect(result).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to check saved game:',
        expect.any(Error),
      );
      consoleSpy.mockRestore();
    });
  });
});
