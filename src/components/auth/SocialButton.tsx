import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View, TouchableOpacityProps } from 'react-native';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';

type Provider = 'google' | 'apple' | 'facebook';

type SocialButtonProps = TouchableOpacityProps & {
  provider: Provider;
  label?: string;
};

const providerMeta: Record<Provider, { icon: string; bg: string; fg: string; border?: string }> = {
  google: { icon: '🟢', bg: colors.white as string, fg: colors.primary as string, border: colors.border as string },
  apple: { icon: '🍎', bg: colors.black as string, fg: colors.white as string },
  facebook: { icon: '📘', bg: '#1877F2', fg: colors.white as string },
};

export function SocialButton({ provider, label, style, disabled, ...props }: SocialButtonProps) {
  const meta = providerMeta[provider];
  return (
    <TouchableOpacity
      style={[styles.button, { backgroundColor: meta.bg, borderColor: meta.border }, disabled && styles.disabled, style]}
      activeOpacity={0.9}
      disabled={disabled}
      {...props}
    >
      <View style={styles.content}>
        <Text style={[styles.icon, { color: meta.fg }]}>{meta.icon}</Text>
        <Text style={[styles.text, { color: meta.fg }]}>
          {label || (provider.charAt(0).toUpperCase() + provider.slice(1))}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    flex: 1,
    borderRadius: dimensions.borderRadius.lg,
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.lg,
    borderWidth: 1,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    fontSize: 18,
    marginRight: dimensions.spacing.sm,
  },
  text: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
  },
  disabled: {
    opacity: 0.5,
  },
});


