import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { typography } from '../constants/typography';
import type { JugarStackScreenProps } from '../types/navigation';

export function RoomScreen({ navigation }: JugarStackScreenProps<'Room'>) {
  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Sala Multijugador</Text>
          <Text style={styles.subtitle}>Esperando jugadores...</Text>
        </View>

        <View style={styles.content}>
          <Text style={styles.placeholder}>
            Aquí irá la sala de espera con lista de jugadores y chat
          </Text>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            onPress={() =>
              navigation.navigate('Game', {
                gameMode: 'private',
              })
            }
          >
            Comenzar Partida
          </Button>

          <Button
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={styles.button}
          >
            Salir de la sala
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
  button: {
    marginTop: dimensions.spacing.md,
  },
});
