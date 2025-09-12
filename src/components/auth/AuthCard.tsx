import React from 'react';
import { View, Text, StyleSheet, ViewProps } from 'react-native';
import { colors } from '../../constants/colors';
import { dimensions } from '../../constants/dimensions';
import { typography } from '../../constants/typography';

type AuthCardProps = ViewProps & {
  title?: string;
  subtitle?: string;
  headerSlot?: React.ReactNode;
  footerSlot?: React.ReactNode;
  children?: React.ReactNode;
  isStandalone?: boolean; // when true, renders a full-screen centered background; when false, just the card
};

export function AuthCard({ title, subtitle, headerSlot, footerSlot, style, children, isStandalone = true, ...props }: AuthCardProps) {
  const CardInner = (
    <View style={[styles.card, style]} {...props}>
      <View style={styles.header}>
        {headerSlot}
        {title && <Text style={styles.title}>{title}</Text>}
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>

      <View style={styles.content}>{children}</View>

      {footerSlot && <View style={styles.footer}>{footerSlot}</View>}
    </View>
  );

  if (!isStandalone) return CardInner;
  return <View style={styles.screen}>{CardInner}</View>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: dimensions.spacing.lg,
    backgroundColor: colors.background,
  },
  card: {
    width: '100%',
    maxWidth: 460,
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.xl,
    paddingVertical: dimensions.spacing.xl,
    paddingHorizontal: dimensions.spacing.xl,
    borderWidth: 1,
    borderColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  header: {
    alignItems: 'center',
    marginBottom: dimensions.spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: dimensions.spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  content: {
    width: '100%',
  },
  footer: {
    marginTop: dimensions.spacing.lg,
  },
});


