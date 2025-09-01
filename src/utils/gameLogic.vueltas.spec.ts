import type { GameState, PlayerId, TeamId, TrickCard } from '../types/game.types';
import { playCard } from './gameLogic';
import { createDeck } from './gameLogic';

describe('Vueltas phase fixes', () => {
  function createVueltasGameState(): GameState {
    const deck = createDeck();
    const trumpCard = deck[0];

    return {
      phase: 'playing',
      players: [
        {
          id: 'p1' as PlayerId,
          name: 'Player 1',
          isBot: false,
          teamId: 'team1' as TeamId,
          avatar: 'avatar1',
          ranking: 1200,
        },
        {
          id: 'p2' as PlayerId,
          name: 'Player 2',
          isBot: true,
          teamId: 'team2' as TeamId,
          avatar: 'avatar2',
          ranking: 1200,
        },
        {
          id: 'p3' as PlayerId,
          name: 'Player 3',
          isBot: true,
          teamId: 'team1' as TeamId,
          avatar: 'avatar3',
          ranking: 1200,
        },
        {
          id: 'p4' as PlayerId,
          name: 'Player 4',
          isBot: true,
          teamId: 'team2' as TeamId,
          avatar: 'avatar4',
          ranking: 1200,
        },
      ],
      teams: [
        {
          id: 'team1' as TeamId,
          playerIds: ['p1' as PlayerId, 'p3' as PlayerId],
          score: 0, // Vueltas current score
          cardPoints: 0,
          cantes: [],
        },
        {
          id: 'team2' as TeamId,
          playerIds: ['p2' as PlayerId, 'p4' as PlayerId],
          score: 0, // Vueltas current score
          cardPoints: 0,
          cantes: [],
        },
      ],
      hands: new Map([
        ['p1' as PlayerId, [deck[1], deck[2], deck[3]]],
        ['p2' as PlayerId, [deck[4], deck[5], deck[6]]],
        ['p3' as PlayerId, [deck[7], deck[8], deck[9]]],
        ['p4' as PlayerId, [deck[10], deck[11], deck[12]]],
      ]),
      deck: [], // Empty deck in vueltas
      trumpCard,
      trumpSuit: trumpCard.suit,
      currentPlayerIndex: 0,
      currentTrick: [],
      dealerIndex: 3,
      trickCount: 0,
      trickWins: new Map(),
      collectedTricks: new Map(),
      teamTrickPiles: new Map(),
      canCambiar7: false,
      gameHistory: [],
      isVueltas: true,
      initialScores: new Map([
        ['team1' as TeamId, 80], // Idas score
        ['team2' as TeamId, 60], // Idas score
      ]),
      canDeclareVictory: false,
      matchScore: {
        team1Partidas: 0,
        team2Partidas: 0,
        team1Cotos: 0,
        team2Cotos: 0,
        partidasPerCoto: 3,
        cotosPerMatch: 2,
      },
    };
  }

  test('should not trigger scoring phase after each trick in vueltas', () => {
    const gameState = createVueltasGameState();

    // Play first card (player 0's turn)
    let newState = playCard(gameState, 'p1' as PlayerId, gameState.hands.get('p1' as PlayerId)![0]);
    expect(newState?.phase).toBe('playing');

    // Play second card (player 3's turn after p1 plays - counter-clockwise)
    const p4Card = newState!.hands.get('p4' as PlayerId)![0];
    newState = playCard(newState!, 'p4' as PlayerId, p4Card);
    expect(newState?.phase).toBe('playing');

    // Play third card (player 2's turn)
    const p3Card = newState!.hands.get('p3' as PlayerId)![0];
    newState = playCard(newState!, 'p3' as PlayerId, p3Card);
    expect(newState?.phase).toBe('playing');

    // Play fourth card (player 1's turn) - completes the trick
    const p2Card = newState!.hands.get('p2' as PlayerId)![0];
    newState = playCard(newState!, 'p2' as PlayerId, p2Card);

    // Should still be in playing phase, not scoring
    expect(newState?.phase).toBe('playing');
    expect(newState?.currentTrick.length).toBe(0); // Trick should be cleared
    expect(newState?.trickCount).toBe(1); // Trick count should increase
  });

  test('should update scores after each trick in vueltas', () => {
    const gameState = createVueltasGameState();

    // Give team1 high value cards to ensure they win
    const highCards = createDeck().filter(c => c.value === 1 || c.value === 3); // Aces and 3s
    gameState.hands.set('p1' as PlayerId, [highCards[0], highCards[1], highCards[2]]);

    // Play a complete trick (counter-clockwise order)
    let newState = playCard(gameState, 'p1' as PlayerId, gameState.hands.get('p1' as PlayerId)![0]);
    const p4Card = newState!.hands.get('p4' as PlayerId)![0];
    newState = playCard(newState!, 'p4' as PlayerId, p4Card);
    const p3Card = newState!.hands.get('p3' as PlayerId)![0];
    newState = playCard(newState!, 'p3' as PlayerId, p3Card);
    const p2Card = newState!.hands.get('p2' as PlayerId)![0];
    newState = playCard(newState!, 'p2' as PlayerId, p2Card);

    // Check that scores are updated
    const team1 = newState?.teams.find(t => t.id === ('team1' as TeamId));
    const team2 = newState?.teams.find(t => t.id === ('team2' as TeamId));

    // At least one team should have points (whoever won the trick)
    const totalPoints = (team1?.score || 0) + (team2?.score || 0);
    expect(totalPoints).toBeGreaterThan(0);
  });

  test('should only go to scoring phase when all cards are played in vueltas', () => {
    const gameState = createVueltasGameState();

    // Set up state with only one card per player (last trick)
    const deck = createDeck();
    gameState.hands = new Map([
      ['p1' as PlayerId, [deck[0]]],
      ['p2' as PlayerId, [deck[1]]],
      ['p3' as PlayerId, [deck[2]]],
      ['p4' as PlayerId, [deck[3]]],
    ]);

    // Play the last trick (counter-clockwise)
    let newState = playCard(gameState, 'p1' as PlayerId, gameState.hands.get('p1' as PlayerId)![0]);
    expect(newState?.phase).toBe('playing');

    newState = playCard(newState!, 'p4' as PlayerId, newState!.hands.get('p4' as PlayerId)![0]);
    expect(newState?.phase).toBe('playing');

    newState = playCard(newState!, 'p3' as PlayerId, newState!.hands.get('p3' as PlayerId)![0]);
    expect(newState?.phase).toBe('playing');

    // Last card - should trigger scoring phase
    newState = playCard(newState!, 'p2' as PlayerId, newState!.hands.get('p2' as PlayerId)![0]);
    expect(newState?.phase).toBe('scoring');
  });

  test('should continue playing when a team reaches 101 combined points mid-vueltas', () => {
    const gameState = createVueltasGameState();

    // Set team1's current score to 20 (with initial 80 = 100 total)
    gameState.teams[0].score = 20;

    // Give team1 an ace to win the trick and get points
    const deck = createDeck();
    const ace = deck.find(c => c.value === 1)!;
    gameState.hands.set('p1' as PlayerId, [ace, deck[10], deck[11]]);

    // Play a trick where team1 wins with the ace (counter-clockwise)
    let newState = playCard(gameState, 'p1' as PlayerId, ace);
    newState = playCard(newState!, 'p4' as PlayerId, newState!.hands.get('p4' as PlayerId)![0]);
    newState = playCard(newState!, 'p3' as PlayerId, newState!.hands.get('p3' as PlayerId)![0]);
    newState = playCard(newState!, 'p2' as PlayerId, newState!.hands.get('p2' as PlayerId)![0]);

    // Team1 should now have enough points to reach 101 combined
    const team1 = newState?.teams[0];
    const team1Total = (gameState.initialScores?.get('team1' as TeamId) || 0) + (team1?.score || 0);

    // Even if team reached 101, phase should remain playing until all cards are played
    // (based on our fix)
    expect(team1Total).toBeGreaterThanOrEqual(101);
    expect(newState?.phase).toBe('playing'); // Should continue playing, not go to scoring yet
  });
});
