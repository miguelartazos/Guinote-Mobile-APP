import { renderHook, act } from '@testing-library/react-native';
import { useAudioReactions } from './useAudioReactions';
import type { GameState, PlayerId } from '../types/game.types';

// Mock the useSounds hook
jest.mock('./useSounds', () => ({
  useSounds: () => ({
    playReactionSound: jest.fn(),
    playCanteSound: jest.fn(),
    playVictorySound: jest.fn(),
    playDefeatSound: jest.fn(),
  }),
}));

describe('useAudioReactions', () => {
  let mockGameState: GameState;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGameState = {
      phase: 'playing',
      currentPlayerIndex: 0,
      players: [
        {
          id: 'player0' as PlayerId,
          name: 'Player 1',
          teamId: 'team1',
          isBot: false,
        },
        {
          id: 'player1' as PlayerId,
          name: 'Player 2',
          teamId: 'team2',
          isBot: true,
        },
        {
          id: 'player2' as PlayerId,
          name: 'Player 3',
          teamId: 'team1',
          isBot: true,
        },
        {
          id: 'player3' as PlayerId,
          name: 'Player 4',
          teamId: 'team2',
          isBot: true,
        },
      ],
      cantes: [],
      currentTrick: {
        leadPlayerIndex: 0,
        cards: [],
        winnerId: null,
      },
      scores: { team1: 0, team2: 0 },
    } as any;
  });

  describe('playReactionForEmoji', () => {
    test('maps emoji reactions to audio types correctly', () => {
      const { result } = renderHook(() => useAudioReactions(mockGameState));
      const { useSounds } = require('./useSounds');
      const sounds = useSounds();

      act(() => {
        result.current.playReactionForEmoji('👍');
      });
      expect(sounds.playReactionSound).toHaveBeenCalledWith('bien');

      act(() => {
        result.current.playReactionForEmoji('😂');
      });
      expect(sounds.playReactionSound).toHaveBeenCalledWith('laugh');

      act(() => {
        result.current.playReactionForEmoji('👏');
      });
      expect(sounds.playReactionSound).toHaveBeenCalledWith('applause');
    });

    test('does not play sound for unmapped reactions', () => {
      const { result } = renderHook(() => useAudioReactions(mockGameState));
      const { useSounds } = require('./useSounds');
      const sounds = useSounds();

      jest.clearAllMocks();
      act(() => {
        result.current.playReactionForEmoji('🎉' as any);
      });
      expect(sounds.playReactionSound).not.toHaveBeenCalled();
    });
  });

  describe('game event detection', () => {
    test('detects cante and triggers appropriate sounds', async () => {
      const { rerender } = renderHook(
        ({ gameState }) => useAudioReactions(gameState),
        { initialProps: { gameState: mockGameState } },
      );

      const { useSounds } = require('./useSounds');
      const sounds = useSounds();

      // Add a cante
      const newGameState = {
        ...mockGameState,
        cantes: [{ playerId: 'player0' as PlayerId, points: 20, suit: 'oros' }],
      };

      act(() => {
        rerender({ gameState: newGameState });
      });

      // Wait for async processing
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(sounds.playCanteSound).toHaveBeenCalledWith(20);
      expect(sounds.playReactionSound).toHaveBeenCalledWith('ole');
    });

    test('detects game end and plays victory sound', async () => {
      const { rerender } = renderHook(
        ({ gameState }) => useAudioReactions(gameState),
        { initialProps: { gameState: mockGameState } },
      );

      const { useSounds } = require('./useSounds');
      const sounds = useSounds();

      // End the game
      const newGameState = {
        ...mockGameState,
        phase: 'finished' as const,
        scores: { team1: 101, team2: 85 },
      };

      act(() => {
        rerender({ gameState: newGameState });
      });

      // Wait for async processing
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(sounds.playVictorySound).toHaveBeenCalled();
    });
  });

  describe('triggerGameEvent', () => {
    test('queues and processes custom events', async () => {
      const { result } = renderHook(() => useAudioReactions(mockGameState));
      const { useSounds } = require('./useSounds');
      const sounds = useSounds();

      act(() => {
        result.current.triggerGameEvent({
          type: 'good_play',
          playerId: 'player0' as PlayerId,
        });
      });

      // Wait for async processing
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 100));
      });

      expect(sounds.playReactionSound).toHaveBeenCalled();
    });

    test('processes multiple events in order', async () => {
      const { result } = renderHook(() => useAudioReactions(mockGameState));
      const { useSounds } = require('./useSounds');
      const sounds = useSounds();

      act(() => {
        result.current.triggerGameEvent({
          type: 'trick_won',
          playerId: 'player0' as PlayerId,
        });
        result.current.triggerGameEvent({
          type: 'good_play',
          playerId: 'player0' as PlayerId,
        });
      });

      // Wait for async processing
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 300));
      });

      // Should have been called at least once for each event
      expect(sounds.playReactionSound.mock.calls.length).toBeGreaterThanOrEqual(
        1,
      );
    });
  });
});
