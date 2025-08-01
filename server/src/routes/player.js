import express from 'express';
import Player from '../models/Player.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Get player profile
router.get('/profile', authenticateToken, async (req, res) => {
  try {
    const player = await Player.findById(req.playerId).select(
      '-password -refreshToken',
    );

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json(player);
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Update player profile
router.patch('/profile', authenticateToken, async (req, res) => {
  try {
    const { avatar, preferences } = req.body;
    const updates = {};

    if (avatar) {
      updates.avatar = avatar;
    }

    if (preferences) {
      updates.preferences = {
        ...preferences,
      };
    }

    const player = await Player.findByIdAndUpdate(req.playerId, updates, {
      new: true,
    }).select('-password -refreshToken');

    res.json(player);
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get player statistics
router.get('/stats/:playerId', async (req, res) => {
  try {
    const player = await Player.findById(req.params.playerId).select(
      'username avatar stats',
    );

    if (!player) {
      return res.status(404).json({ error: 'Player not found' });
    }

    res.json({
      username: player.username,
      avatar: player.avatar,
      stats: player.stats,
      winRate: player.getWinRate(),
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get leaderboard
router.get('/leaderboard', async (req, res) => {
  try {
    const { limit = 100, offset = 0 } = req.query;

    const players = await Player.find({ isGuest: false })
      .select('username avatar stats.elo stats.gamesPlayed stats.wins')
      .sort({ 'stats.elo': -1 })
      .limit(parseInt(limit))
      .skip(parseInt(offset));

    const total = await Player.countDocuments({ isGuest: false });

    res.json({
      players: players.map((player, index) => ({
        rank: offset + index + 1,
        username: player.username,
        avatar: player.avatar,
        elo: player.stats.elo,
        gamesPlayed: player.stats.gamesPlayed,
        winRate: player.getWinRate(),
      })),
      total,
    });
  } catch (error) {
    console.error('Get leaderboard error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// Search players
router.get('/search', authenticateToken, async (req, res) => {
  try {
    const { q } = req.query;

    if (!q || q.length < 2) {
      return res.json({ players: [] });
    }

    const players = await Player.find({
      username: { $regex: q, $options: 'i' },
      _id: { $ne: req.playerId },
      isGuest: false,
    })
      .select('username avatar stats.elo')
      .limit(10);

    res.json({ players });
  } catch (error) {
    console.error('Search players error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
