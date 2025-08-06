import React, { useEffect, useRef } from 'react';
import { Animated, View, StyleSheet } from 'react-native';
import { SpanishCard } from './SpanishCard';
import type { SpanishCardData } from './SpanishCard';
import { useGameSettings } from '../../hooks/useGameSettings';
import { getCardDimensions } from '../../utils/responsive';

type TrumpRevealAnimationProps = {
  trumpCard: SpanishCardData;
  deckPosition: { x: number; y: number };
  onComplete: () => void;
};

export function TrumpRevealAnimation({
  trumpCard,
  deckPosition,
  onComplete,
}: TrumpRevealAnimationProps) {
  const { settings } = useGameSettings();
  const cardSize = settings?.cardSize || 'medium';

  const flipAnimation = useRef(new Animated.Value(0)).current;
  const slideAnimation = useRef(new Animated.Value(0)).current;
  const rotateAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Sound removed: flip sound

    // Animate trump card reveal
    Animated.sequence([
      // First, flip the card
      Animated.timing(flipAnimation, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      // Then slide it down and rotate 90 degrees
      Animated.parallel([
        Animated.timing(slideAnimation, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(rotateAnimation, {
          toValue: 90,
          duration: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start(() => {
      onComplete();
    });
  }, [flipAnimation, slideAnimation, rotateAnimation, onComplete]);

  const cardDimensions = getCardDimensions(cardSize);

  // Flip animation interpolation
  const frontOpacity = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 0, 1],
  });

  const backOpacity = flipAnimation.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1, 1, 0],
  });

  const rotateY = flipAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const translateY = slideAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 30],
  });

  return (
    <View
      style={[
        styles.container,
        { left: deckPosition.x - 50, top: deckPosition.y - 70 },
      ]}
    >
      <Animated.View
        style={[
          styles.card,
          {
            width: cardDimensions.table.width,
            height: cardDimensions.table.height,
            transform: [
              { rotateY },
              { translateY },
              {
                rotate: rotateAnimation.interpolate({
                  inputRange: [0, 90],
                  outputRange: ['0deg', '90deg'],
                }),
              },
            ],
          },
        ]}
      >
        {/* Back of card */}
        <Animated.View style={[styles.cardFace, { opacity: backOpacity }]}>
          <SpanishCard faceDown size={cardSize} />
        </Animated.View>

        {/* Front of card (trump) */}
        <Animated.View
          style={[styles.cardFace, styles.cardFront, { opacity: frontOpacity }]}
        >
          <SpanishCard card={trumpCard} size={cardSize} />
        </Animated.View>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 100,
  },
  card: {
    position: 'relative',
  },
  cardFace: {
    position: 'absolute',
    top: 0,
    left: 0,
    backfaceVisibility: 'hidden',
  },
  cardFront: {
    transform: [{ rotateY: '180deg' }],
  },
});
