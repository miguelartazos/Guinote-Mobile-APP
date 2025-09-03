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

  const handleStartGame = (resume: boolean = false) => {
    if (hasSaved && !resume) {
      Alert.alert('Nueva Partida', '¿Empezar una nueva partida? La partida guardada se perderá.', [
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
      ]);
    } else {
      navigation.navigate('Game', {
        gameMode: 'offline',
        difficulty: selectedDifficulty,
        playerName: user?.username || 'Jugador',
        resumeGame: resume,
      });
    }
  };

  return (
    <ScreenContainer>
      <View style={styles.container}>
        {/* Main Content Area */}
        <ScrollView
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header - Compact */}
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

          {/* Compact Difficulty Selector */}
          <View style={styles.difficultySection}>
            <Text style={styles.sectionTitle}>Dificultad</Text>
            <View style={styles.difficultyTabs}>
              {difficulties.map(difficulty => (
                <TouchableOpacity
                  key={difficulty.level}
                  style={[
                    styles.difficultyTab,
                    selectedDifficulty === difficulty.level && styles.difficultyTabSelected,
                    selectedDifficulty === difficulty.level && {
                      backgroundColor: difficulty.color,
                    },
                  ]}
                  onPress={() => setSelectedDifficulty(difficulty.level)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.difficultyTabIcon}>{difficulty.icon}</Text>
                  <Text
                    style={[
                      styles.difficultyTabText,
                      selectedDifficulty === difficulty.level && styles.difficultyTabTextSelected,
                    ]}
                  >
                    {difficulty.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedDiff && <Text style={styles.difficultyHint}>{selectedDiff.description}</Text>}
          </View>

          {/* Saved Game Section */}
          {hasSaved && (
            <Card elevated style={styles.savedGameCard}>
              <View style={styles.savedGameContent}>
                <Text style={styles.savedGameIcon}>💾</Text>
                <View style={styles.savedGameInfo}>
                  <Text style={styles.savedGameTitle}>Partida Guardada</Text>
                  <Text style={styles.savedGameSubtitle}>Continúa donde lo dejaste</Text>
                </View>
                <TouchableOpacity
                  style={styles.continueButton}
                  onPress={() => handleStartGame(true)}
                  activeOpacity={0.8}
                >
                  <Text style={styles.continueButtonText}>▶️</Text>
                </TouchableOpacity>
              </View>
            </Card>
          )}
        </ScrollView>

        {/* Fixed Bottom Action Area */}
        <View style={styles.bottomActionArea}>
          <TouchableOpacity
            style={[
              styles.primaryActionButton,
              { backgroundColor: selectedDiff?.color || colors.accent },
            ]}
            onPress={() => handleStartGame(false)}
            activeOpacity={0.8}
          >
            <Text style={styles.primaryActionIcon}>🎮</Text>
            <Text style={styles.primaryActionText}>
              {hasSaved ? 'Nueva Partida' : 'Comenzar Partida'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.7}
          >
            <Text style={styles.secondaryActionText}>⬅️ Volver</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: dimensions.spacing.lg,
    paddingBottom: dimensions.spacing.lg,
  },
  header: {
    alignItems: 'center',
    paddingTop: dimensions.spacing.lg,
    paddingBottom: dimensions.spacing.md,
  },
  title: {
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: dimensions.spacing.xs,
  },
  subtitle: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    marginBottom: dimensions.spacing.sm,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.md,
    marginTop: dimensions.spacing.xs,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  playerIcon: {
    fontSize: 16,
    marginRight: dimensions.spacing.xs,
  },
  playerName: {
    fontSize: typography.fontSize.sm,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  difficultySection: {
    marginTop: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.md,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    fontWeight: typography.fontWeight.bold,
    marginBottom: dimensions.spacing.md,
    textAlign: 'center',
  },
  difficultyTabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.xs,
    gap: dimensions.spacing.xs,
  },
  difficultyTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    gap: dimensions.spacing.xs,
  },
  difficultyTabSelected: {
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  difficultyTabIcon: {
    fontSize: 20,
  },
  difficultyTabText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  difficultyTabTextSelected: {
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  difficultyHint: {
    fontSize: typography.fontSize.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: dimensions.spacing.sm,
    fontStyle: 'italic',
  },
  savedGameCard: {
    marginTop: dimensions.spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.success,
  },
  savedGameContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: dimensions.spacing.md,
  },
  savedGameIcon: {
    fontSize: 32,
    marginRight: dimensions.spacing.md,
  },
  savedGameInfo: {
    flex: 1,
  },
  savedGameTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: dimensions.spacing.xs,
  },
  savedGameSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  continueButton: {
    backgroundColor: colors.success,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  continueButtonText: {
    fontSize: 24,
  },
  bottomActionArea: {
    backgroundColor: colors.background,
    paddingHorizontal: dimensions.spacing.lg,
    paddingTop: dimensions.spacing.md,
    paddingBottom: dimensions.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: dimensions.spacing.lg,
    paddingHorizontal: dimensions.spacing.xl,
    borderRadius: dimensions.borderRadius.lg,
    marginBottom: dimensions.spacing.sm,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  primaryActionIcon: {
    fontSize: 24,
    marginRight: dimensions.spacing.sm,
  },
  primaryActionText: {
    fontSize: typography.fontSize.lg,
    color: colors.white,
    fontWeight: typography.fontWeight.bold,
  },
  secondaryActionButton: {
    alignItems: 'center',
    paddingVertical: dimensions.spacing.sm,
  },
  secondaryActionText: {
    fontSize: typography.fontSize.md,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
});
