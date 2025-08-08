import { renderHook, act } from '@testing-library/react-hooks';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { AppState } from 'react-native';
import { useBackgroundMusic } from './useBackgroundMusic';

// Mock dependencies
vi.mock('../utils/audioManager', () => ({
  audioManager: {
    startMusic: vi.fn(),
    stopMusic: vi.fn(),
    pauseMusic: vi.fn(),
    resumeMusic: vi.fn(),
    setCategoryVolume: vi.fn(),
  },
}));

vi.mock('./useGameSettings', () => ({
  useGameSettings: () => ({
    settings: {
      backgroundMusicEnabled: true,
      backgroundMusicType: 'spanish_guitar',
      musicVolume: 0.5,
    },
  }),
}));

// Mock AppState
vi.mock('react-native', () => ({
  AppState: {
    currentState: 'active',
    addEventListener: vi.fn(),
  },
}));

describe('useBackgroundMusic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    AppState.currentState = 'active';
  });

  describe('startMusic', () => {
    test('starts music when enabled', async () => {
      const { audioManager } = require('../utils/audioManager');
      const { result } = renderHook(() => useBackgroundMusic());

      await act(async () => {
        await result.current.startMusic('spanish_guitar');
      });

      expect(audioManager.startMusic).toHaveBeenCalledWith('spanish_guitar');
      expect(result.current.currentMusic).toBe('spanish_guitar');
      expect(result.current.isPlaying).toBe(true);
    });

    test('does not start music when disabled', async () => {
      jest.resetModules();
      jest.mock('./useGameSettings', () => ({
        useGameSettings: () => ({
          settings: {
            backgroundMusicEnabled: false,
          },
        }),
      }));

      const { audioManager } = require('../utils/audioManager');
      const { result } = renderHook(() => useBackgroundMusic());

      await act(async () => {
        await result.current.startMusic('spanish_guitar');
      });

      expect(audioManager.startMusic).not.toHaveBeenCalled();
      expect(result.current.currentMusic).toBeNull();
      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe('stopMusic', () => {
    test('stops playing music', async () => {
      const { audioManager } = require('../utils/audioManager');
      const { result } = renderHook(() => useBackgroundMusic());

      // Start music first
      await act(async () => {
        await result.current.startMusic('spanish_guitar');
      });

      // Then stop it
      await act(async () => {
        await result.current.stopMusic();
      });

      expect(audioManager.stopMusic).toHaveBeenCalled();
      expect(result.current.currentMusic).toBeNull();
      expect(result.current.isPlaying).toBe(false);
    });
  });

  describe('pauseMusic and resumeMusic', () => {
    test('pauses and resumes music', async () => {
      const { audioManager } = require('../utils/audioManager');
      const { result } = renderHook(() => useBackgroundMusic());

      // Start music
      await act(async () => {
        await result.current.startMusic('cafe_ambiance');
      });

      // Pause
      await act(async () => {
        await result.current.pauseMusic();
      });

      expect(audioManager.pauseMusic).toHaveBeenCalled();
      expect(result.current.isPlaying).toBe(false);
      expect(result.current.currentMusic).toBe('cafe_ambiance'); // Still set

      // Resume
      await act(async () => {
        await result.current.resumeMusic();
      });

      expect(audioManager.resumeMusic).toHaveBeenCalled();
      expect(result.current.isPlaying).toBe(true);
    });
  });

  describe('switchMusic', () => {
    test('switches to different music type', async () => {
      const { audioManager } = require('../utils/audioManager');
      const { result } = renderHook(() => useBackgroundMusic());

      // Start with one type
      await act(async () => {
        await result.current.startMusic('spanish_guitar');
      });

      jest.clearAllMocks();

      // Switch to another
      await act(async () => {
        await result.current.switchMusic('nature_sounds');
      });

      expect(audioManager.stopMusic).toHaveBeenCalled();
      expect(audioManager.startMusic).toHaveBeenCalledWith('nature_sounds');
      expect(result.current.currentMusic).toBe('nature_sounds');
    });

    test('does not restart same music type', async () => {
      const { audioManager } = require('../utils/audioManager');
      const { result } = renderHook(() => useBackgroundMusic());

      await act(async () => {
        await result.current.startMusic('spanish_guitar');
      });

      jest.clearAllMocks();

      await act(async () => {
        await result.current.switchMusic('spanish_guitar');
      });

      expect(audioManager.stopMusic).not.toHaveBeenCalled();
      expect(audioManager.startMusic).not.toHaveBeenCalled();
    });
  });

  describe('app state handling', () => {
    test('pauses music when app goes to background', () => {
      const { audioManager } = require('../utils/audioManager');
      let appStateCallback: (state: string) => void = () => {};

      // Capture the event listener
      (AppState.addEventListener as any).mockImplementation(
        (event: string, callback: any) => {
          if (event === 'change') {
            appStateCallback = callback;
          }
          return { remove: vi.fn() };
        },
      );

      const { result } = renderHook(() => useBackgroundMusic());

      act(() => {
        result.current.startMusic('spanish_guitar');
      });

      // Simulate app going to background
      AppState.currentState = 'active';
      act(() => {
        appStateCallback('background');
      });

      expect(audioManager.pauseMusic).toHaveBeenCalled();
    });

    test('resumes music when app returns to foreground', () => {
      const { audioManager } = require('../utils/audioManager');
      let appStateCallback: (state: string) => void = () => {};

      (AppState.addEventListener as any).mockImplementation(
        (event: string, callback: any) => {
          if (event === 'change') {
            appStateCallback = callback;
          }
          return { remove: vi.fn() };
        },
      );

      const { result } = renderHook(() => useBackgroundMusic());

      // Start music and simulate background/foreground
      act(() => {
        result.current.startMusic('spanish_guitar');
      });

      AppState.currentState = 'active';
      act(() => {
        appStateCallback('background');
      });

      AppState.currentState = 'background';
      act(() => {
        appStateCallback('active');
      });

      expect(audioManager.resumeMusic).toHaveBeenCalled();
    });
  });

  describe('settings integration', () => {
    test('updates volume when settings change', () => {
      const { audioManager } = require('../utils/audioManager');

      renderHook(() => useBackgroundMusic());

      expect(audioManager.setCategoryVolume).toHaveBeenCalledWith('music', 0.5);
    });

    test('stops music when disabled in settings', () => {
      const { audioManager } = require('../utils/audioManager');
      const { result, rerender } = renderHook(() => useBackgroundMusic());

      // Start with music
      act(() => {
        result.current.startMusic('spanish_guitar');
      });

      // Mock settings change
      jest.resetModules();
      jest.mock('./useGameSettings', () => ({
        useGameSettings: () => ({
          settings: {
            backgroundMusicEnabled: false,
          },
        }),
      }));

      rerender();

      expect(audioManager.stopMusic).toHaveBeenCalled();
    });
  });

  describe('cleanup', () => {
    test('stops music on unmount', () => {
      const { audioManager } = require('../utils/audioManager');
      const { unmount } = renderHook(() => useBackgroundMusic());

      unmount();

      expect(audioManager.stopMusic).toHaveBeenCalled();
    });
  });
});
