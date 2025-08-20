import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  TextInputProps,
} from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';

type InputFieldProps = TextInputProps & {
  label?: string;
  error?: string;
  icon?: string;
  rightIcon?: string;
  onRightIconPress?: () => void;
  showPasswordToggle?: boolean;
  validation?: {
    isValid?: boolean;
    message?: string;
  };
};

export function InputField({
  label,
  error,
  icon,
  rightIcon,
  onRightIconPress,
  showPasswordToggle,
  validation,
  secureTextEntry,
  onFocus,
  onBlur,
  style,
  ...props
}: InputFieldProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const focusAnim = React.useRef(new Animated.Value(0)).current;
  const shakeAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(focusAnim, {
      toValue: isFocused ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [isFocused, focusAnim]);

  React.useEffect(() => {
    if (error) {
      Animated.sequence([
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: -10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 10,
          duration: 50,
          useNativeDriver: true,
        }),
        Animated.timing(shakeAnim, {
          toValue: 0,
          duration: 50,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [error, shakeAnim]);

  const handleFocus = (e: any) => {
    setIsFocused(true);
    onFocus?.(e);
  };

  const handleBlur = (e: any) => {
    setIsFocused(false);
    onBlur?.(e);
  };

  const borderColor = focusAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [error ? colors.error : colors.border, error ? colors.error : colors.accent],
  });

  const shouldShowPassword = showPasswordToggle ? !showPassword : !secureTextEntry;

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <Animated.View
        style={[
          styles.inputContainer,
          {
            borderColor,
            borderWidth: isFocused ? 2 : 1,
            transform: [{ translateX: shakeAnim }],
          },
        ]}
      >
        {icon && <Text style={styles.leftIcon}>{icon}</Text>}
        <TextInput
          {...props}
          secureTextEntry={!shouldShowPassword}
          onFocus={handleFocus}
          onBlur={handleBlur}
          style={[styles.input, style]}
          placeholderTextColor={colors.textSecondary}
        />
        {showPasswordToggle && secureTextEntry && (
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.rightIconButton}
          >
            <Text style={styles.rightIcon}>{showPassword ? '👁️' : '👁️‍🗨️'}</Text>
          </TouchableOpacity>
        )}
        {rightIcon && !showPasswordToggle && (
          <TouchableOpacity
            onPress={onRightIconPress}
            style={styles.rightIconButton}
            disabled={!onRightIconPress}
          >
            <Text style={styles.rightIcon}>{rightIcon}</Text>
          </TouchableOpacity>
        )}
        {validation?.isValid !== undefined && !error && (
          <Text
            style={[
              styles.validationIcon,
              validation.isValid ? styles.validIcon : styles.invalidIcon,
            ]}
          >
            {validation.isValid ? '✓' : '✗'}
          </Text>
        )}
      </Animated.View>
      {error && <Text style={styles.errorText}>{error}</Text>}
      {validation?.message && !error && (
        <Text
          style={[
            styles.validationMessage,
            validation.isValid ? styles.validMessage : styles.invalidMessage,
          ]}
        >
          {validation.message}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: dimensions.spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    marginBottom: dimensions.spacing.xs,
    fontWeight: typography.fontWeight.medium,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.md,
    paddingHorizontal: dimensions.spacing.md,
    minHeight: dimensions.touchTarget.comfortable,
  },
  leftIcon: {
    fontSize: 20,
    marginRight: dimensions.spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.base,
    color: colors.text,
    paddingVertical: dimensions.spacing.md,
  },
  rightIconButton: {
    padding: dimensions.spacing.sm,
    marginLeft: dimensions.spacing.sm,
  },
  rightIcon: {
    fontSize: 20,
  },
  validationIcon: {
    fontSize: 16,
    marginLeft: dimensions.spacing.sm,
  },
  validIcon: {
    color: colors.success,
  },
  invalidIcon: {
    color: colors.error,
  },
  errorText: {
    fontSize: typography.fontSize.sm,
    color: colors.error,
    marginTop: dimensions.spacing.xs,
    marginLeft: dimensions.spacing.sm,
  },
  validationMessage: {
    fontSize: typography.fontSize.sm,
    marginTop: dimensions.spacing.xs,
    marginLeft: dimensions.spacing.sm,
  },
  validMessage: {
    color: colors.success,
  },
  invalidMessage: {
    color: colors.warning,
  },
});
