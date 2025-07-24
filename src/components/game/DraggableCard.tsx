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
import { SpanishCard, type SpanishCardData } from './SpanishCard';
import { isPointInBounds } from '../../utils/gameLogic';

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
};

export function DraggableCard({
  card,
  index,
  style,
  onCardPlay,
  dropZoneBounds,
  isEnabled = true,
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
      // Start dragging
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1.1,
          useNativeDriver: true,
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
          // Snap to center of drop zone
          Animated.parallel([
            Animated.spring(translateX, {
              toValue: dropZoneBounds.x + dropZoneBounds.width / 2 - absoluteX,
              useNativeDriver: true,
            }),
            Animated.spring(translateY, {
              toValue: dropZoneBounds.y + dropZoneBounds.height / 2 - absoluteY,
              useNativeDriver: true,
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
            useNativeDriver: true,
          }),
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }),
          Animated.spring(scale, {
            toValue: 1,
            useNativeDriver: true,
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
        onPress={() => onCardPlay(index)}
        style={style}
        activeOpacity={0.8}
      >
        <SpanishCard card={card} size="large" />
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
        <SpanishCard card={card} size="large" />
      </Animated.View>
    </PanGestureHandler>
  );
}
