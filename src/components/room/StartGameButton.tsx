import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { colors } from '../../constants/colors';
import { typography } from '../../constants/typography';
import { dimensions } from '../../constants/dimensions';

interface StartGameButtonProps {
  enabled: boolean;
  onStart: () => void;
}

export function StartGameButton({ enabled, onStart }: StartGameButtonProps) {
  return (
    <View>
      <TouchableOpacity
        testID="start-game-button"
        style={[styles.button, !enabled && styles.buttonDisabled]}
        onPress={enabled ? onStart : undefined}
        accessibilityState={{ disabled: !enabled }}
      >
        <Text style={[styles.buttonText, !enabled && styles.buttonTextDisabled]}>
          🎯 Iniciar Partida
        </Text>
      </TouchableOpacity>
      {!enabled && <Text style={styles.waitingMessage}>Esperando a todos los jugadores</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: dimensions.spacing.md,
    paddingHorizontal: dimensions.spacing.xl,
    borderRadius: dimensions.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.cantarGreen,
  },
  buttonDisabled: {
    backgroundColor: colors.surface,
    borderWidth: 2,
    borderColor: colors.border,
  },
  buttonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
    color: colors.background,
  },
  buttonTextDisabled: {
    color: colors.textMuted,
  },
  waitingMessage: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: dimensions.spacing.xs,
  },
});
