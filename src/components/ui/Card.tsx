import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Animated,
  Platform,
  Vibration,
} from 'react-native';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';

type CardProps = {
  children: React.ReactNode;
  onPress?: () => void;
  onLongPress?: () => void;
  style?: ViewStyle;
  elevated?: boolean;
  variant?: 'default' | 'outlined' | 'filled' | 'gradient';
  animateEntrance?: boolean;
  entranceDelay?: number;
};

export function Card({
  children,
  onPress,
  onLongPress,
  style,
  elevated = true,
  variant = 'default',
  animateEntrance = false,
  entranceDelay = 0,
}: CardProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const shadowAnim = React.useRef(new Animated.Value(elevated ? 1 : 0)).current;
  const entranceAnim = React.useRef(new Animated.Value(animateEntrance ? 0 : 1)).current;
  const translateYAnim = React.useRef(new Animated.Value(animateEntrance ? 20 : 0)).current;

  React.useEffect(() => {
    if (animateEntrance) {
      Animated.parallel([
        Animated.timing(entranceAnim, {
          toValue: 1,
          duration: 400,
          delay: entranceDelay,
          useNativeDriver: true,
        }),
        Animated.timing(translateYAnim, {
          toValue: 0,
          duration: 400,
          delay: entranceDelay,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animateEntrance, entranceDelay, entranceAnim, translateYAnim]);

  const handlePressIn = () => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Vibration.vibrate(1);
    }

    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 0.97,
        speed: 50,
        bounciness: 4,
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: 1.5,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handlePressOut = () => {
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.timing(shadowAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: false,
      }),
    ]).start();
  };

  const handleLongPress = () => {
    if (onLongPress) {
      Vibration.vibrate(10);
      onLongPress();
    }
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'outlined':
        return styles.outlined;
      case 'filled':
        return styles.filled;
      case 'gradient':
        return styles.gradient;
      default:
        return styles.default;
    }
  };

  const animatedShadowStyle = elevated
    ? {
        shadowOpacity: shadowAnim.interpolate({
          inputRange: [0, 1, 1.5],
          outputRange: [0, 0.15, 0.25],
        }),
        shadowRadius: shadowAnim.interpolate({
          inputRange: [0, 1, 1.5],
          outputRange: [0, 8, 12],
        }),
        elevation: shadowAnim.interpolate({
          inputRange: [0, 1, 1.5],
          outputRange: [0, 5, 8],
        }),
      }
    : {};

  const content = (
    <Animated.View
      style={[
        styles.card,
        getVariantStyles(),
        style,
        animatedShadowStyle,
        {
          opacity: entranceAnim,
          transform: [{ scale: scaleAnim }, { translateY: translateYAnim }],
        },
      ]}
    >
      {variant === 'gradient' && <View style={styles.gradientOverlay} />}
      {children}
    </Animated.View>
  );

  if (onPress || onLongPress) {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        onLongPress={handleLongPress}
        delayLongPress={500}
      >
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  card: {
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    marginVertical: dimensions.spacing.sm,
    overflow: 'hidden',
    position: 'relative' as const,
  },
  default: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  filled: {
    backgroundColor: colors.secondary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gradient: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  gradientOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.accent,
    opacity: 0.05,
  },
  elevated: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
});
