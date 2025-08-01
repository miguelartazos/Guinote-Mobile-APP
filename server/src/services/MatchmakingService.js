import { getRedisClient } from '../config/redis.js';
import GameService from './GameService.js';
import Player from '../models/Player.js';

class MatchmakingService {
  constructor() {
    this.redis = getRedisClient();
    this.gameService = new GameService();
    this.matchmakingInterval = null;
    this.QUEUE_KEY = 'matchmaking:queue';
    this.ELO_RANGE_INITIAL = 50;
    this.ELO_RANGE_INCREMENT = 50;
    this.ELO_RANGE_MAX = 500;
    this.MATCHMAKING_INTERVAL = 2000; // 2 seconds
  }

  async addToQueue(socket, gameMode = 'ranked') {
    const queueEntry = {
      playerId: socket.playerId,
      socketId: socket.id,
      elo: socket.player.stats.elo,
      gameMode,
      joinedAt: Date.now(),
    };

    // Add to Redis sorted set (score is ELO for efficient range queries)
    await this.redis.zadd(
      this.QUEUE_KEY,
      socket.player.stats.elo,
      JSON.stringify(queueEntry),
    );

    // Notify player they're in queue
    socket.emit('matchmaking_status', {
      status: 'searching',
      playersInQueue: await this.getQueueSize(),
    });

    console.log(`Player ${socket.player.username} joined matchmaking queue`);
  }

  async removeFromQueue(playerId) {
    // Get all queue entries
    const queueEntries = await this.redis.zrange(this.QUEUE_KEY, 0, -1);

    // Find and remove the player's entry
    for (const entry of queueEntries) {
      const data = JSON.parse(entry);
      if (data.playerId === playerId) {
        await this.redis.zrem(this.QUEUE_KEY, entry);
        console.log(`Player ${playerId} removed from matchmaking queue`);
        break;
      }
    }
  }

  async getQueueSize() {
    return this.redis.zcard(this.QUEUE_KEY);
  }

  startMatchmaking(io) {
    this.io = io;

    // Clear any existing interval
    if (this.matchmakingInterval) {
      clearInterval(this.matchmakingInterval);
    }

    // Start matchmaking loop
    this.matchmakingInterval = setInterval(
      () => this.processMatchmaking(),
      this.MATCHMAKING_INTERVAL,
    );

    console.log('✅ Matchmaking service started');
  }

  async processMatchmaking() {
    try {
      const queueSize = await this.getQueueSize();

      // Need at least 4 players to make a match
      if (queueSize < 4) {
        return;
      }

      // Get all players in queue
      const queueEntries = await this.redis.zrange(this.QUEUE_KEY, 0, -1);
      const players = queueEntries.map(entry => JSON.parse(entry));

      // Sort by wait time (oldest first)
      players.sort((a, b) => a.joinedAt - b.joinedAt);

      // Try to match the oldest player
      const anchorPlayer = players[0];
      const waitTime = Date.now() - anchorPlayer.joinedAt;

      // Calculate ELO range based on wait time
      const eloRange = Math.min(
        this.ELO_RANGE_INITIAL +
          Math.floor(waitTime / 10000) * this.ELO_RANGE_INCREMENT,
        this.ELO_RANGE_MAX,
      );

      // Find compatible players within ELO range
      const compatiblePlayers = players.filter(
        p =>
          p.playerId !== anchorPlayer.playerId &&
          Math.abs(p.elo - anchorPlayer.elo) <= eloRange,
      );

      // Need at least 3 more players
      if (compatiblePlayers.length < 3) {
        // Update waiting players with queue status
        this.updateQueueStatus(players);
        return;
      }

      // Select 3 players to form a match
      const selectedPlayers = [anchorPlayer];

      // Try to balance teams by ELO
      compatiblePlayers.sort(
        (a, b) =>
          Math.abs(a.elo - anchorPlayer.elo) -
          Math.abs(b.elo - anchorPlayer.elo),
      );
      selectedPlayers.push(...compatiblePlayers.slice(0, 3));

      // Create the match
      await this.createMatch(selectedPlayers);
    } catch (error) {
      console.error('Matchmaking error:', error);
    }
  }

  async createMatch(matchedPlayers) {
    try {
      // Remove players from queue
      for (const player of matchedPlayers) {
        await this.removeFromQueue(player.playerId);
      }

      // Load full player data
      const playerIds = matchedPlayers.map(p => p.playerId);
      const players = await Player.find({ _id: { $in: playerIds } });

      // Create game
      const gameState = await this.gameService.createGame(players);

      // Notify all players
      for (const matchedPlayer of matchedPlayers) {
        const socket = this.io.sockets.sockets.get(matchedPlayer.socketId);

        if (socket) {
          socket.join(gameState.roomId);
          socket.emit('match_found', {
            roomId: gameState.roomId,
            players: gameState.players,
            gameState: gameState.gameState,
          });
        }
      }

      console.log(
        `Match created: ${gameState.roomId} with players:`,
        players.map(p => p.username).join(', '),
      );
    } catch (error) {
      console.error('Failed to create match:', error);

      // Re-add players to queue on failure
      for (const player of matchedPlayers) {
        const socket = this.io.sockets.sockets.get(player.socketId);
        if (socket) {
          await this.addToQueue(socket, player.gameMode);
        }
      }
    }
  }

  updateQueueStatus(players) {
    const queueSize = players.length;

    for (const player of players) {
      const socket = this.io.sockets.sockets.get(player.socketId);

      if (socket) {
        const waitTime = Math.floor((Date.now() - player.joinedAt) / 1000);
        const estimatedTime = this.estimateWaitTime(player.elo, queueSize);

        socket.emit('matchmaking_status', {
          status: 'searching',
          playersInQueue: queueSize,
          waitTime,
          estimatedTime,
          eloRange: this.calculateCurrentEloRange(waitTime),
        });
      }
    }
  }

  estimateWaitTime(playerElo, queueSize) {
    // Simple estimation based on queue size and ELO
    const baseTime = 30; // 30 seconds base
    const queueFactor = Math.max(0, 60 - queueSize * 5); // Less time with more players
    const eloFactor = (Math.abs(playerElo - 1000) / 100) * 10; // More time for extreme ELOs

    return Math.max(10, Math.floor(baseTime + queueFactor + eloFactor));
  }

  calculateCurrentEloRange(waitTimeSeconds) {
    const waitTime = waitTimeSeconds * 1000;
    return Math.min(
      this.ELO_RANGE_INITIAL +
        Math.floor(waitTime / 10000) * this.ELO_RANGE_INCREMENT,
      this.ELO_RANGE_MAX,
    );
  }

  stopMatchmaking() {
    if (this.matchmakingInterval) {
      clearInterval(this.matchmakingInterval);
      this.matchmakingInterval = null;
      console.log('⏹️ Matchmaking service stopped');
    }
  }
}

export default MatchmakingService;
