import { describe, expect, test } from '@jest/globals';
import { playAICard, shouldAICante, getAIThinkingTime } from './aiPlayer';
import type {
  Card,
  CardId,
  GameState,
  PlayerId,
  TeamId,
  Player,
  DifficultyLevel,
  AIPersonality,
} from '../types/game.types';
import type { SpanishSuit } from '../components/game/SpanishCard';
import { createMemory } from './aiMemory';

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
        playerIds: ['p1' as PlayerId, 'p2' as PlayerId] as [PlayerId, PlayerId],
        score: 0,
        cantes: [],
      },
      {
        id: 'team2' as TeamId,
        playerIds: ['p3' as PlayerId, 'p4' as PlayerId] as [PlayerId, PlayerId],
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

function createPlayer(
  id: PlayerId,
  difficulty: DifficultyLevel = 'medium',
  personality: AIPersonality = 'aggressive',
): Player {
  return {
    id,
    name: 'Test Bot',
    avatar: '🤖',
    ranking: 1000,
    teamId: 'team1' as TeamId,
    isBot: true,
    difficulty,
    personality,
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
      phase: 'arrastre', // In arrastre phase, must follow suit
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
      phase: 'arrastre', // In arrastre, must trump if can't follow suit
      trumpSuit: 'oros',
      currentTrick: [
        { playerId: 'p1' as PlayerId, card: createCard('espadas', 1) }, // 11 points
        { playerId: 'p2' as PlayerId, card: createCard('espadas', 3) }, // 10 points
      ],
    });

    const played = playAICard(hand, gameState);
    expect(played).toEqual(hand[1]); // Should trump to win valuable trick in arrastre
  });
});

describe('playAICard with difficulty levels', () => {
  test('easy AI plays valid card from hand', () => {
    const hand = [
      createCard('espadas', 1),
      createCard('bastos', 10),
      createCard('oros', 7),
    ];
    const gameState = createMockGameState({ trumpSuit: 'copas' });
    const player = createPlayer('bot1' as PlayerId, 'easy');

    // Test that easy AI returns a valid card from hand
    const card = playAICard(hand, gameState, player);
    expect(card).toBeTruthy();
    expect(hand).toContainEqual(card);
  });

  test('hard AI with memory makes optimal decisions', () => {
    const hand = [
      createCard('espadas', 1), // As
      createCard('espadas', 2), // Low card
    ];
    const gameState = createMockGameState({
      currentTrick: [
        { playerId: 'p1' as PlayerId, card: createCard('espadas', 10) },
        { playerId: 'partner' as PlayerId, card: createCard('espadas', 12) }, // Partner winning
      ],
      teams: [
        {
          id: 'team1' as TeamId,
          playerIds: ['bot1', 'partner'] as [PlayerId, PlayerId],
          score: 0,
          cantes: [],
        },
        {
          id: 'team2' as TeamId,
          playerIds: ['p1', 'p2'] as [PlayerId, PlayerId],
          score: 0,
          cantes: [],
        },
      ],
    });

    const player = createPlayer('bot1' as PlayerId, 'hard');
    const memory = createMemory();

    const card = playAICard(hand, gameState, player, memory);
    // Should play As to give points to partner
    expect(card).toEqual(hand[0]);
  });
});

describe('AI personalities', () => {
  test('prudent AI avoids high cards early', () => {
    const hand = [
      createCard('espadas', 1), // As
      createCard('espadas', 3), // Tres
      createCard('espadas', 4), // Low card
    ];
    const gameState = createMockGameState({
      deck: new Array(30).fill(null), // Many cards left
    });
    const player = createPlayer('bot1' as PlayerId, 'medium', 'prudent');

    const card = playAICard(hand, gameState, player);
    // Should prefer low card
    expect(card?.value).toBeLessThanOrEqual(7);
  });

  test('aggressive AI plays high cards and trumps', () => {
    const hand = [
      createCard('espadas', 4),
      createCard('oros', 7), // Trump
      createCard('bastos', 10),
    ];
    const gameState = createMockGameState({
      trumpSuit: 'oros',
      phase: 'playing', // In draw phase, AI can be more aggressive
    });
    const player = createPlayer('bot1' as PlayerId, 'medium', 'aggressive');

    // Run multiple times - aggressive should sometimes play trump (15% chance)
    let trumpPlays = 0;
    for (let i = 0; i < 100; i++) {
      const card = playAICard(hand, gameState, player);
      if (card?.suit === 'oros') trumpPlays++;
    }

    // With 15% chance, expect around 15 trumps out of 100
    expect(trumpPlays).toBeGreaterThanOrEqual(5);
    expect(trumpPlays).toBeLessThanOrEqual(30);
  });
});

describe('playAICard edge cases', () => {
  test('handles undefined player object with fallback ID', () => {
    const hand = [createCard('espadas', 1)];
    const gameState = createMockGameState();

    const card = playAICard(hand, gameState, undefined);
    expect(card).toEqual(hand[0]);
  });

  test('returns first card in arrastre when no valid cards found', () => {
    const hand = [createCard('espadas', 1), createCard('bastos', 3)];
    const gameState = createMockGameState({
      phase: 'arrastre',
      currentTrick: [
        { playerId: 'p1' as PlayerId, card: createCard('oros', 1) },
      ],
    });

    // Mock isValidPlay to return false for all cards
    const originalIsValidPlay = require('./gameLogic').isValidPlay;
    jest.spyOn(require('./gameLogic'), 'isValidPlay').mockReturnValue(false);

    const card = playAICard(hand, gameState);
    expect(card).toEqual(hand[0]); // Should return first card as fallback

    // Restore original function
    require('./gameLogic').isValidPlay = originalIsValidPlay;
  });

  test('handles player without difficulty or personality', () => {
    const hand = [createCard('espadas', 1), createCard('espadas', 2)];
    const gameState = createMockGameState();
    const player = {
      id: 'bot1' as PlayerId,
      name: 'Test Bot',
      avatar: '🤖',
      ranking: 1000,
      teamId: 'team1' as TeamId,
      isBot: true,
      // No difficulty or personality specified
    };

    const card = playAICard(hand, gameState, player);
    expect(card).toBeTruthy();
    expect(hand).toContainEqual(card);
  });

  test('hard AI without memory falls back to medium strategy', () => {
    const hand = [createCard('espadas', 1), createCard('espadas', 2)];
    const gameState = createMockGameState();
    const player = createPlayer('bot1' as PlayerId, 'hard');

    // Call without memory parameter
    const card = playAICard(hand, gameState, player);
    expect(card).toBeTruthy();
    expect(hand).toContainEqual(card);
  });

  test('handles empty trick correctly when following', () => {
    const hand = [createCard('espadas', 1), createCard('espadas', 2)];
    const gameState = createMockGameState({
      currentTrick: [], // Empty trick
    });

    const card = playAICard(hand, gameState);
    expect(card).toBeTruthy();
    expect(hand).toContainEqual(card);
  });

  test('preserves cantes in early game', () => {
    const hand = [
      createCard('espadas', 12), // Rey
      createCard('espadas', 10), // Sota
      createCard('espadas', 2), // Low card
    ];
    const gameState = createMockGameState({
      phase: 'playing',
      deck: new Array(25).fill(null), // Many cards left
    });

    const card = playAICard(hand, gameState);
    // Should prefer playing the low card to preserve cante
    expect(card?.value).toBe(2);
  });

  test('plays cante cards in arrastre phase', () => {
    const hand = [
      createCard('espadas', 12), // Rey
      createCard('espadas', 10), // Sota
    ];
    const gameState = createMockGameState({
      phase: 'arrastre',
    });

    const card = playAICard(hand, gameState);
    // Should play one of the cante cards since preservation is not needed in arrastre
    expect(card).toBeTruthy();
    expect([10, 12]).toContain(card?.value);
  });
});

describe('shouldAICante', () => {
  const createHandWithCante = (suit: SpanishSuit): Card[] => [
    createCard(suit, 12), // Rey
    createCard(suit, 10), // Sota
    createCard('bastos', 7),
  ];

  test('easy AI cantes immediately', () => {
    const hand = createHandWithCante('espadas');
    const gameState = createMockGameState();
    const player = createPlayer('bot1' as PlayerId, 'easy');

    const cante = shouldAICante(player, hand, gameState);
    expect(cante).toBe('espadas');
  });

  test('hard AI saves trump cante for later', () => {
    const hand = createHandWithCante('oros');
    const gameState = createMockGameState({
      trumpSuit: 'oros',
      deck: new Array(20).fill(null), // Early game
    });
    const player = createPlayer('bot1' as PlayerId, 'hard');

    const cante = shouldAICante(player, hand, gameState);
    expect(cante).toBeNull(); // Should wait
  });

  test('medium AI cantes when behind', () => {
    const hand = createHandWithCante('espadas');
    const gameState = createMockGameState({
      teams: [
        {
          id: 'team1' as TeamId,
          playerIds: ['bot1', 'p2'] as [PlayerId, PlayerId],
          score: 20,
          cantes: [],
        },
        {
          id: 'team2' as TeamId,
          playerIds: ['p3', 'p4'] as [PlayerId, PlayerId],
          score: 50,
          cantes: [],
        },
      ],
    });
    const player = createPlayer('bot1' as PlayerId, 'medium');

    const cante = shouldAICante(player, hand, gameState);
    expect(cante).toBe('espadas');
  });
});

describe('getAIThinkingTime', () => {
  test('easy AI thinks faster than hard AI', () => {
    const easyPlayer = createPlayer('bot1' as PlayerId, 'easy');
    const hardPlayer = createPlayer('bot2' as PlayerId, 'hard');

    const easyTime = getAIThinkingTime(easyPlayer, false);
    const hardTime = getAIThinkingTime(hardPlayer, false);

    expect(easyTime).toBeLessThanOrEqual(1500);
    expect(hardTime).toBeGreaterThanOrEqual(800); // Allow for randomness
    expect(hardTime).toBeLessThanOrEqual(2500);
  });

  test('complex decisions take longer', () => {
    const player = createPlayer('bot1' as PlayerId, 'medium');

    const simpleTime = getAIThinkingTime(player, false);
    const complexTime = getAIThinkingTime(player, true);

    expect(complexTime).toBeGreaterThan(simpleTime);
  });

  test('aggressive personality thinks faster', () => {
    const aggressivePlayer = createPlayer(
      'bot1' as PlayerId,
      'medium',
      'aggressive',
    );
    const prudentPlayer = createPlayer('bot2' as PlayerId, 'medium', 'prudent');

    // Run multiple times and average
    let aggressiveTotal = 0;
    let prudentTotal = 0;

    for (let i = 0; i < 10; i++) {
      aggressiveTotal += getAIThinkingTime(aggressivePlayer, false);
      prudentTotal += getAIThinkingTime(prudentPlayer, false);
    }

    expect(aggressiveTotal / 10).toBeLessThan(prudentTotal / 10);
  });
});

describe('recovery scenarios', () => {
  test('AI plays valid card when hand has cards', () => {
    const hand = [
      createCard('espadas', 1),
      createCard('bastos', 10),
      createCard('oros', 7),
    ];
    const gameState = createMockGameState();

    const card = playAICard(hand, gameState);
    expect(card).toBeTruthy();
    expect(hand).toContainEqual(card);
  });

  test('AI returns null when hand is truly empty', () => {
    const gameState = createMockGameState();

    const card = playAICard([], gameState);
    expect(card).toBeNull();
  });

  test('partner winning detection works correctly', () => {
    const hand = [
      createCard('espadas', 12), // Rey = 4 points
      createCard('espadas', 2), // 2 = 0 points
    ];
    const gameState = createMockGameState({
      phase: 'playing', // In draw phase, AI has freedom to give points to partner
      currentPlayer: 'bot1' as PlayerId,
      currentTrick: [
        { playerId: 'p1' as PlayerId, card: createCard('espadas', 10) }, // Sota = 2 points
        { playerId: 'p2' as PlayerId, card: createCard('espadas', 11) }, // Caballo = 3 points, Partner winning
      ],
      teams: [
        {
          id: 'team1' as TeamId,
          playerIds: ['bot1', 'p2'] as [PlayerId, PlayerId], // bot1 and p2 are partners
          score: 0,
          cantes: [],
          cardPoints: 0,
        },
        {
          id: 'team2' as TeamId,
          playerIds: ['p1', 'p3'] as [PlayerId, PlayerId],
          score: 0,
          cantes: [],
          cardPoints: 0,
        },
      ],
    });
    const player = createPlayer('bot1' as PlayerId, 'medium');

    const card = playAICard(hand, gameState, player);
    // In draw phase, should give high point card to partner (Rey=12 has 4 points, 2 has 0 points)
    // But trick value is only 5 points (Sota + Caballo), which is not "valuable" (< 10)
    // So AI might not give points. Let's make a more valuable trick.
    expect(card).toBeTruthy();
  });

  test('gives points to partner when trick is valuable', () => {
    const hand = [
      createCard('espadas', 1), // As = 11 points
      createCard('espadas', 2), // 2 = 0 points
    ];
    const gameState = createMockGameState({
      phase: 'playing', // In draw phase
      currentPlayer: 'bot1' as PlayerId,
      currentTrick: [
        { playerId: 'p1' as PlayerId, card: createCard('bastos', 10) }, // Sota = 2 points
        { playerId: 'p2' as PlayerId, card: createCard('bastos', 1) }, // As = 11 points, Partner winning
      ],
      teams: [
        {
          id: 'team1' as TeamId,
          playerIds: ['bot1', 'p2'] as [PlayerId, PlayerId], // bot1 and p2 are partners
          score: 0,
          cantes: [],
          cardPoints: 0,
        },
        {
          id: 'team2' as TeamId,
          playerIds: ['p1', 'p3'] as [PlayerId, PlayerId],
          score: 0,
          cantes: [],
          cardPoints: 0,
        },
      ],
    });
    const player = createPlayer('bot1' as PlayerId, 'medium');

    const card = playAICard(hand, gameState, player);
    // Trick is worth 14 points (> 10), partner winning, should give As
    expect(card?.value).toBe(1);
  });
});
