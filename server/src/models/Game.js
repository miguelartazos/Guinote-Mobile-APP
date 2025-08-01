import mongoose from 'mongoose';

const gameSchema = new mongoose.Schema({
  roomId: {
    type: String,
    required: true,
    unique: true,
  },
  players: [
    {
      playerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Player',
        required: true,
      },
      username: String,
      avatar: String,
      teamId: {
        type: String,
        enum: ['team1', 'team2'],
        required: true,
      },
      position: {
        type: Number,
        min: 0,
        max: 3,
        required: true,
      },
      connected: {
        type: Boolean,
        default: true,
      },
      elo: Number,
    },
  ],
  gameState: {
    phase: {
      type: String,
      enum: [
        'waiting',
        'dealing',
        'playing',
        'arrastre',
        'scoring',
        'vueltas',
        'gameOver',
      ],
      default: 'waiting',
    },
    trumpSuit: String,
    trumpCard: Object,
    currentPlayerIndex: Number,
    dealerIndex: Number,
    trickCount: Number,
    lastTrickWinner: String,
    canCambiar7: Boolean,
    isVueltas: Boolean,
    canDeclareVictory: Boolean,
  },
  teams: [
    {
      id: String,
      score: Number,
      cardPoints: Number,
      cantes: [
        {
          suit: String,
          points: Number,
          isVisible: Boolean,
        },
      ],
    },
  ],
  deck: [Object],
  hands: {
    type: Map,
    of: [Object],
  },
  currentTrick: [
    {
      playerId: String,
      card: Object,
    },
  ],
  gameHistory: [
    {
      type: String,
      playerId: String,
      data: Object,
      timestamp: Date,
    },
  ],
  startedAt: Date,
  endedAt: Date,
  winner: {
    teamId: String,
    players: [String],
    score: Number,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Update the updatedAt timestamp
gameSchema.pre('save', function (next) {
  this.updatedAt = new Date();
  next();
});

// Methods
gameSchema.methods.isActive = function () {
  return this.gameState.phase !== 'gameOver' && !this.endedAt;
};

gameSchema.methods.getConnectedPlayers = function () {
  return this.players.filter(p => p.connected);
};

gameSchema.methods.canStart = function () {
  return (
    this.players.length === 4 &&
    this.players.every(p => p.connected) &&
    this.gameState.phase === 'waiting'
  );
};

export default mongoose.model('Game', gameSchema);
