import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Text, Dimensions } from 'react-native';
import { SpanishCard } from './SpanishCard';
import type { SpanishSuit, CardValue } from '../../types/cardTypes';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';
import { CARD_DEAL_DURATION, SMOOTH_EASING } from '../../constants/animations';

const CARDS_PER_ROUND = 3;
const TRUMP_REVEAL_DURATION = 800;

type CardDealingAnimationProps = {
  trumpCard: { suit: SpanishSuit; value: CardValue };
  playerCards: Array<{ suit: SpanishSuit; value: CardValue }>;
  onComplete: () => void;
  playDealSound: () => void;
  playTrumpRevealSound: () => void;
  playShuffleSound: () => void;
  playerPositions: Array<{ x: number; y: number }>;
  firstPlayerIndex: number;
};

export function CardDealingAnimation({
  trumpCard,
  playerCards,
  onComplete,
  playDealSound,
  playTrumpRevealSound,
  playShuffleSound,
  playerPositions,
  firstPlayerIndex,
}: CardDealingAnimationProps) {
  const [dealingPhase, setDealingPhase] = useState<
    'shuffle' | 'deal1' | 'deal2' | 'trump' | 'complete'
  >('shuffle');
  const [showGameStart, setShowGameStart] = useState(false);

  const screenDimensions = Dimensions.get('window');
  const centerX = screenDimensions.width / 2;
  const centerY = screenDimensions.height / 2;

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
    for (let i = 0; i < 24; i++) {
      cardAnimations.current[i] = {
        position: new Animated.ValueXY({ x: centerX - 35, y: centerY - 50 }),
        opacity: new Animated.Value(0),
        scale: new Animated.Value(0.8),
        rotation: new Animated.Value(0),
      };
    }
  }, [centerX, centerY]);

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
    for (let playerOffset = 0; playerOffset < 4; playerOffset++) {
      const playerIndex = (3 + playerOffset) % 4; // Start from player to right of dealer

      // Deal 3 cards to this player
      const animations: Animated.CompositeAnimation[] = [];
      for (let cardNum = 0; cardNum < CARDS_PER_ROUND; cardNum++) {
        // Calculate card index based on player and round
        const cardIndexForPlayer = playerIndex * 6 + round * 3 + cardNum;
        const targetPos = playerPositions[playerIndex];
        // Calculate offset to position cards correctly (0-5 cards)
        const totalCardIndex = round * 3 + cardNum;
        const offsetX = (totalCardIndex - 2.5) * 30; // Center the 6 cards

        // Calculate end position
        const endX = targetPos.x + offsetX;
        const endY = targetPos.y;

        animations.push(
          Animated.parallel([
            Animated.timing(
              cardAnimations.current[cardIndexForPlayer].opacity,
              {
                toValue: 1,
                duration: 100,
                useNativeDriver: true,
              },
            ),
            Animated.timing(
              cardAnimations.current[cardIndexForPlayer].position,
              {
                toValue: { x: endX, y: endY },
                duration: CARD_DEAL_DURATION,
                easing: SMOOTH_EASING,
                useNativeDriver: true,
              },
            ),
            Animated.sequence([
              Animated.timing(
                cardAnimations.current[cardIndexForPlayer].scale,
                {
                  toValue: 1.1,
                  duration: CARD_DEAL_DURATION / 2,
                  useNativeDriver: true,
                },
              ),
              Animated.timing(
                cardAnimations.current[cardIndexForPlayer].scale,
                {
                  toValue: 1,
                  duration: CARD_DEAL_DURATION / 2,
                  useNativeDriver: true,
                },
              ),
            ]),
            Animated.timing(
              cardAnimations.current[cardIndexForPlayer].rotation,
              {
                toValue: (Math.random() - 0.5) * 0.1,
                duration: CARD_DEAL_DURATION,
                useNativeDriver: true,
              },
            ),
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

    await new Promise(resolve => {
      Animated.parallel([
        Animated.timing(trumpAnimation.opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(trumpAnimation.rotation, {
            toValue: 0.5,
            duration: TRUMP_REVEAL_DURATION / 2,
            useNativeDriver: true,
          }),
          Animated.timing(trumpAnimation.rotation, {
            toValue: 1,
            duration: TRUMP_REVEAL_DURATION / 2,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.spring(trumpAnimation.scale, {
            toValue: 1.2,
            speed: 14,
            bounciness: 12,
            useNativeDriver: true,
          }),
          Animated.spring(trumpAnimation.scale, {
            toValue: 1,
            speed: 14,
            bounciness: 8,
            useNativeDriver: true,
          }),
        ]),
      ]).start(() => resolve(null));
    });

    await new Promise(resolve => setTimeout(resolve, 500));
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
              top: centerY - 50,
              left: centerX - 35,
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
                  {
                    rotate: anim.rotation.interpolate({
                      inputRange: [-1, 1],
                      outputRange: ['-180deg', '180deg'],
                    }),
                  },
                ],
                opacity: anim.opacity,
              },
            ]}
          >
            {showCard ? (
              <SpanishCard card={playerCards[cardInHandIndex]} size="small" />
            ) : (
              <SpanishCard faceDown size="small" />
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
              top: centerY - 20,
              left: centerX - 35,
              transform: [
                { rotateY: interpolatedRotation },
                { scale: trumpAnimation.scale },
              ],
              opacity: trumpAnimation.opacity,
            },
          ]}
        >
          {(trumpAnimation.rotation.interpolate({
            inputRange: [0, 0.5, 1],
            outputRange: [1, 0, 1],
          }) as any) > 0.5 ? (
            <SpanishCard faceDown size="medium" />
          ) : (
            <SpanishCard card={trumpCard} size="medium" />
          )}
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
          {firstPlayerIndex === 0 && (
            <Text style={styles.turnIndicator}>Tu turno</Text>
          )}
        </Animated.View>
      )}
    </View>
  );
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
