import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import type { StyleProp } from 'react-native';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { getCardDimensions } from '../../utils/responsive';
import { CardGraphics } from './CardGraphics';
import { CardBack } from './CardBack';

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
  style?: StyleProp<ViewStyle>;
};

export function SpanishCard({
  card,
  faceDown = false,
  size = 'medium',
  style,
}: SpanishCardProps) {
  const cardDimensions = getCardDimensions();
  const cardSize = cardDimensions[size];
  const cardStyles = [styles.card, cardSize, style];

  if (faceDown || !card) {
    return (
      <View style={cardStyles}>
        <CardBack width={cardSize.width} height={cardSize.height} />
      </View>
    );
  }

  return (
    <View style={cardStyles}>
      <CardGraphics
        suit={card.suit}
        value={card.value}
        width={cardSize.width}
        height={cardSize.height}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    borderRadius: dimensions.borderRadius.md,
    overflow: 'hidden',
  },
});
