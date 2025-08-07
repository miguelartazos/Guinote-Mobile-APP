import React, { useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { SpanishCard } from './SpanishCard';
import type { Card } from '../../types/game.types';
import {
  getDeckPosition,
  getTrumpPosition,
  CARD_WIDTH,
  CARD_HEIGHT,
} from '../../utils/cardPositions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type TrumpRevealAnimationProps = {
  trumpCard: Card;
  onComplete: () => void;
};

export function TrumpRevealAnimation({
  trumpCard,
  onComplete,
}: TrumpRevealAnimationProps) {
  const deckPosition = getDeckPosition(SCREEN_WIDTH, SCREEN_HEIGHT);
  const trumpPosition = getTrumpPosition(SCREEN_WIDTH, SCREEN_HEIGHT);

  const translateX = useSharedValue(deckPosition.x);
  const translateY = useSharedValue(deckPosition.y);
  const rotateY = useSharedValue(0);
  const rotateZ = useSharedValue(0);
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  useEffect(() => {
    // Animate trump card reveal sequence
    // 1. Flip the card (reveal face)
    rotateY.value = withTiming(180, {
      duration: 600,
      easing: Easing.inOut(Easing.cubic),
    });

    // 2. After flip, move to trump position below deck
    translateY.value = withDelay(
      600,
      withTiming(trumpPosition.y, {
        duration: 800,
        easing: Easing.inOut(Easing.cubic),
      }),
    );

    // 3. Rotate 90 degrees as it moves
    rotateZ.value = withDelay(
      600,
      withTiming(
        90,
        {
          duration: 800,
          easing: Easing.inOut(Easing.cubic),
        },
        () => {
          'worklet';
          runOnJS(onComplete)();
        },
      ),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: translateX.value, // Use position directly as LEFT edge
    top: translateY.value, // Use position directly as TOP edge
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    transform: [
      { rotateY: `${rotateY.value}deg` },
      { rotateZ: `${rotateZ.value}deg` },
      { scale: scale.value },
    ],
    opacity: opacity.value,
    zIndex: trumpPosition.zIndex,
  }));

  const cardFaceStyle = useAnimatedStyle(() => ({
    opacity: rotateY.value > 90 ? 1 : 0,
    backfaceVisibility: 'hidden' as const,
  }));

  const cardBackStyle = useAnimatedStyle(() => ({
    opacity: rotateY.value <= 90 ? 1 : 0,
    backfaceVisibility: 'hidden' as const,
  }));

  return (
    <Animated.View style={animatedStyle}>
      {/* Back of card */}
      <Animated.View style={[StyleSheet.absoluteFillObject, cardBackStyle]}>
        <SpanishCard faceUp={false} size="small" selectable={false} />
      </Animated.View>

      {/* Front of card (trump) */}
      <Animated.View
        style={[
          StyleSheet.absoluteFillObject,
          cardFaceStyle,
          { transform: [{ rotateY: '180deg' }] },
        ]}
      >
        <SpanishCard
          card={trumpCard}
          faceUp={true}
          size="small"
          selectable={false}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
  },
});
