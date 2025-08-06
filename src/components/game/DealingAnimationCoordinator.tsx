import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { InitialDealAnimation } from './InitialDealAnimation';
import { PostTrickDealAnimation } from './PostTrickDealAnimation';
import { TrumpRevealAnimation } from './TrumpRevealAnimation';
import type { SpanishCardData } from './SpanishCard';
import type { PlayerId } from '../../types/game.types';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

type DealingPhase = 'initial' | 'trump' | 'postTrick' | null;

type DealingAnimationCoordinatorProps = {
  dealingPhase: DealingPhase;
  initialDealCards?: Array<
    Array<{
      card: SpanishCardData;
      playerId: PlayerId;
      targetPosition: { x: number; y: number; rotation: number };
    }>
  >;
  postTrickDealCards?: Array<{
    card: SpanishCardData;
    playerId: PlayerId;
    index: number;
  }>;
  trumpCard?: SpanishCardData;
  deckPosition: { x: number; y: number };
  playerPositions: Record<PlayerId, { x: number; y: number; rotation: number }>;
  onComplete: () => void;
  showLastTrickMessage?: boolean;
};

export function DealingAnimationCoordinator({
  dealingPhase,
  initialDealCards,
  postTrickDealCards,
  trumpCard,
  deckPosition,
  playerPositions,
  onComplete,
  showLastTrickMessage,
}: DealingAnimationCoordinatorProps) {
  const [currentPhase, setCurrentPhase] = useState<DealingPhase>(dealingPhase);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    setCurrentPhase(dealingPhase);
    if (dealingPhase === 'postTrick' && showLastTrickMessage) {
      setShowMessage(true);
      // Hide message after 2 seconds
      const timer = setTimeout(() => setShowMessage(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [dealingPhase, showLastTrickMessage]);

  const handleInitialDealComplete = () => {
    if (trumpCard) {
      setCurrentPhase('trump');
    } else {
      onComplete();
    }
  };

  const handleTrumpRevealComplete = () => {
    onComplete();
  };

  if (!currentPhase) {
    return null;
  }

  return (
    <>
      {currentPhase === 'initial' && initialDealCards && (
        <InitialDealAnimation
          dealingCards={initialDealCards}
          deckPosition={deckPosition}
          onComplete={handleInitialDealComplete}
        />
      )}

      {currentPhase === 'trump' && trumpCard && (
        <TrumpRevealAnimation
          trumpCard={trumpCard}
          deckPosition={deckPosition}
          onComplete={handleTrumpRevealComplete}
        />
      )}

      {currentPhase === 'postTrick' && postTrickDealCards && (
        <PostTrickDealAnimation
          dealingCards={postTrickDealCards}
          deckPosition={deckPosition}
          playerPositions={playerPositions}
          onComplete={onComplete}
        />
      )}

      {showMessage && (
        <View style={styles.messageContainer}>
          <View style={styles.messageBubble}>
            <Text style={styles.messageText}>¡Vamos de últimas!</Text>
          </View>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  messageContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  messageBubble: {
    backgroundColor: colors.error,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 30,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  messageText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 1,
  },
});
