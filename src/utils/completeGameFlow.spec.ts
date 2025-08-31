import type { GameState, PlayerId, TeamId, CardId, GamePhase, Card } from '../types/game.types';
import { playCard, createInitialMatchScore } from './gameLogic';

describe('Complete Game Flow - Arrastre to Vueltas to Partida Ganada', () => {
  function createGameInArrastre(): GameState {
    return {
      id: 'test-game' as any,
      phase: 'arrastre' as GamePhase,
      players: [
        { id: 'p1' as PlayerId, name: 'P1', teamId: 'team1' as TeamId },
        { id: 'p2' as PlayerId, name: 'P2', teamId: 'team2' as TeamId },
        { id: 'p3' as PlayerId, name: 'P3', teamId: 'team1' as TeamId },
        { id: 'p4' as PlayerId, name: 'P4', teamId: 'team2' as TeamId },
      ] as any[],
      teams: [
        {
          id: 'team1' as TeamId,
          playerIds: ['p1' as PlayerId, 'p3' as PlayerId],
          score: 98, // Close to 101
          cantes: [],
          tricks: [],
        },
        {
          id: 'team2' as TeamId,
          playerIds: ['p2' as PlayerId, 'p4' as PlayerId],
          score: 85,
          cantes: [],
          tricks: [],
        },
      ] as any[],
      hands: new Map(),
      deck: [], // Empty deck - in arrastre
      currentTrick: [
        {
          playerId: 'p1' as PlayerId,
          card: { id: 'c1' as CardId, suit: 'oros', value: 1 } as Card, // As de oros - 11 points
        },
        {
          playerId: 'p2' as PlayerId,
          card: { id: 'c2' as CardId, suit: 'copas', value: 2 } as Card,
        },
        {
          playerId: 'p3' as PlayerId,
          card: { id: 'c3' as CardId, suit: 'oros', value: 3 } as Card, // 10 points
        },
      ],
      currentPlayerIndex: 3, // p4's turn
      dealerIndex: 0,
      trumpSuit: 'oros' as any,
      trumpCard: { id: 'oros_1' as CardId, suit: 'oros', value: 1 } as any,
      canCambiar7: false,
      trickCount: 9,
      lastActionTimestamp: Date.now(),
      matchScore: createInitialMatchScore(),
      isVueltas: false,
    } as GameState;
  }

  test('Complete flow: arrastre → scoring (101+) → vueltas → partida ganada', () => {
    const gameState = createGameInArrastre();

    // Setup: Last card in p4's hand
    gameState.hands.set('p1' as PlayerId, []);
    gameState.hands.set('p2' as PlayerId, []);
    gameState.hands.set('p3' as PlayerId, []);
    gameState.hands.set('p4' as PlayerId, [
      { id: 'last' as CardId, suit: 'espadas', value: 2 } as Card,
    ]);

    // Step 1: Play last card in arrastre - should complete trick and go to scoring
    const afterLastCard = playCard(
      gameState,
      'p4' as PlayerId,
      { id: 'last' as CardId, suit: 'espadas', value: 2 } as Card,
    );

    expect(afterLastCard).not.toBeNull();
    expect(afterLastCard?.phase).toBe('scoring'); // End of arrastre

    // Team 1 wins the trick (As de oros wins), gets 11 + 10 + 10 (últimas) = 31 points
    // Team 1 total: 98 + 31 = 129 points (over 101!)
    expect(afterLastCard?.teams[0].score).toBeGreaterThanOrEqual(101);

    // Step 2: From scoring, should transition to vueltas (not immediate win)
    // This would be handled by continueFromScoring in the actual game
    // Here we simulate the vueltas state
    const vueltasState: GameState = {
      ...afterLastCard!,
      phase: 'playing' as GamePhase, // Vueltas starts with playing
      isVueltas: true,
      initialScores: new Map([
        ['team1' as TeamId, afterLastCard!.teams[0].score],
        ['team2' as TeamId, afterLastCard!.teams[1].score],
      ]),
      // Reset for vueltas
      teams: [
        {
          ...afterLastCard!.teams[0],
          score: 0, // Reset scores for vueltas
        },
        {
          ...afterLastCard!.teams[1],
          score: 0,
        },
      ] as any,
      deck: [{ id: 'd1' as CardId, suit: 'bastos', value: 4 } as Card], // Some cards in deck
      currentTrick: [],
    };

    // Step 3: During vueltas, team reaches 101 combined points
    vueltasState.teams[0].score = 5; // Team 1 gets 5 more points
    // Combined: initialScores (129) + 5 = 134

    // Setup last trick of vueltas
    vueltasState.currentTrick = [
      {
        playerId: 'p1' as PlayerId,
        card: { id: 'v1' as CardId, suit: 'bastos', value: 2 } as Card,
      },
      {
        playerId: 'p2' as PlayerId,
        card: { id: 'v2' as CardId, suit: 'bastos', value: 3 } as Card,
      },
      {
        playerId: 'p3' as PlayerId,
        card: { id: 'v3' as CardId, suit: 'bastos', value: 4 } as Card,
      },
    ];

    vueltasState.hands.set('p1' as PlayerId, []);
    vueltasState.hands.set('p2' as PlayerId, []);
    vueltasState.hands.set('p3' as PlayerId, []);
    vueltasState.hands.set('p4' as PlayerId, [
      { id: 'vLast' as CardId, suit: 'bastos', value: 5 } as Card,
    ]);
    vueltasState.deck = []; // Empty deck to trigger end
    vueltasState.currentPlayerIndex = 3; // Set to p4's turn

    // Play last card in vueltas
    const afterVueltas = playCard(
      vueltasState,
      'p4' as PlayerId,
      { id: 'vLast' as CardId, suit: 'bastos', value: 5 } as Card,
    );

    expect(afterVueltas).not.toBeNull();
    expect(afterVueltas?.phase).toBe('scoring'); // Vueltas ends

    // Team 1 has 129 (initial) + 5 (vueltas) = 134 total points
    // This triggers partida ganada (handled by continueFromScoring)
    const team1Total =
      (afterVueltas!.initialScores?.get('team1' as TeamId) || 0) + afterVueltas!.teams[0].score;
    expect(team1Total).toBeGreaterThanOrEqual(101);

    // Match score would be updated (1 partida for team 1)
    // This happens in continueFromScoring
  });

  test('Flow validation: arrastre phase preserved until last card', () => {
    const gameState = createGameInArrastre();

    // Setup: Multiple cards remaining
    gameState.hands.set('p1' as PlayerId, [
      { id: 'h1' as CardId, suit: 'copas', value: 1 } as Card,
    ]);
    gameState.hands.set('p2' as PlayerId, [
      { id: 'h2' as CardId, suit: 'copas', value: 2 } as Card,
    ]);
    gameState.hands.set('p3' as PlayerId, []);
    gameState.hands.set('p4' as PlayerId, [
      { id: 'h4' as CardId, suit: 'espadas', value: 2 } as Card,
    ]);

    // Play a card but not the last one
    const afterCard = playCard(
      gameState,
      'p4' as PlayerId,
      { id: 'h4' as CardId, suit: 'espadas', value: 2 } as Card,
    );

    expect(afterCard).not.toBeNull();
    expect(afterCard?.phase).toBe('arrastre'); // Still in arrastre

    // Trick completed, but cards remain
    expect(afterCard?.currentTrick).toHaveLength(0); // Trick cleared
    expect(afterCard?.hands.get('p1' as PlayerId)).toHaveLength(1); // Cards remain
  });

  test('Vueltas immediate stop when 101 reached', () => {
    const vueltasState: GameState = {
      id: 'test-game' as any,
      phase: 'playing' as GamePhase,
      isVueltas: true,
      initialScores: new Map([
        ['team1' as TeamId, 99], // Just under 101
        ['team2' as TeamId, 85],
      ]),
      players: [
        { id: 'p1' as PlayerId, name: 'P1', teamId: 'team1' as TeamId },
        { id: 'p2' as PlayerId, name: 'P2', teamId: 'team2' as TeamId },
        { id: 'p3' as PlayerId, name: 'P3', teamId: 'team1' as TeamId },
        { id: 'p4' as PlayerId, name: 'P4', teamId: 'team2' as TeamId },
      ] as any[],
      teams: [
        {
          id: 'team1' as TeamId,
          playerIds: ['p1' as PlayerId, 'p3' as PlayerId],
          score: 2, // 99 + 2 = 101 exactly
          cantes: [],
          tricks: [],
        },
        {
          id: 'team2' as TeamId,
          playerIds: ['p2' as PlayerId, 'p4' as PlayerId],
          score: 5,
          cantes: [],
          tricks: [],
        },
      ] as any[],
      hands: new Map(),
      deck: [],
      currentTrick: [
        {
          playerId: 'p1' as PlayerId,
          card: { id: 'c1' as CardId, suit: 'oros', value: 2 } as Card,
        },
        {
          playerId: 'p2' as PlayerId,
          card: { id: 'c2' as CardId, suit: 'oros', value: 3 } as Card,
        },
        {
          playerId: 'p3' as PlayerId,
          card: { id: 'c3' as CardId, suit: 'oros', value: 4 } as Card,
        },
      ],
      currentPlayerIndex: 3,
      dealerIndex: 0,
      trumpSuit: 'oros' as any,
      trumpCard: { id: 'oros_1' as CardId, suit: 'oros', value: 1 } as any,
      canCambiar7: false,
      trickCount: 5,
      lastActionTimestamp: Date.now(),
      matchScore: createInitialMatchScore(),
    } as GameState;

    // Some cards remain (not last trick)
    vueltasState.hands.set('p1' as PlayerId, [
      { id: 'h1' as CardId, suit: 'copas', value: 1 } as Card,
      { id: 'h2' as CardId, suit: 'copas', value: 2 } as Card,
    ]);
    vueltasState.hands.set('p2' as PlayerId, [
      { id: 'h3' as CardId, suit: 'copas', value: 3 } as Card,
    ]);
    vueltasState.hands.set('p3' as PlayerId, []);
    vueltasState.hands.set('p4' as PlayerId, [
      { id: 'h4' as CardId, suit: 'oros', value: 5 } as Card,
    ]);

    // Play card to complete trick
    const afterCard = playCard(
      vueltasState,
      'p4' as PlayerId,
      { id: 'h4' as CardId, suit: 'oros', value: 5 } as Card,
    );

    expect(afterCard).not.toBeNull();
    // Should go to scoring immediately because team1 has 101 total
    expect(afterCard?.phase).toBe('scoring');

    // Cards still remain in hands (not all played)
    expect(afterCard?.hands.get('p1' as PlayerId)?.length).toBeGreaterThan(0);
  });
});
