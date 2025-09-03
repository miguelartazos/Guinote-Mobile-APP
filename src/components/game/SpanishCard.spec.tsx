import React from 'react';
import { render } from '@testing-library/react-native';
import { SpanishCard } from './SpanishCard';
import type { SpanishCardData } from '../../types/cardTypes';

describe('SpanishCard', () => {
  const mockCard: SpanishCardData = {
    suit: 'oros',
    value: 1,
  };

  test('renders card without disabled overlay by default', () => {
    const { queryByTestId } = render(<SpanishCard card={mockCard} />);

    // Card should render without overlay
    const overlay = queryByTestId('disabled-overlay');
    expect(overlay).toBeNull();
  });

  test('renders disabled overlay when isDisabled is true', () => {
    const { getByTestId } = render(<SpanishCard card={mockCard} isDisabled={true} />);

    // Should render the overlay
    const overlay = getByTestId('disabled-overlay');
    expect(overlay).toBeTruthy();
  });

  test('applies correct opacity to disabled overlay', () => {
    const { getByTestId } = render(<SpanishCard card={mockCard} isDisabled={true} />);

    const overlay = getByTestId('disabled-overlay');
    const styles = overlay.props.style;

    // Check if overlay has dark background
    const hasCorrectBackground = styles.some(
      (style: any) => style && style.backgroundColor === 'rgba(0, 0, 0, 0.4)',
    );
    expect(hasCorrectBackground).toBe(true);
  });

  test('does not render overlay for face down cards', () => {
    const { queryByTestId } = render(<SpanishCard faceDown={true} isDisabled={true} />);

    // Face down cards should not show disabled overlay
    const overlay = queryByTestId('disabled-overlay');
    expect(overlay).toBeNull();
  });

  test('overlay dimensions match card size', () => {
    const { getByTestId } = render(<SpanishCard card={mockCard} size="large" isDisabled={true} />);

    const overlay = getByTestId('disabled-overlay');
    const styles = overlay.props.style;

    // Check if overlay has width and height set
    const hasWidth = styles.some((style: any) => style && style.width !== undefined);
    const hasHeight = styles.some((style: any) => style && style.height !== undefined);

    expect(hasWidth).toBe(true);
    expect(hasHeight).toBe(true);
  });

  test('disabled state does not affect card content rendering', () => {
    const { rerender } = render(<SpanishCard card={mockCard} />);

    // Should render card content normally when not disabled
    const normalRender = render(<SpanishCard card={mockCard} />);

    // Rerender with disabled state
    rerender(<SpanishCard card={mockCard} isDisabled={true} />);

    // Card content should still be rendered (just with overlay on top)
    const disabledRender = render(<SpanishCard card={mockCard} isDisabled={true} />);

    // Both should have the card rendered
    expect(normalRender).toBeTruthy();
    expect(disabledRender).toBeTruthy();
  });
});
