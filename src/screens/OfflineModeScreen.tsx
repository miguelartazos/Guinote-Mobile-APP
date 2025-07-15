import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { typography } from '../constants/typography';
import type { JugarStackScreenProps } from '../types/navigation';

type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

export function OfflineModeScreen({
  navigation,
}: JugarStackScreenProps<'OfflineMode'>) {
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<DifficultyLevel>('medium');
  const [playerName, setPlayerName] = useState('Jugador');

  const difficulties = [
    {
      level: 'easy' as const,
      title: 'Fácil',
      description: 'Perfecto para principiantes',
      winRate: '30%',
      icon: '🟢',
    },
    {
      level: 'medium' as const,
      title: 'Medio',
      description: 'Para jugadores casuales',
      winRate: '45%',
      icon: '🟡',
    },
    {
      level: 'hard' as const,
      title: 'Difícil',
      description: 'Para jugadores experimentados',
      winRate: '55%',
      icon: '🟠',
    },
    {
      level: 'expert' as const,
      title: 'Experto',
      description: 'Solo para maestros',
      winRate: '65%',
      icon: '🔴',
    },
  ];

  return (
    <ScreenContainer>
      <View style={styles.container}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Modo Offline</Text>
          <Text style={styles.subtitle}>Selecciona la dificultad de la IA</Text>
        </View>

        <View style={styles.content}>
          {/* Player Name Input */}
          <View style={styles.playerNameContainer}>
            <Text style={styles.inputLabel}>Tu nombre de jugador</Text>
            <TextInput
              style={styles.nameInput}
              value={playerName}
              onChangeText={setPlayerName}
              placeholder="Introduce tu nombre"
              placeholderTextColor={colors.text}
              maxLength={20}
            />
          </View>

          {/* Difficulty Selection */}
          <View style={styles.difficultiesContainer}>
            <Text style={styles.sectionTitle}>Selecciona la dificultad</Text>
            {difficulties.map(difficulty => (
              <Button
                key={difficulty.level}
                onPress={() => setSelectedDifficulty(difficulty.level)}
                variant={
                  selectedDifficulty === difficulty.level
                    ? 'primary'
                    : 'secondary'
                }
                style={[
                  styles.difficultyButton,
                  selectedDifficulty === difficulty.level &&
                    styles.selectedButton,
                ]}
              >
                {`${difficulty.icon} ${difficulty.title}`}
              </Button>
            ))}
          </View>

          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>
              {difficulties.find(d => d.level === selectedDifficulty)?.title}
            </Text>
            <Text style={styles.infoDescription}>
              {
                difficulties.find(d => d.level === selectedDifficulty)
                  ?.description
              }
            </Text>
            <Text style={styles.infoWinRate}>
              La IA ganará aproximadamente el{' '}
              {difficulties.find(d => d.level === selectedDifficulty)?.winRate}{' '}
              de las partidas
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            onPress={() =>
              navigation.navigate('Game', {
                gameMode: 'offline',
                difficulty: selectedDifficulty,
                playerName: playerName.trim() || 'Jugador',
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
            Volver
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
    textAlign: 'center',
  },
  content: {
    flex: 1,
    marginTop: dimensions.spacing.xxl,
  },
  playerNameContainer: {
    marginBottom: dimensions.spacing.xl,
  },
  inputLabel: {
    fontSize: typography.fontSize.lg,
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
    marginBottom: dimensions.spacing.md,
  },
  nameInput: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.secondary,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    fontSize: typography.fontSize.lg,
    color: colors.text,
    minHeight: dimensions.touchTarget.large,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
    marginBottom: dimensions.spacing.md,
  },
  difficultiesContainer: {
    marginBottom: dimensions.spacing.xl,
  },
  difficultyButton: {
    marginBottom: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.lg,
  },
  selectedButton: {
    borderWidth: 2,
    borderColor: colors.accent,
  },
  infoCard: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  infoTitle: {
    fontSize: typography.fontSize.xl,
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
    marginBottom: dimensions.spacing.sm,
  },
  infoDescription: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    marginBottom: dimensions.spacing.md,
  },
  infoWinRate: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontStyle: 'italic',
  },
  buttonContainer: {
    marginBottom: dimensions.spacing.xxl,
  },
  button: {
    marginTop: dimensions.spacing.md,
  },
});
