import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ViewStyle,
  Animated,
} from 'react-native';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';

type CardProps = {
  children: React.ReactNode;
  onPress?: () => void;
  style?: ViewStyle;
  elevated?: boolean;
  variant?: 'default' | 'outlined' | 'filled';
};

export function Card({
  children,
  onPress,
  style,
  elevated = true,
  variant = 'default',
}: CardProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.98,
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

  const getVariantStyles = () => {
    switch (variant) {
      case 'outlined':
        return styles.outlined;
      case 'filled':
        return styles.filled;
      default:
        return styles.default;
    }
  };

  const content = (
    <View
      style={[
        styles.card,
        getVariantStyles(),
        elevated && styles.elevated,
        style,
      ]}
    >
      {children}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          {content}
        </Animated.View>
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
  },
  default: {
    backgroundColor: colors.surface,
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.border,
  },
  filled: {
    backgroundColor: colors.secondary,
  },
  elevated: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
});
