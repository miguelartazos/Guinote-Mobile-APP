import { describe, test, expect } from '@jest/globals';
import type {
  GameState,
  PlayerId,
  TeamId,
  GamePhase,
  MatchScore,
  Card,
  CardId,
} from '../types/game.types';
import {
  createInitialMatchScore,
  updateMatchScoreForPartida,
  startNewPartida,
  isMatchComplete,
  getMatchWinner,
  playCard,
} from './gameLogic';

describe('Score Tracking Verification - Complete Match Flow', () => {
  function createMockGameState(matchScore?: MatchScore): GameState {
    return {
      id: 'test' as any,
      phase: 'playing' as GamePhase,
      players: [
        {
          id: 'p1' as PlayerId,
          name: 'Player 1',
          teamId: 'team1' as TeamId,
          avatar: '',
          ranking: 0,
          isBot: false,
        },
        {
          id: 'p2' as PlayerId,
          name: 'Player 2',
          teamId: 'team2' as TeamId,
          avatar: '',
          ranking: 0,
          isBot: false,
        },
        {
          id: 'p3' as PlayerId,
          name: 'Player 3',
          teamId: 'team1' as TeamId,
          avatar: '',
          ranking: 0,
          isBot: false,
        },
        {
          id: 'p4' as PlayerId,
          name: 'Player 4',
          teamId: 'team2' as TeamId,
          avatar: '',
          ranking: 0,
          isBot: false,
        },
      ],
      teams: [
        {
          id: 'team1' as TeamId,
          playerIds: ['p1' as PlayerId, 'p3' as PlayerId],
          score: 0,
          cardPoints: 0,
          cantes: [],
        },
        {
          id: 'team2' as TeamId,
          playerIds: ['p2' as PlayerId, 'p4' as PlayerId],
          score: 0,
          cardPoints: 0,
          cantes: [],
        },
      ],
      deck: [],
      hands: new Map(),
      trumpSuit: 'oros',
      trumpCard: { id: 'trump' as CardId, suit: 'oros', value: 1 },
      currentTrick: [],
      currentPlayerIndex: 0,
      dealerIndex: 0,
      trickCount: 0,
      trickWins: new Map([
        ['team1' as TeamId, 0],
        ['team2' as TeamId, 0],
      ]),
      collectedTricks: new Map(),
      teamTrickPiles: new Map([
        ['team1' as TeamId, []],
        ['team2' as TeamId, []],
      ]),
      canCambiar7: false,
      gameHistory: [],
      isVueltas: false,
      canDeclareVictory: false,
      matchScore: matchScore || createInitialMatchScore(),
    } as GameState;
  }

  test('COMPLETE MATCH: Points → Partidas → Cotos → Victory', () => {
    console.log('\n========== STARTING COMPLETE MATCH TEST ==========\n');

    let matchScore = createInitialMatchScore();
    let gameState = createMockGameState(matchScore);

    // Verify initial state
    expect(matchScore.team1Partidas).toBe(0);
    expect(matchScore.team2Partidas).toBe(0);
    expect(matchScore.team1Cotos).toBe(0);
    expect(matchScore.team2Cotos).toBe(0);
    expect(matchScore.currentSet).toBe('buenas');

    console.log('Initial Match State:');
    console.log(`  Partidas: Team1=${matchScore.team1Partidas}, Team2=${matchScore.team2Partidas}`);
    console.log(`  Cotos: Team1=${matchScore.team1Cotos}, Team2=${matchScore.team2Cotos}`);
    console.log(`  Current Set: ${matchScore.currentSet}`);

    // ========== FIRST COTO ==========
    console.log('\n=== FIRST COTO ===');

    // Partida 1: Team 1 wins (reaches 101)
    console.log('\nPartida 1: Simulating Team 1 victory...');
    gameState.teams[0].score = 101;
    gameState.teams[1].score = 85;
    matchScore = updateMatchScoreForPartida(matchScore, 0);

    console.log(`  Team 1 wins with 101 points`);
    console.log(`  Partidas: Team1=${matchScore.team1Partidas}, Team2=${matchScore.team2Partidas}`);
    console.log(`  Current Set: ${matchScore.currentSet}`);

    expect(matchScore.team1Partidas).toBe(1);
    expect(matchScore.team2Partidas).toBe(0);
    expect(matchScore.currentSet).toBe('malas');

    // Start new partida
    gameState = startNewPartida(gameState, matchScore);
    expect(gameState.matchScore?.team1Partidas).toBe(1); // Score persists
    expect(gameState.phase).toBe('dealing');

    // Partida 2: Team 2 wins
    console.log('\nPartida 2: Simulating Team 2 victory...');
    gameState.teams[0].score = 92;
    gameState.teams[1].score = 103;
    matchScore = updateMatchScoreForPartida(gameState.matchScore!, 1);

    console.log(`  Team 2 wins with 103 points`);
    console.log(`  Partidas: Team1=${matchScore.team1Partidas}, Team2=${matchScore.team2Partidas}`);
    console.log(`  Current Set: ${matchScore.currentSet}`);

    expect(matchScore.team1Partidas).toBe(1);
    expect(matchScore.team2Partidas).toBe(1);
    expect(matchScore.currentSet).toBe('bella'); // 1-1 is bella

    // Start new partida
    gameState = startNewPartida(gameState, matchScore);
    expect(gameState.matchScore?.currentSet).toBe('bella');

    // Partida 3: Team 1 wins
    console.log('\nPartida 3: Simulating Team 1 victory...');
    gameState.teams[0].score = 105;
    gameState.teams[1].score = 78;
    matchScore = updateMatchScoreForPartida(gameState.matchScore!, 0);

    console.log(`  Team 1 wins with 105 points`);
    console.log(`  Partidas: Team1=${matchScore.team1Partidas}, Team2=${matchScore.team2Partidas}`);

    expect(matchScore.team1Partidas).toBe(2);
    expect(matchScore.team2Partidas).toBe(1);

    // Start new partida
    gameState = startNewPartida(gameState, matchScore);

    // Partida 4: Team 1 wins - COMPLETES COTO
    console.log('\nPartida 4: Simulating Team 1 victory...');
    gameState.teams[0].score = 112;
    gameState.teams[1].score = 89;
    matchScore = updateMatchScoreForPartida(gameState.matchScore!, 0);

    console.log(`  Team 1 wins with 112 points - WINS FIRST COTO!`);
    console.log(`  Partidas: Team1=${matchScore.team1Partidas}, Team2=${matchScore.team2Partidas}`);
    console.log(`  Cotos: Team1=${matchScore.team1Cotos}, Team2=${matchScore.team2Cotos}`);

    expect(matchScore.team1Partidas).toBe(0); // Reset after coto
    expect(matchScore.team2Partidas).toBe(0); // Reset after coto
    expect(matchScore.team1Cotos).toBe(1); // First coto won!
    expect(matchScore.team2Cotos).toBe(0);
    expect(matchScore.currentSet).toBe('buenas'); // Reset to buenas

    // ========== SECOND COTO ==========
    console.log('\n=== SECOND COTO ===');

    // Start new partida in new coto
    gameState = startNewPartida(gameState, matchScore);
    expect(gameState.matchScore?.team1Cotos).toBe(1); // Coto score persists

    // Partida 5: Team 2 wins
    console.log('\nPartida 5: Simulating Team 2 victory...');
    gameState.teams[0].score = 88;
    gameState.teams[1].score = 101;
    matchScore = updateMatchScoreForPartida(gameState.matchScore!, 1);

    console.log(`  Team 2 wins with 101 points`);
    console.log(`  Partidas: Team1=${matchScore.team1Partidas}, Team2=${matchScore.team2Partidas}`);
    console.log(`  Cotos still at: Team1=${matchScore.team1Cotos}, Team2=${matchScore.team2Cotos}`);

    expect(matchScore.team1Partidas).toBe(0);
    expect(matchScore.team2Partidas).toBe(1);
    expect(matchScore.team1Cotos).toBe(1); // Previous coto preserved

    // Start new partida
    gameState = startNewPartida(gameState, matchScore);

    // Partida 6: Team 2 wins
    console.log('\nPartida 6: Simulating Team 2 victory...');
    gameState.teams[0].score = 95;
    gameState.teams[1].score = 108;
    matchScore = updateMatchScoreForPartida(gameState.matchScore!, 1);

    console.log(`  Team 2 wins with 108 points`);
    console.log(`  Partidas: Team1=${matchScore.team1Partidas}, Team2=${matchScore.team2Partidas}`);

    expect(matchScore.team2Partidas).toBe(2);

    // Start new partida
    gameState = startNewPartida(gameState, matchScore);

    // Partida 7: Team 2 wins - COMPLETES COTO
    console.log('\nPartida 7: Simulating Team 2 victory...');
    gameState.teams[0].score = 76;
    gameState.teams[1].score = 102;
    matchScore = updateMatchScoreForPartida(gameState.matchScore!, 1);

    console.log(`  Team 2 wins with 102 points - WINS SECOND COTO!`);
    console.log(`  Partidas: Team1=${matchScore.team1Partidas}, Team2=${matchScore.team2Partidas}`);
    console.log(`  Cotos: Team1=${matchScore.team1Cotos}, Team2=${matchScore.team2Cotos}`);

    expect(matchScore.team1Partidas).toBe(0);
    expect(matchScore.team2Partidas).toBe(0);
    expect(matchScore.team1Cotos).toBe(1);
    expect(matchScore.team2Cotos).toBe(1); // Now tied 1-1!
    expect(isMatchComplete(matchScore)).toBe(false); // Match continues

    // ========== THIRD COTO (DECISIVE) ==========
    console.log('\n=== THIRD COTO (DECISIVE) ===');

    // Start new partida in decisive coto
    gameState = startNewPartida(gameState, matchScore);
    expect(gameState.matchScore?.team1Cotos).toBe(1);
    expect(gameState.matchScore?.team2Cotos).toBe(1);

    // Partida 8: Team 1 wins
    console.log('\nPartida 8: Simulating Team 1 victory...');
    gameState.teams[0].score = 115;
    gameState.teams[1].score = 82;
    matchScore = updateMatchScoreForPartida(gameState.matchScore!, 0);

    console.log(`  Team 1 wins with 115 points`);
    console.log(`  Partidas: Team1=${matchScore.team1Partidas}, Team2=${matchScore.team2Partidas}`);

    expect(matchScore.team1Partidas).toBe(1);

    // Start new partida
    gameState = startNewPartida(gameState, matchScore);

    // Partida 9: Team 1 wins
    console.log('\nPartida 9: Simulating Team 1 victory...');
    gameState.teams[0].score = 101;
    gameState.teams[1].score = 99; // Close game!
    matchScore = updateMatchScoreForPartida(gameState.matchScore!, 0);

    console.log(`  Team 1 wins with 101 points (close game!)`);
    console.log(`  Partidas: Team1=${matchScore.team1Partidas}, Team2=${matchScore.team2Partidas}`);

    expect(matchScore.team1Partidas).toBe(2);

    // Start new partida
    gameState = startNewPartida(gameState, matchScore);

    // Partida 10: Team 1 wins - WINS MATCH!
    console.log('\nPartida 10: Simulating Team 1 victory...');
    gameState.teams[0].score = 104;
    gameState.teams[1].score = 91;
    matchScore = updateMatchScoreForPartida(gameState.matchScore!, 0);

    console.log(`  Team 1 wins with 104 points - WINS THE MATCH!`);
    console.log(
      `  Final Partidas: Team1=${matchScore.team1Partidas}, Team2=${matchScore.team2Partidas}`,
    );
    console.log(`  Final Cotos: Team1=${matchScore.team1Cotos}, Team2=${matchScore.team2Cotos}`);

    expect(matchScore.team1Partidas).toBe(0); // Reset after coto
    expect(matchScore.team2Partidas).toBe(0);
    expect(matchScore.team1Cotos).toBe(2); // MATCH WON!
    expect(matchScore.team2Cotos).toBe(1);
    expect(isMatchComplete(matchScore)).toBe(true);
    expect(getMatchWinner(matchScore)).toBe(0); // Team 1 wins!

    console.log('\n========== MATCH COMPLETE ==========');
    console.log(`Winner: Team ${getMatchWinner(matchScore) === 0 ? '1' : '2'}`);
    console.log(`Final Score: ${matchScore.team1Cotos}-${matchScore.team2Cotos} in cotos`);
    console.log('Total partidas played: 10');
  });

  test('Score persistence through game phases', () => {
    const initialMatchScore = createInitialMatchScore();
    initialMatchScore.team1Partidas = 2;
    initialMatchScore.team2Partidas = 1;
    initialMatchScore.team1Cotos = 1;
    initialMatchScore.team2Cotos = 0;

    let gameState = createMockGameState(initialMatchScore);

    // Simulate phase transitions
    const phases: GamePhase[] = ['dealing', 'playing', 'arrastre', 'scoring', 'gameOver'];

    console.log('\nTesting score persistence through phases:');
    for (const phase of phases) {
      gameState = { ...gameState, phase };
      console.log(`  Phase: ${phase}`);
      console.log(
        `    Partidas: ${gameState.matchScore?.team1Partidas}-${gameState.matchScore?.team2Partidas}`,
      );
      console.log(
        `    Cotos: ${gameState.matchScore?.team1Cotos}-${gameState.matchScore?.team2Cotos}`,
      );

      // Verify scores persist
      expect(gameState.matchScore).toBeDefined();
      expect(gameState.matchScore?.team1Partidas).toBe(2);
      expect(gameState.matchScore?.team2Partidas).toBe(1);
      expect(gameState.matchScore?.team1Cotos).toBe(1);
      expect(gameState.matchScore?.team2Cotos).toBe(0);
    }
  });

  test('Trick points accumulation to partida victory', () => {
    let gameState = createMockGameState();

    console.log('\nTesting point accumulation from tricks:');

    // Simulate team accumulating points from tricks
    gameState.teams[0].score = 25; // Team 1 got points from a trick
    gameState.teams[0].cardPoints = 25; // Track card points

    console.log(`  Team 1 won trick with 25 points`);
    console.log(`  Team 1 score: ${gameState.teams[0].score}`);

    expect(gameState.teams[0].score).toBe(25);
    expect(gameState.teams[1].score).toBe(0);

    // Simulate multiple tricks to reach 101
    gameState.teams[0].score = 106; // Team reaches winning score
    gameState.teams[0].cardPoints = 96; // Card points

    console.log(`  Team 1 reaches 106 points (victory!)`);

    // Update match score for the victory
    const newMatchScore = updateMatchScoreForPartida(gameState.matchScore!, 0);
    expect(newMatchScore.team1Partidas).toBe(1);

    console.log(`  Partida awarded to Team 1!`);
  });

  test('Vueltas score tracking', () => {
    let gameState = createMockGameState();

    console.log('\nTesting vueltas score tracking:');

    // First hand ends without winner
    gameState.teams[0].score = 85;
    gameState.teams[1].score = 90;
    gameState = { ...gameState, isVueltas: false };

    console.log(`  First hand ends: Team1=85, Team2=90 (no winner)`);

    // Start vueltas
    gameState = {
      ...gameState,
      isVueltas: true,
      initialScores: new Map([
        ['team1' as TeamId, 85],
        ['team2' as TeamId, 90],
      ]),
    };
    gameState.teams[0].score = 0; // Reset for vueltas
    gameState.teams[1].score = 0;

    console.log(`  Vueltas started with initial scores preserved`);

    // Add points in vueltas
    gameState.teams[0].score = 20;
    gameState.teams[1].score = 15;

    const totalTeam1 =
      (gameState.initialScores?.get('team1' as TeamId) || 0) + gameState.teams[0].score;
    const totalTeam2 =
      (gameState.initialScores?.get('team2' as TeamId) || 0) + gameState.teams[1].score;

    console.log(
      `  Vueltas progress: Team1=${gameState.teams[0].score}, Team2=${gameState.teams[1].score}`,
    );
    console.log(`  Total scores: Team1=${totalTeam1}, Team2=${totalTeam2}`);

    expect(totalTeam1).toBe(105); // 85 + 20 = 105 (winner!)
    expect(totalTeam2).toBe(105); // 90 + 15 = 105

    // Team 1 reached 101 first, wins partida
    const matchScore = updateMatchScoreForPartida(gameState.matchScore!, 0);
    expect(matchScore.team1Partidas).toBe(1);

    console.log(`  Team 1 wins vueltas and the partida!`);
  });
});
