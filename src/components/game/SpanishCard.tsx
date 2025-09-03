import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import type { StyleProp } from 'react-native';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { getCardDimensions } from '../../utils/responsive';
import { CardGraphics } from './CardGraphics';
import { CardBack } from './CardBack';
import type { SpanishCardData } from '../../types/cardTypes';

// Re-export SpanishCardData for convenience
export type { SpanishCardData } from '../../types/cardTypes';

type SpanishCardProps = {
  card?: SpanishCardData;
  faceDown?: boolean;
  size?: 'small' | 'medium' | 'large';
  style?: StyleProp<ViewStyle>;
  isDisabled?: boolean;
};

export const SpanishCard = React.memo(function SpanishCard({
  card,
  faceDown = false,
  size = 'medium',
  style,
  isDisabled = false,
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
      {isDisabled && (
        <View
          testID="disabled-overlay"
          style={[
            styles.disabledOverlay,
            {
              width: cardSize.width,
              height: cardSize.height,
            },
          ]}
        />
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
    borderRadius: dimensions.borderRadius.md,
    overflow: 'hidden',
    // Improve animation stability
    backfaceVisibility: 'hidden',
    renderToHardwareTextureAndroid: true,
    shouldRasterizeIOS: true,
  },
  disabledOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: dimensions.borderRadius.md,
  },
});
