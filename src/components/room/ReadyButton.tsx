import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';

interface ReadyButtonProps {
  isReady: boolean;
  onToggle: () => void;
}

export function ReadyButton({ isReady, onToggle }: ReadyButtonProps) {
  return (
    <TouchableOpacity
      testID="ready-button"
      style={[styles.button, isReady ? styles.buttonReady : styles.buttonNotReady]}
      onPress={onToggle}
    >
      <Text style={[styles.buttonText, isReady && styles.buttonTextReady]}>
        {isReady ? '✅ Cancelar Listo' : '👍 Listo'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.xl,
    borderRadius: dimensions.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  buttonNotReady: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  buttonReady: {
    backgroundColor: colors.surface,
    borderColor: colors.cantarGreen,
  },
  buttonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.background,
  },
  buttonTextReady: {
    color: colors.cantarGreen,
  },
});
