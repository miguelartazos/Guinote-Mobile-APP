import React, { useState, useRef } from 'react';
import { View, StyleSheet, StatusBar, Text, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GameTable } from '../components/game/GameTable';
import { CardDealingAnimation } from '../components/game/CardDealingAnimation';
import { GameEndCelebration } from '../components/game/GameEndCelebration';
import { MatchProgressIndicator } from '../components/game/MatchProgressIndicator';
import { PassDeviceOverlay } from '../components/game/PassDeviceOverlay';
import { CompactActionBar } from '../components/game/CompactActionBar';
import { GameModals } from '../components/game/GameModals';
import { AnimatedButton } from '../components/ui/AnimatedButton';
import { ScreenContainer } from '../components/ScreenContainer';
import { ConnectionStatus } from '../components/game/ConnectionStatus';
import { GameErrorBoundary } from '../components/game/GameErrorBoundary';
// import { VoiceMessaging } from '../components/game/VoiceMessaging'; // Disabled until online works
import { haptics } from '../utils/haptics';
import type { JugarStackScreenProps } from '../types/navigation';
import { useGameState } from '../hooks/useGameState';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';
import { useUnifiedGame } from '../hooks/useUnifiedGame';
import { canCantar, shouldStartVueltas } from '../utils/gameLogic';
import { colors } from '../constants/colors';
import { typography } from '../constants/typography';
import { dimensions } from '../constants/dimensions';
import { useSounds } from '../hooks/useSounds';
import { useGameSettings } from '../hooks/useGameSettings';
import { useGameStatistics } from '../hooks/useGameStatistics';
// Removed Convex statistics - causes errors in offline mode
// import { useConvexStatistics } from '../hooks/useConvexStatistics';

const RENUNCIO_REASONS = [
  {
    id: 'illegal_signal',
    text: 'Señas ilegales',
    description: 'Gestos o señales prohibidas',
  },
  {
    id: 'voice_info',
    text: 'Información por voz',
    description: 'Reveló información del juego',
  },
  {
    id: 'card_reveal',
    text: 'Mostró cartas',
    description: 'Enseñó cartas sin ser permitido',
  },
  {
    id: 'illegal_comment',
    text: 'Comentario prohibido',
    description: 'Comentó sobre cartas o estrategia',
  },
];

export function GameScreen({ navigation, route }: JugarStackScreenProps<'Game'>) {
  const { playerName, difficulty, gameMode, playerNames, roomId, roomCode } = route.params;
  const isLocalMultiplayer = gameMode === 'local';
  const isOnline = gameMode === 'friends' || gameMode === 'online';

  // Get user for online games
  const { user, isAuthenticated } = useUnifiedAuth();

  // Use appropriate game state hook based on game mode
  const gameStateHook =
    isOnline && roomId
      ? useUnifiedGame(roomId)
      : useGameState({
          playerName: playerName || user?.username || 'Tú',
          difficulty: difficulty === 'expert' ? 'hard' : (difficulty as any) || 'medium',
          playerNames: playerNames,
        });

  const {
    gameState,
    playCard,
    cantar,
    cambiar7,
    reorderPlayerHand,
    continueFromScoring,
    continueToNextPartida,
    declareVictory,
    declareRenuncio,
    getValidCardsForCurrentPlayer,
    isPlayerTurn,
    thinkingPlayer,
    isDealingComplete,
    completeDealingAnimation,
    completeTrickAnimation,
    isConnected,
    isLoading,
    networkError,
  } = gameStateHook as any;

  const [showLastTrick, setShowLastTrick] = useState(false);
  const [showDeclareVictory, setShowDeclareVictory] = useState(false);
  const [showRenuncio, setShowRenuncio] = useState(false);
  const [selectedRenuncioReason, setSelectedRenuncioReason] = useState('');
  const [showGameEndCelebration, setShowGameEndCelebration] = useState(false);
  const [showPassDevice, setShowPassDevice] = useState(false);
  const [lastPlayerIndex, setLastPlayerIndex] = useState<number | null>(null);
  const [gameStartTime] = useState(Date.now());

  // Track if we've already recorded this game to prevent infinite loop
  const gameRecordedRef = useRef(false);
  const lastRecordedGameIdRef = useRef<string | null>(null);

  // Handle network errors
  React.useEffect(() => {
    if (isOnline && networkError) {
      Alert.alert('Connection Error', networkError, [
        {
          text: 'OK',
          onPress: () => navigation.goBack(),
        },
      ]);
    }
  }, [isOnline, networkError, navigation]);

  const {
    playCardSound,
    playTurnSound,
    playVictorySound,
    playDefeatSound,
    playShuffleSound,
    playDealSound,
    playTrumpRevealSound,
  } = useSounds();
  const { settings } = useGameSettings();
  const { recordGame } = useGameStatistics();
  // Statistics recording removed for offline mode
  // Will be added back when online mode is properly implemented
  const recordGameResult = async () => {
    console.log('📊 Game statistics recording skipped (offline mode)');
  };
  // Audio hooks removed - these features were broken and deleted during cleanup

  // Hide tab bar when this screen is focused
  useFocusEffect(
    React.useCallback(() => {
      const parent = navigation.getParent();
      if (parent) {
        parent.setOptions({
          tabBarStyle: { display: 'none' },
        });
      }

      // Background music removed - audio system was broken

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

  // Show loading state for online games
  if (isOnline && isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer]}>
        <Text style={styles.loadingText}>Connecting to game...</Text>
        {roomCode && <Text style={styles.roomCode}>Room Code: {roomCode}</Text>}
      </View>
    );
  }

  // Play turn sound when it's player's turn + Handle pass device for local multiplayer
  React.useEffect(() => {
    if (!gameState) return;

    // For local multiplayer, show pass device overlay on turn change
    if (
      isLocalMultiplayer &&
      lastPlayerIndex !== null &&
      lastPlayerIndex !== gameState.currentPlayerIndex
    ) {
      const currentPlayer = gameState.players[gameState.currentPlayerIndex];
      if (!currentPlayer.isBot) {
        setShowPassDevice(true);
      }
    }

    // Update last player index
    setLastPlayerIndex(gameState.currentPlayerIndex);

    // Play turn sound for current device player
    if (!isLocalMultiplayer && isPlayerTurn()) {
      playTurnSound();
    } else if (isLocalMultiplayer && !gameState.players[gameState.currentPlayerIndex].isBot) {
      playTurnSound();
    }
  }, [
    gameState?.currentPlayerIndex,
    gameState,
    isPlayerTurn,
    playTurnSound,
    isLocalMultiplayer,
    lastPlayerIndex,
  ]);

  // Play game over sound and record statistics
  React.useEffect(() => {
    // Show celebration for partida/coto wins (scoring phase) or full match wins (gameOver phase)
    if (
      gameState?.phase === 'gameOver' ||
      (gameState?.phase === 'scoring' && gameState?.matchScore)
    ) {
      // Create a unique game session ID based on game start time and current state
      const gameSessionId = `${gameStartTime}-${gameState.teams[0].score}-${gameState.teams[1].score}`;

      // Check if we've already recorded this specific game (only for final game over)
      if (gameState.phase === 'gameOver' && lastRecordedGameIdRef.current === gameSessionId) {
        return; // Already recorded this game, skip
      }

      const winningTeam = gameState.teams.find(t => t.score >= 101);
      const playerTeam = gameState.teams.find(t => t.playerIds.includes(gameState.players[0].id));
      const playerWon = winningTeam?.id === playerTeam?.id;

      if (playerWon) {
        playVictorySound();
        haptics.success();
      } else {
        playDefeatSound();
      }
      setShowGameEndCelebration(true);

      // Record statistics only once per game session
      if (!gameRecordedRef.current) {
        gameRecordedRef.current = true;
        lastRecordedGameIdRef.current = gameSessionId;

        if (!isOnline) {
          // Offline games - local stats
          const playerScore = playerTeam?.score || 0;
          const partnerPlayer = gameState.players.find(
            p => p.teamId === playerTeam?.id && p.id !== gameState.players[0].id,
          );
          recordGame(
            playerWon,
            playerScore,
            partnerPlayer?.name || 'IA',
            difficulty === 'expert' ? 'hard' : (difficulty as any) || 'medium',
          ).catch(error => {
            console.error('Failed to record offline game stats:', error);
          });
        } else if (user && gameState.matchScore) {
          // Online games - Record stats for authenticated users
          const userId = user.id || user._id;
          if (userId) {
            recordGameResult(
              gameState,
              userId,
              gameMode as 'ranked' | 'casual' | 'friends',
              gameStartTime,
            ).catch(error => {
              console.error('Failed to record online game stats:', error);
            });
          }
        }
      }
    } else if (gameState?.phase === 'dealing' || gameState?.phase === 'playing') {
      // Reset the flag when a new game starts
      gameRecordedRef.current = false;
    }
  }, [
    gameState?.phase,
    gameState,
    playVictorySound,
    playDefeatSound,
    recordGame,
    recordGameResult,
    difficulty,
    isOnline,
    user,
    gameMode,
    gameStartTime,
  ]);

  if (!gameState) {
    return (
      <ScreenContainer orientation="landscape" style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Preparando mesa...</Text>
      </ScreenContainer>
    );
  }

  // Map game state to GameTable props format
  // In local multiplayer, rotate players so current player is always at bottom
  const getRotatedPlayers = () => {
    const allPlayers = gameState.players.map((player, index) => {
      const hand = gameState.hands.get(player.id) || [];

      // In local multiplayer, only show cards for the current player
      const showCards = isLocalMultiplayer
        ? index === gameState.currentPlayerIndex && !player.isBot
        : index === 0; // In single player, always show bottom player's cards

      return {
        id: player.id,
        name: player.name,
        ranking: player.ranking,
        avatar: player.avatar,
        cards: showCards
          ? hand.map(card => ({ suit: card.suit, value: card.value }))
          : hand.map(() => ({ suit: 'oros' as const, value: 1 as const })), // Dummy cards for hidden hands
      };
    });

    if (isLocalMultiplayer) {
      // Rotate array so current player is at index 0 (bottom position)
      const rotation = gameState.currentPlayerIndex;
      return [
        allPlayers[rotation],
        allPlayers[(rotation + 1) % 4],
        allPlayers[(rotation + 2) % 4],
        allPlayers[(rotation + 3) % 4],
      ];
    }

    return allPlayers;
  };

  const players = getRotatedPlayers();

  const handleCardPlay = (cardIndex: number) => {
    if (!isDealingComplete) return;

    // For local multiplayer, check if it's the current human player's turn
    if (isLocalMultiplayer) {
      const currentPlayer = gameState?.players[gameState.currentPlayerIndex];
      if (!currentPlayer || currentPlayer.isBot) return;
    } else {
      // Original single player check
      if (!isPlayerTurn()) return;
    }

    const currentPlayer = gameState?.players[gameState?.currentPlayerIndex];
    if (!currentPlayer) return;

    const playerHand = gameState?.hands.get(currentPlayer.id);
    if (!playerHand) return;

    const cardToPlay = playerHand[cardIndex];
    if (!cardToPlay) return;

    playCard(cardToPlay.id);
    playCardSound();

    // Audio accessibility removed - feature was broken
  };

  // Calculate valid card indices for the current player
  const getValidCardIndices = () => {
    if (gameState?.phase === 'dealing') {
      return undefined;
    }

    // For local multiplayer, check current human player
    if (isLocalMultiplayer) {
      const currentPlayer = gameState?.players[gameState.currentPlayerIndex];
      if (!currentPlayer || currentPlayer.isBot) return undefined;
    } else {
      // Original single player check
      if (!isPlayerTurn()) return undefined;
    }

    const currentPlayer = gameState?.players[gameState?.currentPlayerIndex];
    if (!currentPlayer) return undefined;

    const playerHand = gameState?.hands.get(currentPlayer.id) || [];
    const validCards = getValidCardsForCurrentPlayer();

    // Debug logging only in arrastre
    if (gameState.phase === 'arrastre' && validCards.length === 0) {
      console.error('❌ No valid cards in Arrastre phase! Debug info:', {
        phase: gameState.phase,
        currentTrickLength: gameState.currentTrick.length,
        playerHandSize: playerHand.length,
        trumpSuit: gameState.trumpSuit,
      });
    }

    // Map valid cards to their indices in the player's hand
    const validIndices = playerHand
      .map((card, index) => ({ card, index }))
      .filter(({ card }) => validCards.some(vc => vc.id === card.id))
      .map(({ index }) => index);

    return validIndices;
  };

  const handleCantar = () => {
    if (!isDealingComplete) return;

    // Check turn based on game mode
    if (isLocalMultiplayer) {
      const currentPlayer = gameState?.players[gameState.currentPlayerIndex];
      if (!currentPlayer || currentPlayer.isBot) return;
    } else {
      if (!isPlayerTurn()) return;
    }

    const currentPlayer = gameState?.players[gameState.currentPlayerIndex];
    if (!currentPlayer) return;

    const playerHand = gameState?.hands.get(currentPlayer.id) || [];
    const playerTeam = gameState.teams.find(t => t.playerIds.includes(currentPlayer.id));

    if (!playerTeam) return;

    const cantableSuits = canCantar(playerHand, gameState.trumpSuit, playerTeam.cantes);

    // For now, cantar the first available suit
    if (cantableSuits.length > 0) {
      cantar(cantableSuits[0]);
    }
  };

  const handleCambiar7 = () => {
    if (!isDealingComplete) return;

    // Check turn based on game mode
    if (isLocalMultiplayer) {
      const currentPlayer = gameState?.players[gameState.currentPlayerIndex];
      if (!currentPlayer || currentPlayer.isBot) return;
    } else {
      if (!isPlayerTurn()) return;
    }

    cambiar7();
  };

  const handleSalir = () => {
    Alert.alert('¿Salir del juego?', 'Se perderá el progreso actual de la partida.', [
      {
        text: 'Cancelar',
        style: 'cancel',
      },
      {
        text: 'Salir',
        style: 'destructive',
        onPress: () => navigation.goBack(),
      },
    ]);
  };

  const handleDeclareVictory = () => {
    setShowDeclareVictory(false);
    const success = declareVictory();
    if (success) {
      playVictorySound();
    } else {
      playDefeatSound();
    }
  };

  const handleRenuncio = () => {
    if (!selectedRenuncioReason) return;
    setShowRenuncio(false);
    declareRenuncio(selectedRenuncioReason);
    playDefeatSound();
    setSelectedRenuncioReason('');
  };

  // Show scoring screen (after each hand)
  if (gameState.phase === 'scoring') {
    const team1 = gameState.teams[0];
    const team2 = gameState.teams[1];
    const shouldPlayVueltas = shouldStartVueltas(gameState);

    return (
      <ScreenContainer orientation="landscape" style={styles.scoringContainer}>
        <StatusBar hidden />
        <Text style={styles.scoringTitle}>FIN DE LA MANO</Text>

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

        <Text style={styles.scoringInfo}>
          {shouldPlayVueltas
            ? 'Ningún equipo ha alcanzado 101 puntos. ¡Vamos a las VUELTAS!'
            : team1.score >= 101 && team1.cardPoints < 30
            ? 'Nosotros: 101+ puntos pero menos de 30 malas. ¡Continúa el juego!'
            : team2.score >= 101 && team2.cardPoints < 30
            ? 'Ellos: 101+ puntos pero menos de 30 malas. ¡Continúa el juego!'
            : team1.score >= 101
            ? '¡Nosotros ganamos la partida!'
            : '¡Ellos ganan la partida!'}
        </Text>

        {(team1.cardPoints < 30 || team2.cardPoints < 30) && (
          <Text style={styles.malasWarning}>
            ⚠️ Puntos de cartas - Nosotros: {team1.cardPoints} | Ellos: {team2.cardPoints}
          </Text>
        )}

        <AnimatedButton
          style={[styles.gameOverButton, styles.continueButton]}
          onPress={continueFromScoring}
          hapticType="medium"
        >
          <Text style={styles.continueButtonText}>
            {shouldPlayVueltas ? 'JUGAR VUELTAS' : 'CONTINUAR'}
          </Text>
        </AnimatedButton>
      </ScreenContainer>
    );
  }

  // Show game over screen
  if (gameState.phase === 'gameOver') {
    const winningTeam = gameState.teams.find(t => t.score >= 101);
    const playerTeam = gameState.teams.find(t => t.playerIds.includes(gameState.players[0].id));
    const playerWon = winningTeam?.id === playerTeam?.id;
    const team1 = gameState.teams[0];
    const team2 = gameState.teams[1];

    if (showGameEndCelebration) {
      // Determine celebration type based on match progress
      const matchScore = gameState.matchScore;
      let celebrationType: 'partida' | 'coto' | 'match' = 'partida';

      if (gameState.phase === 'gameOver') {
        celebrationType = 'match'; // Full match is complete
      } else if (matchScore && (matchScore.team1Cotos > 0 || matchScore.team2Cotos > 0)) {
        celebrationType = 'coto'; // A coto was just won
      }

      return (
        <GameEndCelebration
          isWinner={playerWon}
          finalScore={{ player: team1.score, opponent: team2.score }}
          onComplete={() => setShowGameEndCelebration(false)}
          playSound={playerWon ? playVictorySound : playDefeatSound}
          celebrationType={celebrationType}
          matchScore={matchScore}
          onContinue={celebrationType !== 'match' ? continueToNextPartida : undefined}
        />
      );
    }

    return (
      <ScreenContainer orientation="landscape" style={styles.gameOverContainer}>
        <StatusBar hidden />
        <Text style={[styles.gameOverTitle, playerWon ? styles.victoryTitle : styles.defeatTitle]}>
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
          <AnimatedButton
            style={[styles.gameOverButton, styles.newGameButton]}
            onPress={() => navigation.navigate('JugarHome')}
            hapticType="medium"
          >
            <Text style={styles.newGameButtonText}>JUGAR DE NUEVO</Text>
          </AnimatedButton>

          <TouchableOpacity
            style={[styles.gameOverButton, styles.exitButton]}
            onPress={() => navigation.navigate('JugarHome')}
          >
            <Text style={styles.exitButtonText}>SALIR</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <GameErrorBoundary
      gameState={gameState}
      onReset={() => {
        // Reset game state on error recovery
        navigation.goBack();
      }}
    >
      <ScreenContainer orientation="landscape" style={styles.gameContainer}>
        <StatusBar hidden />

        {/* Connection status for online games */}
        {isOnline && <ConnectionStatus />}

        {/* Voice messaging for online games - disabled until online works */}
        {/* {isOnline && (
          <VoiceMessaging
            roomId={roomId}
            gameMode={gameMode as 'online' | 'friends' | 'offline'}
          />
        )} */}

        {/* Card dealing animation */}
        {gameState?.phase === 'dealing' && (
          <CardDealingAnimation
            trumpCard={gameState.trumpCard}
            playerCards={players[0].cards}
            onComplete={completeDealingAnimation}
            playDealSound={playDealSound}
            playTrumpRevealSound={playTrumpRevealSound}
            playShuffleSound={playShuffleSound}
            firstPlayerIndex={gameState.currentPlayerIndex}
          />
        )}

        {/* Show match progress if we have match score */}
        {gameState.matchScore && (
          <View style={styles.matchProgressWrapper}>
            <MatchProgressIndicator matchScore={gameState.matchScore} compact />
          </View>
        )}

        <GameTable
          players={
            players as [
              (typeof players)[0],
              (typeof players)[1],
              (typeof players)[2],
              (typeof players)[3],
            ]
          }
          currentPlayerIndex={isLocalMultiplayer ? 0 : gameState.currentPlayerIndex}
          trumpCard={{
            suit: gameState.trumpSuit,
            value: gameState.trumpCard.value,
          }}
          currentTrick={gameState.currentTrick.map(tc => ({
            playerId: tc.playerId,
            card: { suit: tc.card.suit, value: tc.card.value },
          }))}
          onCardPlay={handleCardPlay}
          onCardReorder={reorderPlayerHand}
          onExitGame={handleSalir}
          onRenuncio={() => setShowRenuncio(true)}
          thinkingPlayerId={thinkingPlayer}
          tableColor={settings?.tableColor || 'green'}
          isDealing={gameState?.phase === 'dealing'}
          deckCount={gameState?.deck?.length || 0}
          validCardIndices={getValidCardIndices()}
          isVueltas={gameState.isVueltas}
          canDeclareVictory={gameState.canDeclareVictory}
          collectedTricks={gameState.collectedTricks}
          trickAnimating={gameState.trickAnimating}
          pendingTrickWinner={
            gameState.pendingTrickWinner
              ? {
                  playerId: gameState.pendingTrickWinner.playerId,
                  points: gameState.pendingTrickWinner.points,
                  cards: gameState.pendingTrickWinner.cards.map(c => ({
                    suit: c.suit,
                    value: c.value,
                  })),
                }
              : undefined
          }
          onCompleteTrickAnimation={completeTrickAnimation}
        />

        {/* Small corner score display during gameplay */}
        {gameState?.teams && gameState.phase === 'playing' && (
          <View style={styles.cornerScore}>
            <Text style={styles.cornerScoreText}>
              {gameState.teams[0].score} - {gameState.teams[1].score}
            </Text>
          </View>
        )}

        {/* Cantes display */}
        {(gameState.teams[0].cantes.length > 0 || gameState.teams[1].cantes.length > 0) && (
          <View style={styles.cantesContainer}>
            {gameState.teams[0].cantes.map((cante, idx) => {
              // Show if it's our team or if it's visible (Veinte)
              const showCante = true; // Always show our team's cantes
              if (showCante) {
                return (
                  <View key={`team0-cante-${idx}`} style={styles.canteItem}>
                    <Text style={styles.canteText}>
                      Nosotros: {cante.points === 40 ? 'Las 40' : '20'} en {cante.suit}
                    </Text>
                  </View>
                );
              }
              return null;
            })}
            {gameState.teams[1].cantes.map((cante, idx) => {
              // Show only if it's visible (Veinte = 20 points)
              if (cante.isVisible) {
                return (
                  <View key={`team1-cante-${idx}`} style={styles.canteItem}>
                    <Text style={styles.canteText}>Ellos: 20 en {cante.suit}</Text>
                  </View>
                );
              }
              return null;
            })}
          </View>
        )}

        {/* Compact action bar */}
        {gameState && isDealingComplete && (
          <CompactActionBar
            gameState={gameState}
            onCantar={handleCantar}
            onCambiar7={handleCambiar7}
            disabled={!isPlayerTurn() || thinkingPlayer !== null}
          />
        )}

        {/* Game modals */}
        {gameState && (
          <GameModals
            showLastTrick={showLastTrick}
            lastTrick={gameState.lastTrick?.map(tc => tc.card) || []}
            onCloseLastTrick={() => setShowLastTrick(false)}
            showDeclareVictory={showDeclareVictory}
            onCloseDeclareVictory={() => setShowDeclareVictory(false)}
            onConfirmVictory={handleDeclareVictory}
            showRenuncio={showRenuncio}
            selectedRenuncioReason={selectedRenuncioReason}
            onCloseRenuncio={() => {
              setShowRenuncio(false);
              setSelectedRenuncioReason('');
            }}
            onSelectRenuncioReason={setSelectedRenuncioReason}
            onConfirmRenuncio={handleRenuncio}
            renuncioReasons={RENUNCIO_REASONS}
          />
        )}

        {/* Pass Device Overlay for Local Multiplayer */}
        {isLocalMultiplayer && gameState && (
          <PassDeviceOverlay
            visible={showPassDevice}
            playerName={gameState.players[gameState.currentPlayerIndex].name}
            playerAvatar={gameState.players[gameState.currentPlayerIndex].avatar}
            onContinue={() => setShowPassDevice(false)}
            autoHideDelay={3000}
          />
        )}
      </ScreenContainer>
    </GameErrorBoundary>
  );
}

export default GameScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gameContainer: {
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  matchProgressWrapper: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 100,
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.tableGreen,
  },
  loadingText: {
    color: colors.text,
    fontSize: typography.fontSize.lg,
  },
  gameOverContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.tableGreen,
  },
  scoringContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.tableGreen,
  },
  scoringTitle: {
    fontSize: typography.fontSize.xxxl,
    fontWeight: typography.fontWeight.bold,
    color: colors.accent,
    marginBottom: 30,
    textAlign: 'center',
  },
  scoringInfo: {
    color: colors.text,
    fontSize: typography.fontSize.lg,
    textAlign: 'center',
    marginBottom: 40,
    paddingHorizontal: 20,
    lineHeight: 28,
  },
  malasWarning: {
    color: colors.warning,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    marginTop: -20,
    marginBottom: 30,
    fontStyle: 'italic',
  },
  continueButton: {
    backgroundColor: colors.accent,
  },
  continueButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
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
    top: 15,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: dimensions.spacing.lg,
    paddingVertical: dimensions.spacing.md,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.accent,
    zIndex: 10,
    gap: 5,
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
  vueltasText: {
    color: colors.gold,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.bold,
    backgroundColor: 'rgba(212, 175, 55, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  matchScoreContainer: {
    marginBottom: dimensions.spacing.xs,
  },
  matchScoreText: {
    color: colors.white,
    fontSize: typography.fontSize.sm,
    textAlign: 'center',
    fontWeight: typography.fontWeight.semibold,
  },
  currentGameScore: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    paddingTop: dimensions.spacing.xs,
  },
  warningText: {
    color: colors.error,
    fontSize: typography.fontSize.xs,
    fontStyle: 'italic',
  },
  cantesContainer: {
    position: 'absolute',
    bottom: 150,
    right: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: dimensions.spacing.md,
    paddingVertical: dimensions.spacing.sm,
    borderRadius: dimensions.borderRadius.md,
    borderWidth: 1,
    borderColor: colors.accent,
    zIndex: 10,
    maxWidth: 200,
  },
  canteItem: {
    marginVertical: 2,
  },
  canteText: {
    color: colors.accent,
    fontSize: typography.fontSize.sm,
    fontWeight: typography.fontWeight.medium,
  },
  declareVictoryButton: {
    right: 20,
    left: 'auto',
    backgroundColor: colors.accent,
    borderColor: colors.white,
  },
  declareVictoryButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  declareWarningText: {
    color: colors.text,
    fontSize: typography.fontSize.lg,
    textAlign: 'center',
    marginBottom: 20,
  },
  scoreEstimate: {
    backgroundColor: 'rgba(212, 165, 116, 0.1)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: 'center',
  },
  estimateLabel: {
    color: colors.textMuted,
    fontSize: typography.fontSize.md,
    marginBottom: 5,
  },
  estimateScore: {
    color: colors.accent,
    fontSize: typography.fontSize.xxl,
    fontWeight: typography.fontWeight.bold,
  },
  modalButtons: {
    gap: 15,
  },
  declareButton: {
    paddingHorizontal: Math.round(30 * dimensions.seniorScaleFactor),
    paddingVertical: Math.round(15 * dimensions.seniorScaleFactor),
    borderRadius: Math.round(25 * dimensions.seniorScaleFactor),
    minHeight: dimensions.touchTarget.comfortable,
    alignItems: 'center',
  },
  confirmDeclareButton: {
    backgroundColor: colors.accent,
  },
  confirmDeclareText: {
    color: colors.white,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  cancelDeclareButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: colors.text,
  },
  cancelDeclareText: {
    color: colors.text,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.semibold,
  },
  renuncioButton: {
    bottom: 80,
    backgroundColor: colors.error,
    borderColor: colors.white,
  },
  renuncioButtonText: {
    color: colors.white,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.bold,
  },
  renuncioWarningText: {
    color: colors.text,
    fontSize: typography.fontSize.md,
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  renuncioReasonsContainer: {
    marginBottom: 20,
  },
  renuncioReasonsTitle: {
    color: colors.text,
    fontSize: typography.fontSize.lg,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 10,
  },
  renuncioReason: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  renuncioReasonSelected: {
    borderColor: colors.accent,
    backgroundColor: 'rgba(212, 165, 116, 0.2)',
  },
  renuncioReasonText: {
    color: colors.text,
    fontSize: typography.fontSize.md,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: 4,
  },
  renuncioReasonDescription: {
    color: colors.textMuted,
    fontSize: typography.fontSize.sm,
  },
  confirmRenuncioButton: {
    backgroundColor: colors.error,
  },
  confirmRenuncioText: {
    color: colors.white,
    fontSize: typography.fontSize.xl,
    fontWeight: typography.fontWeight.bold,
  },
  disabledButton: {
    opacity: 0.5,
  },
  cornerScore: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    zIndex: 100,
  },
  cornerScoreText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: 'bold',
  },
  roomCode: {
    fontSize: typography.fontSize.lg,
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
  },
});
