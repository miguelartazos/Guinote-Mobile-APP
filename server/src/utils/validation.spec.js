import { describe, test, expect } from '@jest/globals';
import {
  validateEmail,
  validateUsername,
  validatePassword,
  getPasswordStrengthMessage,
} from './validation.js';

describe('validateEmail', () => {
  test('accepts valid email addresses', () => {
    expect(validateEmail('user@example.com')).toBe(true);
    expect(validateEmail('test.email+tag@domain.co.uk')).toBe(true);
    expect(validateEmail('user123@sub.domain.com')).toBe(true);
  });

  test('rejects invalid email addresses', () => {
    expect(validateEmail('')).toBe(false);
    expect(validateEmail('not-an-email')).toBe(false);
    expect(validateEmail('user@')).toBe(false);
    expect(validateEmail('@domain.com')).toBe(false);
    expect(validateEmail('user@@domain.com')).toBe(false);
    expect(validateEmail('user@domain')).toBe(false);
  });

  test('handles null and undefined inputs', () => {
    expect(validateEmail(null)).toBe(false);
    expect(validateEmail(undefined)).toBe(false);
  });
});

describe('validateUsername', () => {
  test('accepts valid usernames', () => {
    expect(validateUsername('user123')).toBe(true);
    expect(validateUsername('test_user')).toBe(true);
    expect(validateUsername('User_123')).toBe(true);
    expect(validateUsername('abc')).toBe(true); // minimum length
    expect(validateUsername('a'.repeat(20))).toBe(true); // maximum length
  });

  test('rejects invalid usernames', () => {
    expect(validateUsername('')).toBe(false);
    expect(validateUsername('ab')).toBe(false); // too short
    expect(validateUsername('a'.repeat(21))).toBe(false); // too long
    expect(validateUsername('user-name')).toBe(false); // contains hyphen
    expect(validateUsername('user@name')).toBe(false); // contains @
    expect(validateUsername('user name')).toBe(false); // contains space
    expect(validateUsername('user.name')).toBe(false); // contains dot
  });

  test('handles null, undefined, and non-string inputs', () => {
    expect(validateUsername(null)).toBe(false);
    expect(validateUsername(undefined)).toBe(false);
    expect(validateUsername(123)).toBe(false);
    expect(validateUsername({})).toBe(false);
  });
});

describe('validatePassword', () => {
  test('accepts strong passwords', () => {
    expect(validatePassword('Password123!')).toBe(true);
    expect(validatePassword('MyStr0ng@Pass')).toBe(true);
    expect(validatePassword('Test123#Pass')).toBe(true);
    expect(validatePassword('A1b2C3d4!')).toBe(true);
  });

  test('rejects weak passwords', () => {
    expect(validatePassword('')).toBe(false);
    expect(validatePassword('short')).toBe(false); // too short
    expect(validatePassword('password')).toBe(false); // no uppercase, numbers, special chars
    expect(validatePassword('PASSWORD')).toBe(false); // no lowercase, numbers, special chars
    expect(validatePassword('12345678')).toBe(false); // no letters, special chars
    expect(validatePassword('Password')).toBe(false); // no numbers, special chars
    expect(validatePassword('Password123')).toBe(false); // no special chars
    expect(validatePassword('password123!')).toBe(false); // no uppercase
    expect(validatePassword('PASSWORD123!')).toBe(false); // no lowercase
    expect(validatePassword('Password!')).toBe(false); // no numbers
  });

  test('handles null and undefined inputs', () => {
    expect(validatePassword(null)).toBe(false);
    expect(validatePassword(undefined)).toBe(false);
  });
});

describe('getPasswordStrengthMessage', () => {
  test('returns appropriate messages for different password strengths', () => {
    expect(getPasswordStrengthMessage('')).toBe('Password is required');
    expect(getPasswordStrengthMessage('short')).toBe(
      'Password must be at least 8 characters long',
    );
    expect(getPasswordStrengthMessage('password')).toContain(
      'Password must contain:',
    );
    expect(getPasswordStrengthMessage('password')).toContain(
      'uppercase letter',
    );
    expect(getPasswordStrengthMessage('password')).toContain('number');
    expect(getPasswordStrengthMessage('password')).toContain(
      'special character',
    );
    expect(getPasswordStrengthMessage('Password123!')).toBe(
      'Password is strong',
    );
  });

  test('identifies missing password requirements', () => {
    const message = getPasswordStrengthMessage('password123');
    expect(message).toContain('uppercase letter');
    expect(message).toContain('special character');
    expect(message).not.toContain('lowercase letter');
    expect(message).not.toContain('number');
  });
});
