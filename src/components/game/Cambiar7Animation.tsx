import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Text, Dimensions } from 'react-native';
import { SpanishCard } from './SpanishCard';
import type { Card } from '../../types/game.types';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import {
  getDeckPosition,
  getTrumpPosition,
  getPlayerCardPosition,
  getCardWidth,
  getCardHeight,
} from '../../utils/cardPositions';

type Cambiar7AnimationProps = {
  playerCard: Card;
  trumpCard: Card;
  playerName: string;
  playerIndex: number;
  onComplete: () => void;
  playSound?: () => void;
};

export function Cambiar7Animation({
  playerCard,
  trumpCard,
  playerName,
  playerIndex,
  onComplete,
  playSound,
}: Cambiar7AnimationProps) {
  const screenDimensions = Dimensions.get('window');
  const screenWidth = screenDimensions.width;
  const screenHeight = screenDimensions.height;

  // Calculate actual positions
  const deckPosition = getDeckPosition(screenWidth, screenHeight);
  const trumpPosition = getTrumpPosition(screenWidth, screenHeight);
  const playerHandPosition = getPlayerCardPosition(playerIndex, 3, 10, 'large'); // Assume middle card of hand
  const cardWidth = getCardWidth('medium');
  const cardHeight = getCardHeight('medium');

  // Adjust starting positions to account for medium card size centering
  const adjustedPlayerPosition = {
    ...playerHandPosition,
    x: playerHandPosition.x - cardWidth / 4, // Center adjustment for medium card
    y: playerHandPosition.y - cardHeight / 4,
  };

  const adjustedTrumpPosition = {
    ...trumpPosition,
    x: trumpPosition.x - cardWidth / 4,
    y: trumpPosition.y - cardHeight / 4,
  };

  const adjustedDeckPosition = {
    ...deckPosition,
    x: deckPosition.x - cardWidth / 4,
    y: deckPosition.y - cardHeight / 4,
  };

  // Animation values for the 7 card (from player hand to deck bottom)
  const sevenAnimation = useRef({
    translateX: new Animated.Value(adjustedPlayerPosition.x),
    translateY: new Animated.Value(adjustedPlayerPosition.y),
    scale: new Animated.Value(1),
    rotation: new Animated.Value(playerHandPosition.rotation),
    opacity: new Animated.Value(1),
    zIndex: new Animated.Value(200),
  }).current;

  // Animation values for the trump card (from deck to player hand)
  const trumpAnimation = useRef({
    translateX: new Animated.Value(adjustedTrumpPosition.x),
    translateY: new Animated.Value(adjustedTrumpPosition.y),
    scale: new Animated.Value(1),
    rotation: new Animated.Value(90), // Trump starts rotated
    opacity: new Animated.Value(1),
    zIndex: new Animated.Value(199),
  }).current;

  // Announcement bubble animation positioned near player
  const announcementAnimation = useRef({
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.8),
  }).current;

  // Calculate announcement position based on player index
  const getAnnouncementPosition = () => {
    switch (playerIndex) {
      case 0: // Bottom player
        return { bottom: 150, left: screenWidth / 2 - 100, width: 200 };
      case 1: // Left player
        return { left: 140, top: screenHeight / 2 - 30, width: 180 };
      case 2: // Top player
        return { top: 100, left: screenWidth / 2 - 100, width: 200 };
      case 3: // Right player
        return { right: 140, top: screenHeight / 2 - 30, width: 180 };
      default:
        return { bottom: 150, left: screenWidth / 2 - 100, width: 200 };
    }
  };

  useEffect(() => {
    const runAnimation = async () => {
      playSound?.();

      // 1. Show announcement bubble
      await showAnnouncement();

      // 2. Small delay for readability
      await new Promise(resolve => setTimeout(resolve, 300));

      // 3. Animate cards swapping simultaneously
      await animateCardSwap();

      // 4. Fade out everything
      await fadeOut();

      // Complete
      setTimeout(onComplete, 100);
    };

    runAnimation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const showAnnouncement = async () => {
    await new Promise(resolve => {
      Animated.parallel([
        Animated.timing(announcementAnimation.opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(announcementAnimation.scale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start(() => resolve(null));
    });
  };

  const animateCardSwap = async () => {
    await new Promise(resolve => {
      Animated.parallel([
        // Move 7 from player hand to deck bottom (under the deck)
        Animated.sequence([
          // First scale up slightly
          Animated.timing(sevenAnimation.scale, {
            toValue: 1.15,
            duration: 200,
            useNativeDriver: true,
          }),
          // Then move to deck position
          Animated.parallel([
            Animated.timing(sevenAnimation.translateX, {
              toValue: adjustedDeckPosition.x + 5, // Slightly offset to show it's going under
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(sevenAnimation.translateY, {
              toValue: adjustedDeckPosition.y + 5,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(sevenAnimation.rotation, {
              toValue: 90, // Rotate to match trump orientation
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.delay(400),
              Animated.timing(sevenAnimation.zIndex, {
                toValue: 98, // Move under deck
                duration: 100,
                useNativeDriver: false,
              }),
            ]),
          ]),
        ]),
        // Move trump from deck to player hand
        Animated.sequence([
          // First scale up
          Animated.timing(trumpAnimation.scale, {
            toValue: 1.15,
            duration: 200,
            useNativeDriver: true,
          }),
          // Then move to player position
          Animated.parallel([
            Animated.timing(trumpAnimation.translateX, {
              toValue: adjustedPlayerPosition.x,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(trumpAnimation.translateY, {
              toValue: adjustedPlayerPosition.y,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(trumpAnimation.rotation, {
              toValue: playerHandPosition.rotation,
              duration: 600,
              useNativeDriver: true,
            }),
          ]),
        ]),
      ]).start(() => resolve(null));
    });

    // Brief pause to show completed swap
    await new Promise(resolve => setTimeout(resolve, 300));
  };

  const fadeOut = async () => {
    await new Promise(resolve => {
      Animated.parallel([
        Animated.timing(announcementAnimation.opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(sevenAnimation.opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
        Animated.timing(trumpAnimation.opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: false,
        }),
      ]).start(() => resolve(null));
    });
  };

  const sevenRotationInterpolated = sevenAnimation.rotation.interpolate({
    inputRange: [-90, 0, 90],
    outputRange: ['-90deg', '0deg', '90deg'],
  });

  const trumpRotationInterpolated = trumpAnimation.rotation.interpolate({
    inputRange: [-90, 0, 90],
    outputRange: ['-90deg', '0deg', '90deg'],
  });

  const announcementPosition = getAnnouncementPosition();

  return (
    <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
      {/* Announcement bubble positioned near player */}
      <Animated.View
        style={[
          styles.announcementBubble,
          announcementPosition,
          {
            opacity: announcementAnimation.opacity,
            transform: [{ scale: announcementAnimation.scale }],
          },
        ]}
      >
        <View style={styles.bubbleContent}>
          <Text style={styles.announcementText}>Cambio el 7</Text>
          <Text style={styles.playerNameText}>{playerName}</Text>
        </View>
        <View style={[styles.bubbleTail, playerIndex === 0 && styles.bubbleTailBottom]} />
      </Animated.View>

      {/* Player's 7 card animating to deck */}
      <Animated.View
        style={[
          styles.animatedCard,
          styles.absoluteCard,
          {
            width: cardWidth,
            height: cardHeight,
            zIndex: sevenAnimation.zIndex,
            opacity: sevenAnimation.opacity,
            transform: [
              { translateX: sevenAnimation.translateX },
              { translateY: sevenAnimation.translateY },
              { scale: sevenAnimation.scale },
              { rotate: sevenRotationInterpolated },
            ],
          },
        ]}
      >
        <SpanishCard card={playerCard} size="medium" />
      </Animated.View>

      {/* Trump card animating to player hand */}
      <Animated.View
        style={[
          styles.animatedCard,
          styles.absoluteCard,
          {
            width: cardWidth,
            height: cardHeight,
            zIndex: trumpAnimation.zIndex,
            opacity: trumpAnimation.opacity,
            transform: [
              { translateX: trumpAnimation.translateX },
              { translateY: trumpAnimation.translateY },
              { scale: trumpAnimation.scale },
              { rotate: trumpRotationInterpolated },
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
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  absoluteCard: {
    position: 'absolute',
    left: 0,
    top: 0,
  },
  announcementBubble: {
    position: 'absolute',
    backgroundColor: colors.white,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 12,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 300,
  },
  bubbleContent: {
    alignItems: 'center',
  },
  bubbleTail: {
    position: 'absolute',
    bottom: -8,
    left: '50%',
    marginLeft: -8,
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.white,
  },
  bubbleTailBottom: {
    transform: [{ rotate: '180deg' }],
    bottom: 'auto',
    top: -8,
  },
  announcementText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.cambiarBlue,
    marginBottom: 4,
  },
  playerNameText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.medium,
    color: colors.textSecondary,
  },
});
