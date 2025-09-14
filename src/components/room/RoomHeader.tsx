import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Card } from '../ui/Card';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';

interface RoomHeaderProps {
  code: string;
  onShare: () => void;
  onCopy: () => void;
}

export function RoomHeader({ code, onShare, onCopy }: RoomHeaderProps) {
  return (
    <Card elevated style={styles.container}>
      <Text style={styles.label}>Código de Sala</Text>
      <Text style={styles.code}>{code}</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.copyButton} onPress={onCopy}>
          <Text style={styles.copyButtonText}>📋 Copiar código</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.shareButton} onPress={onShare}>
          <Text style={styles.shareButtonText}>📱 Compartir</Text>
        </TouchableOpacity>
      </View>
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
  buttonContainer: {
    flexDirection: 'row',
    gap: dimensions.spacing.sm,
  },
  copyButton: {
    backgroundColor: colors.secondary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
  },
  copyButtonText: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    color: colors.background,
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
