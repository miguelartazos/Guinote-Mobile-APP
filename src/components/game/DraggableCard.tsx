import React, { useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import {
  PanGestureHandler,
  type PanGestureHandlerGestureEvent,
  State,
} from 'react-native-gesture-handler';
import { SpanishCard } from './SpanishCard';
import type { SpanishCardData } from '../../types/cardTypes';
import { isPointInBounds } from '../../utils/gameLogic';
import { haptics } from '../../utils/haptics';
import { CARD_DRAG_SCALE, SPRING_CONFIG } from '../../constants/animations';

type DraggableCardProps = {
  card: SpanishCardData;
  index: number;
  style?: StyleProp<ViewStyle>;
  onCardPlay: (index: number) => void;
  dropZoneBounds?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  isEnabled?: boolean;
  cardSize?: 'small' | 'medium' | 'large';
};

export function DraggableCard({
  card,
  index,
  style,
  onCardPlay,
  dropZoneBounds,
  isEnabled = true,
  cardSize = 'medium',
}: DraggableCardProps) {
  const translateX = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(1)).current;

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
      Animated.parallel([
        Animated.spring(scale, {
          toValue: CARD_DRAG_SCALE,
          ...SPRING_CONFIG,
        }),
        Animated.timing(opacity, {
          toValue: 0.8,
          duration: 100,
          useNativeDriver: true,
        }),
      ]).start();
    } else if (event.nativeEvent.state === State.END) {
      // Check if dropped in drop zone
      const { absoluteX, absoluteY } = event.nativeEvent;
      let shouldPlay = false;

      if (dropZoneBounds) {
        const inDropZone = isPointInBounds(
          { x: absoluteX, y: absoluteY },
          dropZoneBounds,
        );

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
            Animated.timing(opacity, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
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
          Animated.spring(scale, {
            toValue: 1,
            ...SPRING_CONFIG,
          }),
          Animated.timing(opacity, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }
    }
  };

  if (!isEnabled) {
    return (
      <TouchableOpacity
        onPress={() => {
          haptics.light();
          onCardPlay(index);
        }}
        style={style}
        activeOpacity={0.8}
      >
        <SpanishCard card={card} size={cardSize} />
      </TouchableOpacity>
    );
  }

  return (
    <PanGestureHandler
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
              { scale },
              ...(Array.isArray(style) ? style : [style])
                .filter(Boolean)
                .flatMap((s: any) => s.transform || []),
            ],
            opacity,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => {
            haptics.light();
            onCardPlay(index);
          }}
          activeOpacity={1}
        >
          <SpanishCard card={card} size={cardSize} />
        </TouchableOpacity>
      </Animated.View>
    </PanGestureHandler>
  );
}
