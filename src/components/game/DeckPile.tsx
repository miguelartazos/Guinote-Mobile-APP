import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { SpanishCard } from './SpanishCard';
import type { SpanishCardData } from './SpanishCard';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

type DeckPileProps = {
  cardsRemaining: number;
  trumpCard?: SpanishCardData;
  showTrump?: boolean;
};

export function DeckPile({
  cardsRemaining,
  trumpCard,
  showTrump = true,
}: DeckPileProps) {
  if (cardsRemaining === 0 && !showTrump) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Trump card (la pinta) - shown underneath */}
      {showTrump && trumpCard && (
        <View style={styles.trumpCardContainer}>
          <SpanishCard card={trumpCard} size="medium" />
        </View>
      )}

      {/* Deck pile on top */}
      {cardsRemaining > 0 && (
        <View style={styles.deckContainer}>
          <SpanishCard faceDown size="medium" />
          {cardsRemaining > 1 && (
            <>
              <View style={[styles.stackedCard, styles.stackedCard1]}>
                <SpanishCard faceDown size="medium" />
              </View>
              {cardsRemaining > 5 && (
                <View style={[styles.stackedCard, styles.stackedCard2]}>
                  <SpanishCard faceDown size="medium" />
                </View>
              )}
            </>
          )}
          {/* Card count badge overlay */}
          <View style={styles.cardCountBadge}>
            <Text style={styles.cardCountText}>{cardsRemaining}</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    width: 100,
    height: 140,
  },
  trumpCardContainer: {
    position: 'absolute',
    transform: [{ rotate: '90deg' }],
    top: 30,
    left: -10,
    zIndex: 1,
  },
  deckContainer: {
    position: 'absolute',
    top: 0,
    left: 10,
    zIndex: 2,
  },
  stackedCard: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  stackedCard1: {
    transform: [{ translateX: 2 }, { translateY: 2 }],
  },
  stackedCard2: {
    transform: [{ translateX: 4 }, { translateY: 4 }],
  },
  cardCountBadge: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: colors.error,
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  cardCountText: {
    color: colors.white,
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
});
