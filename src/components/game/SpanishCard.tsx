import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';
import { getCardDimensions, scaleFont } from '../../utils/responsive';

export type SpanishSuit = 'espadas' | 'bastos' | 'oros' | 'copas';
export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;

export type SpanishCardData = {
  suit: SpanishSuit;
  value: CardValue;
};

type SpanishCardProps = {
  card?: SpanishCardData;
  faceDown?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: any;
};

const suitSymbols: Record<SpanishSuit, string> = {
  espadas: '⚔️', // Swords
  bastos: '🏑', // Clubs/Sticks
  oros: '🪙', // Coins
  copas: '🏆', // Cups
};

const suitColors: Record<SpanishSuit, string> = {
  espadas: '#2C5F41', // Dark green
  bastos: '#8B4513', // Brown
  oros: '#D4A574', // Gold
  copas: '#DC2626', // Red
};

const valueNames: Record<CardValue, string> = {
  1: 'As',
  2: '2',
  3: '3',
  4: '4',
  5: '5',
  6: '6',
  7: '7',
  10: 'Sota',
  11: 'Caballo',
  12: 'Rey',
};

export function SpanishCard({
  card,
  faceDown = false,
  size = 'medium',
  style,
}: SpanishCardProps) {
  const cardStyles = [styles.card, styles[`${size}Card`], style];

  if (faceDown || !card) {
    return (
      <View style={[...cardStyles, styles.cardBack]}>
        <View style={styles.backPattern}>
          <Text style={styles.backLogo}>G+</Text>
        </View>
      </View>
    );
  }

  const suitColor = suitColors[card.suit];
  const isRoyalty = card.value >= 10;

  return (
    <View style={cardStyles}>
      <View style={styles.cardFace}>
        {/* Top left corner */}
        <View style={styles.cornerTopLeft}>
          <Text style={[styles.cornerValue, { color: suitColor }]}>
            {card.value}
          </Text>
          <Text style={[styles.cornerSuit, { color: suitColor }]}>
            {suitSymbols[card.suit]}
          </Text>
        </View>

        {/* Center content */}
        <View style={styles.centerContent}>
          {isRoyalty ? (
            <View style={styles.royaltyCard}>
              <Text style={[styles.royaltyValue, { color: suitColor }]}>
                {valueNames[card.value]}
              </Text>
              <Text style={[styles.royaltySuit, { color: suitColor }]}>
                {suitSymbols[card.suit]}
              </Text>
            </View>
          ) : (
            <View style={styles.numberCard}>
              <Text style={[styles.centerSuit, { color: suitColor }]}>
                {suitSymbols[card.suit]}
              </Text>
            </View>
          )}
        </View>

        {/* Bottom right corner (rotated) */}
        <View style={styles.cornerBottomRight}>
          <Text
            style={[styles.cornerValue, styles.rotated, { color: suitColor }]}
          >
            {card.value}
          </Text>
          <Text
            style={[styles.cornerSuit, styles.rotated, { color: suitColor }]}
          >
            {suitSymbols[card.suit]}
          </Text>
        </View>
      </View>
    </View>
  );
}

const cardDimensions = getCardDimensions();

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.white,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: 1,
    borderColor: '#CCCCCC',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  smallCard: cardDimensions.small,
  mediumCard: cardDimensions.medium,
  largeCard: cardDimensions.large,
  cardBack: {
    backgroundColor: '#8B0000',
    borderColor: colors.accent,
    borderWidth: 2,
  },
  backPattern: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#A52A2A',
    margin: 2,
    borderRadius: dimensions.borderRadius.sm,
  },
  backLogo: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    textShadowColor: colors.black,
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 1,
  },
  cardFace: {
    flex: 1,
    position: 'relative',
  },
  cornerTopLeft: {
    position: 'absolute',
    top: 4,
    left: 4,
    alignItems: 'center',
  },
  cornerBottomRight: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    alignItems: 'center',
  },
  cornerValue: {
    fontSize: scaleFont(12),
    fontWeight: typography.fontWeight.bold,
    lineHeight: scaleFont(12),
  },
  cornerSuit: {
    fontSize: scaleFont(10),
    lineHeight: scaleFont(10),
  },
  rotated: {
    transform: [{ rotate: '180deg' }],
  },
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 16,
  },
  numberCard: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerSuit: {
    fontSize: scaleFont(24),
  },
  royaltyCard: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  royaltyValue: {
    fontSize: scaleFont(10),
    fontWeight: typography.fontWeight.bold,
    marginBottom: 2,
  },
  royaltySuit: {
    fontSize: scaleFont(20),
  },
});
