import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
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
  const [practiceMode, setPracticeMode] = useState(false);

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
            <View style={styles.infoStats}>
              <View style={styles.statItem}>
                <Text style={styles.statLabel}>Tasa de Victoria IA</Text>
                <Text style={styles.statValue}>{selectedDiff.winRate}</Text>
              </View>
            </View>
          </Card>
        )}

        {/* Practice Mode */}
        <Card style={styles.practiceCard}>
          <View style={styles.practiceHeader}>
            <View style={styles.practiceLeft}>
              <Text style={styles.practiceIcon}>🎓</Text>
              <View>
                <Text style={styles.practiceTitle}>Modo Práctica</Text>
                <Text style={styles.practiceSubtitle}>
                  Aprende con ayuda visual
                </Text>
              </View>
            </View>
            <Switch
              value={practiceMode}
              onValueChange={setPracticeMode}
              trackColor={{
                false: colors.secondary,
                true: colors.accent,
              }}
              thumbColor={practiceMode ? colors.white : colors.textMuted}
            />
          </View>
          {practiceMode && (
            <View style={styles.practiceFeatures}>
              <Text style={styles.featureItem}>✓ Ver cartas de todos</Text>
              <Text style={styles.featureItem}>✓ Deshacer jugadas</Text>
              <Text style={styles.featureItem}>✓ Explicaciones de IA</Text>
              <Text style={styles.featureItem}>✓ Consejos en tiempo real</Text>
            </View>
          )}
        </Card>

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
                practiceMode,
              })
            }
            icon={practiceMode ? '📚' : '🎮'}
            style={styles.mainButton}
          >
            {practiceMode ? 'Comenzar Práctica' : 'Comenzar Partida'}
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
  infoStats: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: dimensions.spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  statValue: {
    fontSize: typography.fontSize.lg,
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
  },
  practiceCard: {
    marginVertical: dimensions.spacing.lg,
    backgroundColor: colors.surface,
  },
  practiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.md,
  },
  practiceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  practiceIcon: {
    fontSize: 28,
    marginRight: dimensions.spacing.md,
  },
  practiceTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    fontWeight: typography.fontWeight.bold,
  },
  practiceSubtitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
  },
  practiceFeatures: {
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: dimensions.spacing.md,
  },
  featureItem: {
    fontSize: typography.fontSize.md,
    color: colors.cantarGreen,
    marginVertical: dimensions.spacing.xs,
  },
  buttonContainer: {
    marginTop: dimensions.spacing.xl,
    paddingHorizontal: dimensions.spacing.sm,
  },
  mainButton: {
    marginBottom: dimensions.spacing.md,
  },
});
