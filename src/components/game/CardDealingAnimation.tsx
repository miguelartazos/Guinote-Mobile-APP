import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Text, Dimensions } from 'react-native';
import { SpanishCard } from './SpanishCard';
import type { SpanishSuit, CardValue } from '../../types/cardTypes';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';
import { CARD_DEAL_DURATION, SMOOTH_EASING } from '../../constants/animations';
import { getCardDimensions } from '../../utils/responsive';
import {
  getPlayerCardPosition,
  getDeckPosition,
  getTrumpPosition,
  type LayoutInfo,
  computeBoardLayout,
} from '../../utils/cardPositions';

const CARDS_PER_ROUND = 3;
const TRUMP_REVEAL_DURATION = 800;

type CardDealingAnimationProps = {
  trumpCard: { suit: SpanishSuit; value: CardValue };
  playerCards: Array<{ suit: SpanishSuit; value: CardValue }>;
  onComplete: () => void;
  playDealSound: () => void;
  playTrumpRevealSound: () => void;
  playShuffleSound: () => void;
  firstPlayerIndex: number;
};

export function CardDealingAnimation({
  trumpCard,
  playerCards,
  onComplete,
  playDealSound,
  playTrumpRevealSound,
  playShuffleSound,
  firstPlayerIndex,
}: CardDealingAnimationProps) {
  const [dealingPhase, setDealingPhase] = useState<
    'shuffle' | 'deal1' | 'deal2' | 'trump' | 'complete'
  >('shuffle');
  const [showGameStart, setShowGameStart] = useState(false);

  const screenDimensions = Dimensions.get('window');
  const parentWidth = screenDimensions.width;
  const parentHeight = screenDimensions.height;
  const layoutInfo: LayoutInfo = {
    parentLayout: { x: 0, y: 0, width: parentWidth, height: parentHeight },
    boardLayout: computeBoardLayout(parentWidth, parentHeight),
  };

  // Animation values for each card
  const cardAnimations = useRef<
    Array<{
      position: Animated.ValueXY;
      opacity: Animated.Value;
      scale: Animated.Value;
      rotation: Animated.Value;
    }>
  >([]);

  // Shuffle animation values
  const shuffleAnimation = useRef({
    rotation: new Animated.Value(0),
    translateX: new Animated.Value(0),
    translateY: new Animated.Value(0),
  }).current;

  // Initialize animations for 24 cards (6 per player)
  useEffect(() => {
    const deckPos = getDeckPosition(parentWidth, parentHeight, layoutInfo);
    for (let i = 0; i < 24; i++) {
      cardAnimations.current[i] = {
        position: new Animated.ValueXY({
          x: deckPos.x,
          y: deckPos.y,
        }),
        opacity: new Animated.Value(0),
        scale: new Animated.Value(0.8),
        rotation: new Animated.Value(0),
      };
    }
  }, [parentWidth, parentHeight]);

  // Trump card animation values
  const trumpAnimation = useRef({
    rotation: new Animated.Value(0),
    scale: new Animated.Value(1),
    opacity: new Animated.Value(0),
  }).current;

  // Game start text animation
  const gameStartAnimation = useRef({
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.8),
  }).current;

  // Main animation sequence
  useEffect(() => {
    const runAnimationSequence = async () => {
      // 1. Shuffle phase with animation
      await performShuffleAnimation();

      // 2. First deal round (3 cards each)
      setDealingPhase('deal1');
      await dealCardsRound(0);

      // 3. Second deal round (3 cards each)
      setDealingPhase('deal2');
      await dealCardsRound(1);

      // 4. Trump reveal
      setDealingPhase('trump');
      await revealTrumpCard();

      // 5. Show game start message
      setShowGameStart(true);
      await showGameStartMessage();

      // 6. Complete
      setDealingPhase('complete');
      setTimeout(onComplete, 300);
    };

    runAnimationSequence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const performShuffleAnimation = async () => {
    playShuffleSound();

    await new Promise(resolve => {
      Animated.sequence([
        Animated.parallel([
          Animated.sequence([
            Animated.timing(shuffleAnimation.rotation, {
              toValue: 0.05,
              duration: 100,
              easing: SMOOTH_EASING,
              useNativeDriver: true,
            }),
            Animated.timing(shuffleAnimation.rotation, {
              toValue: -0.05,
              duration: 100,
              easing: SMOOTH_EASING,
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(shuffleAnimation.translateX, {
            toValue: 5,
            duration: 100,
            easing: SMOOTH_EASING,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(shuffleAnimation.rotation, {
            toValue: 0,
            duration: 200,
            easing: SMOOTH_EASING,
            useNativeDriver: true,
          }),
          Animated.timing(shuffleAnimation.translateX, {
            toValue: 0,
            duration: 200,
            easing: SMOOTH_EASING,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => resolve(null));
    });

    await new Promise(resolve => setTimeout(resolve, 200));
  };

  const dealCardsRound = async (round: number) => {
    const cardDimensions = getCardDimensions();

    for (let playerOffset = 0; playerOffset < 4; playerOffset++) {
      const playerIndex = (3 + playerOffset) % 4; // Start from player to right of dealer

      // Deal 3 cards to this player
      const animations: Animated.CompositeAnimation[] = [];
      for (let cardNum = 0; cardNum < CARDS_PER_ROUND; cardNum++) {
        // Calculate card index based on player and round
        const cardIndexForPlayer = playerIndex * 6 + round * 3 + cardNum;
        const handIndex = round * 3 + cardNum; // index within this player's hand (0..5)

        // First move to dealing line position
        // Deal from a deck placed slightly left of screen center (matches reference)
        const deckPos = getDeckPosition(parentWidth, parentHeight, layoutInfo);
        const lineX = deckPos.x + 10 + cardNum * 6;
        const lineY = deckPos.y + 10;

        // Get final position based on player and card layout
        const pos = getPlayerCardPosition(
          playerIndex,
          handIndex,
          6,
          playerIndex === 0 ? 'medium' : 'small',
          layoutInfo,
        );

        animations.push(
          Animated.sequence([
            // First animate to line position
            Animated.parallel([
              Animated.timing(cardAnimations.current[cardIndexForPlayer].opacity, {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
              }),
              Animated.timing(cardAnimations.current[cardIndexForPlayer].position, {
                toValue: { x: lineX, y: lineY },
                duration: CARD_DEAL_DURATION / 2,
                easing: SMOOTH_EASING,
                useNativeDriver: true,
              }),
              Animated.timing(cardAnimations.current[cardIndexForPlayer].scale, {
                toValue: 1.1,
                duration: CARD_DEAL_DURATION / 2,
                useNativeDriver: true,
              }),
            ]),
            // Then animate to final position
            Animated.parallel([
              Animated.timing(cardAnimations.current[cardIndexForPlayer].position, {
                toValue: { x: pos.x, y: pos.y },
                duration: CARD_DEAL_DURATION / 2,
                easing: SMOOTH_EASING,
                useNativeDriver: true,
              }),
              Animated.timing(cardAnimations.current[cardIndexForPlayer].scale, {
                toValue: 1, // No scale transform needed, using large cards for bottom player
                duration: CARD_DEAL_DURATION / 2,
                useNativeDriver: true,
              }),
            ]),
          ]),
        );
      }

      playDealSound();
      await new Promise(resolve => {
        Animated.stagger(120, animations).start(() => resolve(null));
      });
      await new Promise(resolve => setTimeout(resolve, 150));
    }
  };

  const revealTrumpCard = async () => {
    playTrumpRevealSound();
    // Show trump with a subtle fade/scale only; avoid heavy rotations that can blur overlaying cards
    await new Promise(resolve => {
      Animated.parallel([
        Animated.timing(trumpAnimation.opacity, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.spring(trumpAnimation.scale, {
          toValue: 1.05,
          speed: 16,
          bounciness: 6,
          useNativeDriver: true,
        }),
      ]).start(() => resolve(null));
    });
    await new Promise(resolve => setTimeout(resolve, 250));
  };

  const showGameStartMessage = async () => {
    await new Promise(resolve => {
      Animated.parallel([
        Animated.timing(gameStartAnimation.opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(gameStartAnimation.scale, {
          toValue: 1,
          speed: 14,
          bounciness: 12,
          useNativeDriver: true,
        }),
      ]).start(() => resolve(null));
    });

    await new Promise(resolve => setTimeout(resolve, 1000));

    await new Promise(resolve => {
      Animated.timing(gameStartAnimation.opacity, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => resolve(null));
    });
  };

  const interpolatedRotation = trumpAnimation.rotation.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={StyleSheet.absoluteFillObject}>
      {/* Deck pile in center with shuffle animation */}
      {dealingPhase !== 'complete' && (
        <Animated.View
          style={[
            styles.deckContainer,
            {
              top: getDeckPosition(parentWidth, parentHeight, layoutInfo).y,
              left: getDeckPosition(parentWidth, parentHeight, layoutInfo).x,
              transform: [
                {
                  rotate: shuffleAnimation.rotation.interpolate({
                    inputRange: [-1, 1],
                    outputRange: ['-90deg', '90deg'],
                  }),
                },
                { translateX: shuffleAnimation.translateX },
                { translateY: shuffleAnimation.translateY },
              ],
            },
          ]}
        >
          <SpanishCard faceDown size="medium" />
        </Animated.View>
      )}

      {/* Animated cards being dealt */}
      {cardAnimations.current.map((anim, index) => {
        // Calculate which player this card belongs to
        const playerIndex = Math.floor(index / 6);
        const cardInHandIndex = index % 6;
        const isPlayerCard = playerIndex === 0;
        // Show face-up for all player cards (0-5)
        const showCard = isPlayerCard && cardInHandIndex < playerCards.length;

        // Determine static rotation so side players are 90° during dealing too
        const staticRotate = playerIndex === 1 ? '-90deg' : playerIndex === 3 ? '90deg' : '0deg';

        return (
          <Animated.View
            key={`dealing-card-${index}`}
            style={[
              styles.animatedCard,
              {
                transform: [
                  { translateX: anim.position.x },
                  { translateY: anim.position.y },
                  { scale: anim.scale },
                  { rotate: staticRotate },
                ],
                opacity: anim.opacity,
              },
            ]}
          >
            {showCard ? (
              <SpanishCard
                card={playerCards[cardInHandIndex]}
                size={playerIndex === 0 ? 'medium' : 'small'}
              />
            ) : (
              <SpanishCard faceDown size={playerIndex === 0 ? 'medium' : 'small'} />
            )}
          </Animated.View>
        );
      })}

      {/* Trump card reveal */}
      {dealingPhase === 'trump' && (
        <Animated.View
          style={[
            styles.trumpCard,
            {
              top: getTrumpPosition(parentWidth, parentHeight, layoutInfo).y,
              left: getTrumpPosition(parentWidth, parentHeight, layoutInfo).x,
              transform: [{ rotateY: interpolatedRotation }, { scale: trumpAnimation.scale }],
              opacity: trumpAnimation.opacity,
            },
          ]}
        >
          <SpanishCard card={trumpCard} size="medium" />
        </Animated.View>
      )}

      {/* Game start message */}
      {showGameStart && (
        <Animated.View
          style={[
            styles.gameStartContainer,
            {
              opacity: gameStartAnimation.opacity,
              transform: [{ scale: gameStartAnimation.scale }],
            },
          ]}
        >
          <Text style={styles.gameStartText}>¡Comienza el juego!</Text>
          {firstPlayerIndex === 0 && <Text style={styles.turnIndicator}>Tu turno</Text>}
        </Animated.View>
      )}
    </View>
  );
}

// Helper function to calculate final card positions with proper layouts
function getCardFinalPosition(
  playerIndex: number,
  cardIndex: number,
  totalCards: number,
  cardDimensions: ReturnType<typeof getCardDimensions>,
) {
  const screenDimensions = Dimensions.get('window');
  const centerX = screenDimensions.width / 2;
  const centerY = screenDimensions.height / 2;

  switch (playerIndex) {
    case 0: {
      // Bottom player - NO overlap, using large cards, side-by-side
      const scaledCardWidth = cardDimensions.large.width; // Use actual large card width (65px)
      const totalWidth = scaledCardWidth * totalCards; // No overlap - cards side by side

      // Center the hand horizontally
      const startX = (screenDimensions.width - totalWidth) / 2;
      const cardX = startX + cardIndex * scaledCardWidth;

      return {
        endX: cardX + scaledCardWidth / 2, // Center of card position
        endY: screenDimensions.height - 70, // Match GameTable positioning
        rotation: 0, // No rotation for horizontal layout
      };
    }

    case 1: {
      // Left player - vertical stack with 10% overlap
      const leftX = 10; // Match GameTable positioning
      const leftCenterY = centerY;
      const cardHeight = cardDimensions.small.height;
      const overlap = 0.1; // 10% overlap
      const visibleHeight = cardHeight * (1 - overlap);
      const verticalSpacing = visibleHeight;
      const leftStartY = leftCenterY - ((totalCards - 1) * verticalSpacing) / 2;

      return {
        endX: leftX,
        endY: leftStartY + cardIndex * verticalSpacing,
        rotation: 0.25, // 90 degrees
      };
    }

    case 2: {
      // Top player - horizontal with 10% overlap only
      const overlap = 0.1; // Only 10% overlap (90% visible)
      const cardWidth = cardDimensions.small.width;
      const visibleWidth = cardWidth * (1 - overlap);
      const totalWidth = cardWidth + (totalCards - 1) * visibleWidth;
      const topStartX = centerX - totalWidth / 2;

      return {
        endX: topStartX + cardIndex * visibleWidth,
        endY: -5, // Match GameTable positioning
        rotation: 0,
      };
    }

    case 3: {
      // Right player - vertical stack with 10% overlap
      const rightX = screenDimensions.width - 10; // Match GameTable positioning
      const rightCenterY = centerY;
      const cardHeight = cardDimensions.small.height;
      const overlap = 0.1; // 10% overlap
      const visibleHeight = cardHeight * (1 - overlap);
      const verticalSpacing = visibleHeight;
      const rightStartY = rightCenterY - ((totalCards - 1) * verticalSpacing) / 2;

      return {
        endX: rightX,
        endY: rightStartY + cardIndex * verticalSpacing,
        rotation: -0.25, // -90 degrees
      };
    }

    default:
      return { endX: centerX, endY: centerY, rotation: 0 };
  }
}

const styles = StyleSheet.create({
  deckContainer: {
    position: 'absolute',
    zIndex: 1,
  },
  animatedCard: {
    position: 'absolute',
    zIndex: 2,
  },
  trumpCard: {
    position: 'absolute',
    zIndex: 3,
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gameStartContainer: {
    position: 'absolute',
    top: '40%',
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  gameStartText: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 4,
    marginBottom: dimensions.spacing.md,
  },
  turnIndicator: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    color: colors.accent,
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
});
