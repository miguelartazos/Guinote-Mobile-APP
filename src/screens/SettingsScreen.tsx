import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { typography } from '../constants/typography';
import type { MainTabScreenProps } from '../types/navigation';

export function SettingsScreen({ navigation: _ }: MainTabScreenProps<'Ajustes'>) {
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Ajustes</Text>
          <Text style={styles.subtitle}>Configuración del juego</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.placeholder}>
            Aquí irán las opciones de configuración del juego, ayuda y soporte
          </Text>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between',
  },
  titleContainer: {
    alignItems: 'center',
    marginTop: dimensions.spacing.xxl,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: dimensions.spacing.sm,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholder: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    textAlign: 'center',
  },
  buttonContainer: {
    marginBottom: dimensions.spacing.xxl,
  },
});
