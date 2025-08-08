import { renderHook, act } from '@testing-library/react-hooks';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { AccessibilityInfo } from 'react-native';
import { useAudioAccessibility } from './useAudioAccessibility';
import type { GameState } from '../types/game.types';

// Mock dependencies
vi.mock('react-native', () => ({
  AccessibilityInfo: {
    announceForAccessibility: vi.fn(),
  },
}));

vi.mock('./useSounds', () => ({
  useSounds: () => ({
    playCardSound: vi.fn(),
    playTurnSound: vi.fn(),
    playCanteSound: vi.fn(),
    playTrickCollectSound: vi.fn(),
    playReactionSound: vi.fn(),
  }),
}));

vi.mock('./useGameSettings', () => ({
  useGameSettings: () => ({
    settings: {
      accessibilityAudioCues: true,
      voiceAnnouncements: true,
    },
  }),
}));

describe('useAudioAccessibility', () => {
  let mockGameState: GameState;

  beforeEach(() => {
    jest.clearAllMocks();

    mockGameState = {
      phase: 'playing',
      currentPlayerIndex: 0,
      trump: 'oros',
      cantes: [],
      players: [
        { id: 'player0', name: 'Player 1', teamId: 'team1', isBot: false },
        { id: 'player1', name: 'Player 2', teamId: 'team2', isBot: true },
        { id: 'player2', name: 'Player 3', teamId: 'team1', isBot: true },
        { id: 'player3', name: 'Player 4', teamId: 'team2', isBot: true },
      ],
    } as any;
  });

  describe('announceCard', () => {
    test('announces card name and suit in Spanish', () => {
      const { result } = renderHook(() => useAudioAccessibility(mockGameState));

      act(() => {
        result.current.announceCard({
          id: 'card1',
          suit: 'oros',
          value: '1',
        } as any);
      });

      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'As de Oros',
      );

      act(() => {
        result.current.announceCard({
          id: 'card2',
          suit: 'copas',
          value: '12',
        } as any);
      });

      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'Rey de Copas',
      );
    });

    test('does not announce when accessibility is disabled', () => {
      vi.resetModules();
      vi.mock('./useGameSettings', () => ({
        useGameSettings: () => ({
          settings: {
            accessibilityAudioCues: false,
          },
        }),
      }));

      const { result } = renderHook(() => useAudioAccessibility(mockGameState));

      act(() => {
        result.current.announceCard({
          id: 'card1',
          suit: 'oros',
          value: '1',
        } as any);
      });

      expect(AccessibilityInfo.announceForAccessibility).not.toHaveBeenCalled();
    });
  });

  describe('announceGameState', () => {
    test('announces game state messages', () => {
      const { result } = renderHook(() => useAudioAccessibility(mockGameState));

      act(() => {
        result.current.announceGameState('Tu turno');
      });

      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'Tu turno',
      );
    });
  });

  describe('playAccessibilityCue', () => {
    test('plays appropriate sound cues for events', async () => {
      const { useSounds } = require('./useSounds');
      const sounds = useSounds();
      const { result } = renderHook(() => useAudioAccessibility(mockGameState));

      // Test turn cue (double beep)
      await act(async () => {
        await result.current.playAccessibilityCue('turn');
      });
      expect(sounds.playTurnSound).toHaveBeenCalledTimes(2);

      // Test card played cue
      jest.clearAllMocks();
      await act(async () => {
        await result.current.playAccessibilityCue('card_played');
      });
      expect(sounds.playCardSound).toHaveBeenCalledTimes(1);

      // Test trick won cue
      jest.clearAllMocks();
      await act(async () => {
        await result.current.playAccessibilityCue('trick_won');
      });
      expect(sounds.playTrickCollectSound).toHaveBeenCalledTimes(1);
      expect(sounds.playReactionSound).toHaveBeenCalledWith('bien');

      // Test cante cue
      jest.clearAllMocks();
      await act(async () => {
        await result.current.playAccessibilityCue('cante');
      });
      expect(sounds.playCanteSound).toHaveBeenCalledWith(20);
    });
  });

  describe('game state monitoring', () => {
    test('announces player turn when it changes to player 0', () => {
      const { useSounds } = require('./useSounds');
      const sounds = useSounds();

      const { rerender } = renderHook(
        ({ gameState }) => useAudioAccessibility(gameState),
        {
          initialProps: {
            gameState: { ...mockGameState, currentPlayerIndex: 1 },
          },
        },
      );

      // Change to player 0's turn
      act(() => {
        rerender({ gameState: { ...mockGameState, currentPlayerIndex: 0 } });
      });

      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'Tu turno',
      );
      expect(sounds.playTurnSound).toHaveBeenCalled();
    });

    test('announces trump suit at game start', () => {
      const { rerender } = renderHook(
        ({ gameState }) => useAudioAccessibility(gameState),
        { initialProps: { gameState: null } },
      );

      act(() => {
        rerender({ gameState: mockGameState });
      });

      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'Triunfo: Oros',
      );
    });

    test('announces cantes when they occur', () => {
      const { useSounds } = require('./useSounds');
      const sounds = useSounds();

      const { rerender } = renderHook(
        ({ gameState }) => useAudioAccessibility(gameState),
        { initialProps: { gameState: mockGameState } },
      );

      const newGameState = {
        ...mockGameState,
        cantes: [{ playerId: 'player0', points: 40, suit: 'oros' }],
      };

      act(() => {
        rerender({ gameState: newGameState });
      });

      expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
        'Cante de 40 puntos',
      );
      expect(sounds.playCanteSound).toHaveBeenCalled();
    });
  });

  describe('card name helpers', () => {
    test('correctly translates all card values', () => {
      const { result } = renderHook(() => useAudioAccessibility(mockGameState));

      const cardValues = [
        { value: '1', expected: 'As' },
        { value: '2', expected: 'Dos' },
        { value: '3', expected: 'Tres' },
        { value: '4', expected: 'Cuatro' },
        { value: '5', expected: 'Cinco' },
        { value: '6', expected: 'Seis' },
        { value: '7', expected: 'Siete' },
        { value: '10', expected: 'Sota' },
        { value: '11', expected: 'Caballo' },
        { value: '12', expected: 'Rey' },
      ];

      cardValues.forEach(({ value, expected }) => {
        jest.clearAllMocks();
        act(() => {
          result.current.announceCard({
            id: 'test',
            suit: 'oros',
            value,
          } as any);
        });
        expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
          `${expected} de Oros`,
        );
      });
    });

    test('correctly translates all suits', () => {
      const { result } = renderHook(() => useAudioAccessibility(mockGameState));

      const suits = [
        { suit: 'oros', expected: 'Oros' },
        { suit: 'copas', expected: 'Copas' },
        { suit: 'espadas', expected: 'Espadas' },
        { suit: 'bastos', expected: 'Bastos' },
      ];

      suits.forEach(({ suit, expected }) => {
        jest.clearAllMocks();
        act(() => {
          result.current.announceCard({ id: 'test', suit, value: '1' } as any);
        });
        expect(AccessibilityInfo.announceForAccessibility).toHaveBeenCalledWith(
          `As de ${expected}`,
        );
      });
    });
  });
});
