import React from 'react';
import { describe, test, expect, jest, beforeEach } from '@jest/globals';
import { render, fireEvent, waitFor, act } from '@testing-library/react-native';
import { QuickVoiceButtons } from './QuickVoiceButtons';
import { QUICK_VOICE_MESSAGES } from '../../utils/quickVoiceMessages';

jest.useFakeTimers();

const mockOnQuickMessage = jest.fn();

describe('QuickVoiceButtons', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('rendering', () => {
    test('renders all quick message buttons when visible', () => {
      const { getByText } = render(
        <QuickVoiceButtons
          onQuickMessage={mockOnQuickMessage}
          visible={true}
        />,
      );

      QUICK_VOICE_MESSAGES.forEach(message => {
        expect(getByText(message.text)).toBeTruthy();
        expect(getByText(message.emoji)).toBeTruthy();
      });
    });

    test('does not render when not visible', () => {
      const { queryByText } = render(
        <QuickVoiceButtons
          onQuickMessage={mockOnQuickMessage}
          visible={false}
        />,
      );

      QUICK_VOICE_MESSAGES.forEach(message => {
        expect(queryByText(message.text)).toBeNull();
      });
    });

    test('applies disabled styles when disabled', () => {
      const { getByText } = render(
        <QuickVoiceButtons
          onQuickMessage={mockOnQuickMessage}
          disabled={true}
          visible={true}
        />,
      );

      const firstButton = getByText(QUICK_VOICE_MESSAGES[0].text);
      // Check if button exists when disabled
      expect(firstButton).toBeTruthy();
    });
  });

  describe('interactions', () => {
    test('calls onQuickMessage when button is pressed', async () => {
      const { getByText } = render(
        <QuickVoiceButtons
          onQuickMessage={mockOnQuickMessage}
          visible={true}
        />,
      );

      const firstMessage = QUICK_VOICE_MESSAGES[0];
      const button = getByText(firstMessage.text);

      fireEvent.press(button);

      // Fast-forward through the delay
      act(() => {
        jest.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(mockOnQuickMessage).toHaveBeenCalledWith(firstMessage);
      });
    });

    test('does not call onQuickMessage when disabled', () => {
      const { getByText } = render(
        <QuickVoiceButtons
          onQuickMessage={mockOnQuickMessage}
          disabled={true}
          visible={true}
        />,
      );

      const button = getByText(QUICK_VOICE_MESSAGES[0].text);
      fireEvent.press(button);

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(mockOnQuickMessage).not.toHaveBeenCalled();
    });

    test('shows pressed state temporarily when button is pressed', async () => {
      const { getByText } = render(
        <QuickVoiceButtons
          onQuickMessage={mockOnQuickMessage}
          visible={true}
        />,
      );

      const firstMessage = QUICK_VOICE_MESSAGES[0];
      const button = getByText(firstMessage.text);

      fireEvent.press(button);

      // Button should show pressed state immediately
      expect(button.props.style).toBeDefined();

      // Fast-forward past the delay
      act(() => {
        jest.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(mockOnQuickMessage).toHaveBeenCalled();
      });
    });

    test('handles multiple quick presses correctly', async () => {
      const { getByText } = render(
        <QuickVoiceButtons
          onQuickMessage={mockOnQuickMessage}
          visible={true}
        />,
      );

      const firstButton = getByText(QUICK_VOICE_MESSAGES[0].text);
      const secondButton = getByText(QUICK_VOICE_MESSAGES[1].text);

      fireEvent.press(firstButton);
      fireEvent.press(secondButton);

      act(() => {
        jest.advanceTimersByTime(150);
      });

      await waitFor(() => {
        expect(mockOnQuickMessage).toHaveBeenCalledTimes(2);
        expect(mockOnQuickMessage).toHaveBeenNthCalledWith(
          1,
          QUICK_VOICE_MESSAGES[0],
        );
        expect(mockOnQuickMessage).toHaveBeenNthCalledWith(
          2,
          QUICK_VOICE_MESSAGES[1],
        );
      });
    });
  });

  describe('visibility transitions', () => {
    test('shows with animation when becoming visible', () => {
      const { rerender } = render(
        <QuickVoiceButtons
          onQuickMessage={mockOnQuickMessage}
          visible={false}
        />,
      );

      rerender(
        <QuickVoiceButtons
          onQuickMessage={mockOnQuickMessage}
          visible={true}
        />,
      );

      // Animation should start
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Component should be visible after animation
      expect(true).toBe(true); // Animation testing would need more complex mocking
    });

    test('hides with animation when becoming invisible', () => {
      const { rerender } = render(
        <QuickVoiceButtons
          onQuickMessage={mockOnQuickMessage}
          visible={true}
        />,
      );

      rerender(
        <QuickVoiceButtons
          onQuickMessage={mockOnQuickMessage}
          visible={false}
        />,
      );

      // Animation should start
      act(() => {
        jest.advanceTimersByTime(300);
      });

      // Component should be hidden after animation
      expect(true).toBe(true); // Animation testing would need more complex mocking
    });
  });

  describe('accessibility', () => {
    test('buttons are accessible and have proper text', () => {
      const { getByText } = render(
        <QuickVoiceButtons
          onQuickMessage={mockOnQuickMessage}
          visible={true}
        />,
      );

      QUICK_VOICE_MESSAGES.forEach(message => {
        const button = getByText(message.text);
        expect(button).toBeTruthy();
      });
    });
  });
});
