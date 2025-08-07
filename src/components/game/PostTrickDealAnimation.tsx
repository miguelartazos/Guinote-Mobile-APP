import React, { useEffect, useState } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { SpanishCard } from './SpanishCard';
import type { Card, PlayerId } from '../../types/game.types';
import type { SlotIndex } from '../../types/slots.types';
import { playerRegistry } from '../../utils/playerRegistry';
import {
  getPlayerCardPosition,
  getDeckPosition,
  getCardWidth,
  getCardHeight,
} from '../../utils/cardPositions';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type DealingCard = {
  card: Card;
  playerId: PlayerId;
  slotIndex: SlotIndex;
};

type PostTrickDealAnimationProps = {
  dealingCards: DealingCard[];
  onComplete: () => void;
};

export function PostTrickDealAnimation({
  dealingCards,
  onComplete,
}: PostTrickDealAnimationProps) {
  const [activeAnimations, setActiveAnimations] = useState<DealingCard[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const deckPosition = getDeckPosition(SCREEN_WIDTH, SCREEN_HEIGHT);

  // Start animations with delay between each card
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    dealingCards.forEach((dealCard, index) => {
      const timer = setTimeout(() => {
        setActiveAnimations(prev => [...prev, dealCard]);
      }, index * 100); // 100ms between each card for faster dealing
      timers.push(timer);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [dealingCards]);

  const handleAnimationComplete = () => {
    setCompletedCount(prev => {
      const newCount = prev + 1;
      if (newCount >= dealingCards.length) {
        onComplete();
      }
      return newCount;
    });
  };

  return (
    <View
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      pointerEvents="none"
    >
      {activeAnimations.map((dealCard, index) => (
        <PostTrickCard
          key={`${dealCard.playerId}-${dealCard.slotIndex}-${index}`}
          dealCard={dealCard}
          deckPosition={deckPosition}
          onComplete={handleAnimationComplete}
        />
      ))}
    </View>
  );
}

type PostTrickCardProps = {
  dealCard: DealingCard;
  deckPosition: { x: number; y: number; rotation: number; zIndex: number };
  onComplete: () => void;
};

function PostTrickCard({
  dealCard,
  deckPosition,
  onComplete,
}: PostTrickCardProps) {
  const translateX = useSharedValue(deckPosition.x);
  const translateY = useSharedValue(deckPosition.y);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(1);

  // Use player registry to get position
  const playerIndex = playerRegistry.getPosition(dealCard.playerId);

  // Determine card size based on player position
  const cardSize = playerIndex === 0 ? 'large' : 'small';

  const targetPosition = getPlayerCardPosition(
    playerIndex,
    dealCard.slotIndex,
    6, // Total cards per player
    cardSize,
  );

  useEffect(() => {
    // Animate to target position with faster duration
    const ANIMATION_DURATION = 500; // 500ms for smooth but quick animation

    translateX.value = withTiming(targetPosition.x, {
      duration: ANIMATION_DURATION,
      easing: Easing.inOut(Easing.cubic),
    });

    translateY.value = withTiming(targetPosition.y, {
      duration: ANIMATION_DURATION,
      easing: Easing.inOut(Easing.cubic),
    });

    rotation.value = withTiming(targetPosition.rotation, {
      duration: ANIMATION_DURATION,
      easing: Easing.inOut(Easing.cubic),
    });

    scale.value = withTiming(
      1, // No additional scale - using large cards for all
      {
        duration: ANIMATION_DURATION,
        easing: Easing.inOut(Easing.cubic),
      },
      () => {
        'worklet';
        runOnJS(onComplete)();
      },
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    left: translateX.value, // Use position directly as LEFT edge
    top: translateY.value, // Use position directly as TOP edge
    transform: [{ rotate: `${rotation.value}deg` }, { scale: scale.value }],
    opacity: opacity.value,
    zIndex: targetPosition.zIndex,
  }));

  const cardSize = playerIndex === 0 ? 'large' : 'small';

  return (
    <Animated.View style={animatedStyle}>
      <SpanishCard card={dealCard.card} size={cardSize} faceDown={true} />
    </Animated.View>
  );
}
