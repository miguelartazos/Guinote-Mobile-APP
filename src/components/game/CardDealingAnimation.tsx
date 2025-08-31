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
import { useTableLayout } from '../../hooks/useTableLayout';

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
  // Crossfade handoff controls from parent (GameTable)
  fadeOut?: boolean;
  onFadeOutComplete?: () => void;
};

export function CardDealingAnimation({
  trumpCard,
  playerCards,
  onComplete,
  playDealSound,
  playTrumpRevealSound,
  playShuffleSound,
  firstPlayerIndex,
  fadeOut,
  onFadeOutComplete,
}: CardDealingAnimationProps) {
  const [dealingPhase, setDealingPhase] = useState<
    'shuffle' | 'deal1' | 'deal2' | 'trump' | 'complete'
  >('shuffle');
  const [showGameStart, setShowGameStart] = useState(false);

  // Use the same table layout logic as GameTable for pixel-perfect alignment
  const { layout, onTableLayout } = useTableLayout();
  const layoutReady = layout.isReady && layout.table.width > layout.table.height; // wait for landscape
  const parentWidth = layout.table.width || Dimensions.get('window').width;
  const parentHeight = layout.table.height || Dimensions.get('window').height;
  const layoutInfo: LayoutInfo = {
    parentLayout: layout.table.width > 0 ? layout.table : { x: 0, y: 0, width: parentWidth, height: parentHeight },
    boardLayout: layout.board.width > 0 ? layout.board : computeBoardLayout(parentWidth, parentHeight),
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
    if (!layoutReady) return;
    if (cardAnimations.current.length > 0) return; // Initialize once after layout
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutReady, parentWidth, parentHeight]);

  // Trump card animation values
  const trumpAnimation = useRef({
    rotation: new Animated.Value(0),
    scale: new Animated.Value(1),
    opacity: new Animated.Value(0),
    translateX: new Animated.Value(0),
    translateY: new Animated.Value(0),
  }).current;

  // Game start text animation
  const gameStartAnimation = useRef({
    opacity: new Animated.Value(0),
    scale: new Animated.Value(0.8),
  }).current;

  // Overlay crossfade opacity (deck + trump + dealt cards)
  const overlayOpacity = useRef(new Animated.Value(1)).current;

  // Main animation sequence
  useEffect(() => {
    if (!layoutReady) return;
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

      // 6. Complete - keep overlay deck/trump visible until parent fades us out
      setDealingPhase('complete');
      onComplete();
    };

    runAnimationSequence();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layoutReady]);

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
        const deckPos = getDeckPosition(parentWidth, parentHeight, layoutInfo);
        const lineX = Math.max(8, deckPos.x + 10 + cardNum * 6);
        const lineY = Math.max(8, deckPos.y + 10);

        // Compute FINAL absolute position matching GameTable containers
        const finalPos = getFinalAbsoluteCardPosition(
          playerIndex,
          handIndex,
          6,
          layoutInfo,
          parentWidth,
        );

        // Initialize relative offset at TOP-OF-DECK position (deck top is left:+10, top:0)
        cardAnimations.current[cardIndexForPlayer].position.setValue({
          x: deckPos.x + 10 - finalPos.x,
          y: deckPos.y - finalPos.y,
        });

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
                toValue: { x: lineX - finalPos.x, y: lineY - finalPos.y },
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
                toValue: { x: 0, y: 0 },
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
    // Flip: rotateY 180->0 while fading in and slight scale
    await new Promise(resolve => {
      Animated.parallel([
        Animated.timing(trumpAnimation.rotation, {
          toValue: 1, // 0->1 mapped to 180->0deg in interpolation for face-up effect
          duration: 350,
          useNativeDriver: true,
        }),
        Animated.timing(trumpAnimation.opacity, {
          toValue: 1,
          duration: 240,
          useNativeDriver: true,
        }),
        Animated.spring(trumpAnimation.scale, {
          toValue: 1.02,
          speed: 20,
          bounciness: 7,
          useNativeDriver: true,
        }),
      ]).start(() => resolve(null));
    });
    // Settle scale and slide slightly under the deck top card
    await new Promise(resolve => {
      Animated.parallel([
        Animated.timing(trumpAnimation.scale, {
          toValue: 1,
          duration: 160,
          useNativeDriver: true,
        }),
        Animated.timing(trumpAnimation.translateX, {
          toValue: -6,
          duration: 180,
          useNativeDriver: true,
        }),
        Animated.timing(trumpAnimation.translateY, {
          toValue: 2,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start(() => resolve(null));
    });
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
    outputRange: ['180deg', '0deg'], // Start face-down (180deg), animate to face-up (0deg)
  });

  // Fade-out handoff
  useEffect(() => {
    if (!fadeOut) return;
    Animated.timing(overlayOpacity, {
      toValue: 0,
      duration: 180,
      useNativeDriver: true,
    }).start(() => onFadeOutComplete?.());
  }, [fadeOut, overlayOpacity, onFadeOutComplete]);

  // Compute GameTable-matching absolute coordinates for a card
  function getFinalAbsoluteCardPosition(
    playerIndex: number,
    handIndex: number,
    totalCards: number,
    layoutInfo: LayoutInfo,
    parentWidth: number,
  ) {
    // Start with the same helper used by GameTable
    const pos = getPlayerCardPosition(
      playerIndex,
      handIndex,
      totalCards,
      playerIndex === 0 ? 'large' : 'small',
      layoutInfo,
    );

    // For left/right we render inside their 120px containers; GameTable re-centers with rotated width.
    if (playerIndex === 1 || playerIndex === 3) {
      const dims = getCardDimensions().small;
      const rotatedWidth = dims.height; // visual width after 90deg rotation
      const containerWidth = 120;
      const xWithinContainer = Math.max(0, (containerWidth - rotatedWidth) / 2);
      // Left container sits at left:8, Right at right:8 (so x differs)
      if (playerIndex === 1) {
        return { x: 8 + xWithinContainer, y: pos.y };
      } else {
        // Right container: parentWidth - 8 - 120 + xWithinContainer
        return { x: parentWidth - 8 - 120 + xWithinContainer, y: pos.y };
      }
    }

    // Top and bottom are already absolute to the table root
    return { x: pos.x, y: pos.y };
  }

  return (
    <Animated.View
      style={[
        StyleSheet.absoluteFillObject,
        { opacity: overlayOpacity, zIndex: 50 },
      ]}
      pointerEvents="none"
      onLayout={onTableLayout}
    >
      {/* Deck + trump container (match DeckPile geometry exactly to avoid jumps) */}
      {layoutReady && (dealingPhase !== 'complete' || !!fadeOut) && (
        <View
          style={[
            styles.deckPileContainer,
            {
              top: getDeckPosition(parentWidth, parentHeight, layoutInfo).y,
              left: getDeckPosition(parentWidth, parentHeight, layoutInfo).x,
            },
          ]}
        >
          {/* Trump card (revealed during 'trump' phase) */}
          {(dealingPhase === 'trump' || fadeOut) && (
            <Animated.View
              style={[
                styles.trumpCardInDeck,
                {
                  opacity: trumpAnimation.opacity,
                  transform: [
                    { rotate: '90deg' },
                    { rotateY: interpolatedRotation },
                    { scale: trumpAnimation.scale },
                    { translateX: trumpAnimation.translateX },
                    { translateY: trumpAnimation.translateY },
                  ],
                },
              ]}
            >
              <SpanishCard card={trumpCard} size="medium" />
            </Animated.View>
          )}

          {/* Deck pile on top (animated shuffle) */}
          <Animated.View
            style={[
              styles.deckTopCardContainer,
              {
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
        </View>
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

        // Compute ABSOLUTE final position to place the animated container
        const finalPos = getFinalAbsoluteCardPosition(
          playerIndex,
          cardInHandIndex,
          6,
          layoutInfo,
          parentWidth,
        );

        return (
          <Animated.View
            key={`dealing-card-${index}`}
            style={[
              styles.animatedCard,
              {
                left: finalPos.x,
                top: finalPos.y,
                opacity: anim.opacity,
                transform: [
                  { translateX: anim.position.x },
                  { translateY: anim.position.y },
                ],
              },
            ]}
          >
            <Animated.View style={{ transform: [{ rotate: staticRotate }, { scale: anim.scale }] }}>
              {showCard ? (
                <SpanishCard
                  card={playerCards[cardInHandIndex]}
                  size={playerIndex === 0 ? 'large' : 'small'}
                />
              ) : (
                <SpanishCard faceDown size={playerIndex === 0 ? 'large' : 'small'} />
              )}
            </Animated.View>
          </Animated.View>
        );
      })}

      {/* Trump card is rendered inside deckPileContainer above during 'trump' phase */}

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
    </Animated.View>
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
  deckPileContainer: {
    position: 'absolute',
    zIndex: 1,
    width: 100, // match DeckPile.container
    height: 140, // match DeckPile.container
  },
  deckTopCardContainer: {
    position: 'absolute',
    top: 0,
    left: 10, // match DeckPile.deckContainer.left
    zIndex: 2,
  },
  animatedCard: {
    position: 'absolute',
    zIndex: 5, // ensure dealt cards are above the overlay deck top card
  },
  trumpCardInDeck: {
    position: 'absolute',
    zIndex: 1, // under deck top cards
    top: 15, // match DeckPile.trumpCardContainer.top (centered)
    left: 55, // match DeckPile.trumpCardContainer.left
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
    zIndex: 2, // keep text below trump/deck and dealt cards
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
