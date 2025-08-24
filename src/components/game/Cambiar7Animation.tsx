import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text, Dimensions } from 'react-native';
import { SpanishCard } from './SpanishCard';
import type { Card } from '../../types/game.types';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';

type Cambiar7AnimationProps = {
  playerCard: Card;
  trumpCard: Card;
  playerName: string;
  onComplete: () => void;
  playSound?: () => void;
};

export function Cambiar7Animation({
  playerCard,
  trumpCard,
  playerName,
  onComplete,
  playSound,
}: Cambiar7AnimationProps) {
  const screenDimensions = Dimensions.get('window');
  const centerX = screenDimensions.width / 2;
  const centerY = screenDimensions.height / 2;

  // Animation values for the 7 card (from player to trump position)
  const sevenAnimation = useRef({
    translateX: new Animated.Value(0),
    translateY: new Animated.Value(screenDimensions.height / 3),
    scale: new Animated.Value(1),
    rotation: new Animated.Value(0),
  }).current;

  // Animation values for the trump card (from center to player)
  const trumpAnimation = useRef({
    translateX: new Animated.Value(0),
    translateY: new Animated.Value(0),
    scale: new Animated.Value(1),
    rotation: new Animated.Value(0),
    opacity: new Animated.Value(1),
  }).current;

  // Text animation
  const textAnimation = useRef({
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.5),
    translateY: new Animated.Value(20),
  }).current;

  useEffect(() => {
    const runAnimation = async () => {
      playSound?.();

      // 1. Show message
      await showMessage();

      // 2. Animate cards swapping
      await animateCardSwap();

      // 3. Fade out everything
      await fadeOut();

      // Complete
      setTimeout(onComplete, 100);
    };

    runAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showMessage = async () => {
    await new Promise(resolve => {
      Animated.parallel([
        Animated.timing(textAnimation.opacity, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.spring(textAnimation.scale, {
          toValue: 1,
          friction: 5,
          useNativeDriver: true,
        }),
        Animated.timing(textAnimation.translateY, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ]).start(() => resolve(null));
    });

    // Keep message visible for a moment
    await new Promise(resolve => setTimeout(resolve, 1000));
  };

  const animateCardSwap = async () => {
    await new Promise(resolve => {
      Animated.parallel([
        // Move 7 from player to center (trump position)
        Animated.sequence([
          Animated.parallel([
            Animated.timing(sevenAnimation.translateX, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(sevenAnimation.translateY, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.spring(sevenAnimation.scale, {
              toValue: 1.2,
              friction: 5,
              useNativeDriver: true,
            }),
            Animated.timing(sevenAnimation.rotation, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
          Animated.spring(sevenAnimation.scale, {
            toValue: 1,
            friction: 5,
            useNativeDriver: true,
          }),
        ]),
        // Move trump from center to player
        Animated.sequence([
          Animated.delay(250),
          Animated.parallel([
            Animated.timing(trumpAnimation.translateX, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(trumpAnimation.translateY, {
              toValue: screenDimensions.height / 3,
              duration: 1000,
              useNativeDriver: true,
            }),
            Animated.timing(trumpAnimation.rotation, {
              toValue: -1,
              duration: 1000,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => resolve(null));
    });

    // Keep cards in swapped positions briefly
    await new Promise(resolve => setTimeout(resolve, 600));
  };

  const fadeOut = async () => {
    await new Promise(resolve => {
      Animated.parallel([
        Animated.timing(textAnimation.opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(sevenAnimation.scale, {
          toValue: 0.8,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(trumpAnimation.opacity, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start(() => resolve(null));
    });
  };

  const sevenRotation = sevenAnimation.rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const trumpRotation = trumpAnimation.rotation.interpolate({
    inputRange: [-1, 0],
    outputRange: ['-360deg', '0deg'],
  });

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Message text */}
      <Animated.View
        style={[
          styles.textContainer,
          {
            opacity: textAnimation.opacity,
            transform: [{ scale: textAnimation.scale }, { translateY: textAnimation.translateY }],
          },
        ]}
      >
        <Text style={styles.messageText}>CAMBIO EL 7</Text>
        <Text style={styles.playerNameText}>{playerName}</Text>
      </Animated.View>

      {/* Player's 7 card animating to trump position */}
      <Animated.View
        style={[
          styles.animatedCard,
          {
            left: centerX - 40,
            top: centerY - 60,
            transform: [
              { translateX: sevenAnimation.translateX },
              { translateY: sevenAnimation.translateY },
              { scale: sevenAnimation.scale },
              { rotate: sevenRotation },
            ],
          },
        ]}
      >
        <SpanishCard card={playerCard} size="medium" />
      </Animated.View>

      {/* Trump card animating to player position */}
      <Animated.View
        style={[
          styles.animatedCard,
          {
            left: centerX - 40,
            top: centerY - 60,
            opacity: trumpAnimation.opacity,
            transform: [
              { translateX: trumpAnimation.translateX },
              { translateY: trumpAnimation.translateY },
              { scale: trumpAnimation.scale },
              { rotate: trumpRotation },
            ],
          },
        ]}
      >
        <SpanishCard card={trumpCard} size="medium" />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  animatedCard: {
    position: 'absolute',
    zIndex: 2,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  textContainer: {
    position: 'absolute',
    top: '25%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 5,
  },
  messageText: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.cambiarBlue,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  playerNameText: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.8)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
});
