import { describe, expect, test } from '@jest/globals';
import { createInitialGameState } from './gameStateFactory';
import type { TeamId } from '../types/game.types';

describe('gameStateFactory', () => {
  describe('mapPersonality', () => {
    test('creates game state with mapped aggressive personality', () => {
      const playerInfos = [
        { id: 'p1', name: 'Player 1', avatar: 'a1', ranking: 1000, teamId: 'team1' as TeamId, isBot: true, personality: 'aggressive' as const, difficulty: 'medium' as const },
        { id: 'p2', name: 'Player 2', avatar: 'a2', ranking: 1000, teamId: 'team2' as TeamId, isBot: false },
        { id: 'p3', name: 'Player 3', avatar: 'a3', ranking: 1000, teamId: 'team1' as TeamId, isBot: false },
        { id: 'p4', name: 'Player 4', avatar: 'a4', ranking: 1000, teamId: 'team2' as TeamId, isBot: false },
      ];

      const gameState = createInitialGameState(playerInfos);
      
      expect(gameState.players[0].personality).toBe('aggressive');
    });

    test('maps balanced personality to prudent', () => {
      const playerInfos = [
        { id: 'p1', name: 'Player 1', avatar: 'a1', ranking: 1000, teamId: 'team1' as TeamId, isBot: true, personality: 'balanced' as const, difficulty: 'medium' as const },
        { id: 'p2', name: 'Player 2', avatar: 'a2', ranking: 1000, teamId: 'team2' as TeamId, isBot: false },
        { id: 'p3', name: 'Player 3', avatar: 'a3', ranking: 1000, teamId: 'team1' as TeamId, isBot: false },
        { id: 'p4', name: 'Player 4', avatar: 'a4', ranking: 1000, teamId: 'team2' as TeamId, isBot: false },
      ];

      const gameState = createInitialGameState(playerInfos);
      
      expect(gameState.players[0].personality).toBe('prudent');
    });

    test('maps defensive personality to prudent', () => {
      const playerInfos = [
        { id: 'p1', name: 'Player 1', avatar: 'a1', ranking: 1000, teamId: 'team1' as TeamId, isBot: true, personality: 'defensive' as const, difficulty: 'medium' as const },
        { id: 'p2', name: 'Player 2', avatar: 'a2', ranking: 1000, teamId: 'team2' as TeamId, isBot: false },
        { id: 'p3', name: 'Player 3', avatar: 'a3', ranking: 1000, teamId: 'team1' as TeamId, isBot: false },
        { id: 'p4', name: 'Player 4', avatar: 'a4', ranking: 1000, teamId: 'team2' as TeamId, isBot: false },
      ];

      const gameState = createInitialGameState(playerInfos);
      
      expect(gameState.players[0].personality).toBe('prudent');
    });

    test('maps unpredictable personality to tricky', () => {
      const playerInfos = [
        { id: 'p1', name: 'Player 1', avatar: 'a1', ranking: 1000, teamId: 'team1' as TeamId, isBot: true, personality: 'unpredictable' as const, difficulty: 'medium' as const },
        { id: 'p2', name: 'Player 2', avatar: 'a2', ranking: 1000, teamId: 'team2' as TeamId, isBot: false },
        { id: 'p3', name: 'Player 3', avatar: 'a3', ranking: 1000, teamId: 'team1' as TeamId, isBot: false },
        { id: 'p4', name: 'Player 4', avatar: 'a4', ranking: 1000, teamId: 'team2' as TeamId, isBot: false },
      ];

      const gameState = createInitialGameState(playerInfos);
      
      expect(gameState.players[0].personality).toBe('tricky');
    });

    test('handles undefined personality for non-bot players', () => {
      const playerInfos = [
        { id: 'p1', name: 'Player 1', avatar: 'a1', ranking: 1000, teamId: 'team1' as TeamId, isBot: false },
        { id: 'p2', name: 'Player 2', avatar: 'a2', ranking: 1000, teamId: 'team2' as TeamId, isBot: false },
        { id: 'p3', name: 'Player 3', avatar: 'a3', ranking: 1000, teamId: 'team1' as TeamId, isBot: false },
        { id: 'p4', name: 'Player 4', avatar: 'a4', ranking: 1000, teamId: 'team2' as TeamId, isBot: false },
      ];

      const gameState = createInitialGameState(playerInfos);
      
      expect(gameState.players[0].personality).toBeUndefined();
    });

    test('handles bot with undefined personality', () => {
      const playerInfos = [
        { id: 'p1', name: 'Bot 1', avatar: 'a1', ranking: 1000, teamId: 'team1' as TeamId, isBot: true, difficulty: 'medium' as const },
        { id: 'p2', name: 'Player 2', avatar: 'a2', ranking: 1000, teamId: 'team2' as TeamId, isBot: false },
        { id: 'p3', name: 'Player 3', avatar: 'a3', ranking: 1000, teamId: 'team1' as TeamId, isBot: false },
        { id: 'p4', name: 'Player 4', avatar: 'a4', ranking: 1000, teamId: 'team2' as TeamId, isBot: false },
      ];

      const gameState = createInitialGameState(playerInfos);
      
      // Bot with no personality should have undefined personality
      expect(gameState.players[0].personality).toBeUndefined();
    });
  });
});