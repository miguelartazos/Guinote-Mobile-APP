import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import Player from './Player.js';

describe('Player Model Security Features', () => {
  let mongoServer;

  beforeEach(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterEach(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  describe('Account Lockout', () => {
    let player;

    beforeEach(async () => {
      player = new Player({
        username: 'testuser',
        email: 'test@example.com',
        password: 'TestPass123!',
      });
      await player.save();
    });

    test('isLocked returns false for unlocked account', () => {
      expect(player.isLocked()).toBe(false);
    });

    test('isLocked returns true when account is locked', async () => {
      player.lockedUntil = new Date(Date.now() + 30 * 60 * 1000); // 30 minutes from now
      expect(player.isLocked()).toBe(true);
    });

    test('isLocked returns false when lock has expired', async () => {
      player.lockedUntil = new Date(Date.now() - 60 * 1000); // 1 minute ago
      expect(player.isLocked()).toBe(false);
    });

    test('incrementLoginAttempts increases failed attempts', async () => {
      expect(player.failedLoginAttempts).toBe(0);

      const updated = await player.incrementLoginAttempts();

      expect(updated.failedLoginAttempts).toBe(1);
    });

    test('incrementLoginAttempts locks account after max attempts', async () => {
      // Simulate 4 failed attempts
      let updated = player;
      for (let i = 0; i < 4; i++) {
        updated = await updated.incrementLoginAttempts();
      }

      expect(updated.failedLoginAttempts).toBe(4);
      expect(updated.isLocked()).toBe(false);

      // 5th attempt should lock the account
      updated = await updated.incrementLoginAttempts();

      expect(updated.failedLoginAttempts).toBe(5);
      expect(updated.isLocked()).toBe(true);
      expect(updated.lockedUntil).toBeDefined();
    });

    test('resetLoginAttempts clears failed attempts and lock', async () => {
      // Set up a locked account
      player.failedLoginAttempts = 5;
      player.lockedUntil = new Date(Date.now() + 30 * 60 * 1000);
      await player.save();

      expect(player.isLocked()).toBe(true);

      await player.resetLoginAttempts();
      // Reload the player from database
      const reloaded = await Player.findById(player._id);

      expect(reloaded.failedLoginAttempts || 0).toBe(0);
      expect(reloaded.lockedUntil).toBeUndefined();
      expect(reloaded.isLocked()).toBe(false);
    });

    test('incrementLoginAttempts resets count when previous lock expired', async () => {
      // Set up an expired lock
      player.failedLoginAttempts = 5;
      player.lockedUntil = new Date(Date.now() - 60 * 1000); // 1 minute ago
      await player.save();

      expect(player.isLocked()).toBe(false);

      const updated = await player.incrementLoginAttempts();

      expect(updated.failedLoginAttempts).toBe(1);
      expect(updated.lockedUntil).toBeUndefined();
    });
  });

  describe('Password Hashing', () => {
    test('password is hashed before saving', async () => {
      const plainPassword = 'TestPass123!';
      const player = new Player({
        username: 'hashtest',
        email: 'hash@example.com',
        password: plainPassword,
      });

      await player.save();

      expect(player.password).not.toBe(plainPassword);
      expect(player.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash pattern
    });

    test('comparePassword works correctly', async () => {
      const plainPassword = 'TestPass123!';
      const player = new Player({
        username: 'comparetest',
        email: 'compare@example.com',
        password: plainPassword,
      });

      await player.save();

      const isValid = await player.comparePassword(plainPassword);
      const isInvalid = await player.comparePassword('WrongPassword123!');

      expect(isValid).toBe(true);
      expect(isInvalid).toBe(false);
    });

    test('password is not rehashed if not modified', async () => {
      const player = new Player({
        username: 'rehashtest',
        email: 'rehash@example.com',
        password: 'TestPass123!',
      });

      await player.save();
      const originalHash = player.password;

      // Update a different field
      player.username = 'newusername';
      await player.save();

      expect(player.password).toBe(originalHash);
    });
  });

  describe('Validation', () => {
    test('requires strong password', async () => {
      const player = new Player({
        username: 'weakpass',
        email: 'weak@example.com',
        password: 'weak', // Too weak
      });

      let error;
      try {
        await player.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.errors.password).toBeDefined();
    });

    // Email format validation is handled at the route level, not model level

    test('requires unique username and email', async () => {
      const player1 = new Player({
        username: 'duplicate',
        email: 'duplicate@example.com',
        password: 'TestPass123!',
      });
      await player1.save();

      const player2 = new Player({
        username: 'duplicate',
        email: 'different@example.com',
        password: 'TestPass123!',
      });

      let error;
      try {
        await player2.save();
      } catch (err) {
        error = err;
      }

      expect(error).toBeDefined();
      expect(error.code).toBe(11000); // MongoDB duplicate key error
    });
  });
});
