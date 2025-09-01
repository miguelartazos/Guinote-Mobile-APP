import { describe, it, expect } from '@jest/globals';
import {
  createInitialMatchScore,
  updateMatchScoreForPartida,
  isMatchComplete,
  startNewPartida,
  processVueltasCompletion,
  initializeVueltasState,
  determineVueltasWinner,
} from './gameLogic';
import type { GameState, TeamId, MatchScore } from '../types/game.types';

describe('Match Flow - Complete Game Progression', () => {
  // Helper to create a mock game state
  function createMockGameState(overrides?: Partial<GameState>): GameState {
    const defaultState: GameState = {
      id: 'test-game' as any,
      phase: 'scoring',
      players: [
        { id: 'p1' as any, name: 'Player 1', teamId: 'team1' as TeamId, isBot: false } as any,
        { id: 'p2' as any, name: 'Player 2', teamId: 'team2' as TeamId, isBot: true } as any,
        { id: 'p3' as any, name: 'Player 3', teamId: 'team1' as TeamId, isBot: true } as any,
        { id: 'p4' as any, name: 'Player 4', teamId: 'team2' as TeamId, isBot: true } as any,
      ],
      teams: [
        { id: 'team1' as TeamId, playerIds: ['p1' as any, 'p3' as any], score: 0, cardPoints: 0, cantes: [] },
        { id: 'team2' as TeamId, playerIds: ['p2' as any, 'p4' as any], score: 0, cardPoints: 0, cantes: [] },
      ],
      deck: [],
      hands: new Map(),
      trumpSuit: 'oros',
      trumpCard: { id: 'trump' as any, suit: 'oros', value: 7 },
      currentTrick: [],
      currentPlayerIndex: 0,
      dealerIndex: 3,
      trickCount: 20,
      trickWins: new Map(),
      collectedTricks: new Map(),
      teamTrickPiles: new Map(),
      canCambiar7: false,
      gameHistory: [],
      isVueltas: false,
      canDeclareVictory: false,
      matchScore: createInitialMatchScore(),
      ...overrides,
    };
    return defaultState;
  }

  describe('Partida Progression', () => {
    it('should handle team winning first hand (idas) with 101+ points', () => {
      const initialScore = createInitialMatchScore();
      const state = createMockGameState({
        teams: [
          { id: 'team1' as TeamId, playerIds: ['p1' as any, 'p3' as any], score: 105, cardPoints: 95, cantes: [] },
          { id: 'team2' as TeamId, playerIds: ['p2' as any, 'p4' as any], score: 65, cardPoints: 55, cantes: [] },
        ],
        matchScore: initialScore,
      });

      // Team 1 wins the partida
      const updatedScore = updateMatchScoreForPartida(initialScore, 0);
      expect(updatedScore.team1Partidas).toBe(1);
      expect(updatedScore.team2Partidas).toBe(0);
      expect(updatedScore.team1Cotos).toBe(0); // No coto yet
    });

    it('should start vueltas when no team reaches 101 in first hand', () => {
      const state = createMockGameState({
        teams: [
          { id: 'team1' as TeamId, playerIds: ['p1' as any, 'p3' as any], score: 85, cardPoints: 75, cantes: [] },
          { id: 'team2' as TeamId, playerIds: ['p2' as any, 'p4' as any], score: 75, cardPoints: 65, cantes: [] },
        ],
      });

      const vueltasState = initializeVueltasState(state);
      
      expect(vueltasState.isVueltas).toBe(true);
      expect(vueltasState.phase).toBe('dealing');
      expect(vueltasState.initialScores?.get('team1' as TeamId)).toBe(85);
      expect(vueltasState.initialScores?.get('team2' as TeamId)).toBe(75);
      // Teams should have reset scores for vueltas hand
      expect(vueltasState.teams[0].score).toBe(0);
      expect(vueltasState.teams[1].score).toBe(0);
    });

    it('should determine vueltas winner correctly', () => {
      const initialScores = new Map<TeamId, number>();
      initialScores.set('team1' as TeamId, 85);
      initialScores.set('team2' as TeamId, 75);

      const state = createMockGameState({
        isVueltas: true,
        initialScores,
        teams: [
          { id: 'team1' as TeamId, playerIds: ['p1' as any, 'p3' as any], score: 20, cardPoints: 20, cantes: [] },
          { id: 'team2' as TeamId, playerIds: ['p2' as any, 'p4' as any], score: 40, cardPoints: 40, cantes: [] },
        ],
      });

      // Team 2 wins vueltas: 75 + 40 = 115 > 85 + 20 = 105
      const winner = determineVueltasWinner(state);
      expect(winner).toBe('team2');
    });

    it('should process vueltas completion and update match score', () => {
      const initialScores = new Map<TeamId, number>();
      initialScores.set('team1' as TeamId, 85);
      initialScores.set('team2' as TeamId, 75);

      const state = createMockGameState({
        isVueltas: true,
        initialScores,
        teams: [
          { id: 'team1' as TeamId, playerIds: ['p1' as any, 'p3' as any], score: 20, cardPoints: 20, cantes: [] },
          { id: 'team2' as TeamId, playerIds: ['p2' as any, 'p4' as any], score: 40, cardPoints: 40, cantes: [] },
        ],
        matchScore: createInitialMatchScore(),
      });

      const newState = processVueltasCompletion(state);
      
      // Should have updated match score for team 2 winning
      expect(newState.matchScore?.team2Partidas).toBe(1);
      expect(newState.matchScore?.team1Partidas).toBe(0);
      
      // Should start new partida
      expect(newState.phase).toBe('dealing');
      expect(newState.isVueltas).toBe(false);
      expect(newState.teams[0].score).toBe(0);
      expect(newState.teams[1].score).toBe(0);
    });
  });

  describe('Coto Progression', () => {
    it('should award coto when team wins 3 partidas', () => {
      let matchScore = createInitialMatchScore();
      
      // Team 1 wins 3 partidas
      matchScore = updateMatchScoreForPartida(matchScore, 0);
      expect(matchScore.team1Partidas).toBe(1);
      expect(matchScore.team1Cotos).toBe(0);
      
      matchScore = updateMatchScoreForPartida(matchScore, 0);
      expect(matchScore.team1Partidas).toBe(2);
      expect(matchScore.team1Cotos).toBe(0);
      
      matchScore = updateMatchScoreForPartida(matchScore, 0);
      expect(matchScore.team1Partidas).toBe(0); // Reset
      expect(matchScore.team1Cotos).toBe(1); // Coto awarded!
    });

    it('should reset partida count after coto is won', () => {
      let matchScore = createInitialMatchScore();
      
      // Team 1 wins a coto
      matchScore = updateMatchScoreForPartida(matchScore, 0);
      matchScore = updateMatchScoreForPartida(matchScore, 0);
      matchScore = updateMatchScoreForPartida(matchScore, 0);
      
      expect(matchScore.team1Cotos).toBe(1);
      expect(matchScore.team1Partidas).toBe(0); // Reset after coto
      
      // Team 2 wins next partida
      matchScore = updateMatchScoreForPartida(matchScore, 1);
      expect(matchScore.team2Partidas).toBe(1);
      expect(matchScore.team1Partidas).toBe(0);
    });
  });

  describe('Match Completion', () => {
    it('should complete match when team wins 2 cotos', () => {
      let matchScore = createInitialMatchScore();
      
      // Team 1 wins first coto (3 partidas)
      for (let i = 0; i < 3; i++) {
        matchScore = updateMatchScoreForPartida(matchScore, 0);
      }
      expect(matchScore.team1Cotos).toBe(1);
      expect(isMatchComplete(matchScore)).toBe(false);
      
      // Team 1 wins second coto (3 more partidas)
      for (let i = 0; i < 3; i++) {
        matchScore = updateMatchScoreForPartida(matchScore, 0);
      }
      expect(matchScore.team1Cotos).toBe(2);
      expect(isMatchComplete(matchScore)).toBe(true);
    });

    it('should handle mixed coto wins', () => {
      let matchScore = createInitialMatchScore();
      
      // Team 1 wins first coto
      for (let i = 0; i < 3; i++) {
        matchScore = updateMatchScoreForPartida(matchScore, 0);
      }
      expect(matchScore.team1Cotos).toBe(1);
      
      // Team 2 wins second coto
      for (let i = 0; i < 3; i++) {
        matchScore = updateMatchScoreForPartida(matchScore, 1);
      }
      expect(matchScore.team2Cotos).toBe(1);
      expect(isMatchComplete(matchScore)).toBe(false);
      
      // Team 1 wins third coto - match complete
      for (let i = 0; i < 3; i++) {
        matchScore = updateMatchScoreForPartida(matchScore, 0);
      }
      expect(matchScore.team1Cotos).toBe(2);
      expect(isMatchComplete(matchScore)).toBe(true);
    });
  });

  describe('Dealer Rotation', () => {
    it('should rotate dealer between partidas', () => {
      const state = createMockGameState({
        dealerIndex: 2,
        matchScore: createInitialMatchScore(),
      });

      const newPartidaState = startNewPartida(state, state.matchScore!);
      
      // Dealer should rotate to next player
      expect(newPartidaState.dealerIndex).toBe(3);
      // Mano (first player) should be to dealer's right
      expect(newPartidaState.currentPlayerIndex).toBe(2);
    });

    it('should wrap dealer rotation correctly', () => {
      const state = createMockGameState({
        dealerIndex: 3,
        matchScore: createInitialMatchScore(),
      });

      const newPartidaState = startNewPartida(state, state.matchScore!);
      
      // Dealer should wrap to 0
      expect(newPartidaState.dealerIndex).toBe(0);
      // Mano should be player 3 (to dealer's right)
      expect(newPartidaState.currentPlayerIndex).toBe(3);
    });
  });
});