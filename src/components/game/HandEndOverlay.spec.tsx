import React from 'react';
import { render, waitFor, act } from '@testing-library/react-native';
import { Animated } from 'react-native';
import { HandEndOverlay } from './HandEndOverlay';

// Mock the Animated API
jest.mock('react-native', () => {
  const actualRN = jest.requireActual('react-native');
  return {
    ...actualRN,
    Animated: {
      ...actualRN.Animated,
      parallel: jest.fn(() => ({
        start: jest.fn(callback => callback && callback()),
      })),
      timing: jest.fn(() => ({
        start: jest.fn(callback => callback && callback()),
      })),
      spring: jest.fn(() => ({
        start: jest.fn(callback => callback && callback()),
      })),
      Value: jest.fn(value => ({
        setValue: jest.fn(),
        interpolate: jest.fn(config => {
          // Simple interpolation mock
          return config.outputRange ? config.outputRange[1] : value;
        }),
      })),
      createAnimatedComponent: (Component: any) => Component,
    },
  };
});

describe('HandEndOverlay', () => {
  const defaultProps = {
    visible: true,
    team1Score: 42,
    team2Score: 38,
    team1Cantes: 20,
    team2Cantes: 0,
    isVueltas: false,
    shouldPlayVueltas: false,
    onAutoAdvance: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  describe('rendering', () => {
    test('shows correct scores for both teams', () => {
      const { getByText } = render(<HandEndOverlay {...defaultProps} />);

      expect(getByText('NOSOTROS')).toBeDefined();
      expect(getByText('ELLOS')).toBeDefined();
      expect(getByText('FIN DE LA MANO')).toBeDefined();
    });

    test('displays cantes when present', () => {
      const { getByText } = render(<HandEndOverlay {...defaultProps} />);

      expect(getByText('+20 cantes')).toBeDefined();
    });

    test('does not display cantes when zero', () => {
      const { queryByText } = render(<HandEndOverlay {...defaultProps} />);

      // Team 2 has 0 cantes, should not show
      expect(queryByText('+0 cantes')).toBeNull();
    });

    test('shows vueltas badge when in vueltas phase', () => {
      const { getByText } = render(<HandEndOverlay {...defaultProps} isVueltas={true} />);

      expect(getByText('VUELTAS')).toBeDefined();
    });

    test('does not show vueltas badge when not in vueltas', () => {
      const { queryByText } = render(<HandEndOverlay {...defaultProps} />);

      expect(queryByText('VUELTAS')).toBeNull();
    });

    test('returns null when not visible', () => {
      const { container } = render(<HandEndOverlay {...defaultProps} visible={false} />);

      expect(container.children.length).toBe(0);
    });
  });

  describe('game state messages', () => {
    test('shows vueltas message when no team reached 101', () => {
      const { getByText } = render(<HandEndOverlay {...defaultProps} shouldPlayVueltas={true} />);

      expect(getByText('Ningún equipo alcanzó 101 puntos')).toBeDefined();
    });

    test('shows victory message when team 1 wins', () => {
      const { getByText } = render(<HandEndOverlay {...defaultProps} team1Score={105} />);

      expect(getByText('¡Victoria! Ganamos la partida')).toBeDefined();
    });

    test('shows defeat message when team 2 wins', () => {
      const { getByText } = render(<HandEndOverlay {...defaultProps} team2Score={102} />);

      expect(getByText('Derrota - Ellos ganan la partida')).toBeDefined();
    });
  });

  describe('countdown timer', () => {
    test('starts countdown at correct time when going to vueltas', async () => {
      const { getByText, queryByText } = render(
        <HandEndOverlay {...defaultProps} shouldPlayVueltas={true} />,
      );

      // Initially no countdown shown
      expect(queryByText(/Vueltas en \d/)).toBeNull();

      // Fast-forward to 4 seconds (7 - 3 = 4 seconds before countdown)
      act(() => {
        jest.advanceTimersByTime(4000);
      });

      // Countdown should start
      await waitFor(() => {
        expect(getByText('Vueltas en 3...')).toBeDefined();
      });
    });

    test('counts down correctly', async () => {
      const { getByText } = render(<HandEndOverlay {...defaultProps} shouldPlayVueltas={true} />);

      // Fast-forward to start of countdown
      act(() => {
        jest.advanceTimersByTime(4000);
      });

      await waitFor(() => {
        expect(getByText('Vueltas en 3...')).toBeDefined();
      });

      // Advance 1 second
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(getByText('Vueltas en 2...')).toBeDefined();
      });

      // Advance another second
      act(() => {
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(getByText('Vueltas en 1...')).toBeDefined();
      });
    });

    test('auto-advances after 7 seconds', () => {
      const onAutoAdvance = jest.fn();
      render(
        <HandEndOverlay {...defaultProps} shouldPlayVueltas={true} onAutoAdvance={onAutoAdvance} />,
      );

      expect(onAutoAdvance).not.toHaveBeenCalled();

      // Advance full 7 seconds
      act(() => {
        jest.advanceTimersByTime(7000);
      });

      // Wait for animation to complete
      act(() => {
        jest.advanceTimersByTime(200); // FADE_OUT duration
      });

      expect(onAutoAdvance).toHaveBeenCalledTimes(1);
    });

    test('does not show countdown when not going to vueltas', () => {
      const { queryByText } = render(
        <HandEndOverlay {...defaultProps} shouldPlayVueltas={false} />,
      );

      // Advance time
      act(() => {
        jest.advanceTimersByTime(5000);
      });

      expect(queryByText(/Vueltas en \d/)).toBeNull();
    });

    test('cleans up timers on unmount', () => {
      const clearTimeoutSpy = jest.spyOn(global, 'clearTimeout');
      const clearIntervalSpy = jest.spyOn(global, 'clearInterval');

      const { unmount } = render(<HandEndOverlay {...defaultProps} shouldPlayVueltas={true} />);

      // Start some timers
      act(() => {
        jest.advanceTimersByTime(4500); // Start countdown
      });

      // Unmount component
      unmount();

      // Should have called cleanup functions
      expect(clearTimeoutSpy).toHaveBeenCalled();
      expect(clearIntervalSpy).toHaveBeenCalled();

      clearTimeoutSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    });
  });

  describe('accessibility', () => {
    test('provides proper ARIA labels for modal', () => {
      const { getByLabelText } = render(<HandEndOverlay {...defaultProps} />);

      expect(getByLabelText('Fin de la mano. Nosotros 42, Ellos 38')).toBeDefined();
    });

    test('announces score values with accessibility labels', () => {
      const { getAllByLabelText } = render(<HandEndOverlay {...defaultProps} />);

      expect(getAllByLabelText('Nosotros: 42 puntos').length).toBeGreaterThan(0);
      expect(getAllByLabelText('Ellos: 38 puntos').length).toBeGreaterThan(0);
    });

    test('provides accessibility labels for cantes', () => {
      const { getByLabelText } = render(<HandEndOverlay {...defaultProps} />);

      expect(getByLabelText('más 20 puntos de cantes')).toBeDefined();
    });

    test('announces countdown with proper timer role', () => {
      const { getByLabelText } = render(
        <HandEndOverlay {...defaultProps} shouldPlayVueltas={true} />,
      );

      // Fast-forward to countdown
      act(() => {
        jest.advanceTimersByTime(4000);
      });

      expect(getByLabelText('Vueltas en 3 segundos')).toBeDefined();
    });
  });

  describe('animations', () => {
    test('starts animations when visible', () => {
      const animatedParallelSpy = jest.spyOn(Animated, 'parallel');
      const animatedTimingSpy = jest.spyOn(Animated, 'timing');

      render(<HandEndOverlay {...defaultProps} />);

      // Should start fade in and scale animations
      expect(animatedParallelSpy).toHaveBeenCalled();
      expect(animatedTimingSpy).toHaveBeenCalled();

      animatedParallelSpy.mockRestore();
      animatedTimingSpy.mockRestore();
    });

    test('starts fade out animation before auto-advance', () => {
      const animatedTimingSpy = jest.spyOn(Animated, 'timing');

      render(<HandEndOverlay {...defaultProps} shouldPlayVueltas={true} />);

      // Clear initial animation calls
      animatedTimingSpy.mockClear();

      // Advance to trigger fade out
      act(() => {
        jest.advanceTimersByTime(7000);
      });

      // Should have called timing for fade out
      expect(animatedTimingSpy).toHaveBeenCalled();

      animatedTimingSpy.mockRestore();
    });
  });

  describe('score animation values', () => {
    test('resets score animations when becoming visible', () => {
      const { rerender } = render(<HandEndOverlay {...defaultProps} visible={false} />);

      // Make visible
      rerender(<HandEndOverlay {...defaultProps} visible={true} />);

      // Animated values should be reset and animated
      // This is tested through the mock implementation
      expect(Animated.timing).toHaveBeenCalled();
    });
  });

  describe('progress bar', () => {
    test('shows progress bar when going to vueltas', () => {
      const { UNSAFE_getByType } = render(
        <HandEndOverlay {...defaultProps} shouldPlayVueltas={true} />,
      );

      // Progress bar container should exist
      const animatedViews = UNSAFE_getByType(Animated.View);
      expect(animatedViews).toBeDefined();
    });

    test('does not show progress bar when not going to vueltas', () => {
      const { container } = render(<HandEndOverlay {...defaultProps} shouldPlayVueltas={false} />);

      // Look for progress bar specific styles
      const progressBars = container.querySelectorAll('[style*="height: 4"]');
      expect(progressBars.length).toBe(0);
    });
  });
});
