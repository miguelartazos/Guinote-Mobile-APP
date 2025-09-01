import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';

interface RoomHeaderProps {
  code: string;
  onShare: () => void;
}

export function RoomHeader({ code, onShare }: RoomHeaderProps) {
  return (
    <Card elevated style={styles.container}>
      <Text style={styles.label}>Código de Sala</Text>
      <Text style={styles.code}>{code}</Text>
      <TouchableOpacity style={styles.shareButton} onPress={onShare}>
        <Text style={styles.shareButtonText}>📱 Compartir por WhatsApp</Text>
      </TouchableOpacity>
    </Card>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.xs,
  },
  code: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    letterSpacing: 4,
    marginBottom: dimensions.spacing.md,
  },
  shareButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
  },
  shareButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
  },
});
