import React from 'react';
import { describe, test, expect, jest, beforeEach, afterEach } from '@jest/globals';
import { render, act } from '@testing-library/react-native';
import { RecordingCountdown } from './RecordingCountdown';

// Mock timers
jest.useFakeTimers();

const mockOnComplete = jest.fn();

describe('RecordingCountdown', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.clearAllTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.clearAllTimers();
  });

  describe('when inactive', () => {
    test('renders nothing when isActive is false', () => {
      const { queryByText } = render(
        <RecordingCountdown isActive={false} onComplete={mockOnComplete} />,
      );

      expect(queryByText('5')).toBeNull();
      expect(queryByText('Grabando en...')).toBeNull();
    });

    test('does not call onComplete when inactive', () => {
      render(<RecordingCountdown isActive={false} onComplete={mockOnComplete} />);

      act(() => {
        jest.advanceTimersByTime(6000);
      });

      expect(mockOnComplete).not.toHaveBeenCalled();
    });
  });

  describe('when active', () => {
    test('renders initial countdown number', () => {
      const { getByText } = render(
        <RecordingCountdown isActive={true} onComplete={mockOnComplete} />,
      );

      expect(getByText('5')).toBeTruthy();
      expect(getByText('Grabando en...')).toBeTruthy();
    });

    test('counts down from default duration', () => {
      const { getByText } = render(
        <RecordingCountdown isActive={true} onComplete={mockOnComplete} />,
      );

      expect(getByText('5')).toBeTruthy();

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(getByText('4')).toBeTruthy();

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(getByText('3')).toBeTruthy();

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(getByText('2')).toBeTruthy();

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(getByText('1')).toBeTruthy();
    });

    test('counts down from custom duration', () => {
      const { getByText } = render(
        <RecordingCountdown isActive={true} onComplete={mockOnComplete} duration={3} />,
      );

      expect(getByText('3')).toBeTruthy();

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(getByText('2')).toBeTruthy();

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(getByText('1')).toBeTruthy();
    });

    test('calls onComplete after countdown finishes with animation delay', () => {
      render(<RecordingCountdown isActive={true} onComplete={mockOnComplete} duration={2} />);

      // Advance through countdown
      act(() => {
        jest.advanceTimersByTime(2000); // 2 -> 1 -> 0
      });

      // onComplete is called inside animation callback, need to run pending timers
      act(() => {
        jest.runAllTimers();
      });

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    test('stops countdown when isActive becomes false', () => {
      const { rerender, queryByText } = render(
        <RecordingCountdown isActive={true} onComplete={mockOnComplete} />,
      );

      expect(queryByText('5')).toBeTruthy();

      act(() => {
        jest.advanceTimersByTime(2000);
      });
      expect(queryByText('3')).toBeTruthy();

      // Deactivate countdown
      rerender(<RecordingCountdown isActive={false} onComplete={mockOnComplete} />);

      // Advance more time
      act(() => {
        jest.advanceTimersByTime(10000);
      });

      // Should not complete
      expect(mockOnComplete).not.toHaveBeenCalled();
    });

    test('resets count when reactivated', () => {
      const { rerender, getByText } = render(
        <RecordingCountdown isActive={true} onComplete={mockOnComplete} duration={3} />,
      );

      act(() => {
        jest.advanceTimersByTime(1000);
      });
      expect(getByText('2')).toBeTruthy();

      // Deactivate
      rerender(<RecordingCountdown isActive={false} onComplete={mockOnComplete} duration={3} />);

      // Reactivate
      rerender(<RecordingCountdown isActive={true} onComplete={mockOnComplete} duration={3} />);

      // Should reset to initial count
      expect(getByText('3')).toBeTruthy();
    });
  });

  describe('edge cases', () => {
    test('handles duration of 1 second', () => {
      render(<RecordingCountdown isActive={true} onComplete={mockOnComplete} duration={1} />);

      act(() => {
        jest.advanceTimersByTime(1000);
        jest.advanceTimersByTime(200); // Animation delay
      });

      expect(mockOnComplete).toHaveBeenCalledTimes(1);
    });

    test('handles duration of 0 (edge case)', () => {
      const { queryByText } = render(
        <RecordingCountdown isActive={true} onComplete={mockOnComplete} duration={0} />,
      );

      // Should not render anything for 0 duration
      expect(queryByText('0')).toBeNull();
      expect(queryByText('Grabando en...')).toBeNull();
    });
  });
});
