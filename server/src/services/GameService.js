import Game from '../models/Game.js';
import { getRedisClient } from '../config/redis.js';
import {
  createDeck,
  shuffleDeck,
  dealInitialCards,
  isValidPlay,
  calculateTrickWinner,
  calculateTrickPoints,
  canCantar,
  calculateCantePoints,
  canCambiar7,
  getNextPlayerIndex,
  findPlayerTeam,
  isGameOver,
  shouldStartVueltas,
  canDeclareVictory,
} from '../utils/gameLogic.js';

class GameService {
  constructor() {
    this.redis = getRedisClient();
  }

  async createGame(players) {
    const roomId = `game_${Date.now()}_${Math.random()
      .toString(36)
      .substr(2, 9)}`;

    // Assign teams and positions
    const gamePlayers = players.map((player, index) => ({
      playerId: player._id,
      username: player.username,
      avatar: player.avatar,
      teamId: index % 2 === 0 ? 'team1' : 'team2',
      position: index,
      connected: true,
      elo: player.stats.elo,
    }));

    // Initialize teams
    const teams = [
      {
        id: 'team1',
        score: 0,
        cardPoints: 0,
        cantes: [],
      },
      {
        id: 'team2',
        score: 0,
        cardPoints: 0,
        cantes: [],
      },
    ];

    // Create and shuffle deck
    const deck = shuffleDeck(createDeck());
    const playerIds = gamePlayers.map(p => p.playerId.toString());
    const { hands, remainingDeck } = dealInitialCards(deck, playerIds);

    const trumpCard = remainingDeck[remainingDeck.length - 1];
    const dealerIndex = Math.floor(Math.random() * 4);
    const firstPlayerIndex = (dealerIndex + 1) % 4;

    const game = new Game({
      roomId,
      players: gamePlayers,
      gameState: {
        phase: 'dealing',
        trumpSuit: trumpCard.suit,
        trumpCard,
        currentPlayerIndex: firstPlayerIndex,
        dealerIndex,
        trickCount: 0,
        canCambiar7: true,
        isVueltas: false,
        canDeclareVictory: false,
      },
      teams,
      deck: remainingDeck,
      hands,
      currentTrick: [],
      gameHistory: [],
      startedAt: new Date(),
    });

    await game.save();

    // Store player-room mapping in Redis
    for (const player of gamePlayers) {
      await this.redis.set(`player:${player.playerId}:room`, roomId, {
        EX: 7200, // 2 hours
      });
    }

    return this.getGameState(roomId);
  }

  async getGameState(roomId) {
    const game = await Game.findOne({ roomId });
    if (!game) {
      throw new Error('Game not found');
    }

    return {
      roomId: game.roomId,
      players: game.players,
      gameState: game.gameState,
      teams: game.teams,
      currentTrick: game.currentTrick,
      hands: Object.fromEntries(game.hands),
      trumpCard: game.gameState.trumpCard,
      lastTrick: game.lastTrick,
    };
  }

  async playCard(roomId, playerId, cardId) {
    const game = await Game.findOne({ roomId });
    if (!game) {
      throw new Error('Game not found');
    }

    // Verify it's the player's turn
    const currentPlayer = game.players[game.gameState.currentPlayerIndex];
    if (currentPlayer.playerId.toString() !== playerId) {
      throw new Error('Not your turn');
    }

    // Get player's hand
    const playerHand = game.hands.get(playerId);
    if (!playerHand) {
      throw new Error('Player hand not found');
    }

    // Find the card
    const cardIndex = playerHand.findIndex(c => c.id === cardId);
    if (cardIndex === -1) {
      throw new Error('Card not found in hand');
    }

    const card = playerHand[cardIndex];

    // Validate the play
    if (
      !isValidPlay(
        card,
        playerHand,
        game.currentTrick,
        game.gameState.trumpSuit,
        game.gameState.phase,
        playerId,
        game,
      )
    ) {
      throw new Error('Invalid play');
    }

    // Remove card from hand
    playerHand.splice(cardIndex, 1);
    game.hands.set(playerId, playerHand);

    // Add to current trick
    game.currentTrick.push({
      playerId,
      card,
    });

    // Record action
    game.gameHistory.push({
      type: 'PLAY_CARD',
      playerId,
      data: { cardId },
      timestamp: new Date(),
    });

    // Check if trick is complete
    if (game.currentTrick.length === 4) {
      await this.completeTrick(game);
    } else {
      // Next player's turn
      game.gameState.currentPlayerIndex = getNextPlayerIndex(
        game.gameState.currentPlayerIndex,
        4,
      );
    }

    await game.save();
    return this.getGameState(roomId);
  }

  async completeTrick(game) {
    const winnerId = calculateTrickWinner(
      game.currentTrick,
      game.gameState.trumpSuit,
    );
    const points = calculateTrickPoints(game.currentTrick);

    // Find winner's team
    const winner = game.players.find(p => p.playerId.toString() === winnerId);
    const winnerTeam = game.teams.find(t => t.id === winner.teamId);

    // Update scores
    winnerTeam.score += points;
    winnerTeam.cardPoints += points;

    // Update trick count
    game.gameState.trickCount++;
    game.gameState.lastTrickWinner = winnerId;
    game.lastTrick = [...game.currentTrick];

    // Deal new cards if deck has cards
    if (game.deck.length > 0 && game.gameState.phase === 'playing') {
      // Winner draws first, then counter-clockwise
      const winnerIndex = game.players.findIndex(
        p => p.playerId.toString() === winnerId,
      );
      const drawOrder = [winnerId];

      let nextIndex = winnerIndex;
      for (let i = 0; i < 3; i++) {
        nextIndex = getNextPlayerIndex(nextIndex, 4);
        drawOrder.push(game.players[nextIndex].playerId.toString());
      }

      drawOrder.forEach(playerId => {
        if (game.deck.length > 0) {
          const drawnCard = game.deck.pop();
          const playerCards = game.hands.get(playerId) || [];
          playerCards.push(drawnCard);
          game.hands.set(playerId, playerCards);
        }
      });

      // Transition to arrastre if deck is empty
      if (game.deck.length === 0) {
        game.gameState.phase = 'arrastre';
      }
    }

    // Check if game is over
    const allHandsEmpty = Array.from(game.hands.values()).every(
      hand => hand.length === 0,
    );

    if (allHandsEmpty) {
      // Award last trick bonus
      winnerTeam.score += 10;

      // Check for game end
      if (isGameOver(game)) {
        game.gameState.phase = 'gameOver';
        await this.endGame(game);
      } else if (shouldStartVueltas(game)) {
        game.gameState.phase = 'scoring';
      }
    }

    // Clear current trick and set winner as next player
    game.currentTrick = [];
    game.gameState.currentPlayerIndex = game.players.findIndex(
      p => p.playerId.toString() === winnerId,
    );
  }

  async cantar(roomId, playerId, suit) {
    const game = await Game.findOne({ roomId });
    if (!game) {
      throw new Error('Game not found');
    }

    // Verify it's the player's turn and they can cantar
    const currentPlayer = game.players[game.gameState.currentPlayerIndex];
    if (currentPlayer.playerId.toString() !== playerId) {
      throw new Error('Not your turn');
    }

    if (
      game.currentTrick.length !== 0 ||
      game.gameState.lastTrickWinner !== playerId
    ) {
      throw new Error('Can only cantar after winning a trick');
    }

    const playerHand = game.hands.get(playerId);
    const player = game.players.find(p => p.playerId.toString() === playerId);
    const team = game.teams.find(t => t.id === player.teamId);

    const cantableSuits = canCantar(
      playerHand,
      game.gameState.trumpSuit,
      team.cantes,
    );

    if (!cantableSuits.includes(suit)) {
      throw new Error('Cannot cantar this suit');
    }

    const points = calculateCantePoints(suit, game.gameState.trumpSuit);

    team.score += points;
    team.cantes.push({
      suit,
      points,
      isVisible: points === 20,
    });

    game.gameHistory.push({
      type: 'CANTAR',
      playerId,
      data: { suit, points },
      timestamp: new Date(),
    });

    // Check if game is over
    if (isGameOver(game)) {
      game.gameState.phase = 'gameOver';
      await this.endGame(game);
    }

    await game.save();
    return this.getGameState(roomId);
  }

  async cambiar7(roomId, playerId) {
    const game = await Game.findOne({ roomId });
    if (!game) {
      throw new Error('Game not found');
    }

    const currentPlayer = game.players[game.gameState.currentPlayerIndex];
    if (currentPlayer.playerId.toString() !== playerId) {
      throw new Error('Not your turn');
    }

    if (!game.gameState.canCambiar7) {
      throw new Error('Cannot cambiar 7');
    }

    const playerHand = game.hands.get(playerId);
    if (!canCambiar7(playerHand, game.gameState.trumpCard, game.deck.length)) {
      throw new Error('Cannot cambiar 7');
    }

    // Find and exchange 7 of trump
    const sevenIndex = playerHand.findIndex(
      c => c.suit === game.gameState.trumpSuit && c.value === 7,
    );

    const seven = playerHand[sevenIndex];
    playerHand[sevenIndex] = game.gameState.trumpCard;
    game.gameState.trumpCard = seven;
    game.gameState.canCambiar7 = false;

    game.hands.set(playerId, playerHand);

    game.gameHistory.push({
      type: 'CAMBIAR_7',
      playerId,
      data: {},
      timestamp: new Date(),
    });

    await game.save();
    return this.getGameState(roomId);
  }

  async declareVictory(roomId, playerId) {
    const game = await Game.findOne({ roomId });
    if (!game) {
      throw new Error('Game not found');
    }

    if (!game.gameState.isVueltas || game.currentTrick.length > 0) {
      throw new Error('Cannot declare victory now');
    }

    const player = game.players.find(p => p.playerId.toString() === playerId);
    const team = game.teams.find(t => t.id === player.teamId);

    if (canDeclareVictory(team.id, game)) {
      // Correct declaration - team wins
      game.gameState.phase = 'gameOver';
      await this.endGame(game, team.id);
    } else {
      // Incorrect declaration - other team wins
      const otherTeam = game.teams.find(t => t.id !== team.id);
      otherTeam.score = 101;
      game.gameState.phase = 'gameOver';
      await this.endGame(game, otherTeam.id);
    }

    await game.save();
    return this.getGameState(roomId);
  }

  async handlePlayerDisconnect(roomId, playerId) {
    const game = await Game.findOne({ roomId });
    if (!game) return;

    const player = game.players.find(p => p.playerId.toString() === playerId);
    if (player) {
      player.connected = false;
      await game.save();
    }

    // TODO: Implement AI takeover or pause game
  }

  async endGame(game, winningTeamId = null) {
    if (!winningTeamId) {
      // Determine winner by score
      winningTeamId =
        game.teams[0].score > game.teams[1].score
          ? game.teams[0].id
          : game.teams[1].id;
    }

    const winningTeam = game.teams.find(t => t.id === winningTeamId);
    const winningPlayers = game.players
      .filter(p => p.teamId === winningTeamId)
      .map(p => p.username);

    game.endedAt = new Date();
    game.winner = {
      teamId: winningTeamId,
      players: winningPlayers,
      score: winningTeam.score,
    };

    // Update player statistics
    for (const player of game.players) {
      // TODO: Update player ELO and statistics
    }

    await game.save();
  }
}

export default GameService;
