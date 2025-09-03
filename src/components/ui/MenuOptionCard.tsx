import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
  Animated,
  Platform,
  Vibration,
} from 'react-native';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';

type MenuOptionCardProps = {
  title: string;
  subtitle?: string;
  icon: string;
  color?: string;
  onPress: () => void;
  disabled?: boolean;
  badge?: string | number;
  animateEntrance?: boolean;
  entranceDelay?: number;
  rightArrow?: boolean;
};

export function MenuOptionCard({
  title,
  subtitle,
  icon,
  color = colors.accent,
  onPress,
  disabled = false,
  badge,
  animateEntrance = false,
  entranceDelay = 0,
  rightArrow = true,
}: MenuOptionCardProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const glowAnim = React.useRef(new Animated.Value(0)).current;
  const entranceAnim = React.useRef(new Animated.Value(animateEntrance ? 0 : 1)).current;
  const translateXAnim = React.useRef(new Animated.Value(animateEntrance ? 30 : 0)).current;

  React.useEffect(() => {
    if (animateEntrance) {
      Animated.parallel([
        Animated.timing(entranceAnim, {
          toValue: 1,
          duration: 400,
          delay: entranceDelay,
          useNativeDriver: true,
        }),
        Animated.spring(translateXAnim, {
          toValue: 0,
          delay: entranceDelay,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animateEntrance, entranceDelay, entranceAnim, translateXAnim]);

  React.useEffect(() => {
    if (!disabled) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 2000,
            useNativeDriver: false,
          }),
        ]),
      ).start();
    }
  }, [disabled, glowAnim]);

  const handlePressIn = () => {
    if (Platform.OS === 'ios') {
      Vibration.vibrate(1);
    }
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      speed: 50,
      bounciness: 4,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  const animatedShadowStyle = {
    shadowOpacity: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [0.1, 0.2],
    }),
    shadowRadius: glowAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [6, 10],
    }),
  };

  return (
    <Animated.View
      style={[
        styles.container,
        animatedShadowStyle,
        {
          opacity: entranceAnim,
          transform: [{ scale: scaleAnim }, { translateX: translateXAnim }],
        },
        disabled && styles.disabled,
      ]}
    >
      <TouchableOpacity
        style={[styles.card, { borderLeftColor: color }]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={disabled}
        activeOpacity={1}
      >
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <Text style={styles.icon}>{icon}</Text>
        </View>
        <View style={styles.content}>
          <View style={styles.textContainer}>
            <Text style={[styles.title, disabled && styles.disabledText]}>{title}</Text>
            {subtitle && (
              <Text style={[styles.subtitle, disabled && styles.disabledText]}>{subtitle}</Text>
            )}
          </View>
          {badge !== undefined && (
            <View style={[styles.badge, { backgroundColor: color }]}>
              <Text style={styles.badgeText}>{badge}</Text>
            </View>
          )}
          {rightArrow && <Text style={[styles.arrow, disabled && styles.disabledText]}>›</Text>}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: dimensions.spacing.lg,
    marginVertical: dimensions.spacing.xs,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    padding: dimensions.spacing.md,
    borderLeftWidth: 4,
    minHeight: dimensions.touchTarget.comfortable,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: dimensions.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: dimensions.spacing.md,
  },
  icon: {
    fontSize: 28,
    color: colors.white,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.text,
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.md,
    marginRight: dimensions.spacing.md,
  },
  badgeText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.white,
  },
  arrow: {
    fontSize: 36,
    color: colors.textSecondary,
    fontWeight: '300',
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: colors.textMuted,
  },
});
