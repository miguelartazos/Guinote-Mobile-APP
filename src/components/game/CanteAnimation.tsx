import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text, Dimensions } from 'react-native';
import { SpanishCard } from './SpanishCard';
import type { SpanishSuit, CardValue } from '../../types/cardTypes';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import {
  CANTE_GLOW_DURATION,
  CANTE_FLIP_DURATION,
  CANTE_TEXT_DURATION,
  COIN_RAIN_DURATION,
  PARTNER_NOTIFY_DURATION,
  BOUNCE_CONFIG,
} from '../../constants/animations';

type CanteType = 'veinte' | 'cuarenta';

type CanteAnimationProps = {
  cards: Array<{ suit: SpanishSuit; value: CardValue }>;
  canteType: CanteType;
  playerPosition: { x: number; y: number };
  partnerPosition?: { x: number; y: number };
  onComplete: () => void;
  playSound?: () => void;
};

export function CanteAnimation({
  cards,
  canteType,
  playerPosition,
  partnerPosition,
  onComplete,
  playSound,
}: CanteAnimationProps) {
  const screenDimensions = Dimensions.get('window');
  const centerX = screenDimensions.width / 2;

  // Card animations
  const cardAnimations = useRef(
    cards.map(() => ({
      rotation: new Animated.Value(0),
      scale: new Animated.Value(1),
      glow: new Animated.Value(0),
    })),
  ).current;

  // Text animation
  const textAnimation = useRef({
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.5),
    translateY: new Animated.Value(20),
  }).current;

  // Coin rain animations (for cuarenta)
  const coinAnimations = useRef(
    Array.from({ length: 8 }, () => ({
      translateY: new Animated.Value(-50),
      translateX: new Animated.Value((Math.random() - 0.5) * 100),
      opacity: new Animated.Value(0),
      rotation: new Animated.Value(0),
    })),
  ).current;

  // Partner notification
  const partnerNotification = useRef({
    opacity: new Animated.Value(0),
    translateX: new Animated.Value(-50),
  }).current;

  useEffect(() => {
    const runAnimation = async () => {
      playSound?.();

      // 1. Glow and flip cards
      await animateCardsGlowAndFlip();

      // 2. Show cante text
      await showCanteText();

      // 3. Special effects based on type
      if (canteType === 'cuarenta') {
        await animateCoinRain();
      }

      // 4. Notify partner if applicable
      if (partnerPosition) {
        await notifyPartner();
      }

      // Complete
      setTimeout(onComplete, 300);
    };

    runAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const animateCardsGlowAndFlip = async () => {
    const animations = cardAnimations.map(anim =>
      Animated.parallel([
        // Glow effect
        Animated.sequence([
          Animated.timing(anim.glow, {
            toValue: 1,
            duration: CANTE_GLOW_DURATION / 2,
            useNativeDriver: false, // Can't use native driver for shadow
          }),
          Animated.timing(anim.glow, {
            toValue: 0.5,
            duration: CANTE_GLOW_DURATION / 2,
            useNativeDriver: false,
          }),
        ]),
        // 3D flip
        Animated.sequence([
          Animated.timing(anim.rotation, {
            toValue: 0.5,
            duration: CANTE_FLIP_DURATION / 2,
            useNativeDriver: true,
          }),
          Animated.timing(anim.rotation, {
            toValue: 1,
            duration: CANTE_FLIP_DURATION / 2,
            useNativeDriver: true,
          }),
        ]),
        // Scale bounce
        Animated.sequence([
          Animated.spring(anim.scale, {
            toValue: 1.3,
            ...BOUNCE_CONFIG,
          }),
          Animated.spring(anim.scale, {
            toValue: 1.1,
            ...BOUNCE_CONFIG,
          }),
        ]),
      ]),
    );

    await new Promise(resolve => {
      Animated.parallel(animations).start(() => resolve(null));
    });
  };

  const showCanteText = async () => {
    await new Promise(resolve => {
      Animated.parallel([
        Animated.timing(textAnimation.opacity, {
          toValue: 1,
          duration: CANTE_TEXT_DURATION / 2,
          useNativeDriver: true,
        }),
        Animated.spring(textAnimation.scale, {
          toValue: 1,
          ...BOUNCE_CONFIG,
        }),
        Animated.timing(textAnimation.translateY, {
          toValue: 0,
          duration: CANTE_TEXT_DURATION / 2,
          useNativeDriver: true,
        }),
      ]).start(() => resolve(null));
    });

    // Keep text visible for a moment
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Fade out
    await new Promise(resolve => {
      Animated.timing(textAnimation.opacity, {
        toValue: 0,
        duration: CANTE_TEXT_DURATION / 4,
        useNativeDriver: true,
      }).start(() => resolve(null));
    });
  };

  const animateCoinRain = async () => {
    const animations = coinAnimations.map((anim, index) =>
      Animated.sequence([
        Animated.delay(index * 100),
        Animated.parallel([
          Animated.timing(anim.translateY, {
            toValue: screenDimensions.height,
            duration: COIN_RAIN_DURATION,
            useNativeDriver: true,
          }),
          Animated.sequence([
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: 200,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 0,
              duration: 200,
              delay: COIN_RAIN_DURATION - 400,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(anim.rotation, {
            toValue: 4,
            duration: COIN_RAIN_DURATION,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );

    await new Promise(resolve => {
      Animated.parallel(animations).start(() => resolve(null));
    });
  };

  const notifyPartner = async () => {
    await new Promise(resolve => {
      Animated.parallel([
        Animated.timing(partnerNotification.opacity, {
          toValue: 1,
          duration: PARTNER_NOTIFY_DURATION / 2,
          useNativeDriver: true,
        }),
        Animated.timing(partnerNotification.translateX, {
          toValue: 0,
          duration: PARTNER_NOTIFY_DURATION,
          useNativeDriver: true,
        }),
      ]).start(() => resolve(null));
    });

    // Keep visible briefly
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Fade out
    await new Promise(resolve => {
      Animated.timing(partnerNotification.opacity, {
        toValue: 0,
        duration: PARTNER_NOTIFY_DURATION / 2,
        useNativeDriver: true,
      }).start(() => resolve(null));
    });
  };

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Animated cards with glow */}
      {cardAnimations.map((anim, index) => {
        const interpolatedRotation = anim.rotation.interpolate({
          inputRange: [0, 1],
          outputRange: ['0deg', '360deg'],
        });

        return (
          <Animated.View
            key={`cante-card-${index}`}
            style={[
              styles.animatedCard,
              {
                left: playerPosition.x + index * 60 - 30,
                top: playerPosition.y - 50,
                transform: [{ rotateY: interpolatedRotation }, { scale: anim.scale }],
                shadowColor: colors.accent,
                shadowOpacity: anim.glow,
                shadowRadius: Animated.multiply(anim.glow, 20),
              },
            ]}
          >
            <SpanishCard card={cards[index]} size="medium" />
          </Animated.View>
        );
      })}

      {/* Cante text */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textAnimation.opacity,
            transform: [{ scale: textAnimation.scale }, { translateY: textAnimation.translateY }],
          },
        ]}
      >
        <Text style={styles.canteText}>¡{canteType === 'veinte' ? 'VEINTE' : 'CUARENTA'}!</Text>
      </Animated.View>

      {/* Coin rain for cuarenta */}
      {canteType === 'cuarenta' &&
        coinAnimations.map((anim, index) => (
          <Animated.Text
            key={`coin-${index}`}
            style={[
              styles.coin,
              {
                left: centerX + Number(anim.translateX),
                opacity: anim.opacity,
                transform: [
                  { translateY: anim.translateY },
                  {
                    rotate: anim.rotation.interpolate({
                      inputRange: [0, 4],
                      outputRange: ['0deg', '1440deg'],
                    }),
                  },
                ],
              },
            ]}
          >
            🪙
          </Animated.Text>
        ))}

      {/* Partner notification */}
      {partnerPosition && (
        <Animated.View
          style={[
            styles.partnerNotification,
            {
              left: partnerPosition.x - 50,
              top: partnerPosition.y - 30,
              opacity: partnerNotification.opacity,
              transform: [{ translateX: partnerNotification.translateX }],
            },
          ]}
        >
          <Text style={styles.partnerText}>¡Cante de tu compañero!</Text>
        </Animated.View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  animatedCard: {
    position: 'absolute',
    zIndex: 2,
  },
  textContainer: {
    position: 'absolute',
    top: '30%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  canteText: {
    fontSize: typography.fontSize.xxxl * 1.5,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 3, height: 3 },
    textShadowRadius: 5,
  },
  coin: {
    position: 'absolute',
    fontSize: 30,
    zIndex: 4,
  },
  partnerNotification: {
    position: 'absolute',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.accent,
    zIndex: 6,
  },
  partnerText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
  },
});
