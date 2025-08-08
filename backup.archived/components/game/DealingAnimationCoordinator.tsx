import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { InitialDealAnimation } from './InitialDealAnimation';
import { PostTrickDealAnimation } from './PostTrickDealAnimation';
import { TrumpRevealAnimation } from './TrumpRevealAnimation';
import type { Card, PlayerId } from '../../types/game.types';
import type { SlotIndex } from '../../types/slots.types';
import { playerRegistry } from '../../utils/playerRegistry';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

type DealingPhase = 'initial' | 'trump' | 'postTrick' | null;

type DealingAnimationCoordinatorProps = {
  dealingPhase: DealingPhase;
  deck?: Card[];
  players?: { id: PlayerId }[];
  dealerIndex?: number;
  postTrickDealCards?: Array<{
    card: Card;
    playerId: PlayerId;
    slotIndex: SlotIndex;
  }>;
  trumpCard?: Card;
  onComplete: () => void;
  onCardDealt?: (playerId: PlayerId, slotIndex: SlotIndex, card: Card) => void;
  showLastTrickMessage?: boolean;
};

export function DealingAnimationCoordinator({
  dealingPhase,
  deck,
  players,
  dealerIndex = 0,
  postTrickDealCards,
  trumpCard,
  onComplete,
  onCardDealt,
  showLastTrickMessage,
}: DealingAnimationCoordinatorProps) {
  const [currentPhase, setCurrentPhase] = useState<DealingPhase>(dealingPhase);
  const [showMessage, setShowMessage] = useState(false);

  useEffect(() => {
    setCurrentPhase(dealingPhase);
    // Register players with the position registry when we have them
    if (players && players.length === 4) {
      const playerIds = players.map(p => p.id) as [PlayerId, PlayerId, PlayerId, PlayerId];
      playerRegistry.registerPlayers(playerIds);
    }
    if (dealingPhase === 'postTrick' && showLastTrickMessage) {
      setShowMessage(true);
      // Hide message after 2 seconds
      const timer = setTimeout(() => setShowMessage(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [dealingPhase, showLastTrickMessage, players]);

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
      {currentPhase === 'initial' && deck && players && (
        <InitialDealAnimation
          deck={deck.slice(0, 24)} // First 24 cards for initial deal
          players={players}
          dealerIndex={dealerIndex}
          onComplete={handleInitialDealComplete}
          onCardDealt={onCardDealt}
        />
      )}

      {currentPhase === 'trump' && trumpCard && (
        <TrumpRevealAnimation
          trumpCard={trumpCard}
          onComplete={handleTrumpRevealComplete}
        />
      )}

      {currentPhase === 'postTrick' && postTrickDealCards && (
        <PostTrickDealAnimation
          dealingCards={postTrickDealCards}
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
