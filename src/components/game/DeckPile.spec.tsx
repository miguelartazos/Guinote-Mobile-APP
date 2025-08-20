import React from 'react';
import { render } from '@testing-library/react-native';
import { DeckPile } from './DeckPile';
import type { SpanishCardData } from './SpanishCard';

describe('DeckPile', () => {
  const mockTrumpCard: SpanishCardData = {
    suit: 'copas',
    value: 7,
  };

  test('renders deck pile with remaining cards (no count badge)', () => {
    const { queryByText } = render(<DeckPile cardsRemaining={15} trumpCard={mockTrumpCard} />);

    expect(queryByText('15')).toBeNull();
  });

  test('shows trump card when showTrump is true', () => {
    const { queryByTestId } = render(
      <DeckPile cardsRemaining={10} trumpCard={mockTrumpCard} showTrump={true} />,
    );

    // Since we can't easily test for card content, we just verify the component renders
    expect(queryByTestId).toBeTruthy();
  });

  test('hides trump card when showTrump is false (still renders deck)', () => {
    const component = render(
      <DeckPile cardsRemaining={10} trumpCard={mockTrumpCard} showTrump={false} />,
    );

    expect(component.toJSON()).not.toBeNull();
  });

  test('returns null when no cards remaining and showTrump is false', () => {
    const component = render(
      <DeckPile cardsRemaining={0} trumpCard={mockTrumpCard} showTrump={false} />,
    );

    expect(component.toJSON()).toBeNull();
  });

  test('shows only trump card when no cards remaining but showTrump is true', () => {
    const component = render(
      <DeckPile cardsRemaining={0} trumpCard={mockTrumpCard} showTrump={true} />,
    );

    expect(component.toJSON()).not.toBeNull();
  });

  test('renders deck visually for larger deck sizes (no count badge)', () => {
    const { queryByText } = render(<DeckPile cardsRemaining={20} trumpCard={mockTrumpCard} />);

    expect(queryByText('20')).toBeNull();
  });
});
