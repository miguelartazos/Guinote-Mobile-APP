import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import type { SpanishSuit, CardValue } from '../../types/cardTypes';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

type CanteType = 'veinte' | 'cuarenta';

type CanteAnimationProps = {
  canteType: CanteType;
  playerPosition: { x: number; y: number };
  onComplete: () => void;
  playSound?: () => void;
  playerName?: string;
};

export function CanteAnimation({
  canteType,
  playerPosition,
  onComplete,
  playSound,
  playerName,
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
      {/* Enhanced cante announcement near player icon */}
      <Animated.View
        style={[
          styles.discreteTextContainer,
          {
            left: playerPosition.x - 60,
            top: playerPosition.y - 70,
            opacity: textAnimation.opacity,
            transform: [{ scale: textAnimation.scale }, { translateY: textAnimation.translateY }],
          },
        ]}
      >
        <View style={styles.speechBubble}>
          <Text style={styles.playerNameText}>{playerName || 'Jugador'}</Text>
          <Text style={styles.discreteCanteText}>
            {canteType === 'veinte' ? '¡Canto 20!' : '¡Las 40!'}
          </Text>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: colors.white,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    alignItems: 'center',
    minWidth: 120,
  },
  playerNameText: {
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 2,
  },
  discreteCanteText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
