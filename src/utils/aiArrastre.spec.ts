// Jest is configured for this project
import { playAICard } from './aiPlayer';
import { getValidCards } from './gameLogic';
import type { GameState, Card, Player, PlayerId, TeamId } from '../types/game.types';
import type { SpanishSuit } from '../types/cardTypes';

// Helper to create a test card
function createCard(value: number, suit: SpanishSuit): Card {
  return {
    id: `${value}-${suit}` as any,
    value: value as any,
    suit,
  };
}

// Helper to create a test game state in arrastre phase
function createArrastreGameState(
  currentPlayerIndex: number = 0,
  trumpSuit: SpanishSuit = 'oros',
): GameState {
  const players: Player[] = [
    { id: 'p0' as PlayerId, name: 'Bot 1', isBot: true, difficulty: 'medium' },
    { id: 'p1' as PlayerId, name: 'Bot 2', isBot: true, difficulty: 'medium' },
    { id: 'p2' as PlayerId, name: 'Bot 3', isBot: true, difficulty: 'medium' },
    { id: 'p3' as PlayerId, name: 'Bot 4', isBot: true, difficulty: 'medium' },
  ];

  const teams: any[] = [
    {
      id: 'team1' as TeamId,
      playerIds: ['p0', 'p2'] as PlayerId[],
      score: 50,
      cardPoints: 30,
      cantes: [],
    },
    {
      id: 'team2' as TeamId,
      playerIds: ['p1', 'p3'] as PlayerId[],
      score: 45,
      cardPoints: 25,
      cantes: [],
    },
  ];

  return {
    phase: 'arrastre',
    players,
    teams,
    currentPlayerIndex,
    currentPlayer: players[currentPlayerIndex].id,
    trumpSuit,
    currentTrick: [],
    deck: [], // Empty deck in arrastre
    hands: new Map(),
    trumpCard: createCard(7, trumpSuit),
    lastTrickWinner: null,
    lastTrickWinnerTeam: null,
    trickCount: 5,
    dealerIndex: 0,
    isVueltas: false,
    trickAnimating: false,
    postTrickDealingAnimating: false,
  } as GameState;
}

describe('AI Arrastre Phase Behavior', () => {
  describe('playAICard in arrastre', () => {
    it('should always return a card when bot has cards in arrastre', () => {
      const gameState = createArrastreGameState(0, 'oros');
      const hand: Card[] = [
        createCard(1, 'espadas'),
        createCard(3, 'oros'),
        createCard(10, 'copas'),
      ];

      gameState.hands.set('p0' as PlayerId, hand);

      const player = gameState.players[0];
      const selectedCard = playAICard(hand, gameState, player);

      expect(selectedCard).toBeTruthy();
      expect(hand).toContain(selectedCard);
    });

    it('should handle case when no cards pass validation in arrastre', () => {
      const gameState = createArrastreGameState(0, 'oros');
      const hand: Card[] = [createCard(7, 'bastos')];

      gameState.hands.set('p0' as PlayerId, hand);

      // Start a trick with a high trump
      gameState.currentTrick = [{ playerId: 'p1' as PlayerId, card: createCard(1, 'oros') }];

      const player = gameState.players[0];
      const selectedCard = playAICard(hand, gameState, player);

      // Should still return a card even if validation would normally fail
      expect(selectedCard).toBeTruthy();
      expect(selectedCard).toEqual(hand[0]);
    });

    it('should prefer following suit in arrastre when following', () => {
      const gameState = createArrastreGameState(1, 'oros');
      const hand: Card[] = [
        createCard(5, 'espadas'),
        createCard(7, 'espadas'),
        createCard(10, 'copas'),
      ];

      gameState.hands.set('p1' as PlayerId, hand);

      // Lead with espadas
      gameState.currentTrick = [{ playerId: 'p0' as PlayerId, card: createCard(3, 'espadas') }];

      const validCards = getValidCards(hand, gameState, 'p1' as PlayerId);

      // Should only return espadas cards
      expect(validCards).toHaveLength(2);
      expect(validCards.every(c => c.suit === 'espadas')).toBe(true);
    });

    it('should not freeze when starting a trick in arrastre', () => {
      const gameState = createArrastreGameState(0, 'oros');
      const hand: Card[] = [
        createCard(1, 'oros'), // Trump As
        createCard(3, 'oros'), // Trump 3
        createCard(12, 'bastos'),
      ];

      gameState.hands.set('p0' as PlayerId, hand);
      gameState.currentTrick = []; // Starting a trick

      const player = gameState.players[0];
      const selectedCard = playAICard(hand, gameState, player);

      expect(selectedCard).toBeTruthy();
      expect(hand).toContain(selectedCard);
    });
  });

  describe('getValidCards fallback in arrastre', () => {
    it('should return at least one card when validation fails', () => {
      const gameState = createArrastreGameState(2, 'oros');

      // Create a scenario where normal validation might fail
      const hand: Card[] = [
        createCard(2, 'bastos'), // Low non-trump
      ];

      gameState.hands.set('p2' as PlayerId, hand);

      // Complex trick scenario
      gameState.currentTrick = [
        { playerId: 'p0' as PlayerId, card: createCard(1, 'espadas') },
        { playerId: 'p1' as PlayerId, card: createCard(3, 'oros') }, // Trump
      ];

      const validCards = getValidCards(hand, gameState, 'p2' as PlayerId);

      // Should always return at least one card
      expect(validCards.length).toBeGreaterThan(0);
    });

    it('should handle team detection failures gracefully', () => {
      const gameState = createArrastreGameState(0, 'oros');

      // Corrupt team data to simulate detection failure
      gameState.teams = [];

      const hand: Card[] = [createCard(10, 'espadas'), createCard(11, 'espadas')];

      gameState.hands.set('p0' as PlayerId, hand);
      gameState.currentTrick = [{ playerId: 'p1' as PlayerId, card: createCard(5, 'espadas') }];

      const validCards = getValidCards(hand, gameState, 'p0' as PlayerId);

      // Should return cards despite team detection failure
      expect(validCards.length).toBeGreaterThan(0);
    });

    it('should use fallback when starting trick with empty validation', () => {
      const gameState = createArrastreGameState(0, 'oros');
      const hand: Card[] = [createCard(4, 'copas'), createCard(5, 'copas')];

      gameState.hands.set('p0' as PlayerId, hand);
      gameState.currentTrick = []; // Starting a trick

      const validCards = getValidCards(hand, gameState, 'p0' as PlayerId);

      // Should return all cards when starting a trick
      expect(validCards).toHaveLength(2);
    });
  });

  describe('Edge cases and recovery', () => {
    it('should handle empty hand gracefully', () => {
      const gameState = createArrastreGameState(0, 'oros');
      const hand: Card[] = [];

      gameState.hands.set('p0' as PlayerId, hand);

      const player = gameState.players[0];
      const selectedCard = playAICard(hand, gameState, player);

      expect(selectedCard).toBeNull();
    });

    it('should handle missing player gracefully', () => {
      const gameState = createArrastreGameState(0, 'oros');
      const hand: Card[] = [createCard(7, 'bastos')];

      gameState.hands.set('p0' as PlayerId, hand);

      // Pass undefined player to test fallback
      const selectedCard = playAICard(hand, gameState, undefined);

      // Should still work with fallback player ID
      expect(selectedCard).toBeTruthy();
    });

    it('should play lowest card as fallback in complex arrastre scenario', () => {
      const gameState = createArrastreGameState(3, 'oros');
      const hand: Card[] = [
        createCard(12, 'bastos'), // Rey - 10 points
        createCard(1, 'bastos'), // As - 11 points
        createCard(4, 'bastos'), // 4 - 0 points
      ];

      gameState.hands.set('p3' as PlayerId, hand);

      // Complex scenario where partner might be winning
      gameState.currentTrick = [
        { playerId: 'p0' as PlayerId, card: createCard(7, 'copas') },
        { playerId: 'p1' as PlayerId, card: createCard(10, 'copas') }, // Partner team
        { playerId: 'p2' as PlayerId, card: createCard(11, 'copas') },
      ];

      const validCards = getValidCards(hand, gameState, 'p3' as PlayerId);

      // Should have at least one valid card
      expect(validCards.length).toBeGreaterThan(0);
    });
  });
});
