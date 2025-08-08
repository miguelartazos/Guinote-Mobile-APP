import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Animated,
  type TouchableOpacityProps,
  type ViewStyle,
  type StyleProp,
} from 'react-native';
import { haptics } from '../../utils/haptics';
import {
  BUTTON_PRESS_SCALE,
  BUTTON_PRESS_DURATION,
} from '../../constants/animations';

type AnimatedButtonProps = TouchableOpacityProps & {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  hapticType?: 'light' | 'medium' | 'selection';
  scaleOnPress?: boolean;
};

export function AnimatedButton({
  children,
  style,
  onPress,
  hapticType = 'light',
  scaleOnPress = true,
  ...props
}: AnimatedButtonProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    if (scaleOnPress) {
      Animated.timing(scaleAnim, {
        toValue: BUTTON_PRESS_SCALE,
        duration: BUTTON_PRESS_DURATION,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePressOut = () => {
    if (scaleOnPress) {
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: BUTTON_PRESS_DURATION,
        useNativeDriver: true,
      }).start();
    }
  };

  const handlePress = (event: any) => {
    // Trigger haptic feedback
    switch (hapticType) {
      case 'medium':
        haptics.medium();
        break;
      case 'selection':
        haptics.selection();
        break;
      default:
        haptics.light();
    }

    // Call original onPress
    onPress?.(event);
  };

  return (
    <TouchableOpacity
      {...props}
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          style,
          scaleOnPress && {
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
}
