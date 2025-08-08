import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Alert,
} from 'react-native';
import { ScreenContainer } from '../components/ScreenContainer';
import { Button } from '../components/Button';
import { colors } from '../constants/colors';
import { dimensions } from '../constants/dimensions';
import { typography } from '../constants/typography';
import type { JugarStackScreenProps } from '../types/navigation';

export function LocalMultiplayerScreen({
  navigation,
}: JugarStackScreenProps<'LocalMultiplayer'>) {
  const [playerCount, setPlayerCount] = useState(4);
  const [playerNames, setPlayerNames] = useState(['', '', '', '']);
  const [selectedDealer, setSelectedDealer] = useState<number | null>(null);

  const handlePlayerNameChange = (index: number, name: string) => {
    const newNames = [...playerNames];
    newNames[index] = name;
    setPlayerNames(newNames);
  };

  const selectRandomDealer = () => {
    const activePlayers = playerNames
      .slice(0, playerCount)
      .map((name, index) => ({ name: name || `Jugador ${index + 1}`, index }))
      .filter(p => p.name.trim());

    if (activePlayers.length < playerCount) {
      Alert.alert(
        'Nombres incompletos',
        'Por favor, introduce todos los nombres de los jugadores',
      );
      return;
    }

    const randomIndex = Math.floor(Math.random() * playerCount);
    setSelectedDealer(randomIndex);
    Alert.alert(
      '¡Dealer seleccionado!',
      `${
        playerNames[randomIndex] || `Jugador ${randomIndex + 1}`
      } será el dealer`,
    );
  };

  const startGame = () => {
    const activePlayers = playerNames.slice(0, playerCount);
    const hasAllNames = activePlayers.every(name => name.trim());

    if (!hasAllNames) {
      Alert.alert(
        'Nombres incompletos',
        'Por favor, introduce todos los nombres de los jugadores',
      );
      return;
    }

    if (selectedDealer === null) {
      Alert.alert(
        'Dealer no seleccionado',
        'Por favor, selecciona quién será el dealer',
      );
      return;
    }

    // Fill empty slots with default names
    const finalNames = activePlayers.map(
      (name, index) => name.trim() || `Jugador ${index + 1}`,
    );

    navigation.navigate('Game', {
      gameMode: 'local',
      playerNames: finalNames,
    });
  };

  const getTeamInfo = (playerIndex: number) => {
    if (playerCount === 2) {
      return playerIndex === 0 ? 'Equipo 1' : 'Equipo 2';
    }
    // In 4-player Guiñote, players 0&2 are teammates, 1&3 are teammates
    return playerIndex % 2 === 0 ? 'Equipo 1 (🟦)' : 'Equipo 2 (🟥)';
  };

  return (
    <ScreenContainer>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Paso y Juego</Text>
          <Text style={styles.subtitle}>
            Configura los jugadores para la partida local
          </Text>
        </View>

        <View style={styles.content}>
          {/* Player Count Selection */}
          <View style={styles.playerCountContainer}>
            <Text style={styles.sectionTitle}>Número de jugadores</Text>
            <View style={styles.playerCountButtons}>
              <Button
                onPress={() => setPlayerCount(2)}
                variant={playerCount === 2 ? 'primary' : 'secondary'}
                style={styles.countButton}
              >
                2 Jugadores
              </Button>
              <Button
                onPress={() => setPlayerCount(4)}
                variant={playerCount === 4 ? 'primary' : 'secondary'}
                style={styles.countButton}
              >
                4 Jugadores
              </Button>
            </View>
            {playerCount === 2 && (
              <Text style={styles.modeInfo}>
                ⚠️ Modo simplificado: cada jugador controla dos manos
              </Text>
            )}
          </View>

          {/* Player Names Input */}
          <View style={styles.playersContainer}>
            <Text style={styles.sectionTitle}>Nombres de los jugadores</Text>
            {playerNames.slice(0, playerCount).map((name, index) => (
              <View key={index} style={styles.playerInputContainer}>
                <View style={styles.playerInputHeader}>
                  <Text style={styles.playerLabel}>
                    Jugador {index + 1} - {getTeamInfo(index)}
                  </Text>
                  {selectedDealer === index && (
                    <Text style={styles.dealerBadge}>DEALER</Text>
                  )}
                </View>
                <TextInput
                  style={styles.nameInput}
                  value={name}
                  onChangeText={text => handlePlayerNameChange(index, text)}
                  placeholder={`Jugador ${index + 1}`}
                  placeholderTextColor={colors.textMuted}
                  maxLength={20}
                />
              </View>
            ))}
          </View>

          {/* Team Info */}
          <View style={styles.teamInfoContainer}>
            <Text style={styles.sectionTitle}>Información de equipos</Text>
            <Text style={styles.teamInfo}>
              En Guiñote, los equipos son fijos:
            </Text>
            {playerCount === 4 ? (
              <>
                <Text style={styles.teamDetail}>
                  🟦 Equipo 1: Jugadores 1 y 3 (enfrentados)
                </Text>
                <Text style={styles.teamDetail}>
                  🟥 Equipo 2: Jugadores 2 y 4 (enfrentados)
                </Text>
              </>
            ) : (
              <Text style={styles.teamDetail}>
                Cada jugador forma su propio equipo
              </Text>
            )}
          </View>

          {/* Dealer Selection */}
          <View style={styles.dealerContainer}>
            <Text style={styles.sectionTitle}>Selección del dealer</Text>
            <Text style={styles.dealerInfo}>
              El dealer reparte las cartas. El jugador a su derecha empieza.
            </Text>
            <Button
              onPress={selectRandomDealer}
              variant="secondary"
              style={styles.dealerButton}
            >
              🎲 Seleccionar Dealer al Azar
            </Button>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <Button onPress={startGame} style={styles.startButton}>
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
  },
  playerCountContainer: {
    marginBottom: dimensions.spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
    marginBottom: dimensions.spacing.md,
  },
  playerCountButtons: {
    flexDirection: 'row',
    gap: dimensions.spacing.md,
  },
  countButton: {
    flex: 1,
    minHeight: dimensions.touchTarget.comfortable,
  },
  modeInfo: {
    fontSize: typography.fontSize.sm,
    color: colors.warning,
    marginTop: dimensions.spacing.md,
    fontStyle: 'italic',
  },
  playersContainer: {
    marginBottom: dimensions.spacing.xl,
  },
  playerInputContainer: {
    marginBottom: dimensions.spacing.lg,
  },
  playerInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: dimensions.spacing.sm,
  },
  playerLabel: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    fontWeight: typography.fontWeight.semibold,
  },
  dealerBadge: {
    backgroundColor: colors.accent,
    color: colors.white,
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.xs,
    borderRadius: dimensions.borderRadius.sm,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
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
  teamInfoContainer: {
    backgroundColor: colors.surface,
    borderRadius: dimensions.borderRadius.lg,
    padding: dimensions.spacing.lg,
    marginBottom: dimensions.spacing.xl,
    borderWidth: 1,
    borderColor: colors.secondary,
  },
  teamInfo: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    marginBottom: dimensions.spacing.md,
  },
  teamDetail: {
    fontSize: typography.fontSize.md,
    color: colors.text,
    marginBottom: dimensions.spacing.sm,
  },
  dealerContainer: {
    marginBottom: dimensions.spacing.xl,
  },
  dealerInfo: {
    fontSize: typography.fontSize.md,
    color: colors.textMuted,
    marginBottom: dimensions.spacing.md,
  },
  dealerButton: {
    minHeight: dimensions.touchTarget.comfortable,
  },
  buttonContainer: {
    marginBottom: dimensions.spacing.xxl,
    marginTop: dimensions.spacing.xl,
  },
  startButton: {
    minHeight: dimensions.touchTarget.large,
  },
  button: {
    marginTop: dimensions.spacing.md,
  },
});
