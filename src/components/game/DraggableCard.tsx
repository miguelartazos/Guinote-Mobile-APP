import React, { useRef } from 'react';
import { Animated, TouchableOpacity, type ViewStyle, type StyleProp } from 'react-native';
import {
  PanGestureHandler,
  type PanGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';
import { SpanishCard } from './SpanishCard';
import type { SpanishCardData } from '../../types/cardTypes';
import { isPointInBounds } from '../../utils/gameLogic';
import { haptics } from '../../utils/haptics';
import { SPRING_CONFIG } from '../../constants/animations';

type DraggableCardProps = {
  card: SpanishCardData;
  index: number;
  style?: StyleProp<ViewStyle>;
  onCardPlay: (index: number) => void;
  onReorder?: (fromIndex: number, toIndex: number) => void;
  dropZoneBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isEnabled?: boolean;
  cardSize?: 'small' | 'medium' | 'large';
  totalCards?: number;
  cardWidth?: number;
  isPlayerTurn?: boolean;
};

export const DraggableCard = React.memo(function DraggableCard({
  card,
  index,
  style,
  onCardPlay,
  onReorder,
  dropZoneBounds,
  isEnabled = true,
  cardSize = 'medium',
  totalCards = 1,
  cardWidth = 80,
  isPlayerTurn = true,
}: DraggableCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const startX = useRef(0);
  const startY = useRef(0);
  const isDraggingHorizontally = useRef(false);

  const onGestureEvent = Animated.event(
    [
      {
        nativeEvent: {
          translationX: translateX,
          translationY: translateY,
        },
      },
    ],
    { useNativeDriver: true },
  );

  const onHandlerStateChange = (event: PanGestureHandlerGestureEvent) => {
    if (event.nativeEvent.state === State.BEGAN) {
      // Start dragging with haptic feedback
      haptics.light();
      startX.current = event.nativeEvent.x;
      startY.current = event.nativeEvent.y;
      isDraggingHorizontally.current = false;

      // No visual feedback when starting drag
    } else if (event.nativeEvent.state === State.ACTIVE) {
      // Determine drag direction after moving 10 pixels
      const dx = Math.abs(event.nativeEvent.x - startX.current);
      const dy = Math.abs(event.nativeEvent.y - startY.current);

      if (dx > 10 || dy > 10) {
        isDraggingHorizontally.current = dx > dy * 1.5; // Favor horizontal movement
      }
    } else if (event.nativeEvent.state === State.END) {
      const { absoluteX, absoluteY, translationX } = event.nativeEvent;

      // Handle horizontal reordering
      if (isDraggingHorizontally.current && onReorder && totalCards > 1) {
        const cardSpacing = cardWidth; // No overlap in bottom hand
        const dragDistance = translationX;
        const newPosition = Math.round(dragDistance / cardSpacing);
        const targetIndex = Math.max(0, Math.min(totalCards - 1, index + newPosition));

        if (targetIndex !== index) {
          haptics.medium();
          onReorder(index, targetIndex);
        }

        // Return to original position
        Animated.parallel([
          Animated.spring(translateX, {
            toValue: 0,
            ...SPRING_CONFIG,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            ...SPRING_CONFIG,
          }),
        ]).start();
      } else {
        // Handle vertical play mode
        let shouldPlay = false;

        if (dropZoneBounds && !isDraggingHorizontally.current && canPlay) {
          const inDropZone = isPointInBounds({ x: absoluteX, y: absoluteY }, dropZoneBounds);

          if (inDropZone) {
            shouldPlay = true;
            // Haptic feedback for successful drop
            haptics.medium();
            // Snap to center of drop zone
            Animated.parallel([
              Animated.spring(translateX, {
                toValue: dropZoneBounds.x + dropZoneBounds.width / 2 - absoluteX,
                ...SPRING_CONFIG,
              }),
              Animated.spring(translateY, {
                toValue: dropZoneBounds.y + dropZoneBounds.height / 2 - absoluteY,
                ...SPRING_CONFIG,
              }),
            ]).start(() => {
              onCardPlay(index);
            });
          }
        }

        if (!shouldPlay) {
          // Return to original position
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: 0,
              ...SPRING_CONFIG,
            }),
            Animated.spring(translateY, {
              toValue: 0,
              ...SPRING_CONFIG,
            }),
          ]).start();
        }
      }
    }
  };

  // Always allow dragging for reordering, but only allow playing when enabled
  const canPlay = isEnabled;

  return (
    <PanGestureHandler
      enabled={true}
      onGestureEvent={onGestureEvent}
      onHandlerStateChange={onHandlerStateChange}
    >
      <Animated.View
        style={[
          style,
          {
            transform: [
              { translateX },
              { translateY },
              ...(Array.isArray(style) ? style : [style])
                .filter(Boolean)
                .flatMap((s: any) => s.transform || []),
            ],
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            if (canPlay) {
              haptics.light();
              onCardPlay(index);
            }
          }}
          activeOpacity={1}
          disabled={!canPlay}
        >
          <SpanishCard card={card} size={cardSize} isDisabled={!canPlay} />
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
});
