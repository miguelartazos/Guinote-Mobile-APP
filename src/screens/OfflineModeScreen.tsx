import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { Card } from '../components/ui/Card';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { typography } from '../constants/typography';
import { useGameSettings } from '../hooks/useGameSettings';
import { useConvexAuth } from '../hooks/useConvexAuth';
import type { JugarStackScreenProps } from '../types/navigation';

type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'expert';

export function OfflineModeScreen({
  navigation,
}: JugarStackScreenProps<'OfflineMode'>) {
  const { settings } = useGameSettings();
  const { user } = useConvexAuth();
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<DifficultyLevel>('medium');

  useEffect(() => {
    if (settings?.difficulty) {
      setSelectedDifficulty(settings.difficulty as DifficultyLevel);
    }
  }, [settings]);

  const difficulties = [
    {
      level: 'easy' as const,
      title: 'Fácil',
      description: 'Perfecto para principiantes',
      icon: '🟢',
    },
    {
      level: 'medium' as const,
      title: 'Medio',
      description: 'Para jugadores casuales',
      icon: '🟡',
    },
    {
      level: 'hard' as const,
      title: 'Difícil',
      description: 'Para jugadores experimentados',
      icon: '🟠',
    },
    // Removed expert difficulty as it's not in the game types
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
              <Text style={styles.playerName}>
                {user.username || 'Jugador'}
              </Text>
            </View>
          )}
        </View>

        {/* Difficulty Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dificultad</Text>
          <View style={styles.difficultySelector}>
            {difficulties.map(difficulty => (
              <TouchableOpacity
                key={difficulty.level}
                style={[
                  styles.difficultyOption,
                  selectedDifficulty === difficulty.level &&
                    styles.difficultyOptionSelected,
                ]}
                onPress={() => setSelectedDifficulty(difficulty.level)}
                activeOpacity={0.7}
              >
                <Text style={styles.difficultyIcon}>{difficulty.icon}</Text>
                <Text
                  style={[
                    styles.difficultyText,
                    selectedDifficulty === difficulty.level &&
                      styles.difficultyTextSelected,
                  ]}
                >
                  {difficulty.title}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Difficulty Info Card */}
        {selectedDiff && (
          <Card elevated style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <Text style={styles.infoIcon}>{selectedDiff.icon}</Text>
              <View style={styles.infoContent}>
                <Text style={styles.infoTitle}>{selectedDiff.title}</Text>
                <Text style={styles.infoDescription}>
                  {selectedDiff.description}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            variant="primary"
            size="large"
            onPress={() =>
              navigation.navigate('Game', {
                gameMode: 'offline',
                difficulty: selectedDifficulty,
                playerName: user?.username || 'Jugador',
              })
            }
            icon="🎮"
            style={styles.mainButton}
          >
            Comenzar Partida
          </Button>

          <Button
            variant="secondary"
            onPress={() => navigation.goBack()}
            icon="⬅️"
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
    borderColor: colors.accent,
    backgroundColor: colors.secondary,
  },
  difficultyIcon: {
    fontSize: 32,
    marginBottom: dimensions.spacing.xs,
  },
  difficultyText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: typography.fontWeight.medium,
  },
  difficultyTextSelected: {
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
  },
  infoCard: {
    marginVertical: dimensions.spacing.md,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: dimensions.spacing.md,
  },
  infoIcon: {
    fontSize: 40,
    marginRight: dimensions.spacing.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: typography.fontSize.xl,
    color: colors.accent,
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
    marginBottom: dimensions.spacing.md,
  },
});
