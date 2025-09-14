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
  // New: visually darken the card (without disabling) when it's the player's turn
  turnActive?: boolean;
  // Optional: customize turn darkening opacity (0-1). Defaults to 0.2
  turnOverlayOpacity?: number;
  // Optional: force an exact pixel size to ensure consistency across layers
  fixedCardSize?: { width: number; height: number };
};

export const SpanishCard = React.memo(function SpanishCard({
  card,
  faceDown = false,
  size = 'medium',
  style,
  isDisabled = false,
  turnActive = false,
  turnOverlayOpacity,
  fixedCardSize,
}: SpanishCardProps) {
  const cardDimensions = getCardDimensions();
  const cardSize = fixedCardSize ?? cardDimensions[size];
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
      {(() => {
        // Compute overlay opacity priority:
        // - Unplayable (disabled): 0.2 (as requested)
        // - Turn-active (subtle hint): default 0.2 (tunable via prop)
        const overlayOpacity = isDisabled ? 0.2 : turnActive ? turnOverlayOpacity ?? 0.2 : 0;
        if (overlayOpacity <= 0) return null;
        return (
        <View
          testID="disabled-overlay"
          style={[
            styles.disabledOverlay,
            {
              width: cardSize.width,
              height: cardSize.height,
              // Dynamic darkness
              backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`,
            },
          ]}
        />
        );
      })()}
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
    borderRadius: dimensions.borderRadius.md,
  },
});
