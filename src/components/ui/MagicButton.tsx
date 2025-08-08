import React, { useEffect } from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  View,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withSpring,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import HapticFeedback from 'react-native-haptic-feedback';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type MagicButtonProps = {
  title: string;
  subtitle?: string;
  icon?: string;
  onPress: () => void;
  gradientColors: string[];
  shadowColor?: string;
  index?: number;
  disabled?: boolean;
};

const AnimatedTouchableOpacity =
  Animated.createAnimatedComponent(TouchableOpacity);
const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

export function MagicButton({
  title,
  subtitle,
  icon,
  onPress,
  gradientColors,
  shadowColor = '#000',
  index = 0,
  disabled = false,
}: MagicButtonProps) {
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const translateY = useSharedValue(50);
  const opacity = useSharedValue(0);
  const shimmerPosition = useSharedValue(0);
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    translateY.value = withSpring(0, {
      damping: 15,
      stiffness: 100,
      mass: 1.2,
    });
    opacity.value = withTiming(1, { duration: 600 });

    rotation.value = withSequence(
      withTiming(-2, { duration: 100 }),
      withSpring(0, { damping: 8, stiffness: 200 }),
    );

    shimmerPosition.value = withRepeat(
      withTiming(1, { duration: 3000 }),
      -1,
      false,
    );

    pulseScale.value = withRepeat(
      withSequence(
        withTiming(1.02, { duration: 1500 }),
        withTiming(1, { duration: 1500 }),
      ),
      -1,
      true,
    );
  }, []);

  const handlePressIn = () => {
    'worklet';
    scale.value = withSpring(0.95, {
      damping: 10,
      stiffness: 400,
    });
    rotation.value = withSequence(
      withTiming(-1, { duration: 50 }),
      withTiming(1, { duration: 50 }),
      withTiming(0, { duration: 50 }),
    );
  };

  const handlePressOut = () => {
    'worklet';
    scale.value = withSpring(1, {
      damping: 10,
      stiffness: 400,
    });
  };

  const handlePress = () => {
    runOnJS(HapticFeedback.impact)(HapticFeedback.ImpactFeedbackStyle.Medium);
    runOnJS(onPress)();
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value * pulseScale.value },
        { rotate: `${rotation.value}deg` },
        { translateY: translateY.value },
      ],
      opacity: opacity.value,
    };
  });

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(
      shimmerPosition.value,
      [0, 1],
      [-SCREEN_WIDTH, SCREEN_WIDTH],
      Extrapolate.CLAMP,
    );
    return {
      transform: [{ translateX }],
    };
  });

  const glowStyle = useAnimatedStyle(() => {
    const glowOpacity = interpolate(
      pulseScale.value,
      [1, 1.02],
      [0.3, 0.6],
      Extrapolate.CLAMP,
    );
    return {
      opacity: glowOpacity,
    };
  });

  return (
    <AnimatedTouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      style={[
        styles.container,
        animatedStyle,
        {
          shadowColor,
          marginBottom: dimensions.spacing.lg,
        },
      ]}
    >
      <LinearGradient
        colors={gradientColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <Animated.View style={[styles.glowEffect, glowStyle]}>
          <LinearGradient
            colors={[...gradientColors].reverse()}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.glowGradient}
          />
        </Animated.View>

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{icon}</Text>
            <View style={styles.iconGlow} />
          </View>

          <View style={styles.textContainer}>
            <Text style={styles.title}>{title}</Text>
            {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
          </View>

          <View style={styles.arrowContainer}>
            <Text style={styles.arrow}>→</Text>
          </View>
        </View>

        <Animated.View style={[styles.shimmer, shimmerStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(255,255,255,0.3)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.shimmerGradient}
          />
        </Animated.View>
      </LinearGradient>
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 10,
  },
  gradient: {
    paddingVertical: 24,
    paddingHorizontal: 20,
    minHeight: 100,
    position: 'relative',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
  },
  icon: {
    fontSize: 32,
    zIndex: 2,
  },
  iconGlow: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    transform: [{ scale: 1.2 }],
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.white,
    letterSpacing: 0.5,
    marginBottom: 4,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    fontWeight: '500',
    letterSpacing: 0.3,
  },
  arrowContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  arrow: {
    fontSize: 24,
    color: colors.white,
    fontWeight: 'bold',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shimmerGradient: {
    width: '30%',
    height: '100%',
  },
  glowEffect: {
    position: 'absolute',
    top: -20,
    left: -20,
    right: -20,
    bottom: -20,
    borderRadius: 30,
  },
  glowGradient: {
    flex: 1,
    borderRadius: 30,
  },
});
