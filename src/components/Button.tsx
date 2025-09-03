import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  TouchableOpacityProps,
  Animated,
  Platform,
  View,
  Vibration,
  ActivityIndicator,
} from 'react-native';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { typography } from '../constants/typography';

type ButtonVariant = 'primary' | 'secondary' | 'white' | 'danger' | 'success';
type ButtonSize = 'small' | 'medium' | 'large';

type ButtonProps = TouchableOpacityProps & {
  children: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: string;
  iconPosition?: 'left' | 'right';
};

export function Button({
  children,
  variant = 'primary',
  size = 'medium',
  disabled,
  loading,
  icon,
  iconPosition = 'left',
  style,
  onPressIn,
  onPressOut,
  onPress,
  ...props
}: ButtonProps) {
  const scaleAnim = React.useRef(new Animated.Value(1)).current;
  const opacityAnim = React.useRef(new Animated.Value(1)).current;
  const rippleAnim = React.useRef(new Animated.Value(0)).current;
  const iconRotateAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.timing(iconRotateAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ).start();
    } else {
      iconRotateAnim.setValue(0);
    }
  }, [loading, iconRotateAnim]);

  const handlePressIn = (e: any) => {
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Vibration.vibrate(1);
    }

    Animated.parallel(
      [
        Animated.spring(scaleAnim, {
          toValue: 0.96,
          speed: 50,
          bounciness: 4,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 100,
          useNativeDriver: true,
        }),
        // Ripple effect for Android
        Platform.OS === 'android' &&
          Animated.timing(rippleAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
      ].filter(Boolean),
    ).start();
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    Animated.parallel(
      [
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 3,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
        Platform.OS === 'android' &&
          Animated.timing(rippleAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: true,
          }),
      ].filter(Boolean),
    ).start();
    onPressOut?.(e);
  };

  const handlePress = (e: any) => {
    if (!disabled && !loading) {
      onPress?.(e);
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'small':
        return styles.buttonSmall;
      case 'large':
        return styles.buttonLarge;
      default:
        return styles.buttonMedium;
    }
  };

  const getTextSizeStyles = () => {
    switch (size) {
      case 'small':
        return styles.buttonTextSmall;
      case 'large':
        return styles.buttonTextLarge;
      default:
        return styles.buttonTextMedium;
    }
  };

  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1.5],
  });

  const iconRotation = iconRotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnim }], opacity: opacityAnim }, style]}>
      <TouchableOpacity
        style={[
          styles.button,
          getSizeStyles(),
          variant === 'primary' && styles.primaryButton,
          variant === 'secondary' && styles.secondaryButton,
          variant === 'white' && styles.whiteButton,
          variant === 'danger' && styles.dangerButton,
          variant === 'success' && styles.successButton,
          (disabled || loading) && styles.disabledButton,
        ]}
        disabled={disabled || loading}
        activeOpacity={1}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={handlePress}
        {...props}
      >
        {Platform.OS === 'android' && (
          <Animated.View
            style={[
              styles.rippleEffect,
              {
                transform: [{ scale: rippleScale }],
                opacity: rippleAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0, 0.3, 0],
                }),
              },
            ]}
          />
        )}
        {Platform.OS === 'ios' && variant === 'primary' && <View style={styles.gradientOverlay} />}
        <View style={styles.buttonContent}>
          {loading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator
                size={size === 'small' ? 'small' : 'small'}
                color={variant === 'white' ? colors.primary : colors.white}
              />
              <Text
                style={[
                  styles.buttonText,
                  getTextSizeStyles(),
                  styles.loadingText,
                  variant === 'white' && styles.whiteButtonText,
                ]}
              >
                Cargando...
              </Text>
            </View>
          ) : (
            <>
              {icon && iconPosition === 'left' && (
                <Animated.Text
                  style={[styles.buttonIcon, loading && { transform: [{ rotate: iconRotation }] }]}
                >
                  {icon}
                </Animated.Text>
              )}
              <Text
                style={[
                  styles.buttonText,
                  getTextSizeStyles(),
                  variant === 'primary' && styles.primaryButtonText,
                  variant === 'secondary' && styles.secondaryButtonText,
                  variant === 'white' && styles.whiteButtonText,
                  variant === 'danger' && styles.dangerButtonText,
                  variant === 'success' && styles.successButtonText,
                ]}
              >
                {children}
              </Text>
              {icon && iconPosition === 'right' && (
                <Animated.Text
                  style={[styles.buttonIcon, loading && { transform: [{ rotate: iconRotation }] }]}
                >
                  {icon}
                </Animated.Text>
              )}
            </>
          )}
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: dimensions.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative' as const,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonSmall: {
    minHeight: dimensions.touchTarget.small,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
  },
  buttonMedium: {
    minHeight: dimensions.touchTarget.comfortable,
    paddingHorizontal: dimensions.spacing.xl,
    paddingVertical: dimensions.spacing.md,
  },
  buttonLarge: {
    minHeight: dimensions.touchTarget.large,
    paddingHorizontal: dimensions.spacing.xxl,
    paddingVertical: dimensions.spacing.lg,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: colors.accent,
  },
  secondaryButton: {
    backgroundColor: colors.secondary,
    borderWidth: 2,
    borderColor: colors.accent,
  },
  whiteButton: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dangerButton: {
    backgroundColor: colors.salirRed,
  },
  successButton: {
    backgroundColor: colors.cantarGreen,
  },
  disabledButton: {
    opacity: 0.5,
    shadowOpacity: 0,
    elevation: 0,
  },
  gradientOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  buttonText: {
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  buttonTextSmall: {
    fontSize: typography.fontSize.sm,
  },
  buttonTextMedium: {
    fontSize: typography.fontSize.lg,
  },
  buttonTextLarge: {
    fontSize: typography.fontSize.xl,
  },
  primaryButtonText: {
    color: colors.white,
  },
  secondaryButtonText: {
    color: colors.text,
  },
  whiteButtonText: {
    color: colors.primary,
  },
  dangerButtonText: {
    color: colors.white,
  },
  successButtonText: {
    color: colors.white,
  },
  buttonIcon: {
    fontSize: 20,
    marginHorizontal: dimensions.spacing.xs,
  },
  rippleEffect: {
    position: 'absolute' as const,
    top: '50%',
    left: '50%',
    width: 100,
    height: 100,
    marginLeft: -50,
    marginTop: -50,
    borderRadius: 50,
    backgroundColor: colors.white,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginLeft: dimensions.spacing.sm,
  },
});
