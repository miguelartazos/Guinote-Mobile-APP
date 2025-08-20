import { describe, test, expect, beforeEach } from '@jest/globals';
import { PlayerPositionRegistry } from './playerRegistry';
import type { PlayerId } from '../types/game.types';

const makePlayerId = (id: string): PlayerId => id as PlayerId;

describe('PlayerPositionRegistry', () => {
  let registry: PlayerPositionRegistry;

  beforeEach(() => {
    registry = new PlayerPositionRegistry();
    registry.clear();
  });

  describe('registerPlayers', () => {
    test('registers players in correct positions', () => {
      const players: [PlayerId, PlayerId, PlayerId, PlayerId] = [
        makePlayerId('player'),
        makePlayerId('bot1'),
        makePlayerId('bot2'),
        makePlayerId('bot3'),
      ];

      registry.registerPlayers(players);

      expect(registry.getPosition(makePlayerId('player'))).toBe(0); // bottom
      expect(registry.getPosition(makePlayerId('bot1'))).toBe(1); // right
      expect(registry.getPosition(makePlayerId('bot2'))).toBe(2); // top
      expect(registry.getPosition(makePlayerId('bot3'))).toBe(3); // left
    });

    test('overwrites previous registration', () => {
      registry.registerPlayers([
        makePlayerId('a'),
        makePlayerId('b'),
        makePlayerId('c'),
        makePlayerId('d'),
      ]);
      registry.registerPlayers([
        makePlayerId('w'),
        makePlayerId('x'),
        makePlayerId('y'),
        makePlayerId('z'),
      ]);

      expect(registry.hasPlayer(makePlayerId('a'))).toBe(false);
      expect(registry.hasPlayer(makePlayerId('w'))).toBe(true);
      expect(registry.getPosition(makePlayerId('w'))).toBe(0);
    });
  });

  describe('getPosition', () => {
    test('returns correct position for registered player', () => {
      registry.registerPlayers([
        makePlayerId('p0'),
        makePlayerId('p1'),
        makePlayerId('p2'),
        makePlayerId('p3'),
      ]);
      expect(registry.getPosition(makePlayerId('p2'))).toBe(2);
    });

    test('returns 0 for unregistered player', () => {
      registry.registerPlayers([
        makePlayerId('p0'),
        makePlayerId('p1'),
        makePlayerId('p2'),
        makePlayerId('p3'),
      ]);
      expect(registry.getPosition(makePlayerId('unknown'))).toBe(0);
    });
  });

  describe('getPlayerId', () => {
    test('returns player ID for given position', () => {
      registry.registerPlayers([
        makePlayerId('alice'),
        makePlayerId('bob'),
        makePlayerId('charlie'),
        makePlayerId('dave'),
      ]);

      expect(registry.getPlayerId(0)).toBe('alice');
      expect(registry.getPlayerId(1)).toBe('bob');
      expect(registry.getPlayerId(2)).toBe('charlie');
      expect(registry.getPlayerId(3)).toBe('dave');
    });

    test('returns undefined for unregistered position', () => {
      expect(registry.getPlayerId(0)).toBeUndefined();
    });
  });

  describe('hasPlayer', () => {
    test('checks if player is registered', () => {
      registry.registerPlayers([
        makePlayerId('a'),
        makePlayerId('b'),
        makePlayerId('c'),
        makePlayerId('d'),
      ]);

      expect(registry.hasPlayer(makePlayerId('a'))).toBe(true);
      expect(registry.hasPlayer(makePlayerId('b'))).toBe(true);
      expect(registry.hasPlayer(makePlayerId('unknown'))).toBe(false);
    });
  });

  describe('getAllPlayers', () => {
    test('returns all players in position order', () => {
      const players: [PlayerId, PlayerId, PlayerId, PlayerId] = [
        makePlayerId('bottom'),
        makePlayerId('right'),
        makePlayerId('top'),
        makePlayerId('left'),
      ];

      registry.registerPlayers(players);
      expect(registry.getAllPlayers()).toEqual(players);
    });

    test('returns null when not all positions are filled', () => {
      // Empty registry
      expect(registry.getAllPlayers()).toBeNull();
    });
  });

  describe('clear', () => {
    test('removes all registered players', () => {
      registry.registerPlayers([
        makePlayerId('a'),
        makePlayerId('b'),
        makePlayerId('c'),
        makePlayerId('d'),
      ]);
      registry.clear();

      expect(registry.hasPlayer(makePlayerId('a'))).toBe(false);
      expect(registry.getAllPlayers()).toBeNull();
    });
  });

  describe('singleton pattern', () => {
    test('returns same instance', () => {
      const instance1 = PlayerPositionRegistry.getInstance();
      const instance2 = PlayerPositionRegistry.getInstance();

      expect(instance1).toBe(instance2);
    });
  });

  describe('edge cases', () => {
    test('handles different player ID formats', () => {
      const players: [PlayerId, PlayerId, PlayerId, PlayerId] = [
        makePlayerId('player0'),
        makePlayerId('player1'),
        makePlayerId('player2'),
        makePlayerId('player3'),
      ];

      registry.registerPlayers(players);
      expect(registry.getPosition(makePlayerId('player0'))).toBe(0);
      expect(registry.getPosition(makePlayerId('player3'))).toBe(3);
    });

    test('handles special characters in player IDs', () => {
      const players: [PlayerId, PlayerId, PlayerId, PlayerId] = [
        makePlayerId('user@123'),
        makePlayerId('bot-1'),
        makePlayerId('player_2'),
        makePlayerId('AI.3'),
      ];

      registry.registerPlayers(players);
      expect(registry.getPosition(makePlayerId('user@123'))).toBe(0);
      expect(registry.getPosition(makePlayerId('AI.3'))).toBe(3);
    });
  });
});
