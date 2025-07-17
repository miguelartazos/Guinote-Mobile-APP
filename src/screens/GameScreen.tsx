import React from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  Text,
  TouchableOpacity,
} from 'react-native';
import { GameTable } from '../components/game/GameTable';
import type { JugarStackScreenProps } from '../types/navigation';
import { useGameState } from '../hooks/useGameState';
import { canCantar } from '../utils/gameLogic';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';

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
    if (cardIndex >= 0 && cardIndex < playerHand.length) {
      playCard(playerHand[cardIndex].id);
    }
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

    return (
      <View style={[styles.container, styles.gameOverContainer]}>
        <StatusBar hidden />
        <Text style={styles.gameOverTitle}>
          {playerWon ? '¡Victoria!' : 'Derrota'}
        </Text>
        <Text style={styles.gameOverScore}>
          {gameState.teams[0].score} - {gameState.teams[1].score}
        </Text>
        <TouchableOpacity
          style={styles.newGameButton}
          onPress={() => navigation.navigate('JugarHome')}
        >
          <Text style={styles.newGameButtonText}>Nueva Partida</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      <GameTable
        players={players as [typeof players[0], typeof players[1], typeof players[2], typeof players[3]]}
        currentPlayerIndex={gameState.currentPlayerIndex}
        trumpCard={{
          suit: gameState.trumpSuit,
          value: gameState.trumpCard.value,
        }}
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
    color: colors.text,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
    marginBottom: 20,
  },
  gameOverScore: {
    color: colors.textSecondary,
    fontSize: typography.fontSize.xl,
    marginBottom: 40,
  },
  newGameButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 25,
  },
  newGameButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  scoreContainer: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 10,
    borderRadius: 10,
  },
  scoreText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.semibold,
  },
});
