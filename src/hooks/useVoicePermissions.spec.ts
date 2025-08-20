import { renderHook, act } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import { useVoicePermissions } from './useVoicePermissions';

jest.mock('react-native-permissions', () => ({
  check: jest.fn(),
  request: jest.fn(),
  PERMISSIONS: {
    IOS: { MICROPHONE: 'ios.permission.MICROPHONE' },
    ANDROID: { RECORD_AUDIO: 'android.permission.RECORD_AUDIO' },
  },
  RESULTS: {
    GRANTED: 'granted',
    DENIED: 'denied',
    BLOCKED: 'blocked',
    UNAVAILABLE: 'unavailable',
  },
}));

describe('useVoicePermissions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  describe('checkPermission', () => {
    test('returns true when permission is granted on iOS', async () => {
      Platform.OS = 'ios';
      (check as jest.Mock).mockResolvedValue(RESULTS.GRANTED);

      const { result } = renderHook(() => useVoicePermissions());

      let hasPermission: boolean;
      await act(async () => {
        hasPermission = await result.current.checkPermission();
      });

      expect(hasPermission!).toBe(true);
      expect(result.current.hasPermission).toBe(true);
      expect(check).toHaveBeenCalledWith(PERMISSIONS.IOS.MICROPHONE);
    });

    test('returns true when permission is granted on Android', async () => {
      Platform.OS = 'android';
      (check as jest.Mock).mockResolvedValue(RESULTS.GRANTED);

      const { result } = renderHook(() => useVoicePermissions());

      let hasPermission: boolean;
      await act(async () => {
        hasPermission = await result.current.checkPermission();
      });

      expect(hasPermission!).toBe(true);
      expect(result.current.hasPermission).toBe(true);
      expect(check).toHaveBeenCalledWith(PERMISSIONS.ANDROID.RECORD_AUDIO);
    });

    test('returns false when permission is denied', async () => {
      Platform.OS = 'ios';
      (check as jest.Mock).mockResolvedValue(RESULTS.DENIED);

      const { result } = renderHook(() => useVoicePermissions());

      let hasPermission: boolean;
      await act(async () => {
        hasPermission = await result.current.checkPermission();
      });

      expect(hasPermission!).toBe(false);
      expect(result.current.hasPermission).toBe(false);
    });

    test('handles check errors gracefully', async () => {
      Platform.OS = 'ios';
      (check as jest.Mock).mockRejectedValue(new Error('Check failed'));
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      const { result } = renderHook(() => useVoicePermissions());

      let hasPermission: boolean;
      await act(async () => {
        hasPermission = await result.current.checkPermission();
      });

      expect(hasPermission!).toBe(false);
      expect(result.current.hasPermission).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith(
        'Error checking microphone permission:',
        expect.any(Error),
      );

      consoleSpy.mockRestore();
    });
  });

  describe('requestPermission', () => {
    test('returns true if permission already granted', async () => {
      Platform.OS = 'ios';
      (check as jest.Mock).mockResolvedValue(RESULTS.GRANTED);

      const { result } = renderHook(() => useVoicePermissions());

      let granted: boolean;
      await act(async () => {
        granted = await result.current.requestPermission();
      });

      expect(granted!).toBe(true);
      expect(request).not.toHaveBeenCalled();
      expect(Alert.alert).not.toHaveBeenCalled();
    });

    test('shows explanation and requests permission when user allows', async () => {
      Platform.OS = 'ios';
      (check as jest.Mock).mockResolvedValue(RESULTS.DENIED);
      (request as jest.Mock).mockResolvedValue(RESULTS.GRANTED);

      // Mock Alert to immediately call "Permitir" button
      (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        buttons[1].onPress();
      });

      const { result } = renderHook(() => useVoicePermissions());

      let granted: boolean;
      await act(async () => {
        granted = await result.current.requestPermission();
      });

      expect(granted!).toBe(true);
      expect(Alert.alert).toHaveBeenCalledWith(
        'Permiso de Micrófono',
        expect.stringContaining('Guiñote necesita acceso al micrófono'),
        expect.any(Array),
      );
      expect(request).toHaveBeenCalledWith(PERMISSIONS.IOS.MICROPHONE);
    });

    test('returns false when user cancels permission dialog', async () => {
      Platform.OS = 'ios';
      (check as jest.Mock).mockResolvedValue(RESULTS.DENIED);

      // Mock Alert to immediately call "Cancelar" button
      (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        buttons[0].onPress();
      });

      const { result } = renderHook(() => useVoicePermissions());

      let granted: boolean;
      await act(async () => {
        granted = await result.current.requestPermission();
      });

      expect(granted!).toBe(false);
      expect(request).not.toHaveBeenCalled();
    });

    test('shows blocked alert when permission is blocked', async () => {
      Platform.OS = 'ios';
      (check as jest.Mock).mockResolvedValue(RESULTS.DENIED);
      (request as jest.Mock).mockResolvedValue(RESULTS.BLOCKED);

      let alertCalls = 0;
      (Alert.alert as jest.Mock).mockImplementation((title, message, buttons) => {
        if (alertCalls === 0) {
          // First alert - permission request
          buttons[1].onPress();
        }
        alertCalls++;
      });

      const { result } = renderHook(() => useVoicePermissions());

      let granted: boolean;
      await act(async () => {
        granted = await result.current.requestPermission();
      });

      expect(granted!).toBe(false);
      expect(Alert.alert).toHaveBeenCalledTimes(2);
      expect(Alert.alert).toHaveBeenLastCalledWith(
        'Permiso Denegado',
        expect.stringContaining('Has denegado el acceso al micrófono'),
        expect.any(Array),
      );
    });
  });
});
