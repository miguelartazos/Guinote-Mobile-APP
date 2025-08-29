import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, LayoutChangeEvent, Animated } from 'react-native';
import { SpanishCard } from './SpanishCard';
import { getCardDimensions } from '../../utils/responsive';

type Anchor = 'bottomLeft' | 'topRight';

type Props = {
  count: number;
  anchor: Anchor;
  onCenterLayout?: (center: { x: number; y: number }) => void;
};

export function TeamTrickPile({ count, anchor, onCenterLayout }: Props) {
  if (!count || count <= 0) return null;

  const dims = getCardDimensions().small;
  // Increase depth with every trick up to a cap for perf; also change spread with count
  const depth = Math.min(8, Math.max(3, Math.ceil(count))); // noticeable change every trick (cap at 8 layers)
  const spread = Math.min(14, 6 + count); // influences offsets for thicker look

  // Small bounce when a new trick is added
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    pulse.setValue(0);
    Animated.timing(pulse, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  }, [count]);
  const scale = pulse.interpolate({ inputRange: [0, 0.5, 1], outputRange: [1, 1.06, 1] });

  const handleLayout = (e: LayoutChangeEvent) => {
    const { x, y, width, height } = e.nativeEvent.layout;
    onCenterLayout?.({ x: x + width / 2, y: y + height / 2 });
  };

  return (
    <Animated.View
      onLayout={handleLayout}
      style={[
        styles.container,
        anchor === 'bottomLeft' ? styles.bottomLeft : styles.topRight,
        { width: dims.width + 24, height: dims.height + 24, transform: [{ scale }] },
      ]}
      pointerEvents="none"
    >
      {/* Create a visually rich stack that grows with count */}
      <View style={styles.stackArea}>
        {Array.from({ length: depth }).map((_, i) => {
          // Seeded, deterministic variations per layer and count
          const seed = (count * 17 + i * 13) % 97;
          const rnd = (seed / 97) * 2 - 1; // [-1, 1]
          const baseLeft = 6 + i * 1.8 + rnd * (spread * 0.12);
          const baseTop = 8 + i * 2.1 + (rnd * 0.5 + 0.5) * (spread * 0.08);
          const rot = Math.max(-14, Math.min(14, rnd * 12 + (i % 2 ? 4 : -3)));
          // Slight scale-down for lower layers for perspective
          const layerScale = 1 - Math.min(0.2, i * 0.03);
          return (
            <SpanishCard
              key={`pile-${i}`}
              faceDown
              size="small"
              style={[
                styles.layer,
                {
                  left: baseLeft,
                  top: baseTop,
                  transform: [{ rotate: `${rot}deg` }, { scale: layerScale }],
                  zIndex: i, // top-most will be last rendered
                },
              ]}
            />
          );
        })}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 5,
  },
  bottomLeft: {
    left: 15,
    bottom: 15,
  },
  topRight: {
    right: 15,
    top: 15,
  },
  stackArea: {
    position: 'relative',
  },
  layer: {
    position: 'absolute',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
});

export default TeamTrickPile;


