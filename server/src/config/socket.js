import jwt from 'jsonwebtoken';
import { getRedisClient } from './redis.js';
import GameService from '../services/GameService.js';
import MatchmakingService from '../services/MatchmakingService.js';
import Player from '../models/Player.js';

export function setupSocketHandlers(io) {
  // Create services after Redis is connected
  const gameService = new GameService();
  const matchmakingService = new MatchmakingService();
  // Authentication middleware
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      if (!token) {
        return next(new Error('Authentication error'));
      }

      // TEMPORARY: Accept mock token for testing
      if (token === 'mock-token-123') {
        socket.playerId = 'test-player-123';
        socket.player = {
          _id: 'test-player-123',
          username: 'TestPlayer',
          avatar: '🎮',
          stats: {
            elo: 1000,
            gamesPlayed: 0,
            wins: 0,
            losses: 0,
          },
          updateLastActive: async function () {
            console.log('Mock player active');
          },
        };
        return next();
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const player = await Player.findById(decoded.id).select('-password');

      if (!player) {
        return next(new Error('Player not found'));
      }

      socket.playerId = decoded.id;
      socket.player = player;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', socket => {
    console.log(
      `Player connected: ${socket.player.username} (${socket.playerId})`,
    );

    // Update player online status
    socket.player.updateLastActive();

    // Matchmaking events
    socket.on('join_matchmaking', async data => {
      try {
        const { gameMode } = data;
        await matchmakingService.addToQueue(socket, gameMode);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('leave_matchmaking', async () => {
      try {
        await matchmakingService.removeFromQueue(socket.playerId);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Game events
    socket.on('play_card', async data => {
      try {
        const { roomId, cardId } = data;
        const result = await gameService.playCard(
          roomId,
          socket.playerId,
          cardId,
        );
        io.to(roomId).emit('game_update', result);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('cantar', async data => {
      try {
        const { roomId, suit } = data;
        const result = await gameService.cantar(roomId, socket.playerId, suit);
        io.to(roomId).emit('game_update', result);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('cambiar_7', async data => {
      try {
        const { roomId } = data;
        const result = await gameService.cambiar7(roomId, socket.playerId);
        io.to(roomId).emit('game_update', result);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('declare_victory', async data => {
      try {
        const { roomId } = data;
        const result = await gameService.declareVictory(
          roomId,
          socket.playerId,
        );
        io.to(roomId).emit('game_update', result);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Room events
    socket.on('join_room', async data => {
      try {
        const { roomId } = data;
        socket.join(roomId);
        const gameState = await gameService.getGameState(roomId);
        socket.emit('game_state', gameState);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    socket.on('leave_room', async data => {
      try {
        const { roomId } = data;
        socket.leave(roomId);
        await gameService.handlePlayerDisconnect(roomId, socket.playerId);
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Chat events
    socket.on('send_message', async data => {
      try {
        const { roomId, message } = data;
        io.to(roomId).emit('chat_message', {
          playerId: socket.playerId,
          username: socket.player.username,
          message,
          timestamp: new Date(),
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Voice events
    socket.on('voice_message', async data => {
      try {
        const { roomId, audioData } = data;
        socket.to(roomId).emit('voice_message', {
          playerId: socket.playerId,
          username: socket.player.username,
          audioData,
          timestamp: new Date(),
        });
      } catch (error) {
        socket.emit('error', { message: error.message });
      }
    });

    // Disconnect handling
    socket.on('disconnect', async () => {
      console.log(`Player disconnected: ${socket.player.username}`);

      try {
        // Remove from matchmaking if in queue
        await matchmakingService.removeFromQueue(socket.playerId);

        // Handle game disconnection
        const redis = getRedisClient();
        const roomId = await redis.get(`player:${socket.playerId}:room`);

        if (roomId) {
          await gameService.handlePlayerDisconnect(roomId, socket.playerId);
          io.to(roomId).emit('player_disconnected', {
            playerId: socket.playerId,
            username: socket.player.username,
          });
        }
      } catch (error) {
        console.error('Disconnect error:', error);
      }
    });
  });

  // Start matchmaking service
  matchmakingService.startMatchmaking(io);
}
