import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';
import { SpanishCard } from './SpanishCard';
import { getCardDimensions } from '../../utils/responsive';
import type { SpanishSuit, CardValue } from '../../types/cardTypes';
import {
  TRICK_SLIDE_DURATION,
  TRICK_CELEBRATION_DURATION,
  SMOOTH_EASING,
  BOUNCE_EASING,
  WINNER_HIGHLIGHT_DURATION,
  WINNER_HIGHLIGHT_SCALE,
  WINNER_HIGHLIGHT_DELAY,
} from '../../constants/animations';
import { runAfterInteractions } from '../../utils/animationPerformance';

type TrickCollectionAnimationProps = {
  cards: Array<{ suit: SpanishSuit; value: CardValue }>;
  winnerPosition: { x: number; y: number };
  startPositions?: Array<{ x: number; y: number }>; // absolute positions where cards currently are
  winningCardIndex?: number; // index of the winning card within cards array
  points: number;
  bonus?: number;
  showLastTrickBonus?: boolean;
  onComplete: () => void;
  playSound?: () => void;
};

export function TrickCollectionAnimation({
  cards,
  winnerPosition,
  startPositions,
  winningCardIndex = 0,
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
    // Don't run if already completed (prevents double execution)
    if (hasCompletedRef.current) return;

    const runAnimation = async () => {
      playSound?.();

      // Initialize starting positions so cards animate from the trick location
      if (startPositions && startPositions.length === cardAnimations.length) {
        startPositions.forEach((p, i) => {
          cardAnimations[i].position.setValue({ x: p.x, y: p.y });
        });
      }

      // 1. Highlight the winning card
      await highlightWinnerCard();

      // 2. Fly cards directly from trick positions to winner pile
      await animateCardsToWinner();

      // 3. Show sparkle effect
      await showSparkleEffect();

      // Complete with a small delay, using runAfterInteractions to avoid React state update conflicts
      animationTimeoutRef.current = setTimeout(() => {
        if (!hasCompletedRef.current) {
          hasCompletedRef.current = true;
          // Defer state updates to avoid React internal errors
          runAfterInteractions(() => {
            onComplete?.();
          });
        }
      }, 300);
    };

    // Start animation immediately (no queueing!)
    runAnimation();

    // Simple cleanup function ensures onComplete is ALWAYS called
    return () => {
      // Clear any pending timeout
      if (animationTimeoutRef.current) {
        clearTimeout(animationTimeoutRef.current);
        animationTimeoutRef.current = null;
      }

      // Ensure onComplete is called if component unmounts before animation completes
      if (!hasCompletedRef.current) {
        hasCompletedRef.current = true;
        if (__DEV__) {
          console.log('⚠️ TrickCollectionAnimation cleanup: calling onComplete');
        }
        // Use setTimeout with 0 delay to ensure we're completely out of React's commit phase
        // This prevents the "Expected static flag was missing" error
        setTimeout(() => {
          onComplete?.();
        }, 0);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const highlightWinnerCard = async () => {
    // Only animate if we have a valid winning card index
    if (winningCardIndex < 0 || winningCardIndex >= cardAnimations.length) {
      return;
    }

    // Shorter wait for snappier feel
    await new Promise(resolve => setTimeout(resolve, Math.max(100, WINNER_HIGHLIGHT_DELAY - 100)));

    // Stabilize all cards before animation to prevent jumps
    cardAnimations.forEach((anim, i) => {
      // Ensure all cards start at scale 1
      anim.scale.setValue(1);
      // Stop any in-flight rotation animations
      anim.rotation.stopAnimation();
      anim.rotation.setValue(0);
    });

    // Animate the winning card scale up
    await new Promise(resolve => {
      Animated.sequence([
        // Scale up
        Animated.timing(cardAnimations[winningCardIndex].scale, {
          toValue: WINNER_HIGHLIGHT_SCALE,
          duration: WINNER_HIGHLIGHT_DURATION / 2,
          easing: SMOOTH_EASING,
          useNativeDriver: true,
        }),
        // Hold at peak
        Animated.delay(100),
        // Scale back down
        Animated.timing(cardAnimations[winningCardIndex].scale, {
          toValue: 1,
          duration: WINNER_HIGHLIGHT_DURATION / 2,
          easing: SMOOTH_EASING,
          useNativeDriver: true,
        }),
      ]).start(() => resolve(null));
    });
  };

  const animateCardsToWinner = async () => {
    const dims = getCardDimensions().medium;
    const targetX = winnerPosition.x - dims.width / 2;
    const targetY = winnerPosition.y - dims.height / 2;

    const animations = cardAnimations.map(anim => {
      // Fly all cards to the exact center of the pile
      const offsetX = 0;
      const offsetY = 0;

      // Keep cards at their natural size (1.0) - no scaling
      return Animated.parallel([
        Animated.timing(anim.position, {
          toValue: {
            x: targetX + offsetX,
            y: targetY + offsetY,
          },
          duration: TRICK_SLIDE_DURATION,
          easing: SMOOTH_EASING,
          useNativeDriver: true,
        }),
        Animated.timing(anim.rotation, {
          toValue: (Math.random() - 0.5) * 0.2,
          duration: TRICK_SLIDE_DURATION,
          useNativeDriver: true,
        }),
      ]);
    });

    await new Promise(resolve => {
      // Reduced stagger for faster collection
      Animated.stagger(50, animations).start(() => resolve(null));
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
              zIndex: index === winningCardIndex ? 999 : 2,
            },
          ]}
        >
          <SpanishCard card={cards[index]} size="medium" />
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
