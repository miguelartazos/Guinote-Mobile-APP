import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import type { SpanishSuit, CardValue } from '../../types/cardTypes';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

type CanteType = 'veinte' | 'cuarenta';

type CanteAnimationProps = {
  cards: Array<{ suit: SpanishSuit; value: CardValue }>;
  canteType: CanteType;
  playerPosition: { x: number; y: number };
  onComplete: () => void;
  playSound?: () => void;
  playerName?: string;
  playerAvatar?: string;
};

export function CanteAnimation({
  cards,
  canteType,
  playerPosition,
  onComplete,
  playSound,
}: CanteAnimationProps) {
  // Text animation - smaller and near player
  const textAnimation = useRef({
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.8),
    translateY: new Animated.Value(10),
  }).current;

  useEffect(() => {
    const runAnimation = async () => {
      playSound?.();

      // Show discrete text near player for 2 seconds
      await showCanteText();

      // Complete immediately after text fades
      onComplete();
    };

    runAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Card animations removed for discrete display

  const showCanteText = async () => {
    // Fade in quickly (200ms)
    await new Promise(resolve => {
      Animated.parallel([
        Animated.timing(textAnimation.opacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(textAnimation.scale, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(textAnimation.translateY, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start(() => resolve(null));
    });

    // Keep visible for 1.6 seconds
    await new Promise(resolve => setTimeout(resolve, 1600));

    // Fade out quickly (200ms)
    await new Promise(resolve => {
      Animated.timing(textAnimation.opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start(() => resolve(null));
    });
  };

  // Coin rain and partner notification removed for discrete display

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Discrete cante text near player icon */}
      <Animated.View
        style={[
          styles.discreteTextContainer,
          {
            left: playerPosition.x - 40,
            top: playerPosition.y - 60,
            opacity: textAnimation.opacity,
            transform: [{ scale: textAnimation.scale }, { translateY: textAnimation.translateY }],
          },
        ]}
      >
        <View style={styles.speechBubble}>
          <Text style={styles.discreteCanteText}>{canteType === 'veinte' ? '20' : '40'}</Text>
        </View>
      </Animated.View>

      {/* Removed coin rain and partner notification for more discrete display */}
    </View>
  );
}

const styles = StyleSheet.create({
  discreteTextContainer: {
    position: 'absolute',
    zIndex: 1000,
    alignItems: 'center',
  },
  speechBubble: {
    backgroundColor: colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  discreteCanteText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
});
