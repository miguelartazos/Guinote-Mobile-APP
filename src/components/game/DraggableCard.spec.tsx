import React from 'react';
import { render } from '@testing-library/react-native';
import { DraggableCard } from './DraggableCard';
import { SpanishCard } from './SpanishCard';
import type { SpanishCardData } from '../../types/cardTypes';

describe('DraggableCard', () => {
  const mockCard: SpanishCardData = {
    suit: 'oros',
    value: 1,
  };

  const mockOnCardPlay = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('shadow behavior in different game phases', () => {
    test('should NOT show shadow in playing phase when card is unplayable', () => {
      const { UNSAFE_root } = render(
        <DraggableCard
          card={mockCard}
          index={0}
          onCardPlay={mockOnCardPlay}
          isEnabled={false}
          isPlayerTurn={true}
          gamePhase="playing"
        />
      );

      // Find SpanishCard component by type
      const spanishCards = UNSAFE_root.findAllByType(SpanishCard);
      expect(spanishCards).toHaveLength(1);
      expect(spanishCards[0].props.isDisabled).toBe(false);
    });

    test('should show shadow in arrastre phase when card is unplayable and is player turn', () => {
      const { UNSAFE_root } = render(
        <DraggableCard
          card={mockCard}
          index={0}
          onCardPlay={mockOnCardPlay}
          isEnabled={false}
          isPlayerTurn={true}
          gamePhase="arrastre"
        />
      );

      // Find SpanishCard component by type
      const spanishCards = UNSAFE_root.findAllByType(SpanishCard);
      expect(spanishCards).toHaveLength(1);
      expect(spanishCards[0].props.isDisabled).toBe(true);
    });

    test('should NOT show shadow in arrastre phase when card is playable', () => {
      const { UNSAFE_root } = render(
        <DraggableCard
          card={mockCard}
          index={0}
          onCardPlay={mockOnCardPlay}
          isEnabled={true}
          isPlayerTurn={true}
          gamePhase="arrastre"
        />
      );

      // Find SpanishCard component by type
      const spanishCards = UNSAFE_root.findAllByType(SpanishCard);
      expect(spanishCards).toHaveLength(1);
      expect(spanishCards[0].props.isDisabled).toBe(false);
    });

    test('should NOT show shadow in arrastre phase when not player turn', () => {
      const { UNSAFE_root } = render(
        <DraggableCard
          card={mockCard}
          index={0}
          onCardPlay={mockOnCardPlay}
          isEnabled={false}
          isPlayerTurn={false}
          gamePhase="arrastre"
        />
      );

      // Find SpanishCard component by type
      const spanishCards = UNSAFE_root.findAllByType(SpanishCard);
      expect(spanishCards).toHaveLength(1);
      expect(spanishCards[0].props.isDisabled).toBe(false);
    });

    test('should NOT show shadow in scoring phase', () => {
      const { UNSAFE_root } = render(
        <DraggableCard
          card={mockCard}
          index={0}
          onCardPlay={mockOnCardPlay}
          isEnabled={false}
          isPlayerTurn={true}
          gamePhase="scoring"
        />
      );

      // Find SpanishCard component by type
      const spanishCards = UNSAFE_root.findAllByType(SpanishCard);
      expect(spanishCards).toHaveLength(1);
      expect(spanishCards[0].props.isDisabled).toBe(false);
    });

    test('should NOT show shadow when gamePhase is undefined', () => {
      const { UNSAFE_root } = render(
        <DraggableCard
          card={mockCard}
          index={0}
          onCardPlay={mockOnCardPlay}
          isEnabled={false}
          isPlayerTurn={true}
          gamePhase={undefined}
        />
      );

      // Find SpanishCard component by type
      const spanishCards = UNSAFE_root.findAllByType(SpanishCard);
      expect(spanishCards).toHaveLength(1);
      expect(spanishCards[0].props.isDisabled).toBe(false);
    });
  });
});