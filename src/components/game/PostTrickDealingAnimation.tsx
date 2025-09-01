import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions, InteractionManager } from 'react-native';
import { SpanishCard, type SpanishCardData } from './SpanishCard';
import type { Card, PlayerId } from '../../types/game.types';
import { SMOOTH_EASING } from '../../constants/animations';
import {
  getDeckPosition,
  getPlayerCardPosition,
  getTrumpPosition,
  type LayoutInfo,
} from '../../utils/cardPositions';
import { getCardDimensions } from '../../utils/responsive';
import { createAnimationCleanup, shouldDropFrames } from '../../utils/animationPerformance';

type DrawSpec = {
  playerId: PlayerId | string;
  card: Card; // includes id
  source: 'deck' | 'trump';
};

type PlayerPositionMap = Record<string, 0 | 1 | 2 | 3>;

type Props = {
  draws: ReadonlyArray<DrawSpec>;
  playerPositions: PlayerPositionMap; // playerId -> 0 bottom, 1 left, 2 top, 3 right
  currentHandSizes: Record<string, number>; // playerId -> current hand size before dealing
  layoutInfo: LayoutInfo;
  onComplete: () => void;
  onCardLanded?: (draw: DrawSpec) => void;
};

export function PostTrickDealingAnimation({
  draws,
  playerPositions,
  currentHandSizes,
  layoutInfo,
  onComplete,
  onCardLanded,
}: Props) {
  const screen = Dimensions.get('window');

  // One animated card reused per active draw step (sequential)
  const position = useRef(new Animated.ValueXY({ x: 0, y: 0 })).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const rotation = useRef(new Animated.Value(0)).current;

  // Track which draw index is currently animating
  const currentIndexRef = useRef(0);
  const [, forceRerenderTick] = useState(0);

  // Snapshot the planned draws ONCE to avoid restarts as parent updates state
  const plannedDrawsRef = useRef(draws);

  // Cleanup manager for timers
  const cleanupManager = useRef(createAnimationCleanup()).current;

  // Animate next draw in sequence
  useEffect(() => {
    let cancelled = false;

    // Run after interactions for better performance
    const handle = InteractionManager.runAfterInteractions(() => {
      const animateOne = (idx: number) => {
        if (cancelled) return;
        const planned = plannedDrawsRef.current;
        if (idx >= planned.length) {
          onComplete();
          return;
        }

        const draw = planned[idx];
        const playerIndex = playerPositions[draw.playerId] ?? 0;
        console.log('▶️ Dealing to', {
          idx,
          playerId: draw.playerId,
          position: playerIndex,
          source: draw.source,
          card: `${draw.card.value} de ${draw.card.suit}`,
        });

        // Compute positions on demand using latest layoutInfo
        const sourcePos =
          draw.source === 'trump'
            ? getTrumpPosition(screen.width, screen.height, layoutInfo)
            : (() => {
                // Get exact top of deck position
                const deckPos = getDeckPosition(screen.width, screen.height, layoutInfo);
                return {
                  x: deckPos.x + 10, // Left edge of top card
                  y: deckPos.y, // Top edge of deck (no offset)
                  rotation: 0,
                  zIndex: 200,
                };
              })();

        const handSizeBase = currentHandSizes[draw.playerId as string] || 0;
        const priorDrawsForPlayer = planned
          .slice(0, idx)
          .filter(d => d.playerId === draw.playerId).length;
        const targetCardIndex = handSizeBase + priorDrawsForPlayer;
        const targetPos = getPlayerCardPosition(
          playerIndex,
          targetCardIndex,
          Math.max(targetCardIndex + 1, handSizeBase + 1),
          playerIndex === 0 ? 'medium' : 'small',
          layoutInfo,
        );

        // Initialize start
        position.setValue({ x: sourcePos.x, y: sourcePos.y });
        opacity.setValue(0);
        scale.setValue(1);
        rotation.setValue(0);

        // Optimize animation duration based on performance
        const durationPerCard = shouldDropFrames() ? 300 : 350; // Faster than before (was 440)
        const interCardDelay = shouldDropFrames() ? 30 : 50; // Faster than before (was 60)

        Animated.sequence([
          Animated.timing(opacity, { toValue: 1, duration: 60, useNativeDriver: true }),
          Animated.parallel([
            Animated.timing(position, {
              toValue: { x: targetPos.x, y: targetPos.y },
              duration: durationPerCard,
              easing: SMOOTH_EASING,
              useNativeDriver: true,
            }),
            Animated.sequence([
              Animated.timing(scale, {
                toValue: 1.08,
                duration: durationPerCard * 0.5,
                useNativeDriver: true,
              }),
              Animated.timing(scale, {
                toValue: 1,
                duration: durationPerCard * 0.5,
                useNativeDriver: true,
              }),
            ]),
            Animated.timing(rotation, {
              toValue: 0,
              duration: durationPerCard,
              useNativeDriver: true,
            }),
          ]),
        ]).start(() => {
          // Inform host to commit this card to hands/deck immediately
          onCardLanded?.(draw);
          // Small gap before next card
          const timer = setTimeout(() => {
            if (!cancelled) {
              currentIndexRef.current = idx + 1;
              // Trigger a lightweight re-render so face rules update
              forceRerenderTick(t => t + 1);
              animateOne(idx + 1);
            }
          }, interCardDelay);
          cleanupManager.register(timer);
        });
      };

      animateOne(0);
    });

    return () => {
      cancelled = true;
      handle.cancel();
      cleanupManager.clearAll();
    };
    // Run once on mount; the draws are snapshotted
  }, []);

  const planned = plannedDrawsRef.current;
  if (planned.length === 0) return null;

  // Determine face rules: bottom player face-up always; others face-down unless source is trump
  const currentDraw = planned[Math.min(currentIndexRef.current, planned.length - 1)];
  const playerIndexForCurrent = playerPositions[currentDraw.playerId] ?? 0;
  const isBottom = playerIndexForCurrent === 0;
  const shouldFaceUp = isBottom || currentDraw.source === 'trump';

  const currentCard: SpanishCardData = {
    suit: currentDraw.card.suit,
    value: currentDraw.card.value,
  } as SpanishCardData;

  const dims = getCardDimensions();
  const size = isBottom ? 'medium' : 'small';

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Animated.View
        style={[
          styles.animatedCard,
          {
            transform: [{ translateX: position.x }, { translateY: position.y }, { scale }],
            opacity,
            width: dims[size].width,
            height: dims[size].height,
          },
        ]}
      >
        <SpanishCard card={currentCard} size={size} faceDown={!shouldFaceUp} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  animatedCard: {
    position: 'absolute',
    zIndex: 200,
  },
});

export default PostTrickDealingAnimation;
