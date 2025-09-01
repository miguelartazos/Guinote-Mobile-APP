import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { Card } from '../components/ui/Card';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { typography } from '../constants/typography';
import { useGameSettings } from '../hooks/useGameSettings';
import { useAuth } from '../hooks/useAuth';
import { hasSavedGame, clearGameState } from '../utils/gameStatePersistence';
import type { JugarStackScreenProps } from '../types/navigation';

type DifficultyLevel = 'easy' | 'medium' | 'hard';

export function OfflineModeScreen({ navigation }: JugarStackScreenProps<'OfflineMode'>) {
  const { settings } = useGameSettings();
  const { user } = useAuth();
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('medium');
  const [hasSaved, setHasSaved] = useState(false);

  useEffect(() => {
    if (settings?.difficulty) {
      setSelectedDifficulty(settings.difficulty as DifficultyLevel);
    }
  }, [settings]);

  useEffect(() => {
    hasSavedGame().then(setHasSaved);
  }, []);

  const difficulties = [
    {
      level: 'easy' as const,
      title: 'Fácil',
      description: 'Perfecto para principiantes',
      icon: '🟢',
      color: '#66BB6A',
    },
    {
      level: 'medium' as const,
      title: 'Medio',
      description: 'Para jugadores casuales',
      icon: '🟡',
      color: '#FFA726',
    },
    {
      level: 'hard' as const,
      title: 'Difícil',
      description: 'Para jugadores experimentados',
      icon: '🔴',
      color: '#EF5350',
    },
  ];

  const selectedDiff = difficulties.find(d => d.level === selectedDifficulty);

  return (
    <ScreenContainer>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Modo Offline</Text>
          <Text style={styles.subtitle}>Juega contra la IA</Text>
          {user && (
            <View style={styles.playerInfo}>
              <Text style={styles.playerIcon}>👤</Text>
              <Text style={styles.playerName}>{user.username || 'Jugador'}</Text>
            </View>
          )}
        </View>

        {/* Difficulty Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Selecciona la Dificultad</Text>
          <View style={styles.difficultySelector}>
            {difficulties.map(difficulty => (
              <TouchableOpacity
                key={difficulty.level}
                style={[
                  styles.difficultyOption,
                  selectedDifficulty === difficulty.level && styles.difficultyOptionSelected,
                  selectedDifficulty === difficulty.level && { borderColor: difficulty.color },
                ]}
                onPress={() => setSelectedDifficulty(difficulty.level)}
                activeOpacity={0.7}
              >
                <Text style={styles.difficultyIcon}>{difficulty.icon}</Text>
                <Text
                  style={[
                    styles.difficultyText,
                    selectedDifficulty === difficulty.level && styles.difficultyTextSelected,
                  ]}
                >
                  {difficulty.title}
                </Text>
                <Text
                  style={[
                    styles.difficultyDescription,
                    selectedDifficulty === difficulty.level && styles.difficultyDescriptionSelected,
                  ]}
                >
                  {difficulty.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Difficulty Info Card */}
        {selectedDiff && (
          <Card elevated style={[styles.infoCard, { borderColor: selectedDiff.color }]}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoIcon}>{selectedDiff.icon}</Text>
              <View style={styles.infoContent}>
                <Text style={[styles.infoTitle, { color: selectedDiff.color }]}>
                  {selectedDiff.title}
                </Text>
                <Text style={styles.infoDescription}>{selectedDiff.description}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          {hasSaved && (
            <TouchableOpacity
              style={[styles.mainButton, styles.continueButton]}
              onPress={() =>
                navigation.navigate('Game', {
                  gameMode: 'offline',
                  difficulty: selectedDifficulty,
                  playerName: user?.username || 'Jugador',
                  resumeGame: true,
                })
              }
              activeOpacity={0.8}
            >
              <Text style={styles.buttonIcon}>▶️</Text>
              <Text style={styles.mainButtonText}>Continuar Partida Guardada</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[styles.mainButton, hasSaved ? styles.newGameButton : styles.startButton]}
            onPress={() => {
              if (hasSaved) {
                Alert.alert(
                  'Nueva Partida',
                  '¿Empezar una nueva partida? La partida guardada se perderá.',
                  [
                    { text: 'Cancelar', style: 'cancel' },
                    {
                      text: 'Nueva Partida',
                      onPress: () => {
                        clearGameState();
                        navigation.navigate('Game', {
                          gameMode: 'offline',
                          difficulty: selectedDifficulty,
                          playerName: user?.username || 'Jugador',
                          resumeGame: false,
                        });
                      },
                    },
                  ],
                );
              } else {
                navigation.navigate('Game', {
                  gameMode: 'offline',
                  difficulty: selectedDifficulty,
                  playerName: user?.username || 'Jugador',
                  resumeGame: false,
                });
              }
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.buttonIcon}>🎮</Text>
            <Text style={styles.mainButtonText}>
              {hasSaved ? 'Nueva Partida' : 'Comenzar Partida'}
            </Text>
          </TouchableOpacity>

          <Button
            variant="secondary"
            onPress={() => navigation.goBack()}
            icon="⬅️"
            size="large"
            style={styles.backButton}
          >
            Volver
          </Button>
        </View>
      </ScrollView>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: dimensions.spacing.lg,
    paddingBottom: dimensions.spacing.xxl,
  },
  header: {
    alignItems: 'center',
    paddingTop: dimensions.spacing.xl,
    paddingBottom: dimensions.spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: dimensions.spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.lg,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.md,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.lg,
    marginTop: dimensions.spacing.sm,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  playerIcon: {
    fontSize: 20,
    marginRight: dimensions.spacing.sm,
  },
  playerName: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  section: {
    marginVertical: dimensions.spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.xl,
    color: colors.text,
    fontWeight: typography.fontWeight.bold,
    marginBottom: dimensions.spacing.md,
    textAlign: 'center',
  },
  difficultySelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: dimensions.spacing.sm,
  },
  difficultyOption: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingVertical: dimensions.spacing.lg,
    borderRadius: dimensions.borderRadius.lg,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  difficultyOptionSelected: {
    backgroundColor: colors.secondary,
    borderWidth: 2,
  },
  difficultyIcon: {
    fontSize: 32,
    marginBottom: dimensions.spacing.xs,
  },
  difficultyText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
    marginBottom: dimensions.spacing.xs,
  },
  difficultyTextSelected: {
    color: colors.text,
    fontWeight: typography.fontWeight.bold,
  },
  difficultyDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    paddingHorizontal: dimensions.spacing.xs,
  },
  difficultyDescriptionSelected: {
    color: colors.textSecondary,
  },
  infoCard: {
    marginVertical: dimensions.spacing.md,
    borderWidth: 2,
    backgroundColor: colors.surface,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
  },
  infoIcon: {
    fontSize: 48,
    marginRight: dimensions.spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: dimensions.spacing.xs,
  },
  infoDescription: {
    fontSize: typography.fontSize.md,
    color: colors.text,
  },
  buttonContainer: {
    marginTop: dimensions.spacing.xl,
    paddingHorizontal: dimensions.spacing.sm,
  },
  mainButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: dimensions.spacing.lg,
    paddingHorizontal: dimensions.spacing.xl,
    borderRadius: dimensions.borderRadius.lg,
    marginBottom: dimensions.spacing.md,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  continueButton: {
    backgroundColor: colors.success,
    borderWidth: 1,
    borderColor: '#66BB6A',
  },
  startButton: {
    backgroundColor: colors.accent,
  },
  newGameButton: {
    backgroundColor: colors.cambiarBlue,
  },
  buttonIcon: {
    fontSize: 24,
    marginRight: dimensions.spacing.sm,
  },
  mainButtonText: {
    fontSize: typography.fontSize.lg,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  backButton: {
    marginTop: dimensions.spacing.md,
  },
});
