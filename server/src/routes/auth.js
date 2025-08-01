import express from 'express';
import jwt from 'jsonwebtoken';
import Player from '../models/Player.js';
import {
  validateEmail,
  validateUsername,
  validatePassword,
  getPasswordStrengthMessage,
} from '../utils/validation.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Register
router.post('/register', authLimiter, async (req, res) => {
  try {
    const { username, email, password, avatar } = req.body;

    // Validate input
    if (!validateUsername(username)) {
      return res.status(400).json({ error: 'Invalid username' });
    }
    if (!validateEmail(email)) {
      return res.status(400).json({ error: 'Invalid email' });
    }
    if (!validatePassword(password)) {
      return res
        .status(400)
        .json({ error: getPasswordStrengthMessage(password) });
    }

    // Check if user exists
    const existingPlayer = await Player.findOne({
      $or: [{ email }, { username }],
    });

    if (existingPlayer) {
      return res.status(400).json({
        error:
          existingPlayer.email === email
            ? 'Email already registered'
            : 'Username already taken',
      });
    }

    // Create new player
    const player = new Player({
      username,
      email,
      password,
      avatar: avatar || '👤',
    });

    await player.save();

    // Generate tokens
    const accessToken = generateAccessToken(player._id);
    const refreshToken = generateRefreshToken(player._id);

    // Save refresh token
    player.refreshToken = refreshToken;
    await player.save();

    res.status(201).json({
      accessToken,
      refreshToken,
      player: {
        id: player._id,
        username: player.username,
        email: player.email,
        avatar: player.avatar,
        stats: player.stats,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Login
router.post('/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    // Find player
    const player = await Player.findOne({
      $or: [{ email: username }, { username }],
    });

    if (!player) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if account is locked
    if (player.isLocked()) {
      const lockTimeRemaining = Math.ceil(
        (player.lockedUntil - Date.now()) / (60 * 1000),
      );
      return res.status(423).json({
        error: `Account temporarily locked due to too many failed login attempts. Try again in ${lockTimeRemaining} minutes.`,
      });
    }

    // Check password
    const isValidPassword = await player.comparePassword(password);
    if (!isValidPassword) {
      await player.incrementLoginAttempts();
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset failed attempts on successful login
    if (player.failedLoginAttempts > 0) {
      await player.resetLoginAttempts();
    }

    // Update last active
    await player.updateLastActive();

    // Generate tokens
    const accessToken = generateAccessToken(player._id);
    const refreshToken = generateRefreshToken(player._id);

    // Save refresh token
    player.refreshToken = refreshToken;
    await player.save();

    res.json({
      accessToken,
      refreshToken,
      player: {
        id: player._id,
        username: player.username,
        email: player.email,
        avatar: player.avatar,
        stats: player.stats,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Refresh token
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({ error: 'Refresh token required' });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find player
    const player = await Player.findById(decoded.id);
    if (!player || player.refreshToken !== refreshToken) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    // Generate new access token
    const accessToken = generateAccessToken(player._id);

    res.json({ accessToken });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// Guest login
router.post('/guest', async (req, res) => {
  try {
    const guestNumber = Math.floor(Math.random() * 10000);
    const username = `Guest${guestNumber}`;

    const player = new Player({
      username,
      email: `${username}@guest.local`,
      password: Math.random().toString(36),
      isGuest: true,
      avatar: '👤',
    });

    await player.save();

    const accessToken = generateAccessToken(player._id);

    res.json({
      accessToken,
      player: {
        id: player._id,
        username: player.username,
        avatar: player.avatar,
        stats: player.stats,
        isGuest: true,
      },
    });
  } catch (error) {
    console.error('Guest login error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Logout
router.post('/logout', async (req, res) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const player = await Player.findById(decoded.id);

    if (player) {
      player.refreshToken = null;
      await player.save();
    }

    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Helper functions
function generateAccessToken(playerId) {
  return jwt.sign({ id: playerId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE_TIME || '15m',
  });
}

function generateRefreshToken(playerId) {
  return jwt.sign({ id: playerId }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE_TIME || '7d',
  });
}

export default router;
