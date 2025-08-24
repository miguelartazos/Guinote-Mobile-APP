import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { SpanishCard } from './SpanishCard';
import type { SpanishSuit, CardValue } from '../../types/cardTypes';
import {
  TRICK_SLIDE_DURATION,
  TRICK_CELEBRATION_DURATION,
  SMOOTH_EASING,
  BOUNCE_EASING,
} from '../../constants/animations';

type TrickCollectionAnimationProps = {
  cards: Array<{ suit: SpanishSuit; value: CardValue }>;
  winnerPosition: { x: number; y: number };
  points: number;
  bonus?: number;
  showLastTrickBonus?: boolean;
  onComplete: () => void;
  playSound?: () => void;
};

export function TrickCollectionAnimation({
  cards,
  winnerPosition,
  points: _points,
  bonus,
  showLastTrickBonus,
  onComplete,
  playSound,
}: TrickCollectionAnimationProps) {
  // Animation values for each card
  const cardAnimations = useRef(
    cards.map(() => ({
      position: new Animated.ValueXY({ x: 0, y: 0 }),
      opacity: new Animated.Value(1),
      scale: new Animated.Value(1),
      rotation: new Animated.Value(0),
    })),
  ).current;

  // Sparkle animation
  const sparkleAnimation = useRef({
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.5),
  }).current;

  // Track if onComplete has been called to prevent double-calling
  const hasCompletedRef = useRef(false);
  const animationTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const runAnimation = async () => {
      playSound?.();

      // 1. Slide cards to winner
      await animateCardsToWinner();

      // 2. Show sparkle effect
      await showSparkleEffect();

      // Complete
      animationTimeoutRef.current = setTimeout(() => {
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          onComplete?.();
        }
      }, 300);
    };

    runAnimation();

    // CRITICAL: Cleanup function ensures onComplete is ALWAYS called
    return () => {
      // Clear any pending timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
      }

      // Ensure onComplete is called if component unmounts before animation completes
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        console.log('⚠️ TrickCollectionAnimation cleanup: calling onComplete');
        onComplete?.();
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animateCardsToWinner = async () => {
    const animations = cardAnimations.map((anim, index) => {
      // Stagger cards slightly
      const offsetX = index * 3;
      const offsetY = index * 3;

      return Animated.parallel([
        Animated.timing(anim.position, {
          toValue: {
            x: winnerPosition.x + offsetX,
            y: winnerPosition.y + offsetY,
          },
          duration: TRICK_SLIDE_DURATION,
          easing: SMOOTH_EASING,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(anim.scale, {
            toValue: 0.9,
            duration: TRICK_SLIDE_DURATION / 2,
            useNativeDriver: true,
          }),
          Animated.timing(anim.scale, {
            toValue: 0.7,
            duration: TRICK_SLIDE_DURATION / 2,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(anim.rotation, {
          toValue: (Math.random() - 0.5) * 0.2,
          duration: TRICK_SLIDE_DURATION,
          useNativeDriver: true,
        }),
      ]);
    });

    await new Promise(resolve => {
      Animated.stagger(100, animations).start(() => resolve(null));
    });
  };

  const showSparkleEffect = async () => {
    await new Promise(resolve => {
      Animated.parallel([
        Animated.sequence([
          Animated.timing(sparkleAnimation.opacity, {
            toValue: 1,
            duration: TRICK_CELEBRATION_DURATION / 4,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnimation.opacity, {
            toValue: 0,
            duration: (TRICK_CELEBRATION_DURATION * 3) / 4,
            useNativeDriver: true,
          }),
        ]),
        Animated.timing(sparkleAnimation.scale, {
          toValue: 1.5,
          duration: TRICK_CELEBRATION_DURATION,
          easing: BOUNCE_EASING,
          useNativeDriver: true,
        }),
      ]).start(() => resolve(null));
    });
  };

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Animated cards */}
      {cardAnimations.map((anim, index) => (
        <Animated.View
          key={`trick-card-${index}`}
          style={[
            styles.animatedCard,
            {
              transform: [
                { translateX: anim.position.x },
                { translateY: anim.position.y },
                { scale: anim.scale },
                {
                  rotate: anim.rotation.interpolate({
                    inputRange: [-0.2, 0.2],
                    outputRange: ['-11.5deg', '11.5deg'], // Convert radians to degrees
                  }),
                },
              ],
              opacity: anim.opacity,
            },
          ]}
        >
          <SpanishCard card={cards[index]} size="small" />
        </Animated.View>
      ))}

      {/* Sparkle effect */}
      <Animated.View
        style={[
          styles.sparkleContainer,
          {
            left: winnerPosition.x - 30,
            top: winnerPosition.y - 30,
            opacity: sparkleAnimation.opacity,
            transform: [{ scale: sparkleAnimation.scale }],
          },
        ]}
      >
        <Text style={styles.sparkleText}>✨</Text>
      </Animated.View>

      {/* Last trick bonus overlay */}
      {showLastTrickBonus && (
        <View
          style={[
            styles.bonusContainer,
            { left: winnerPosition.x - 10, top: winnerPosition.y - 50 },
          ]}
        >
          <Text style={styles.bonusText}>+{(bonus ?? 10).toString()} de últimas</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  animatedCard: {
    position: 'absolute',
    zIndex: 2,
  },
  sparkleContainer: {
    position: 'absolute',
    zIndex: 3,
    width: 60,
    height: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sparkleText: {
    fontSize: 40,
  },
  bonusContainer: {
    position: 'absolute',
    zIndex: 4,
    backgroundColor: 'rgba(0,0,0,0.75)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#D4A574',
  },
  bonusText: {
    color: '#D4A574',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
