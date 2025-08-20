import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, Platform } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolate,
  Extrapolate,
  runOnJS,
} from 'react-native-reanimated';
import LinearGradient from 'react-native-linear-gradient';
import HapticFeedback from 'react-native-haptic-feedback';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';

type GlassButtonProps = {
  text: string;
  icon: string;
  onPress: () => void;
  disabled?: boolean;
};

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity);

export function GlassButton({ text, icon, onPress, disabled = false }: GlassButtonProps) {
  const scale = useSharedValue(1);
  const shine = useSharedValue(0);

  const handlePressIn = () => {
    'worklet';
    scale.value = withSpring(0.95, {
      damping: 10,
      stiffness: 400,
    });
    shine.value = withTiming(1, { duration: 200 });
  };

  const handlePressOut = () => {
    'worklet';
    scale.value = withSpring(1, {
      damping: 10,
      stiffness: 400,
    });
    shine.value = withTiming(0, { duration: 400 });
  };

  const handlePress = () => {
    runOnJS(HapticFeedback.impact)(HapticFeedback.ImpactFeedbackStyle.Light);
    runOnJS(onPress)();
  };

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const shineStyle = useAnimatedStyle(() => {
    const opacity = interpolate(shine.value, [0, 1], [0, 0.3], Extrapolate.CLAMP);
    return {
      opacity,
    };
  });

  return (
    <AnimatedTouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={handlePress}
      disabled={disabled}
      style={[styles.container, animatedStyle]}
    >
      <LinearGradient
        colors={['rgba(255, 255, 255, 0.1)', 'rgba(255, 255, 255, 0.05)']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <View style={styles.glassBorder} />

        <View style={styles.content}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>{icon}</Text>
          </View>
          <Text style={styles.text}>{text}</Text>
        </View>

        <Animated.View style={[styles.shine, shineStyle]}>
          <LinearGradient
            colors={['transparent', 'rgba(255, 255, 255, 0.5)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.shineGradient}
          />
        </Animated.View>
      </LinearGradient>
    </AnimatedTouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  gradient: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    position: 'relative',
  },
  glassBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  icon: {
    fontSize: 18,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    letterSpacing: 0.3,
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  shineGradient: {
    flex: 1,
  },
});
