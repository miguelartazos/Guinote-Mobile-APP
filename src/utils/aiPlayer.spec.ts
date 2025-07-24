import { describe, expect, test } from '@jest/globals';
import { playAICard } from './aiPlayer';
import type {
  Card,
  CardId,
  GameState,
  PlayerId,
  TeamId,
} from '../types/game.types';
import type { SpanishSuit } from '../components/game/SpanishCard';

function createCard(suit: SpanishSuit, value: number): Card {
  return {
    id: `${suit}_${value}` as CardId,
    suit,
    value: value as any,
  };
}

function createMockGameState(overrides: Partial<GameState> = {}): GameState {
  return {
    id: 'test' as any,
    phase: 'playing',
    players: [],
    teams: [
      {
        id: 'team1' as TeamId,
        playerIds: ['p1', 'p2'] as PlayerId[],
        score: 0,
        cantes: [],
      },
      {
        id: 'team2' as TeamId,
        playerIds: ['p3', 'p4'] as PlayerId[],
        score: 0,
        cantes: [],
      },
    ],
    deck: [],
    hands: new Map(),
    trumpSuit: 'oros',
    trumpCard: createCard('oros', 4),
    currentTrick: [],
    currentPlayerIndex: 0,
    trickWins: new Map(),
    canCambiar7: false,
    gameHistory: [],
    ...overrides,
  };
}

describe('playAICard', () => {
  test('returns null when hand is empty', () => {
    const gameState = createMockGameState();
    expect(playAICard([], gameState)).toBeNull();
  });

  test('returns only valid card when there is just one', () => {
    const card = createCard('bastos', 7);
    const gameState = createMockGameState();
    expect(playAICard([card], gameState)).toEqual(card);
  });

  test('leads with high non-trump when starting trick', () => {
    const hand = [
      createCard('espadas', 1), // As de espadas (non-trump, high)
      createCard('bastos', 2), // 2 de bastos (non-trump, low)
      createCard('oros', 7), // 7 de oros (trump)
    ];
    const gameState = createMockGameState({ trumpSuit: 'oros' });

    const played = playAICard(hand, gameState);
    expect(played).toEqual(hand[0]); // Should play As de espadas
  });

  test('plays low card in arrastre phase when leading', () => {
    const hand = [
      createCard('espadas', 1), // As de espadas (high)
      createCard('espadas', 2), // 2 de espadas (low)
      createCard('bastos', 10), // Sota de bastos
    ];
    const gameState = createMockGameState({
      phase: 'arrastre',
      trumpSuit: 'oros',
    });

    const played = playAICard(hand, gameState);
    expect(played).toEqual(hand[1]); // Should play 2 de espadas
  });

  test('wins valuable trick with lowest winning card', () => {
    const hand = [
      createCard('espadas', 1), // As (can win)
      createCard('espadas', 3), // 3 (can win)
      createCard('espadas', 2), // 2 (cannot win)
    ];
    const gameState = createMockGameState({
      currentTrick: [
        { playerId: 'p1' as PlayerId, card: createCard('espadas', 10) }, // 2 points
        { playerId: 'p2' as PlayerId, card: createCard('espadas', 11) }, // 3 points
        { playerId: 'p3' as PlayerId, card: createCard('espadas', 12) }, // 4 points
      ],
    });

    const played = playAICard(hand, gameState);
    expect(played).toEqual(hand[1]); // 3 is lowest card that can win
  });

  test('throws low point card when cannot win', () => {
    const hand = [
      createCard('bastos', 10), // Sota (2 points)
      createCard('bastos', 12), // Rey (4 points)
      createCard('bastos', 7), // 7 (0 points)
    ];
    const gameState = createMockGameState({
      currentTrick: [
        { playerId: 'p1' as PlayerId, card: createCard('bastos', 1) }, // As leads
      ],
    });

    const played = playAICard(hand, gameState);
    expect(played).toEqual(hand[2]); // Should play 7 (0 points)
  });

  test('must follow suit even if cannot win', () => {
    const hand = [
      createCard('espadas', 2), // Must play espadas
      createCard('oros', 1), // Trump As
    ];
    const gameState = createMockGameState({
      trumpSuit: 'oros',
      currentTrick: [
        { playerId: 'p1' as PlayerId, card: createCard('espadas', 1) }, // As de espadas leads
      ],
    });

    const played = playAICard(hand, gameState);
    expect(played).toEqual(hand[0]); // Must play espadas even though can't win
  });

  test('plays trump when cannot follow suit and trick is valuable', () => {
    const hand = [
      createCard('bastos', 2), // Low non-trump
      createCard('oros', 10), // Trump sota
    ];
    const gameState = createMockGameState({
      trumpSuit: 'oros',
      currentTrick: [
        { playerId: 'p1' as PlayerId, card: createCard('espadas', 1) }, // 11 points
        { playerId: 'p2' as PlayerId, card: createCard('espadas', 3) }, // 10 points
      ],
    });

    const played = playAICard(hand, gameState);
    expect(played).toEqual(hand[1]); // Should trump to win valuable trick
  });
});
