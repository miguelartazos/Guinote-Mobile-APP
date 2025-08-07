import React, { useEffect, useState } from 'react';
import { View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { SpanishCard } from './SpanishCard';
import type { Card } from '../../types/game.types';
import {
  getPlayerCardPosition,
  getDeckPosition,
  getCardWidth,
  getCardHeight,
} from '../../utils/cardPositions';
import {
  getInitialDealAnimationSequence,
  type DealAnimationStep,
} from '../../utils/dealingOrder';
import type { PlayerId } from '../../types/game.types';
import type { SlotIndex } from '../../types/slots.types';
import { playerRegistry } from '../../utils/playerRegistry';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type InitialDealAnimationProps = {
  deck: Card[];
  players: { id: PlayerId }[];
  dealerIndex: number;
  onComplete: () => void;
  onCardDealt?: (playerId: PlayerId, slotIndex: SlotIndex, card: Card) => void;
};

export function InitialDealAnimation({
  deck,
  players,
  dealerIndex,
  onComplete,
  onCardDealt,
}: InitialDealAnimationProps) {
  const [animationSteps] = useState(() =>
    getInitialDealAnimationSequence(dealerIndex, players, deck),
  );
  const [activeAnimations, setActiveAnimations] = useState<DealAnimationStep[]>(
    [],
  );
  const [completedCount, setCompletedCount] = useState(0);

  const deckPosition = getDeckPosition(SCREEN_WIDTH, SCREEN_HEIGHT);

  // Start animations based on delay
  useEffect(() => {
    const timers: NodeJS.Timeout[] = [];

    animationSteps.forEach(step => {
      const timer = setTimeout(() => {
        setActiveAnimations(prev => [...prev, step]);
      }, step.delay);
      timers.push(timer);
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [animationSteps]);

  const handleAnimationComplete = (step: DealAnimationStep) => {
    const playerId = players[step.playerIndex].id;
    onCardDealt?.(playerId, step.cardIndex as SlotIndex, step.card);
    setCompletedCount(prev => {
      const newCount = prev + 1;
      if (newCount >= animationSteps.length) {
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
      {activeAnimations.map((step, index) => (
        <DealingCard
          key={`${step.playerIndex}-${step.cardIndex}-${index}`}
          step={step}
          deckPosition={deckPosition}
          onComplete={() => handleAnimationComplete(step)}
        />
      ))}
    </View>
  );
}

type DealingCardProps = {
  step: DealAnimationStep;
  deckPosition: { x: number; y: number; rotation: number; zIndex: number };
  onComplete: () => void;
};

function DealingCard({ step, deckPosition, onComplete }: DealingCardProps) {
  const translateX = useSharedValue(deckPosition.x);
  const translateY = useSharedValue(deckPosition.y);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(0.8);
  const opacity = useSharedValue(1);

  // Determine card size based on player position
  const cardSize = step.playerIndex === 0 ? 'large' : 'small';

  const targetPosition = getPlayerCardPosition(
    step.playerIndex,
    step.cardIndex,
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

  const cardSize = step.playerIndex === 0 ? 'large' : 'small';

  return (
    <Animated.View style={animatedStyle}>
      <SpanishCard card={step.card} size={cardSize} faceDown={true} />
    </Animated.View>
  );
}
