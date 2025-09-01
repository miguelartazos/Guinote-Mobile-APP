import { useRef, useEffect } from 'react';
import { Animated } from 'react-native';
import type { Card } from '../types/game.types';
import type { LayoutInfo } from '../utils/cardPositions';
import { getPlayerCardPosition } from '../utils/cardPositions';
import { SPRING_CONFIG } from '../constants/animations';

type PlayerPosition = 'left' | 'top' | 'right';

interface AnimationState {
  value: Animated.Value;
  targetY: number;
  isAnimating: boolean;
}

export function useCardHandAnimation(
  cards: Card[],
  playerPosition: PlayerPosition,
  layoutInfo: LayoutInfo,
) {
  const previousCards = useRef<Card[]>(cards);
  const animationMap = useRef<Map<string, AnimationState>>(new Map());
  const activeAnimations = useRef<Set<string>>(new Set());
  const animationCounter = useRef(0);

  const getPlayerIndex = (): number => {
    switch (playerPosition) {
      case 'left':
        return 3;
      case 'top':
        return 2;
      case 'right':
        return 1;
      default:
        return 0;
    }
  };

  const findCardMapping = (prevCards: Card[], currentCards: Card[]): Map<number, number> => {
    const mapping = new Map<number, number>();

    currentCards.forEach((card, currentIndex) => {
      const prevIndex = prevCards.findIndex(
        prevCard =>
          prevCard.id === card.id && prevCard.suit === card.suit && prevCard.value === card.value,
      );
      if (prevIndex !== -1) {
        mapping.set(currentIndex, prevIndex);
      }
    });

    return mapping;
  };

  const getAnimatedPosition = (cardIndex: number): Animated.Value | null => {
    const cardKey = `${playerPosition}_${cardIndex}_${animationCounter.current}`;
    const existingAnimation = animationMap.current.get(cardKey);

    if (existingAnimation) {
      return existingAnimation.value;
    }

    const playerIndex = getPlayerIndex();
    const targetPosition = getPlayerCardPosition(
      playerIndex,
      cardIndex,
      cards.length,
      'small',
      layoutInfo,
    );

    const cardsRemoved = previousCards.current.length > cards.length;
    const mapping = findCardMapping(previousCards.current, cards);
    const previousIndex = mapping.get(cardIndex);

    let sourceY = targetPosition.y;
    if (cardsRemoved && previousIndex !== undefined) {
      const sourcePosition = getPlayerCardPosition(
        playerIndex,
        previousIndex,
        previousCards.current.length,
        'small',
        layoutInfo,
      );
      sourceY = sourcePosition.y;
    }

    const animatedValue = new Animated.Value(sourceY);
    const animationState: AnimationState = {
      value: animatedValue,
      targetY: targetPosition.y,
      isAnimating: false,
    };

    animationMap.current.set(cardKey, animationState);

    if (sourceY !== targetPosition.y) {
      const animationId = `${cardKey}_anim`;
      activeAnimations.current.add(animationId);
      animationState.isAnimating = true;

      Animated.spring(animatedValue, {
        toValue: targetPosition.y,
        ...SPRING_CONFIG,
        delay: cardIndex * 50,
        useNativeDriver: true,
      }).start(() => {
        activeAnimations.current.delete(animationId);
        animationState.isAnimating = false;

        if (activeAnimations.current.size === 0) {
          previousCards.current = cards;
          animationCounter.current += 1;

          const keysToDelete: string[] = [];
          animationMap.current.forEach((_, key) => {
            if (!key.includes(`_${animationCounter.current}`)) {
              keysToDelete.push(key);
            }
          });
          keysToDelete.forEach(key => animationMap.current.delete(key));
        }
      });
    }

    return animatedValue;
  };

  useEffect(() => {
    const cardsChanged =
      cards.length !== previousCards.current.length ||
      !cards.every((card, i) => {
        const prev = previousCards.current[i];
        return prev && card.id === prev.id && card.suit === prev.suit && card.value === prev.value;
      });

    if (cardsChanged && activeAnimations.current.size === 0) {
      previousCards.current = cards;
    }
  }, [cards]);

  const isAnimating = (): boolean => {
    return activeAnimations.current.size > 0;
  };

  const cleanup = () => {
    animationMap.current.clear();
    activeAnimations.current.clear();
  };

  useEffect(() => {
    return cleanup;
  }, []);

  return {
    getAnimatedPosition,
    isAnimating,
    cleanup,
  };
}
