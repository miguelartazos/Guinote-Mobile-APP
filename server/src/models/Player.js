import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

const playerSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
    minlength: 6,
  },
  avatar: {
    type: String,
    default: '👤',
  },
  stats: {
    elo: {
      type: Number,
      default: 1000,
    },
    gamesPlayed: {
      type: Number,
      default: 0,
    },
    wins: {
      type: Number,
      default: 0,
    },
    losses: {
      type: Number,
      default: 0,
    },
    draws: {
      type: Number,
      default: 0,
    },
    winStreak: {
      type: Number,
      default: 0,
    },
    bestWinStreak: {
      type: Number,
      default: 0,
    },
    totalPoints: {
      type: Number,
      default: 0,
    },
    cantes: {
      type: Number,
      default: 0,
    },
    lastTricks: {
      type: Number,
      default: 0,
    },
  },
  preferences: {
    soundEnabled: {
      type: Boolean,
      default: true,
    },
    musicVolume: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1,
    },
    voiceEnabled: {
      type: Boolean,
      default: true,
    },
  },
  isGuest: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  refreshToken: String,
  failedLoginAttempts: {
    type: Number,
    default: 0,
  },
  lockedUntil: Date,
});

// Hash password before saving
playerSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
playerSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update last active
playerSchema.methods.updateLastActive = function () {
  this.lastActive = new Date();
  return this.save();
};

// Calculate win rate
playerSchema.methods.getWinRate = function () {
  if (this.stats.gamesPlayed === 0) return 0;
  return Math.round((this.stats.wins / this.stats.gamesPlayed) * 100);
};

// Update ELO rating
playerSchema.methods.updateElo = function (opponentElo, won, scoreDiff = 0) {
  const K = process.env.ELO_K_FACTOR || 32;
  const expected = 1 / (1 + Math.pow(10, (opponentElo - this.stats.elo) / 400));
  const scoreFactor = Math.min(1 + scoreDiff / 100, 2);
  const change = Math.round(K * (won ? 1 - expected : -expected) * scoreFactor);

  this.stats.elo = Math.max(100, this.stats.elo + change);
  return change;
};

// Account lockout methods
playerSchema.methods.isLocked = function () {
  return !!(this.lockedUntil && this.lockedUntil > Date.now());
};

playerSchema.methods.incrementLoginAttempts = async function () {
  const maxAttempts = 5;
  const lockTime = 30 * 60 * 1000; // 30 minutes
  const currentTime = Date.now();

  // Check if lock has expired and reset if needed
  if (this.lockedUntil && this.lockedUntil < new Date(currentTime)) {
    // Lock has expired, reset attempts and remove lock
    const updated = await this.constructor.findOneAndUpdate(
      { _id: this._id },
      {
        $set: { failedLoginAttempts: 1 },
        $unset: { lockedUntil: 1 },
      },
      { new: true },
    );
    return updated;
  }

  // Use atomic findOneAndUpdate to prevent race conditions
  const updated = await this.constructor.findOneAndUpdate(
    {
      _id: this._id,
      $or: [
        { lockedUntil: { $exists: false } },
        { lockedUntil: { $lt: new Date(currentTime) } },
      ],
    },
    {
      $inc: { failedLoginAttempts: 1 },
    },
    { new: true },
  );

  // If we successfully incremented and reached max attempts, lock the account
  if (updated && updated.failedLoginAttempts >= maxAttempts) {
    await updated.updateOne({
      $set: { lockedUntil: new Date(currentTime + lockTime) },
    });
    updated.lockedUntil = new Date(currentTime + lockTime);
  }

  return updated;
};

playerSchema.methods.resetLoginAttempts = function () {
  return this.updateOne({
    $unset: { failedLoginAttempts: 1, lockedUntil: 1 },
  });
};

export default mongoose.model('Player', playerSchema);
