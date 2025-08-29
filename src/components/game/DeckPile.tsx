import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SpanishCard } from './SpanishCard';
import type { SpanishCardData } from './SpanishCard';

type DeckPileProps = {
  cardsRemaining: number;
  trumpCard?: SpanishCardData;
  showTrump?: boolean;
};

export function DeckPile({ cardsRemaining, trumpCard, showTrump = true }: DeckPileProps) {
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
    transform: [{ rotate: '90deg' }], // Rotated to show on right side
    top: 15, // Better vertical centering with deck
    left: 55, // Positioned to right side of deck
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
  // Removed card count badge styles
});
