import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { SingleCardDealAnimation } from './SingleCardDealAnimation';
import type { SpanishCardData } from './SpanishCard';
import type { PlayerId } from '../../types/game.types';

type DealingCard = {
  card: SpanishCardData;
  playerId: PlayerId;
  index: number;
};

type PostTrickDealAnimationProps = {
  dealingCards: DealingCard[];
  onComplete: () => void;
  deckPosition: { x: number; y: number };
  playerPositions: Record<PlayerId, { x: number; y: number; rotation: number }>;
};

export function PostTrickDealAnimation({
  dealingCards,
  onComplete,
  deckPosition,
  playerPositions,
}: PostTrickDealAnimationProps) {
  const [currentCardIndex, setCurrentCardIndex] = useState(0);

  useEffect(() => {
    if (currentCardIndex >= dealingCards.length) {
      onComplete();
    }
  }, [currentCardIndex, dealingCards.length, onComplete]);

  const handleCardComplete = () => {
    setCurrentCardIndex(prev => prev + 1);
  };

  if (currentCardIndex >= dealingCards.length) {
    return null;
  }

  const currentCard = dealingCards[currentCardIndex];
  const targetPosition = playerPositions[currentCard.playerId];

  if (!targetPosition) {
    // Skip this card if no position
    handleCardComplete();
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      <SingleCardDealAnimation
        key={`${currentCard.playerId}-${currentCardIndex}`}
        card={currentCard.card}
        from={deckPosition}
        to={targetPosition}
        duration={1000} // 1 second per card as requested
        onComplete={handleCardComplete}
      />
    </View>
  );
}
