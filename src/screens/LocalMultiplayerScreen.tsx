import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { TeamDiagram } from '../components/game/TeamDiagram';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { typography } from '../constants/typography';
import type { JugarStackScreenProps } from '../types/navigation';

export function LocalMultiplayerScreen({ navigation }: JugarStackScreenProps<'LocalMultiplayer'>) {
  const [playerCount] = useState(4); // Always 4 players by default
  const [playerNames, setPlayerNames] = useState(['', '', '', '']);
  const [showCustomNames, setShowCustomNames] = useState(false);

  const getDefaultNames = () => {
    return ['Jugador 1', 'Jugador 2', 'Jugador 3', 'Jugador 4'];
  };

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const startGameQuick = () => {
    // Use default names for quick start
    const defaultNames = getDefaultNames();
    navigation.navigate('Game', {
      gameMode: 'local',
      playerNames: defaultNames,
    });
  };

  const startGameCustom = () => {
    // Use custom names or default if empty
    const finalNames = playerNames.map((name, index) => name.trim() || `Jugador ${index + 1}`);

    navigation.navigate('Game', {
      gameMode: 'local',
      playerNames: finalNames,
    });
  };

  const displayNames = showCustomNames
    ? playerNames.map((name, index) => name || `Jugador ${index + 1}`)
    : getDefaultNames();

  return (
    <ScreenContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <Text style={styles.icon}>📱</Text>
          <Text style={styles.title}>Juego Local</Text>
          <Text style={styles.subtitle}>Pasa el dispositivo entre jugadores</Text>
        </View>

        {!showCustomNames ? (
          <>
            {/* Quick Start Section */}
            <View style={styles.quickStartSection}>
              <TeamDiagram playerNames={displayNames} playerCount={4} />

              <Button onPress={startGameQuick} style={styles.quickStartButton} variant="primary">
                <Text style={styles.buttonIcon}>🎮</Text>
                <Text style={styles.buttonText}>Jugar Ahora</Text>
              </Button>

              <TouchableOpacity
                style={styles.customizeButton}
                onPress={() => setShowCustomNames(true)}
              >
                <Text style={styles.customizeIcon}>✏️</Text>
                <Text style={styles.customizeText}>Personalizar nombres</Text>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          <>
            {/* Custom Names Section */}
            <View style={styles.customSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Personalizar Jugadores</Text>
                <TouchableOpacity
                  onPress={() => setShowCustomNames(false)}
                  style={styles.backButton}
                >
                  <Text style={styles.backButtonText}>← Volver</Text>
                </TouchableOpacity>
              </View>

              <TeamDiagram playerNames={displayNames} playerCount={4} />

              <View style={styles.playersContainer}>
                {playerNames.map((name, index) => {
                  const teamNumber = index % 2 === 0 ? 1 : 2;
                  const teamColor = teamNumber === 1 ? '#4FC3F7' : '#FF7043';

                  return (
                    <View key={index} style={styles.playerInputContainer}>
                      <View style={styles.playerInputHeader}>
                        <View style={styles.playerInfo}>
                          <View
                            style={[
                              styles.teamBadge,
                              { backgroundColor: teamColor + '20', borderColor: teamColor },
                            ]}
                          >
                            <Text style={[styles.teamBadgeText, { color: teamColor }]}>
                              Equipo {teamNumber}
                            </Text>
                          </View>
                          <Text style={styles.playerLabel}>Jugador {index + 1}</Text>
                        </View>
                      </View>
                      <TextInput
                        style={[styles.nameInput, { borderColor: teamColor }]}
                        value={name}
                        onChangeText={text => handlePlayerNameChange(index, text)}
                        placeholder={`Jugador ${index + 1}`}
                        placeholderTextColor={colors.textMuted}
                        maxLength={20}
                      />
                    </View>
                  );
                })}
              </View>

              <Button onPress={startGameCustom} style={styles.startButton} variant="primary">
                <Text style={styles.buttonIcon}>🎮</Text>
                <Text style={styles.buttonText}>Comenzar Partida</Text>
              </Button>
            </View>
          </>
        )}

        {/* Game Rules Info */}
        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>📖 Cómo funciona</Text>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>•</Text>
            <Text style={styles.infoText}>
              Pasa el dispositivo al siguiente jugador después de cada turno
            </Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>•</Text>
            <Text style={styles.infoText}>Los jugadores 1 y 3 forman el equipo azul</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>•</Text>
            <Text style={styles.infoText}>Los jugadores 2 y 4 forman el equipo naranja</Text>
          </View>
          <View style={styles.infoItem}>
            <Text style={styles.infoBullet}>•</Text>
            <Text style={styles.infoText}>
              El objetivo es llegar a 101 puntos antes que el otro equipo
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button variant="secondary" onPress={() => navigation.goBack()} style={styles.button}>
            Volver al menú
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
  titleContainer: {
    alignItems: 'center',
    marginTop: dimensions.spacing.xl,
    marginBottom: dimensions.spacing.xl,
  },
  icon: {
    fontSize: 48,
    marginBottom: dimensions.spacing.sm,
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
    textAlign: 'center',
  },
  quickStartSection: {
    paddingHorizontal: dimensions.spacing.lg,
  },
  quickStartButton: {
    minHeight: dimensions.touchTarget.large,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: dimensions.spacing.sm,
    marginBottom: dimensions.spacing.md,
  },
  buttonIcon: {
    fontSize: 20,
  },
  buttonText: {
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
  },
  customizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.md,
  },
  customizeIcon: {
    fontSize: 16,
  },
  customizeText: {
    fontSize: typography.fontSize.md,
    color: colors.accent,
    fontWeight: typography.fontWeight.medium,
  },
  customSection: {
    paddingHorizontal: dimensions.spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.text,
    fontWeight: typography.fontWeight.bold,
  },
  backButton: {
    paddingVertical: dimensions.spacing.xs,
    paddingHorizontal: dimensions.spacing.sm,
  },
  backButtonText: {
    fontSize: typography.fontSize.sm,
    color: colors.accent,
    fontWeight: typography.fontWeight.medium,
  },
  playersContainer: {
    marginBottom: dimensions.spacing.xl,
  },
  playerInputContainer: {
    marginBottom: dimensions.spacing.md,
  },
  playerInputHeader: {
    marginBottom: dimensions.spacing.sm,
  },
  playerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: dimensions.spacing.sm,
  },
  teamBadge: {
    paddingHorizontal: dimensions.spacing.sm,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.sm,
    borderWidth: 1,
  },
  teamBadgeText: {
    fontSize: typography.fontSize.xs,
    fontWeight: typography.fontWeight.semibold,
  },
  playerLabel: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontWeight: typography.fontWeight.medium,
  },
  nameInput: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    borderWidth: 2,
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    fontSize: typography.fontSize.md,
    color: colors.text,
    minHeight: dimensions.touchTarget.comfortable,
  },
  startButton: {
    minHeight: dimensions.touchTarget.large,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: dimensions.spacing.sm,
  },
  infoSection: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    marginTop: dimensions.spacing.xl,
    marginHorizontal: dimensions.spacing.lg,
  },
  infoTitle: {
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: dimensions.spacing.md,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: dimensions.spacing.sm,
  },
  infoBullet: {
    fontSize: typography.fontSize.md,
    color: colors.accent,
    marginRight: dimensions.spacing.sm,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: typography.fontSize.sm * 1.5,
  },
  buttonContainer: {
    marginTop: dimensions.spacing.xl,
    marginBottom: dimensions.spacing.xxl,
    paddingHorizontal: dimensions.spacing.lg,
  },
  button: {
    minHeight: dimensions.touchTarget.comfortable,
  },
});
