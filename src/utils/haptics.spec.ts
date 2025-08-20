import { describe, expect, jest, test } from '@jest/globals';
import { Platform } from 'react-native';

// Mock the haptic feedback module
jest.mock('react-native-haptic-feedback', () => ({
  default: {
    trigger: jest.fn(),
  },
}));

// Import haptics after mocking
import { haptics } from './haptics';

describe('haptics', () => {
  let mockTrigger: jest.MockedFunction<any>;
  let originalDev: boolean;

  beforeAll(() => {
    // Store original __DEV__ value
    originalDev = (global as any).__DEV__;
    // Set __DEV__ to false for tests
    (global as any).__DEV__ = false;

    // Get the mocked trigger function
    const ReactNativeHapticFeedback = require('react-native-haptic-feedback').default;
    mockTrigger = ReactNativeHapticFeedback.trigger;
  });

  afterAll(() => {
    // Restore original __DEV__ value
    (global as any).__DEV__ = originalDev;
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('iOS', () => {
    beforeAll(() => {
      Platform.OS = 'ios';
    });

    test('light triggers impactLight on iOS', () => {
      haptics.light();
      expect(mockTrigger).toHaveBeenCalledWith('impactLight', expect.any(Object));
    });

    test('medium triggers impactMedium on iOS', () => {
      haptics.medium();
      expect(mockTrigger).toHaveBeenCalledWith('impactMedium', expect.any(Object));
    });

    test('heavy triggers impactHeavy on iOS', () => {
      haptics.heavy();
      expect(mockTrigger).toHaveBeenCalledWith('impactHeavy', expect.any(Object));
    });

    test('success triggers notificationSuccess on iOS', () => {
      haptics.success();
      expect(mockTrigger).toHaveBeenCalledWith('notificationSuccess', expect.any(Object));
    });

    test('warning triggers notificationWarning on iOS', () => {
      haptics.warning();
      expect(mockTrigger).toHaveBeenCalledWith('notificationWarning', expect.any(Object));
    });

    test('selection triggers selection on iOS', () => {
      haptics.selection();
      expect(mockTrigger).toHaveBeenCalledWith('selection', expect.any(Object));
    });
  });

  describe('Android', () => {
    beforeAll(() => {
      Platform.OS = 'android';
    });

    test('light triggers soft on Android', () => {
      haptics.light();
      expect(mockTrigger).toHaveBeenCalledWith('soft', expect.any(Object));
    });

    test('medium triggers impactMedium on Android', () => {
      haptics.medium();
      expect(mockTrigger).toHaveBeenCalledWith('impactMedium', expect.any(Object));
    });

    test('selection triggers soft on Android', () => {
      haptics.selection();
      expect(mockTrigger).toHaveBeenCalledWith('soft', expect.any(Object));
    });
  });

  test('haptic options are consistent', () => {
    haptics.light();
    expect(mockTrigger).toHaveBeenCalledWith(expect.any(String), {
      enableVibrateFallback: true,
      ignoreAndroidSystemSettings: false,
    });
  });

  describe('Development mode', () => {
    beforeAll(() => {
      (global as any).__DEV__ = true;
    });

    afterAll(() => {
      (global as any).__DEV__ = false;
    });

    test('does not trigger haptics in development mode', () => {
      haptics.light();
      expect(mockTrigger).not.toHaveBeenCalled();
    });
  });
});
