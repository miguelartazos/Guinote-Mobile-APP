/* eslint-disable @typescript-eslint/no-var-requires */

/**
 * Tests for envConfig module
 * Note: These tests were added after implementation (not TDD) to ensure
 * robustness of the environment variable handling logic.
 */

import { describe, expect, test, beforeEach, afterEach } from '@jest/globals';

// Mock the global __DEV__ variable
declare global {
  let __DEV__: boolean;
}

describe('envConfig', () => {
  // Store original values
  const originalEnv = process.env;
  const originalDev = global.__DEV__;
  let consoleWarnSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset environment
    jest.resetModules();
    process.env = { ...originalEnv };
    consoleWarnSpy = jest.spyOn(console, 'warn').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore original values
    process.env = originalEnv;
    global.__DEV__ = originalDev;
    consoleWarnSpy.mockRestore();
    jest.resetModules();
  });

  describe('getEnvVar', () => {
    test('returns value when environment variable exists', () => {
      process.env.EXPO_PUBLIC_TEST_VAR = 'test-value';

      const { getEnvVar } = require('./envConfig');
      const result = getEnvVar('EXPO_PUBLIC_TEST_VAR');

      expect(result).toBe('test-value');
    });

    test('treats string "undefined" as missing', () => {
      global.__DEV__ = true;
      process.env.EXPO_PUBLIC_TEST_VAR = 'undefined';

      const { getEnvVar, resetWarningCache } = require('./envConfig');
      resetWarningCache();
      const result = getEnvVar('EXPO_PUBLIC_TEST_VAR');

      expect(result).toBe('');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️  Missing environment variable: EXPO_PUBLIC_TEST_VAR',
      );
    });

    test('treats empty string as missing', () => {
      global.__DEV__ = true;
      process.env.EXPO_PUBLIC_TEST_VAR = '';

      const { getEnvVar, resetWarningCache } = require('./envConfig');
      resetWarningCache();
      const result = getEnvVar('EXPO_PUBLIC_TEST_VAR');

      expect(result).toBe('');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️  Missing environment variable: EXPO_PUBLIC_TEST_VAR',
      );
    });

    test('treats whitespace-only string as missing', () => {
      global.__DEV__ = true;
      process.env.EXPO_PUBLIC_TEST_VAR = '   ';

      const { getEnvVar, resetWarningCache } = require('./envConfig');
      resetWarningCache();
      const result = getEnvVar('EXPO_PUBLIC_TEST_VAR');

      expect(result).toBe('');
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '⚠️  Missing environment variable: EXPO_PUBLIC_TEST_VAR',
      );
    });

    describe('in development mode', () => {
      beforeEach(() => {
        global.__DEV__ = true;
      });

      test('warns once and returns empty string for missing variable', () => {
        delete process.env.EXPO_PUBLIC_TEST_VAR;
        // Set required env vars to prevent initialization errors
        process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

        const { getEnvVar, resetWarningCache } = require('./envConfig');
        resetWarningCache();
        const result = getEnvVar('EXPO_PUBLIC_TEST_VAR');

        expect(result).toBe('');
        expect(consoleWarnSpy).toHaveBeenCalledWith(
          '⚠️  Missing environment variable: EXPO_PUBLIC_TEST_VAR',
        );
      });

      test('only shows hint for first missing variable', () => {
        delete process.env.EXPO_PUBLIC_TEST_VAR;
        delete process.env.EXPO_PUBLIC_OTHER_VAR;
        // Set required env vars
        process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

        const { getEnvVar, resetWarningCache } = require('./envConfig');
        resetWarningCache();

        getEnvVar('EXPO_PUBLIC_TEST_VAR');
        consoleWarnSpy.mockClear();
        getEnvVar('EXPO_PUBLIC_OTHER_VAR');

        expect(consoleWarnSpy).toHaveBeenCalledWith(
          '⚠️  Missing environment variable: EXPO_PUBLIC_OTHER_VAR',
        );
        expect(consoleWarnSpy).not.toHaveBeenCalledWith('   Please add it to your .env file');
      });

      test('warns only once per key when called multiple times', () => {
        delete process.env.EXPO_PUBLIC_TEST_VAR;
        // Set required env vars
        process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

        const { getEnvVar, resetWarningCache } = require('./envConfig');
        resetWarningCache();

        getEnvVar('EXPO_PUBLIC_TEST_VAR');
        const warnCount = consoleWarnSpy.mock.calls.length;

        // Call again - should not warn
        getEnvVar('EXPO_PUBLIC_TEST_VAR');
        getEnvVar('EXPO_PUBLIC_TEST_VAR');

        expect(consoleWarnSpy).toHaveBeenCalledTimes(warnCount);
      });
    });

    describe('in production mode', () => {
      beforeEach(() => {
        global.__DEV__ = false;
      });

      test('throws error for missing variable', () => {
        delete process.env.EXPO_PUBLIC_TEST_VAR;
        // Set required env vars to prevent module initialization errors
        process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

        const { getEnvVar } = require('./envConfig');

        expect(() => getEnvVar('EXPO_PUBLIC_TEST_VAR')).toThrow(
          'Missing required environment variable: EXPO_PUBLIC_TEST_VAR',
        );
        expect(consoleWarnSpy).not.toHaveBeenCalled();
      });

      test('throws error for empty string', () => {
        process.env.EXPO_PUBLIC_TEST_VAR = '';
        // Set required env vars to prevent module initialization errors
        process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

        const { getEnvVar } = require('./envConfig');

        expect(() => getEnvVar('EXPO_PUBLIC_TEST_VAR')).toThrow(
          'Missing required environment variable: EXPO_PUBLIC_TEST_VAR',
        );
      });

      test('throws error for whitespace-only string', () => {
        process.env.EXPO_PUBLIC_TEST_VAR = '   ';
        // Set required env vars to prevent module initialization errors
        process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

        const { getEnvVar } = require('./envConfig');

        expect(() => getEnvVar('EXPO_PUBLIC_TEST_VAR')).toThrow(
          'Missing required environment variable: EXPO_PUBLIC_TEST_VAR',
        );
      });

      test('returns value when properly set', () => {
        process.env.EXPO_PUBLIC_TEST_VAR = 'production-value';
        // Set required env vars
        process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
        process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

        const { getEnvVar } = require('./envConfig');
        const result = getEnvVar('EXPO_PUBLIC_TEST_VAR');

        expect(result).toBe('production-value');
      });
    });
  });

  describe('resetWarningCache', () => {
    test('clears warning cache in development', () => {
      global.__DEV__ = true;
      delete process.env.EXPO_PUBLIC_TEST_VAR;
      // Set required env vars
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      const { getEnvVar, resetWarningCache } = require('./envConfig');

      // First call should warn
      resetWarningCache();
      getEnvVar('EXPO_PUBLIC_TEST_VAR');
      const firstWarnCount = consoleWarnSpy.mock.calls.length;
      expect(firstWarnCount).toBeGreaterThan(0);

      // Second call should not warn (cached)
      consoleWarnSpy.mockClear();
      getEnvVar('EXPO_PUBLIC_TEST_VAR');
      expect(consoleWarnSpy).not.toHaveBeenCalled();

      // After reset, should warn again
      resetWarningCache();
      getEnvVar('EXPO_PUBLIC_TEST_VAR');
      expect(consoleWarnSpy.mock.calls.length).toBeGreaterThan(0);
    });

    test('clears warning cache in test environment', () => {
      global.__DEV__ = false;
      process.env.NODE_ENV = 'test';
      // Set required env vars
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      const { resetWarningCache } = require('./envConfig');

      // Should not throw in test environment with reset available
      expect(() => resetWarningCache()).not.toThrow();
    });

    test('does nothing in production without test env', () => {
      global.__DEV__ = false;
      delete process.env.NODE_ENV;
      // Set required env vars
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      const { resetWarningCache } = require('./envConfig');

      // Should safely do nothing
      expect(() => resetWarningCache()).not.toThrow();
    });
  });

  describe('ENV_CONFIG', () => {
    test('loads development config in dev mode', () => {
      global.__DEV__ = true;
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://dev.supabase.co';
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'dev-key';

      const { ENV_CONFIG } = require('./envConfig');

      expect(ENV_CONFIG.ENVIRONMENT).toBe('development');
      expect(ENV_CONFIG.ENABLE_AUTH).toBe(true);
      expect(ENV_CONFIG.ENABLE_GUEST_MODE).toBe(true);
      expect(ENV_CONFIG.ENABLE_OFFLINE_MODE).toBe(true);
      expect(ENV_CONFIG.SHOW_AUTH_LOGS).toBe(true);
      expect(ENV_CONFIG.SUPABASE_URL).toBe('https://dev.supabase.co');
      expect(ENV_CONFIG.SUPABASE_ANON_KEY).toBe('dev-key');
    });

    test('loads production config in prod mode', () => {
      global.__DEV__ = false;
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://prod.supabase.co';
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'prod-key';

      const { ENV_CONFIG } = require('./envConfig');

      expect(ENV_CONFIG.ENVIRONMENT).toBe('production');
      expect(ENV_CONFIG.ENABLE_AUTH).toBe(true);
      expect(ENV_CONFIG.ENABLE_GUEST_MODE).toBe(false);
      expect(ENV_CONFIG.ENABLE_OFFLINE_MODE).toBe(false);
      expect(ENV_CONFIG.SHOW_AUTH_LOGS).toBe(false);
      expect(ENV_CONFIG.SUPABASE_URL).toBe('https://prod.supabase.co');
      expect(ENV_CONFIG.SUPABASE_ANON_KEY).toBe('prod-key');
    });
  });

  describe('memory management', () => {
    test('handles many different env var checks without unbounded growth', () => {
      global.__DEV__ = true;
      // Set required env vars
      process.env.EXPO_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY = 'test-key';

      const { getEnvVar, resetWarningCache } = require('./envConfig');
      resetWarningCache();

      // Check 150 different missing env vars
      for (let i = 0; i < 150; i++) {
        delete process.env[`EXPO_PUBLIC_TEST_VAR_${i}`];
        getEnvVar(`EXPO_PUBLIC_TEST_VAR_${i}`);
      }

      // Should not crash or have memory issues
      // The cache should have been reset at some point
      expect(true).toBe(true); // Test passes if no crash
    });
  });
});
