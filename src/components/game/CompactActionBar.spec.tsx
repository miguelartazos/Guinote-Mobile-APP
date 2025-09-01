import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { CompactActionBar } from './CompactActionBar';
import type { GameState, Card, CardId, PlayerId, TeamId } from '../../types/game.types';
import type { SpanishSuit, CardValue } from '../../types/cardTypes';

// Mock the gameLogic functions
jest.mock('../../utils/gameLogic', () => ({
  canCantar: jest.fn(),
  canCambiar7: jest.fn(),
}));

import { canCantar, canCambiar7 } from '../../utils/gameLogic';

// Helper to create a card
const createCard = (suit: SpanishSuit, value: CardValue): Card => ({
  id: `${suit}_${value}` as CardId,
  suit,
  value,
});

describe('CompactActionBar', () => {
  const mockOnCantar = jest.fn();
  const mockOnCambiar7 = jest.fn();

  const createMockGameState = (overrides = {}): GameState => ({
    id: 'game1' as any,
    phase: 'playing' as const,
    currentPlayerIndex: 0,
    players: [
      { id: 'p1' as PlayerId, name: 'Player 1', isBot: false, teamId: 'team1' as TeamId, ranking: 1000, avatar: 'avatar1' },
      { id: 'p2' as PlayerId, name: 'Player 2', isBot: true, teamId: 'team1' as TeamId, ranking: 1000, avatar: 'avatar2' },
      { id: 'p3' as PlayerId, name: 'Player 3', isBot: true, teamId: 'team2' as TeamId, ranking: 1000, avatar: 'avatar3' },
      { id: 'p4' as PlayerId, name: 'Player 4', isBot: true, teamId: 'team2' as TeamId, ranking: 1000, avatar: 'avatar4' },
    ],
    teams: [
      { id: 'team1' as TeamId, playerIds: ['p1' as PlayerId, 'p2' as PlayerId], score: 0, cardPoints: 0, cantes: [] },
      { id: 'team2' as TeamId, playerIds: ['p3' as PlayerId, 'p4' as PlayerId], score: 0, cardPoints: 0, cantes: [] },
    ],
    hands: new Map([
      ['p1' as PlayerId, [
        createCard('oros', 10), // Sota de oros
        createCard('oros', 12), // Rey de oros
        createCard('copas', 1),
      ]],
    ]),
    trumpSuit: 'espadas' as const,
    trumpCard: createCard('espadas', 1),
    deck: [createCard('bastos', 1)],
    currentTrick: [],
    lastTrick: null,
    lastTrickWinner: null,
    collectedTricks: new Map(),
    teamTrickPiles: new Map(),
    dealerIndex: 0,
    trickCount: 0,
    trickWins: new Map(),
    gameHistory: [],
    isVueltas: false,
    pendingVueltas: false,
    canDeclareVictory: false,
    canCambiar7: false,
    trickAnimating: false,
    postTrickDealingAnimating: false,
    postTrickDealingPending: false,
    pendingTrickWinner: null,
    pendingPostTrickDraws: null,
    cardPlayAnimation: null,
    lastActionTimestamp: Date.now(),
    matchScore: null,
    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('cantar button animation', () => {
    test('shows cantar button with pop animation when player can cantar', () => {
      (canCantar as jest.Mock).mockReturnValue(['oros']);
      (canCambiar7 as jest.Mock).mockReturnValue(false);

      const gameState = createMockGameState();
      
      const { getByText } = render(
        <CompactActionBar
          gameState={gameState}
          onCantar={mockOnCantar}
          onCambiar7={mockOnCambiar7}
          disabled={false}
        />
      );

      // Button should be visible
      const cantarButton = getByText('Cantar');
      expect(cantarButton).toBeDefined();
    });

    test('hides cantar button when player cannot cantar', () => {
      (canCantar as jest.Mock).mockReturnValue([]);
      (canCambiar7 as jest.Mock).mockReturnValue(false);

      const gameState = createMockGameState();
      
      const { queryByText } = render(
        <CompactActionBar
          gameState={gameState}
          onCantar={mockOnCantar}
          onCambiar7={mockOnCambiar7}
          disabled={false}
        />
      );

      // Button should not be visible
      expect(queryByText('Cantar')).toBeNull();
    });

    test('calls onCantar when cantar button is pressed', () => {
      (canCantar as jest.Mock).mockReturnValue(['oros']);
      (canCambiar7 as jest.Mock).mockReturnValue(false);

      const gameState = createMockGameState();
      
      const { getByText } = render(
        <CompactActionBar
          gameState={gameState}
          onCantar={mockOnCantar}
          onCambiar7={mockOnCambiar7}
          disabled={false}
        />
      );

      const cantarButton = getByText('Cantar');
      fireEvent.press(cantarButton);

      expect(mockOnCantar).toHaveBeenCalledTimes(1);
    });

    test('disables cantar button when disabled prop is true', () => {
      (canCantar as jest.Mock).mockReturnValue(['oros']);
      (canCambiar7 as jest.Mock).mockReturnValue(false);

      const gameState = createMockGameState();
      
      const { queryByText } = render(
        <CompactActionBar
          gameState={gameState}
          onCantar={mockOnCantar}
          onCambiar7={mockOnCambiar7}
          disabled={true}
        />
      );

      // Button should not be shown when disabled
      expect(queryByText('Cantar')).toBeNull();
    });
  });

  describe('cambiar7 button animation', () => {
    test('shows cambiar7 button with pop animation when player can cambiar7', () => {
      (canCantar as jest.Mock).mockReturnValue([]);
      (canCambiar7 as jest.Mock).mockReturnValue(true);

      const gameState = createMockGameState({ canCambiar7: true });
      
      const { getByText } = render(
        <CompactActionBar
          gameState={gameState}
          onCantar={mockOnCantar}
          onCambiar7={mockOnCambiar7}
          disabled={false}
        />
      );

      // Button should be visible
      const cambiarButton = getByText('Cambiar 7');
      expect(cambiarButton).toBeDefined();
    });

    test('calls onCambiar7 when cambiar7 button is pressed', () => {
      (canCantar as jest.Mock).mockReturnValue([]);
      (canCambiar7 as jest.Mock).mockReturnValue(true);

      const gameState = createMockGameState({ canCambiar7: true });
      
      const { getByText } = render(
        <CompactActionBar
          gameState={gameState}
          onCantar={mockOnCantar}
          onCambiar7={mockOnCambiar7}
          disabled={false}
        />
      );

      const cambiarButton = getByText('Cambiar 7');
      fireEvent.press(cambiarButton);

      expect(mockOnCambiar7).toHaveBeenCalledTimes(1);
    });
  });

  describe('both buttons', () => {
    test('shows both buttons when player can do both actions', () => {
      (canCantar as jest.Mock).mockReturnValue(['oros']);
      (canCambiar7 as jest.Mock).mockReturnValue(true);

      const gameState = createMockGameState({ canCambiar7: true });
      
      const { getByText } = render(
        <CompactActionBar
          gameState={gameState}
          onCantar={mockOnCantar}
          onCambiar7={mockOnCambiar7}
          disabled={false}
        />
      );

      expect(getByText('Cantar')).toBeDefined();
      expect(getByText('Cambiar 7')).toBeDefined();
    });

    test('returns null when no actions available', () => {
      (canCantar as jest.Mock).mockReturnValue([]);
      (canCambiar7 as jest.Mock).mockReturnValue(false);

      const gameState = createMockGameState();
      
      const { UNSAFE_root } = render(
        <CompactActionBar
          gameState={gameState}
          onCantar={mockOnCantar}
          onCambiar7={mockOnCambiar7}
          disabled={false}
        />
      );

      expect(UNSAFE_root.children.length).toBe(0);
    });

    test('returns null when current player is a bot', () => {
      (canCantar as jest.Mock).mockReturnValue(['oros']);
      (canCambiar7 as jest.Mock).mockReturnValue(true);

      const gameState = createMockGameState({ 
        currentPlayerIndex: 1, // Player 2 is a bot
      });
      
      const { UNSAFE_root } = render(
        <CompactActionBar
          gameState={gameState}
          onCantar={mockOnCantar}
          onCambiar7={mockOnCambiar7}
          disabled={false}
        />
      );

      expect(UNSAFE_root.children.length).toBe(0);
    });
  });
});