import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withDelay,
  withTiming,
  interpolate,
  Extrapolate,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';

type AnimatedStatCardProps = {
  value: string | number;
  label: string;
  index: number;
  gradientColors?: string[];
};

export function AnimatedStatCard({
  value,
  label,
  index,
  gradientColors = ['rgba(102, 126, 234, 0.1)', 'rgba(118, 75, 162, 0.1)'],
}: AnimatedStatCardProps) {
  const scale = useSharedValue(0);
  const opacity = useSharedValue(0);
  const rotate = useSharedValue(-10);

  useEffect(() => {
    scale.value = withDelay(
      index * 100,
      withSpring(1, {
        damping: 12,
        stiffness: 100,
      }),
    );
    opacity.value = withDelay(index * 100, withTiming(1, { duration: 400 }));
    rotate.value = withDelay(
      index * 100,
      withSpring(0, {
        damping: 10,
        stiffness: 90,
      }),
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
      opacity: opacity.value,
    };
  });

  const valueAnimatedStyle = useAnimatedStyle(() => {
    const translateY = interpolate(scale.value, [0, 1], [20, 0], Extrapolate.CLAMP);
    return {
      transform: [{ translateY }],
    };
  });

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.glowEffect} />
        <Animated.View style={valueAnimatedStyle}>
          <Text style={styles.value}>{value}</Text>
        </Animated.View>
        <Text style={styles.label}>{label}</Text>
        <View style={styles.shine} />
      </LinearGradient>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '48%',
    marginBottom: dimensions.spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  gradient: {
    padding: dimensions.spacing.lg,
    alignItems: 'center',
    position: 'relative',
    minHeight: 90,
    justifyContent: 'center',
  },
  glowEffect: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    backgroundColor: 'rgba(102, 126, 234, 0.05)',
    borderRadius: 100,
    transform: [{ scale: 1.5 }],
  },
  value: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.accent,
    marginBottom: dimensions.spacing.xs,
    textShadowColor: 'rgba(102, 126, 234, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  label: {
    fontSize: 14,
    color: colors.text,
    fontWeight: '600',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  shine: {
    position: 'absolute',
    top: 0,
    right: -30,
    width: 30,
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ skewX: '-20deg' }],
  },
});
