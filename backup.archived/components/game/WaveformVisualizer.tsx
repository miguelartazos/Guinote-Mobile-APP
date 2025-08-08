import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { colors } from '../../constants/colors';

type WaveformVisualizerProps = {
  isActive: boolean;
  color?: string;
  barCount?: number;
  width?: number;
  height?: number;
};

export function WaveformVisualizer({
  isActive,
  color = colors.accent,
  barCount = 5,
  width = 60,
  height = 30,
}: WaveformVisualizerProps) {
  const animations = useRef(
    Array.from({ length: barCount }, () => new Animated.Value(0.3)),
  ).current;

  useEffect(() => {
    if (isActive) {
      // Start animations with different delays for each bar
      const animationInstances = animations.map((anim, index) => {
        const delay = index * 100;
        return Animated.loop(
          Animated.sequence([
            Animated.delay(delay),
            Animated.timing(anim, {
              toValue: 1,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0.3,
              duration: 300,
              useNativeDriver: true,
            }),
          ]),
        );
      });

      // Start all animations
      Animated.parallel(animationInstances).start();

      return () => {
        // Stop all animations
        animations.forEach(anim => anim.setValue(0.3));
      };
    } else {
      // Reset to default state
      animations.forEach(anim => anim.setValue(0.3));
    }
  }, [isActive, animations]);

  const barWidth = width / (barCount * 2 - 1);

  return (
    <View style={[styles.container, { width, height }]}>
      {animations.map((anim, index) => (
        <Animated.View
          key={index}
          style={[
            styles.bar,
            {
              backgroundColor: color,
              width: barWidth,
              transform: [{ scaleY: anim }],
            },
          ]}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bar: {
    height: '100%',
    borderRadius: 2,
  },
});
