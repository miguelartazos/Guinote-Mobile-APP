import type { PlayerId } from '../types/game.types';
import type { PlayerPosition } from '../types/slots.types';

/**
 * Single source of truth for player positions
 * Maps any PlayerId format to consistent PlayerPosition (0-3)
 */
export class PlayerPositionRegistry {
  private static instance: PlayerPositionRegistry;
  private playerMap: Map<PlayerId, PlayerPosition> = new Map();

  private constructor() {}

  static getInstance(): PlayerPositionRegistry {
    if (!PlayerPositionRegistry.instance) {
      PlayerPositionRegistry.instance = new PlayerPositionRegistry();
    }
    return PlayerPositionRegistry.instance;
  }

  /**
   * Register players with their positions
   * @param players Array of player IDs in order: [bottom, right, top, left]
   */
  registerPlayers(players: [PlayerId, PlayerId, PlayerId, PlayerId]): void {
    this.playerMap.clear();
    this.playerMap.set(players[0], 0); // bottom
    this.playerMap.set(players[1], 1); // right
    this.playerMap.set(players[2], 2); // top
    this.playerMap.set(players[3], 3); // left
  }

  /**
   * Get player position from ID
   */
  getPosition(playerId: PlayerId): PlayerPosition {
    const position = this.playerMap.get(playerId);
    if (position === undefined) {
      console.warn(`Player ${playerId} not found in registry, defaulting to position 0`);
      return 0;
    }
    return position;
  }

  /**
   * Get player ID from position
   */
  getPlayerId(position: PlayerPosition): PlayerId | undefined {
    for (const [id, pos] of this.playerMap.entries()) {
      if (pos === position) {
        return id;
      }
    }
    return undefined;
  }

  /**
   * Check if player is registered
   */
  hasPlayer(playerId: PlayerId): boolean {
    return this.playerMap.has(playerId);
  }

  /**
   * Get all registered players in position order
   */
  getAllPlayers(): [PlayerId, PlayerId, PlayerId, PlayerId] | null {
    const players: (PlayerId | undefined)[] = [undefined, undefined, undefined, undefined];

    for (const [id, pos] of this.playerMap.entries()) {
      players[pos] = id;
    }

    if (players.every(p => p !== undefined)) {
      return players as [PlayerId, PlayerId, PlayerId, PlayerId];
    }

    return null;
  }

  /**
   * Clear the registry
   */
  clear(): void {
    this.playerMap.clear();
  }
}

// Export singleton instance
export const playerRegistry = PlayerPositionRegistry.getInstance();
