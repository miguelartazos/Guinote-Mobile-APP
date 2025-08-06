import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { SingleCardDealAnimation } from './SingleCardDealAnimation';
import type { SpanishCardData } from './SpanishCard';
import type { PlayerId } from '../../types/game.types';

type DealingCard = {
  card: SpanishCardData;
  playerId: PlayerId;
  targetPosition: { x: number; y: number; rotation: number };
};

type InitialDealAnimationProps = {
  dealingCards: DealingCard[][]; // Array of rounds, each round has cards to deal
  deckPosition: { x: number; y: number };
  onComplete: () => void;
  onRoundComplete?: (roundIndex: number) => void;
};

export function InitialDealAnimation({
  dealingCards,
  deckPosition,
  onComplete,
  onRoundComplete,
}: InitialDealAnimationProps) {
  const [currentRoundIndex, setCurrentRoundIndex] = useState(0);
  const [currentCards, setCurrentCards] = useState<DealingCard[]>([]);
  const [completedCards, setCompletedCards] = useState(0);
  const totalCardsInRound = useRef(0);

  useEffect(() => {
    if (currentRoundIndex < dealingCards.length) {
      const round = dealingCards[currentRoundIndex];
      totalCardsInRound.current = round.length;
      setCurrentCards(round);
      setCompletedCards(0);
    } else {
      // All rounds complete
      onComplete();
    }
  }, [currentRoundIndex, dealingCards, onComplete]);

  const handleCardComplete = () => {
    setCompletedCards(prev => {
      const newCount = prev + 1;
      if (
        newCount >= totalCardsInRound.current &&
        totalCardsInRound.current > 0
      ) {
        // Round complete, move to next
        onRoundComplete?.(currentRoundIndex);
        setCurrentRoundIndex(currentRoundIndex + 1);
      }
      return newCount;
    });
  };

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {currentCards.map((dealingCard, index) => (
        <SingleCardDealAnimation
          key={`${currentRoundIndex}-${dealingCard.playerId}-${index}`}
          card={dealingCard.card}
          from={deckPosition}
          to={dealingCard.targetPosition}
          duration={600}
          delay={index * 100} // Stagger cards slightly
          onComplete={handleCardComplete}
        />
      ))}
    </View>
  );
}
