import React, { useState, useRef } from 'react';
import { View, StyleSheet, StatusBar, Text, TouchableOpacity, Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { GameTable } from '../components/game/GameTable';
import { GameEndCelebration } from '../components/game/GameEndCelebration';
// import { MatchProgressIndicator } from '../components/game/MatchProgressIndicator'; // Hidden - not showing scores during gameplay
import { PassDeviceOverlay } from '../components/game/PassDeviceOverlay';
import { HandEndOverlay } from '../components/game/HandEndOverlay';
// import { VueltasScoreBanner } from '../components/game/VueltasScoreBanner'; // Hidden - not showing scores during gameplay
import { CompactActionBar } from '../components/game/CompactActionBar';
import { GameModals } from '../components/game/GameModals';
import { Toast, toastManager } from '../components/ui/Toast';
import { CanteAnimation } from '../components/game/CanteAnimation';
import { Cambiar7Animation } from '../components/game/Cambiar7Animation';
import { ScreenContainer } from '../components/ScreenContainer';
// import { ConnectionStatus } from '../components/game/ConnectionStatus';
import { GameErrorBoundary } from '../components/game/GameErrorBoundary';
// import { VoiceMessaging } from '../components/game/VoiceMessaging'; // Disabled until online works
import { haptics } from '../utils/haptics';
// Multiplayer components
import { ConnectionIndicator } from '../components/game/ConnectionIndicator';
import { TurnTimer } from '../components/game/TurnTimer';
import { PlayerAvatars } from '../components/game/PlayerAvatars';
import { SpectatorMode } from '../components/game/SpectatorMode';
import { useConnectionStatus } from '../hooks/useConnectionStatus';
import { useMultiplayerGame } from '../hooks/useMultiplayerGame';
import type { JugarStackScreenProps } from '../types/navigation';
import { useGameState } from '../hooks/useGameState';
import { useUnifiedAuth } from '../hooks/useUnifiedAuth';
import { canCantar, shouldStartVueltas, determineVueltasWinner } from '../utils/gameLogic';
import {
  detectNewCante,
  getPlayerPositionForIndex,
  createCanteAnimationData,
  shouldShowCanteAnimation,
} from '../utils/canteDetection';
import type { SpanishSuit } from '../types/cardTypes';
import type { TeamId } from '../types/game.types';
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
  const { playerName, difficulty, gameMode, playerNames, roomId } = route.params;
  const isLocalMultiplayer = gameMode === 'local';
  const isOnline = gameMode === 'friends' || gameMode === 'online';

  // Get user for online games
  const { user } = useUnifiedAuth();

  // Multiplayer hooks
  const connectionStatus = useConnectionStatus();
  const multiplayerGame = isOnline
    ? useMultiplayerGame({
        roomId,
        userId: user?.id,
        autoConnect: true,
        onGameAction: (payload: any) => {
          // Apply remote actions to local state engine
          if (!payload || !gameState) return;
          try {
            switch (payload.type) {
              case 'play_card':
                if (payload.cardId) {
                  playCard(payload.cardId);
                }
                break;
              case 'cambiar_7':
                cambiar7();
                break;
              case 'declare_cante':
                if (payload.suit) {
                  cantar(payload.suit as SpanishSuit);
                }
                break;
              default:
                break;
            }
          } catch (e) {
            console.error('[GameScreen] Failed to apply remote action:', e);
          }
        },
      })
    : null;

  // Use appropriate game state hook based on game mode
  // FIXME: Online mode is not fully implemented yet, always use offline mode
  const gameStateHook = useGameState({
    playerName: playerName || user?.username || 'Tú',
    difficulty: difficulty === 'expert' ? 'hard' : (difficulty as any) || 'medium',
    playerNames,
  });

  const {
    gameState,
    playCard,
    cantar,
    cambiar7,
    reorderPlayerHand,
    continueFromScoring,
    continueToNextPartida,
    startVueltas,
    declareVictory,
    declareRenuncio,
    getValidCardsForCurrentPlayer,
    isPlayerTurn,
    thinkingPlayer,
    isDealingComplete,
    completeDealingAnimation,
    completeTrickAnimation,
    completePostTrickDealing,
    onPostTrickCardLanded,
  } = gameStateHook;

  const [showLastTrick, setShowLastTrick] = useState(false);
  const [showDeclareVictory, setShowDeclareVictory] = useState(false);
  const [showRenuncio, setShowRenuncio] = useState(false);
  const [selectedRenuncioReason, setSelectedRenuncioReason] = useState('');
  const [showGameEndCelebration, setShowGameEndCelebration] = useState(false);
  // Track last known match progression to avoid showing celebration too early
  const lastProgressRef = useRef(0);
  const [showPassDevice, setShowPassDevice] = useState(false);
  const [showHandEndOverlay, setShowHandEndOverlay] = useState(false);
  const [lastPlayerIndex, setLastPlayerIndex] = useState<number | null>(null);
  // Prevent rapid double-clicks from playing multiple cards
  const isProcessingCardPlay = useRef(false);
  const [gameStartTime] = useState(Date.now());
  const autoVueltasTriggeredRef = useRef(false);
  const autoAdvanceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Multiplayer state
  const [turnTimeLeft, setTurnTimeLeft] = useState(30);
  const [isSpectating, setIsSpectating] = useState(false);
  const turnTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Cante animation state
  const [canteAnimation, setCanteAnimation] = useState<{
    active: boolean;
    canteType: 'veinte' | 'cuarenta';
    playerPosition: { x: number; y: number };
    playerName: string;
  } | null>(null);

  // Cambiar 7 animation state
  const [cambiar7Animation, setCambiar7Animation] = useState<{
    active: boolean;
    playerCard: { id: string; suit: SpanishSuit; value: number };
    trumpCard: { id: string; suit: SpanishSuit; value: number };
    playerName: string;
    playerIndex: number;
  } | null>(null);

  // Track if we've already recorded this game to prevent infinite loop
  const gameRecordedRef = useRef(false);
  const lastRecordedGameIdRef = useRef<string | null>(null);

  // Track last cante count to detect new cantes from any player
  const lastCanteCountRef = useRef(0);
  // Debounce cante animations to prevent race conditions
  const canteAnimationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  // Prevent multiple cante button presses
  const [isProcessingCante, setIsProcessingCante] = useState(false);

  // Toast state
  const [toastConfig, setToastConfig] = useState<{
    message: string;
    type?: 'success' | 'error' | 'warning' | 'info';
    duration?: number;
  } | null>(null);

  // Online flow is not active; network error handling removed

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
  // Audio hooks removed - these features were broken and deleted during cleanup

  // Setup toast manager
  React.useEffect(() => {
    toastManager.setShowToast(config => {
      setToastConfig(config);
    });
  }, []);

  // Detect cantes from any player (including bots)
  React.useEffect(() => {
    if (!gameState) return;

    const totalCantes = gameState.teams.reduce((sum, team) => sum + team.cantes.length, 0);

    if (shouldShowCanteAnimation(totalCantes, lastCanteCountRef.current)) {
      const newCante = detectNewCante(gameState.teams, lastCanteCountRef.current);

      if (newCante) {
        // Clear any pending animation
        if (canteAnimationTimeoutRef.current) {
          clearTimeout(canteAnimationTimeoutRef.current);
        }

        // Debounce the animation to prevent race conditions
        canteAnimationTimeoutRef.current = setTimeout(() => {
          const animationData = createCanteAnimationData(gameState, newCante);

          if (animationData) {
            const playerPosition = getPlayerPositionForIndex(animationData.playerIndex);

            // Show animation
            setCanteAnimation({
              active: true,
              canteType: animationData.points === 40 ? 'cuarenta' : 'veinte',
              playerPosition,
              playerName: animationData.playerName,
            });

            // Play sound
            playCardSound?.();
          }
        }, 100); // Small debounce delay
      }
    }

    // Update the ref
    if (lastCanteCountRef.current === 0 && totalCantes > 0) {
      // Initial load - don't trigger animations for existing cantes
      lastCanteCountRef.current = totalCantes;
    } else if (totalCantes !== lastCanteCountRef.current) {
      lastCanteCountRef.current = totalCantes;
    }

    return () => {
      if (canteAnimationTimeoutRef.current) {
        clearTimeout(canteAnimationTimeoutRef.current);
      }
    };
  }, [gameState?.teams, gameState?.currentPlayerIndex, playCardSound]);

  // Show hand end overlay when scoring phase starts and handle auto-advance
  React.useEffect(() => {
    if (!gameState) return;

    if (gameState.phase === 'scoring') {
      console.log('📊 [FIN DE MANO] Entering scoring phase', {
        team1Score: gameState.teams[0].score,
        team2Score: gameState.teams[1].score,
        isVueltas: gameState.isVueltas,
        showHandEndOverlay,
      });

      // Show the overlay for scoring
      setShowHandEndOverlay(true);
      console.log('📄 [FIN DE MANO] HandEndOverlay should now be visible');

      // Check if there's a winner
      const hasWinnerIdas = !gameState.isVueltas && gameState.teams.some(team => team.score >= 101);
      const hasWinnerVueltas = gameState.isVueltas && determineVueltasWinner(gameState) !== null;
      const hasWinner = hasWinnerIdas || hasWinnerVueltas;

      // Set up 8-second auto-advance timer for non-online games with a winner
      // Auto-advance after IDAS if team has 101+, or after VUELTAS if there's a winner
      if (hasWinner && !isOnline) {
        console.log('🏆 Winner detected, setting up auto-advance timer', {
          isVueltas: gameState.isVueltas,
          hasWinnerIdas,
          hasWinnerVueltas,
        });
        // Clear any existing timer
        if (autoAdvanceTimerRef.current) {
          clearTimeout(autoAdvanceTimerRef.current);
        }

        // Set new 8-second timer
        autoAdvanceTimerRef.current = setTimeout(() => {
          console.log('⏰ Auto-advancing from scoring phase after 8 seconds');
          continueFromScoring();
          autoAdvanceTimerRef.current = null;
        }, 8000);
      } else if (!hasWinner) {
        console.log('🔄 No winner yet - user must click Continuar to play vueltas');
      }
    } else {
      // Hide overlay when phase changes
      setShowHandEndOverlay(false);

      // Clear timer if phase changes
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (autoAdvanceTimerRef.current) {
        clearTimeout(autoAdvanceTimerRef.current);
        autoAdvanceTimerRef.current = null;
      }
    };
  }, [gameState?.phase, gameState?.teams, gameMode, continueFromScoring]);

  // Reset dealing complete flag when entering dealing phase (for vueltas)
  React.useEffect(() => {
    if (gameState?.phase === 'dealing' && gameState.isVueltas) {
      console.log('🎴 Vueltas dealing phase detected, ensuring animation plays');
      // The flag should already be false from continueFromScoring,
      // but this ensures it's definitely false when we need the animation
      if (isDealingComplete) {
        console.log('⚠️ Dealing was marked complete, resetting for vueltas animation');
        // This shouldn't happen, but if it does, we need to fix it
        // by calling the hook's internal state setter through the GameTable component
      }
    }
  }, [gameState?.phase, gameState?.isVueltas, isDealingComplete]);

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

    // Reset turn timer for online games
    if (isOnline) {
      setTurnTimeLeft(30);

      // Clear existing timer
      if (turnTimerRef.current) {
        clearInterval(turnTimerRef.current);
      }

      // Start new timer
      turnTimerRef.current = setInterval(() => {
        setTurnTimeLeft(prev => {
          if (prev <= 1) {
            // Auto-play when timer expires
            if (isPlayerTurn()) {
              const validCards = getValidCardsForCurrentPlayer();
              if (validCards.length > 0) {
                const cardId = validCards[0].id;
                playCard(cardId);
                // Broadcast to peers if online
                if (multiplayerGame?.isMultiplayerEnabled) {
                  multiplayerGame
                    .sendGameAction({
                      type: 'play_card',
                      cardId,
                      timestamp: Date.now(),
                      playerId: user?.id || 'anonymous',
                    } as any)
                    .catch(() => {});
                }
              }
            }
            return 30;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (turnTimerRef.current) {
        clearInterval(turnTimerRef.current);
      }
    };
  }, [
    gameState?.currentPlayerIndex,
    gameState,
    isPlayerTurn,
    playTurnSound,
    isLocalMultiplayer,
    lastPlayerIndex,
    isOnline,
    getValidCardsForCurrentPlayer,
    playCard,
  ]);

  // Play game over sound and record statistics
  React.useEffect(() => {
    const matchScore = gameState?.matchScore;

    // Compute a simple progress signature: total partidas + cotos
    const progressSignature = matchScore
      ? matchScore.team1Partidas +
        matchScore.team2Partidas +
        matchScore.team1Cotos +
        matchScore.team2Cotos
      : 0;

    const shouldShowCelebration =
      gameState?.phase === 'gameOver' ||
      (gameState?.phase === 'scoring' && progressSignature > lastProgressRef.current);

    console.log('🏆 [PARTIDA GANADA] Check celebration trigger:', {
      phase: gameState?.phase,
      shouldShowCelebration,
      progressSignature,
      lastProgress: lastProgressRef.current,
      team1Score: gameState?.teams[0].score,
      team2Score: gameState?.teams[1].score,
    });

    if (shouldShowCelebration && gameState) {
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
      lastProgressRef.current = progressSignature;

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
          ).catch(() => {
            // Silently fail if stats recording fails
          });
        } else if (user && gameState.matchScore) {
          // Online games - Record stats for authenticated users
          // Stats recording disabled for now as online mode is not fully implemented
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
    difficulty,
    isOnline,
    user,
    gameMode,
    gameStartTime,
  ]);

  // Handle scoring phase with overlay instead of full screen
  // This effect must be before any conditional returns to avoid hooks order violations
  React.useEffect(() => {
    if (!gameState || gameState.phase !== 'scoring') return;

    const team1 = gameState.teams[0];
    const team2 = gameState.teams[1];

    // Check if any team has won (reached 101+ points)
    const hasWinner = team1.score >= 101 || team2.score >= 101;

    // If a team reached 101 in first hand or vueltas complete, don't auto-transition
    // The HandEndOverlay will handle the timing and call onAutoAdvance
    if (hasWinner || gameState.isVueltas) {
      console.log('🎯 Victory or vueltas complete - HandEndOverlay will handle transition');
    }
  }, [gameState?.phase, gameState?.teams, gameState?.isVueltas]);

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
      // During dealing phase, use pendingHands if available, otherwise use regular hands
      const hand =
        gameState.phase === 'dealing' && gameState.pendingHands
          ? gameState.pendingHands.get(player.id) || []
          : gameState.hands.get(player.id) || [];

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
          ? hand.map(card => ({ id: card.id, suit: card.suit, value: card.value }))
          : hand.map(() => ({ suit: 'oros' as const, value: 1 as const })), // Dummy cards for hidden hands
        isHidden: !showCards, // Mark cards as hidden for proper key generation
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
    if (
      gameState?.trickAnimating ||
      gameState?.postTrickDealingAnimating ||
      gameState?.postTrickDealingPending
    )
      return;

    // Prevent rapid double-clicks
    if (isProcessingCardPlay.current) {
      console.warn('⚠️ Blocked rapid card play attempt');
      return;
    }

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

    // Set lock before playing card
    isProcessingCardPlay.current = true;

    // Play the card
    playCard(cardToPlay.id);
    playCardSound();

    // Broadcast to peers if online
    if (isOnline && multiplayerGame?.isMultiplayerEnabled) {
      multiplayerGame
        .sendGameAction({
          type: 'play_card',
          cardId: cardToPlay.id,
          timestamp: Date.now(),
          playerId: user?.id || 'anonymous',
        } as any)
        .catch(() => {});
    }

    // Reset lock after a short delay to allow state to update
    setTimeout(() => {
      isProcessingCardPlay.current = false;
    }, 500);

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

    // Debug logging for arrastre phase
    if (gameState?.phase === 'arrastre') {
      console.log('📱 Frontend validation:', {
        phase: gameState.phase,
        playerId: currentPlayer.id,
        playerHandSize: playerHand.length,
        validCardsCount: validCards.length,
        validCardIds: validCards.map(c => c.id),
        allCardIds: playerHand.map(c => c.id),
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

    // Prevent multiple simultaneous cante attempts
    if (isProcessingCante) return;

    // CANTAR: Can be done at start of game or after winning a trick
    const currentPlayer = gameState?.players[gameState.currentPlayerIndex];
    if (!currentPlayer) return;

    // In local multiplayer, only human players can perform actions
    if (isLocalMultiplayer && currentPlayer.isBot) return;

    const playerTeam = gameState.teams.find(t => t.playerIds.includes(currentPlayer.id));
    if (!playerTeam) return;

    // Check if it's the right time to cantar:
    // 1. At the start of the game (no tricks played yet, current player is mano)
    // 2. After your team won the last trick
    const lastWinner = gameState?.lastTrickWinner;
    const isGameStart = !lastWinner && gameState.trickCount === 0;
    const isFirstPlayer = gameState.currentPlayerIndex === (gameState.dealerIndex - 1 + 4) % 4;

    if (!isGameStart) {
      // Not game start, so check if team won last trick
      if (!lastWinner) return;

      const lastWinnerTeam = gameState.teams.find(t => t.playerIds.includes(lastWinner));
      if (!lastWinnerTeam || playerTeam.id !== lastWinnerTeam.id) {
        return; // Player's team didn't win the last trick
      }
    } else if (!isFirstPlayer) {
      // At game start, only mano (first player) can cantar
      return;
    }

    // Check if trick hasn't started yet
    if (gameState.currentTrick.length !== 0) return;

    const playerHand = gameState?.hands.get(currentPlayer.id) || [];
    const cantableSuits = canCantar(playerHand, gameState.trumpSuit, playerTeam.cantes);

    // For now, cantar the first available suit
    if (cantableSuits.length > 0) {
      const suit = cantableSuits[0];

      // Mark as processing to prevent repeated button presses
      setIsProcessingCante(true);

      // Calculate points based on suit
      const points = suit === gameState.trumpSuit ? 40 : 20;

      // Get player position (accounting for local multiplayer rotation)
      let displayIndex = gameState.currentPlayerIndex;
      if (isLocalMultiplayer) {
        // In local multiplayer, position 0 is always at bottom
        displayIndex = 0;
      }
      const playerPosition = getPlayerPositionForIndex(displayIndex);

      // Show animation immediately (following cambiar7 pattern)
      setCanteAnimation({
        active: true,
        canteType: points === 40 ? 'cuarenta' : 'veinte',
        playerPosition,
        playerName: currentPlayer.name,
      });

      // Play sound
      playCardSound();

      // Declare the cante after a short delay
      setTimeout(() => {
        cantar(suit);
        // Broadcast cantar to peers
        if (isOnline && multiplayerGame?.isMultiplayerEnabled) {
          multiplayerGame
            .sendGameAction({
              type: 'declare_cante',
              suit,
              timestamp: Date.now(),
              playerId: user?.id || 'anonymous',
            } as any)
            .catch(() => {});
        }
        // Re-enable button after cante is processed
        setIsProcessingCante(false);
      }, 100);
    }
  };

  const handleCambiar7 = () => {
    if (!isDealingComplete) return;

    // CAMBIAR7: Can be used anytime it's your turn and you have the 7 of trumps
    // Check turn based on game mode
    if (isLocalMultiplayer) {
      const currentPlayer = gameState?.players[gameState.currentPlayerIndex];
      if (!currentPlayer || currentPlayer.isBot) return;
    } else {
      if (!isPlayerTurn()) return;
    }

    const currentPlayer = gameState?.players[gameState.currentPlayerIndex];
    if (!currentPlayer) return;

    // Check if we can cambiar7 (have 7 of trumps, deck not empty, etc.)
    if (!gameState.canCambiar7) return;

    const playerHand = gameState?.hands.get(currentPlayer.id) || [];
    const seven = playerHand.find(c => c.suit === gameState.trumpSuit && c.value === 7);

    if (!seven) return;

    // Show animation
    setCambiar7Animation({
      active: true,
      playerCard: seven,
      trumpCard: gameState.trumpCard,
      playerName: currentPlayer.name,
      playerIndex: gameState.currentPlayerIndex,
    });

    // Play sound
    playCardSound();

    // Perform the actual cambiar7 after a short delay to sync with animation
    // Animation breakdown: message (500ms + 1000ms wait) + card swap (1000ms + 600ms wait) = 2500ms total
    setTimeout(() => {
      cambiar7();
      // Broadcast cambiar 7
      if (isOnline && multiplayerGame?.isMultiplayerEnabled) {
        multiplayerGame
          .sendGameAction({
            type: 'cambiar_7',
            timestamp: Date.now(),
            playerId: user?.id || 'anonymous',
          } as any)
          .catch(() => {});
      }
    }, 2100);
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

  // Don't show GameEndCelebration during scoring phase - only HandEndOverlay should appear
  // GameEndCelebration will show in gameOver phase after the user clicks continue

  // Show game over screen
  if (gameState.phase === 'gameOver') {
    const playerTeam = gameState.teams.find(t => t.playerIds.includes(gameState.players[0].id));
    // Determine winner (handle vueltas combined totals)
    let playerWon = false;
    if (gameState.isVueltas && gameState.initialScores) {
      const winnerId = determineVueltasWinner(gameState);
      playerWon = winnerId !== null && winnerId === playerTeam?.id;
    } else {
      const winningTeamDirect = gameState.teams.find(t => t.score >= 101);
      playerWon = winningTeamDirect?.id === playerTeam?.id;
    }
    const team1 = gameState.teams[0];
    const team2 = gameState.teams[1];
    const matchScore = gameState.matchScore;

    console.log('🎮 [PARTIDA GANADA] GameScreen: gameOver phase - SHOWING VICTORY/DEFEAT SCREEN', {
      showGameEndCelebration,
      team1Score: gameState.teams[0].score,
      team2Score: gameState.teams[1].score,
      matchScore: gameState.matchScore,
      isWinner: playerWon,
    });

    // Check if the match is truly complete (team reached 2 cotos)
    const isMatchReallyComplete =
      matchScore &&
      (matchScore.team1Cotos >= matchScore.cotosPerMatch ||
        matchScore.team2Cotos >= matchScore.cotosPerMatch);

    // Always show celebration for game endings, except if match is complete and celebration was already shown
    if (showGameEndCelebration || !isMatchReallyComplete) {
      // Determine celebration type based on actual match state
      let celebrationType: 'partida' | 'coto' | 'match' = 'partida';

      if (isMatchReallyComplete) {
        celebrationType = 'match'; // Full match is actually complete
      } else if (
        matchScore &&
        ((matchScore.team1Partidas === 0 && matchScore.team1Cotos > 0) ||
          (matchScore.team2Partidas === 0 && matchScore.team2Cotos > 0))
      ) {
        // A coto was just won (partidas reset to 0 after winning a coto)
        celebrationType = 'coto';
      }

      // For pending vueltas, always show the celebration with custom handling
      const isVueltasTransition = false; // pendingVueltas no longer used

      return (
        <ScreenContainer orientation="landscape" style={styles.gameContainer}>
          <GameEndCelebration
            isWinner={isVueltasTransition ? false : playerWon} // No winner yet for vueltas
            finalScore={{
              player:
                gameState.isVueltas && gameState.initialScores
                  ? playerTeam?.id === team1.id
                    ? (gameState.initialScores.get(team1.id as TeamId) || 0) + team1.score
                    : (gameState.initialScores.get(team2.id as TeamId) || 0) + team2.score
                  : playerTeam?.id === team1.id
                  ? team1.score
                  : team2.score,
              opponent:
                gameState.isVueltas && gameState.initialScores
                  ? playerTeam?.id === team1.id
                    ? (gameState.initialScores.get(team2.id as TeamId) || 0) + team2.score
                    : (gameState.initialScores.get(team1.id as TeamId) || 0) + team1.score
                  : playerTeam?.id === team1.id
                  ? team2.score
                  : team1.score,
            }}
            onComplete={() => {
              if (isVueltasTransition) {
                // Don't hide celebration, let onContinue handle it
              } else {
                setShowGameEndCelebration(false);
                // After celebration completes, automatically continue if not match end
                if (!isMatchReallyComplete) {
                  continueToNextPartida();
                }
              }
            }}
            playSound={
              isVueltasTransition ? undefined : playerWon ? playVictorySound : playDefeatSound
            }
            celebrationType={isVueltasTransition ? 'partida' : celebrationType}
            matchScore={matchScore}
            onContinue={!isMatchReallyComplete ? continueToNextPartida : undefined}
            isVueltasTransition={isVueltasTransition}
            gameState={gameState}
            playerTeamIndex={playerTeam?.id === team1.id ? 0 : 1}
          />
        </ScreenContainer>
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
          <TouchableOpacity
            style={[styles.gameOverButton, styles.newGameButton]}
            onPress={() => navigation.navigate('JugarHome')}
          >
            <Text style={styles.newGameButtonText}>JUGAR DE NUEVO</Text>
          </TouchableOpacity>

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
        {isOnline && (
          <ConnectionIndicator
            status={connectionStatus.status}
            reconnectAttempts={connectionStatus.reconnectAttempts}
            hideWhenConnected={true}
          />
        )}

        {/* Turn timer for online games */}
        {isOnline && gameState?.phase === 'playing' && (
          <TurnTimer
            seconds={turnTimeLeft}
            onExpire={() => {
              // Auto-play first valid card
              if (isPlayerTurn()) {
                const validCards = getValidCardsForCurrentPlayer();
                if (validCards.length > 0) {
                  playCard(validCards[0].id);
                }
              }
            }}
            playerName={gameState.players[gameState.currentPlayerIndex]?.name}
            paused={gameState.phase !== 'playing'}
          />
        )}

        {/* Player avatars for online games */}
        {isOnline && (
          <PlayerAvatars
            players={gameState.players.map((p, idx) => ({
              id: p.id,
              name: p.name,
              avatar: p.avatar,
              isOnline: multiplayerGame?.state.players.find(mp => mp.id === p.id)?.isOnline ?? true,
              isCurrentTurn: idx === gameState.currentPlayerIndex,
              position: ['bottom', 'right', 'top', 'left'][idx] as any,
            }))}
            currentPlayerId={user?.id || ''}
          />
        )}

        {/* Spectator mode when eliminated */}
        {isOnline && isSpectating && (
          <SpectatorMode
            enabled={isSpectating}
            players={gameState.players.map(p => ({
              id: p.id,
              name: p.name,
              cards:
                gameState.hands.get(p.id)?.map(c => ({
                  suit: c.suit,
                  value: c.value,
                })) || [],
              isEliminated: false, // TODO: Add elimination tracking
            }))}
            currentPlayerId={user?.id || ''}
            currentTurnPlayerId={gameState.players[gameState.currentPlayerIndex]?.id}
            teamScores={{
              team1: gameState.teams[0].score,
              team2: gameState.teams[1].score,
            }}
          />
        )}

        {/* Voice messaging for online games - disabled until online works */}
        {/* {isOnline && (
          <VoiceMessaging
            roomId={roomId}
            gameMode={gameMode as 'online' | 'friends' | 'offline'}
          />
        )} */}

        {/* Card dealing animation now rendered inside GameTable to share layout */}

        {/* Match progress indicator - HIDDEN to not show scores during gameplay */}
        {/* {gameState.matchScore && (
          <View style={styles.matchProgressWrapper}>
            <MatchProgressIndicator matchScore={gameState.matchScore} compact />
          </View>
        )} */}

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
          onCompleteDealingAnimation={completeDealingAnimation}
          playShuffleSound={playShuffleSound}
          playDealSound={playDealSound}
          playTrumpRevealSound={playTrumpRevealSound}
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
          gamePhase={gameState?.phase}
          validCardIndices={getValidCardIndices()}
          isVueltas={gameState.isVueltas}
          canDeclareVictory={gameState.canDeclareVictory}
          teamScores={{
            team1:
              gameState.isVueltas && gameState.initialScores
                ? (gameState.initialScores.get(gameState.teams[0].id) || 0) +
                  gameState.teams[0].score
                : gameState.teams[0].score,
            team2:
              gameState.isVueltas && gameState.initialScores
                ? (gameState.initialScores.get(gameState.teams[1].id) || 0) +
                  gameState.teams[1].score
                : gameState.teams[1].score,
          }}
          hideTrumpCard={cambiar7Animation?.active}
          hideCardFromHand={
            cambiar7Animation?.active
              ? {
                  playerId: players[cambiar7Animation.playerIndex].id,
                  suit: cambiar7Animation.playerCard.suit,
                  value: cambiar7Animation.playerCard.value,
                }
              : undefined
          }
          collectedTricks={
            gameState.collectedTricks as unknown as ReadonlyMap<
              string,
              Array<Array<{ playerId: string; card: any }>>
            >
          }
          teamTrickCounts={{
            team1: (gameState.teamTrickPiles?.get(gameState.teams[0].id as TeamId) || []).length,
            team2: (gameState.teamTrickPiles?.get(gameState.teams[1].id as TeamId) || []).length,
          }}
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
          postTrickDealingAnimating={gameState.postTrickDealingAnimating}
          postTrickDealingPending={gameState.postTrickDealingPending}
          pendingPostTrickDraws={gameState.pendingPostTrickDraws?.map(d => ({
            playerId: d.playerId as unknown as string,
            // Preserve card id so incremental commits can match and update hands immediately
            card: d.card as any,
            source: d.source,
          }))}
          onCompletePostTrickDealing={completePostTrickDealing}
          onPostTrickCardLanded={d => {
            // Forward to hook to commit incrementally (types widened in GameTable overlay)
            (onPostTrickCardLanded as any)({
              playerId: d.playerId as any,
              card: d.card as any,
              source: d.source as 'deck' | 'trump',
            });
          }}
          cardPlayAnimation={
            gameState.cardPlayAnimation
              ? {
                  playerId: gameState.cardPlayAnimation.playerId,
                  card: {
                    id: gameState.cardPlayAnimation.card.id,
                    suit: gameState.cardPlayAnimation.card.suit,
                    value: gameState.cardPlayAnimation.card.value,
                  },
                  cardIndex: gameState.cardPlayAnimation.cardIndex,
                }
              : undefined
          }
        />

        {/* Cantes display removed - now shown as discrete animations */}

        {/* Compact action bar */}
        {gameState && isDealingComplete && (
          <CompactActionBar
            gameState={gameState}
            onCantar={handleCantar}
            onCambiar7={handleCambiar7}
            disabled={!isPlayerTurn() || thinkingPlayer !== null || isProcessingCante}
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

        {/* Cante animation overlay */}
        {canteAnimation?.active && (
          <CanteAnimation
            canteType={canteAnimation.canteType}
            playerPosition={canteAnimation.playerPosition}
            playerName={canteAnimation.playerName}
            onComplete={() => setCanteAnimation(null)}
            playSound={playCardSound}
          />
        )}

        {/* Cambiar 7 animation overlay */}
        {cambiar7Animation?.active && (
          <Cambiar7Animation
            playerCard={cambiar7Animation.playerCard as any}
            trumpCard={cambiar7Animation.trumpCard as any}
            playerName={cambiar7Animation.playerName}
            playerIndex={cambiar7Animation.playerIndex}
            onComplete={() => setCambiar7Animation(null)}
            playSound={playCardSound}
          />
        )}

        {/* Vueltas Score Banner - HIDDEN to not show scores during gameplay */}
        {/* {gameState && (
          <VueltasScoreBanner
            visible={gameState.isVueltas && gameState.phase === 'playing'}
            team1Score={gameState.teams[0].score}
            team2Score={gameState.teams[1].score}
          />
        )} */}

        {/* Hand End Overlay - shows scoring after each hand with detailed point breakdown */}
        {gameState && (
          <HandEndOverlay
            visible={showHandEndOverlay && gameState.phase === 'scoring'}
            team1Score={
              gameState.isVueltas && gameState.initialScores
                ? (gameState.initialScores.get(gameState.teams[0].id) || 0) +
                  gameState.teams[0].score
                : gameState.teams[0].score
            }
            team2Score={
              gameState.isVueltas && gameState.initialScores
                ? (gameState.initialScores.get(gameState.teams[1].id) || 0) +
                  gameState.teams[1].score
                : gameState.teams[1].score
            }
            team1HandPoints={undefined} // Let HandEndOverlay calculate from tricks
            team2HandPoints={undefined} // Let HandEndOverlay calculate from tricks
            team1Cantes={gameState.teams[0].cantes.reduce((sum, c) => sum + c.points, 0)}
            team2Cantes={gameState.teams[1].cantes.reduce((sum, c) => sum + c.points, 0)}
            team1Tricks={gameState.teamTrickPiles?.get(gameState.teams[0].id) || []}
            team2Tricks={gameState.teamTrickPiles?.get(gameState.teams[1].id) || []}
            lastTrickWinnerTeam={
              gameState.lastTrickWinner
                ? gameState.teams.find(t => t.playerIds.includes(gameState.lastTrickWinner!))?.id
                : undefined
            }
            team1Id={gameState.teams[0].id}
            team2Id={gameState.teams[1].id}
            isVueltas={gameState.isVueltas}
            shouldPlayVueltas={shouldStartVueltas(gameState)}
            hasWinner={
              !gameState.isVueltas
                ? gameState.teams.some(t => t.score >= 101)
                : determineVueltasWinner(gameState) !== null
            }
            winningTeamIsTeam1={((): boolean | undefined => {
              if (!gameState.isVueltas) {
                const t1 = gameState.teams[0].score;
                const t2 = gameState.teams[1].score;
                if (t1 >= 101) return true;
                if (t2 >= 101) return false;
                return undefined;
              }
              const winnerId = determineVueltasWinner(gameState);
              if (!winnerId) return undefined;
              return winnerId === gameState.teams[0].id;
            })()}
            team1IdasScore={
              gameState.isVueltas && gameState.initialScores
                ? gameState.initialScores.get(gameState.teams[0].id)
                : undefined
            }
            team2IdasScore={
              gameState.isVueltas && gameState.initialScores
                ? gameState.initialScores.get(gameState.teams[1].id)
                : undefined
            }
            onAutoAdvance={() => {
              console.log('🎯 HandEndOverlay onAutoAdvance called', {
                team1Score: gameState.teams[0].score,
                team2Score: gameState.teams[1].score,
                shouldPlayVueltas: shouldStartVueltas(gameState),
              });

              // Clear auto-advance timer if user manually continues
              if (autoAdvanceTimerRef.current) {
                clearTimeout(autoAdvanceTimerRef.current);
                autoAdvanceTimerRef.current = null;
              }
              // Hide overlay and let continueFromScoring handle all logic
              setShowHandEndOverlay(false);
              continueFromScoring();
            }}
          />
        )}

        {/* Toast notification */}
        {toastConfig && (
          <Toast
            visible={!!toastConfig}
            message={toastConfig.message}
            type={toastConfig.type}
            duration={toastConfig.duration}
            onHide={() => setToastConfig(null)}
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
  roomCode: {
    fontSize: typography.fontSize.lg,
    color: colors.accent,
    fontWeight: typography.fontWeight.bold,
  },
});
