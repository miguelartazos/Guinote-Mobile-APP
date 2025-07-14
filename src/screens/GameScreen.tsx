import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { typography } from '../constants/typography';
import type { JugarStackScreenProps } from '../types/navigation';

export function GameScreen({ navigation }: JugarStackScreenProps<'Game'>) {
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Juego</Text>
          <Text style={styles.subtitle}>Partida de Guiñote</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.placeholder}>Aquí irá la interfaz del juego</Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button variant="secondary" onPress={() => navigation.goBack()}>
            Volver al menú
          </Button>
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
