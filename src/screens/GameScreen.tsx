import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Text,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GameTable } from '../components/game/GameTable';
import { SpanishCard } from '../components/game/SpanishCard';
import type { JugarStackScreenProps } from '../types/navigation';
import { useGameState } from '../hooks/useGameState';
import { canCantar } from '../utils/gameLogic';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { dimensions } from '../constants/dimensions';
import { useSounds } from '../hooks/useSounds';

export function GameScreen({
  navigation,
  route,
}: JugarStackScreenProps<'Game'>) {
  const { playerName } = route.params;

  const {
    gameState,
    playCard,
    cantar,
    cambiar7,
    getCurrentPlayerHand,
    isPlayerTurn,
  } = useGameState({ playerName: playerName || 'Tú' });

  const [showLastTrick, setShowLastTrick] = useState(false);
  const { playCardSound, playTurnSound, playVictorySound, playDefeatSound } =
    useSounds();

  // Hide tab bar when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' },
        });
      }
      return () => {
        if (parent) {
          parent.setOptions({
            tabBarStyle: {
              backgroundColor: '#2C3E50',
              borderTopColor: '#34495E',
              borderTopWidth: 1,
            },
          });
        }
      };
    }, [navigation]),
  );

  // Play turn sound when it's player's turn
  React.useEffect(() => {
    if (gameState && isPlayerTurn()) {
      playTurnSound();
    }
  }, [gameState?.currentPlayerIndex, gameState, isPlayerTurn, playTurnSound]);

  // Play game over sound
  React.useEffect(() => {
    if (gameState?.phase === 'gameOver') {
      const winningTeam = gameState.teams.find(t => t.score >= 101);
      const playerTeam = gameState.teams.find(t =>
        t.playerIds.includes(gameState.players[0].id),
      );
      const playerWon = winningTeam?.id === playerTeam?.id;

      if (playerWon) {
        playVictorySound();
      } else {
        playDefeatSound();
      }
    }
  }, [gameState?.phase, gameState, playVictorySound, playDefeatSound]);

  if (!gameState) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Preparando mesa...</Text>
      </View>
    );
  }

  // Map game state to GameTable props format
  const players = gameState.players.map(player => {
    const hand = gameState.hands.get(player.id) || [];
    return {
      name: player.name,
      ranking: player.ranking,
      avatar: player.avatar,
      cards: hand.map(card => ({ suit: card.suit, value: card.value })),
    };
  });

  const handleCardPlay = (cardIndex: number) => {
    if (!isPlayerTurn()) return;

    const playerHand = getCurrentPlayerHand();
    const cardToPlay = playerHand[cardIndex];
    if (!cardToPlay) return;

    playCard(cardToPlay.id);
    playCardSound();
  };

  const handleCantar = () => {
    if (!isPlayerTurn()) return;

    const playerHand = getCurrentPlayerHand();
    const playerTeam = gameState.teams.find(t =>
      t.playerIds.includes(gameState.players[0].id),
    );

    if (!playerTeam) return;

    const cantableSuits = canCantar(
      playerHand,
      gameState.trumpSuit,
      playerTeam.cantes,
    );

    // For now, cantar the first available suit
    if (cantableSuits.length > 0) {
      cantar(cantableSuits[0]);
    }
  };

  const handleCambiar7 = () => {
    if (!isPlayerTurn()) return;
    cambiar7();
  };

  const handleSalir = () => {
    navigation.goBack();
  };

  // Show game over screen
  if (gameState.phase === 'gameOver') {
    const winningTeam = gameState.teams.find(t => t.score >= 101);
    const playerTeam = gameState.teams.find(t =>
      t.playerIds.includes(gameState.players[0].id),
    );
    const playerWon = winningTeam?.id === playerTeam?.id;
    const team1 = gameState.teams[0];
    const team2 = gameState.teams[1];

    return (
      <View style={[styles.container, styles.gameOverContainer]}>
        <StatusBar hidden />
        <Text
          style={[
            styles.gameOverTitle,
            playerWon ? styles.victoryTitle : styles.defeatTitle,
          ]}
        >
          {playerWon ? '¡VICTORIA!' : 'DERROTA'}
        </Text>

        <View style={styles.scoreBreakdown}>
          <View style={styles.teamScore}>
            <Text style={styles.teamLabel}>Nosotros</Text>
            <Text style={styles.finalScore}>{team1.score}</Text>
            {team1.cantes.length > 0 && (
              <Text style={styles.canteInfo}>
                Cantes: {team1.cantes.reduce((sum, c) => sum + c.points, 0)}
              </Text>
            )}
          </View>

          <Text style={styles.scoreSeparator}>-</Text>

          <View style={styles.teamScore}>
            <Text style={styles.teamLabel}>Ellos</Text>
            <Text style={styles.finalScore}>{team2.score}</Text>
            {team2.cantes.length > 0 && (
              <Text style={styles.canteInfo}>
                Cantes: {team2.cantes.reduce((sum, c) => sum + c.points, 0)}
              </Text>
            )}
          </View>
        </View>

        <View style={styles.gameOverButtons}>
          <TouchableOpacity
            style={[styles.gameOverButton, styles.newGameButton]}
            onPress={() => navigation.navigate('JugarHome')}
          >
            <Text style={styles.newGameButtonText}>JUGAR DE NUEVO</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.gameOverButton, styles.exitButton]}
            onPress={() => navigation.navigate('Home')}
          >
            <Text style={styles.exitButtonText}>SALIR</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <GameTable
        players={
          players as [
            (typeof players)[0],
            (typeof players)[1],
            (typeof players)[2],
            (typeof players)[3],
          ]
        }
        currentPlayerIndex={gameState.currentPlayerIndex}
        trumpCard={{
          suit: gameState.trumpSuit,
          value: gameState.trumpCard.value,
        }}
        currentTrick={gameState.currentTrick.map(tc => ({
          playerId: tc.playerId,
          card: { suit: tc.card.suit, value: tc.card.value },
        }))}
        onCardPlay={handleCardPlay}
        onCantar={handleCantar}
        onCambiar7={handleCambiar7}
        onSalir={handleSalir}
      />
      {/* Score display */}
      <View style={styles.scoreContainer}>
        <Text style={styles.scoreText}>
          Nosotros: {gameState.teams[0].score} | Ellos:{' '}
          {gameState.teams[1].score}
        </Text>
      </View>

      {/* Last trick button */}
      {gameState.lastTrick && gameState.lastTrick.length > 0 && (
        <TouchableOpacity
          style={styles.lastTrickButton}
          onPress={() => setShowLastTrick(true)}
        >
          <Text style={styles.lastTrickButtonText}>Ver última baza</Text>
        </TouchableOpacity>
      )}

      {/* Last trick modal */}
      <Modal
        visible={showLastTrick}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLastTrick(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowLastTrick(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Última Baza</Text>
            <View style={styles.trickCards}>
              {gameState.lastTrick?.map((trickCard, index) => {
                const player = gameState.players.find(
                  p => p.id === trickCard.playerId,
                );
                return (
                  <View key={index} style={styles.trickCardContainer}>
                    <SpanishCard
                      card={trickCard.card}
                      size="medium"
                      style={styles.modalCard}
                    />
                    <Text style={styles.playerLabel}>{player?.name}</Text>
                  </View>
                );
              })}
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowLastTrick(false)}
            >
              <Text style={styles.closeButtonText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  loadingText: {
    color: colors.text,
    fontSize: typography.fontSize.lg,
  },
  gameOverContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.background,
  },
  gameOverTitle: {
    fontSize: typography.fontSize.xxxl * 1.2,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 30,
    textAlign: 'center',
  },
  victoryTitle: {
    color: colors.accent,
    textShadowColor: 'rgba(212, 165, 116, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  defeatTitle: {
    color: colors.error,
    textShadowColor: 'rgba(207, 102, 121, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
  },
  scoreBreakdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 50,
    gap: 30,
  },
  teamScore: {
    alignItems: 'center',
  },
  teamLabel: {
    color: colors.text,
    fontSize: typography.fontSize.lg,
    marginBottom: 10,
  },
  finalScore: {
    color: colors.white,
    fontSize: typography.fontSize.xxxl * 1.5,
    fontWeight: typography.fontWeight.bold,
  },
  canteInfo: {
    color: colors.accent,
    fontSize: typography.fontSize.md,
    marginTop: 5,
  },
  scoreSeparator: {
    color: colors.text,
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
  },
  gameOverButtons: {
    gap: 20,
  },
  gameOverButton: {
    paddingHorizontal: Math.round(50 * dimensions.seniorScaleFactor),
    paddingVertical: Math.round(20 * dimensions.seniorScaleFactor),
    borderRadius: Math.round(30 * dimensions.seniorScaleFactor),
    minWidth: Math.round(280 * dimensions.seniorScaleFactor),
    minHeight: dimensions.touchTarget.large,
  },
  newGameButton: {
    backgroundColor: colors.accent,
  },
  newGameButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
  },
  exitButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.text,
  },
  exitButtonText: {
    color: colors.text,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  scoreContainer: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  scoreText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
  lastTrickButton: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    backgroundColor: colors.surface,
    paddingHorizontal: Math.round(20 * dimensions.seniorScaleFactor),
    paddingVertical: Math.round(12 * dimensions.seniorScaleFactor),
    borderRadius: Math.round(20 * dimensions.seniorScaleFactor),
    borderWidth: 2,
    borderColor: colors.accent,
    minHeight: dimensions.touchTarget.comfortable,
    minWidth: Math.round(120 * dimensions.seniorScaleFactor),
  },
  lastTrickButtonText: {
    color: colors.accent,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 30,
    alignItems: 'center',
    maxWidth: '90%',
    borderWidth: 2,
    borderColor: colors.accent,
  },
  modalTitle: {
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    color: colors.text,
    marginBottom: 20,
  },
  trickCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 15,
    marginBottom: 30,
  },
  trickCardContainer: {
    alignItems: 'center',
  },
  modalCard: {
    marginBottom: 10,
  },
  playerLabel: {
    color: colors.text,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  closeButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: Math.round(30 * dimensions.seniorScaleFactor),
    paddingVertical: Math.round(12 * dimensions.seniorScaleFactor),
    borderRadius: Math.round(20 * dimensions.seniorScaleFactor),
    minHeight: dimensions.touchTarget.comfortable,
    minWidth: Math.round(100 * dimensions.seniorScaleFactor),
  },
  closeButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
});
