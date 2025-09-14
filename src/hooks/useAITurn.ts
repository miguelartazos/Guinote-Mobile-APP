import { useEffect, useRef, useState } from 'react';
import type { GameState, PlayerId, Card } from '../types/game.types';
import type { SpanishSuit } from '../types/cardTypes';
import { playAICard, shouldAICante, getAIThinkingTime } from '../utils/aiPlayer';
import { getValidCards } from '../utils/gameLogic';
import type { CardMemory } from '../utils/aiMemory';
import { updateMemory } from '../utils/aiMemory';
import { AI_TIMING } from '../constants/gameConstants';

type UseAITurnProps = {
  gameState: GameState | null;
  currentTurnKey: string;
  mockData?: any;
  playCard: (cardId: string) => void;
  cantar: (suit: SpanishSuit) => void;
  aiMemory: CardMemory;
  setAIMemory: (memory: CardMemory | ((prev: CardMemory) => CardMemory)) => void;
  // Prevent AI from acting until initial dealing overlay has fully completed
  isDealingComplete?: boolean;
};

type UseAITurnReturn = {
  thinkingPlayer: PlayerId | null;
};

export function useAITurn({
  gameState,
  currentTurnKey,
  mockData,
  playCard,
  cantar,
  aiMemory,
  setAIMemory,
  isDealingComplete,
}: UseAITurnProps): UseAITurnReturn {
  const [thinkingPlayer, setThinkingPlayer] = useState<PlayerId | null>(null);
  const botRecoveryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTurnKeyRef = useRef<string>('');
  const retryAttemptsRef = useRef<number>(0);
  const lastPlayedCardRef = useRef<string | null>(null);
  const mainTimerRef = useRef<NodeJS.Timeout | null>(null);
  const isCleaningUpRef = useRef<boolean>(false);

  // Use refs to prevent stale closures
  const playCardRef = useRef(playCard);
  const cantarRef = useRef(cantar);
  const aiMemoryRef = useRef(aiMemory);

  // Update refs when callbacks change
  useEffect(() => {
    playCardRef.current = playCard;
  }, [playCard]);

  useEffect(() => {
    cantarRef.current = cantar;
  }, [cantar]);

  // Keep AI memory in a ref so main effect does not depend on aiMemory
  useEffect(() => {
    aiMemoryRef.current = aiMemory;
  }, [aiMemory]);

  // Main AI turn logic
  useEffect(() => {
    // Prevent running if we're cleaning up
    if (isCleaningUpRef.current) {
      return;
    }

    // Early validation with detailed logging
    if (!gameState) {
      console.log('🚫 AI Turn: No game state');
      return;
    }

    // Do not make AI decisions while trick or post-trick dealing animation/pause is running
    // Do not make decisions during initial dealing or while overlay hasn't completed
    if (
      !isDealingComplete ||
      gameState.trickAnimating ||
      gameState.postTrickDealingAnimating ||
      gameState.postTrickDealingPending
    ) {
      console.log('🎬 AI Turn: Skipping - animation in progress', {
        player: gameState.players[gameState.currentPlayerIndex].name,
        currentTrickLength: gameState.currentTrick.length,
        trickAnimating: gameState.trickAnimating,
        postTrickDealingAnimating: gameState.postTrickDealingAnimating,
        postTrickDealingPending: gameState.postTrickDealingPending,
        isDealingComplete,
      });
      return;
    }

    if (
      gameState.phase === 'dealing' ||
      gameState.phase === 'scoring' ||
      gameState.phase === 'gameOver' ||
      gameState.phase === 'waiting' ||
      gameState.phase === 'finished'
    ) {
      console.log('🚫 AI Turn: Invalid phase:', gameState.phase);
      return;
    }

    // Don't block on animations - queue the move instead
    // The animation system should handle queuing properly

    if (mockData) {
      console.log('🚫 AI Turn: Mock data present');
      return;
    }

    const currentPlayer = gameState.players[gameState.currentPlayerIndex];
    const playerHand = gameState.hands.get(currentPlayer.id);

    console.log('🎮 CURRENT TURN:', {
      playerIndex: gameState.currentPlayerIndex,
      playerId: currentPlayer.id,
      playerName: currentPlayer.name,
      isBot: currentPlayer.isBot,
      phase: gameState.phase,
      trickSize: gameState.currentTrick.length,
      turnKey: currentTurnKey,
      handSize: playerHand?.length || 0,
      timestamp: Date.now(),
    });

    // Extra diagnostics for right-side bot (index 3)
    if (gameState.currentPlayerIndex === 3) {
      console.log('🧭 RIGHT BOT (index 3) DIAGNOSTICS:', {
        trickAnimating: gameState.trickAnimating,
        isVueltas: gameState.isVueltas,
        trickCount: gameState.trickCount,
        currentTrickLength: gameState.currentTrick.length,
        deckSize: gameState.deck.length,
      });
    }

    if (!currentPlayer.isBot) {
      console.log('🚫 AI Turn: Not a bot turn');
      return;
    }

    if (!playerHand || playerHand.length === 0) {
      // This can happen legitimately when cards are being dealt after a trick
      // The postTrickDealingAnimating/Pending checks above should prevent this
      // but add extra safety logging
      console.log('⏳ AI Turn: Bot temporarily has no cards (dealing in progress?)', {
        player: currentPlayer.name,
        phase: gameState.phase,
        deckSize: gameState.deck.length,
        trickCount: gameState.trickCount,
        hasPendingDraws: !!gameState.pendingPostTrickDraws?.length,
      });
      return;
    }

    // Check if this is the same turn key as last time (indicates stuck state)
    const isSameTurnKey = lastTurnKeyRef.current === currentTurnKey;
    if (isSameTurnKey && thinkingPlayer === currentPlayer.id) {
      console.warn('⚠️ AI Turn: Same turn key detected, bot might be stuck', {
        playerId: currentPlayer.id,
        turnKey: currentTurnKey,
        retryAttempts: retryAttemptsRef.current,
      });

      // Increment retry attempts for exponential backoff
      retryAttemptsRef.current++;

      if (retryAttemptsRef.current > AI_TIMING.MAX_RETRY_ATTEMPTS) {
        console.error('❌ AI Turn: Max retry attempts reached, forcing play');
        // Force immediate play to unstick the game
        const validCards = getValidCards(playerHand, gameState, currentPlayer.id);
        if (validCards.length > 0) {
          playCardRef.current(validCards[0].id);
        }
        setThinkingPlayer(null);
        retryAttemptsRef.current = 0;
        // Clear last played card ref when forcing play
        lastPlayedCardRef.current = null;
        return;
      }
    } else {
      // Reset retry attempts and last played card for new turn
      retryAttemptsRef.current = 0;
      // Clear last played card ref when turn changes
      lastPlayedCardRef.current = null;
    }
    lastTurnKeyRef.current = currentTurnKey;

    // Clear any existing timers BEFORE setting thinking state
    if (botRecoveryTimerRef.current) {
      clearTimeout(botRecoveryTimerRef.current);
      botRecoveryTimerRef.current = null;
    }
    if (mainTimerRef.current) {
      clearTimeout(mainTimerRef.current);
      mainTimerRef.current = null;
    }

    // Set thinking indicator after clearing timers
    // Disabled: Don't show "está pensando" message for bots - better UX without it
    // setThinkingPlayer(currentPlayer.id);

    // Capture all necessary data in closure to prevent stale references
    const botId = currentPlayer.id;
    const botName = currentPlayer.name;
    const currentPhase = gameState.phase;
    // const currentTrumpSuit = gameState.trumpSuit; // Not used in recovery
    const botHand = [...(gameState.hands.get(botId) || [])]; // Make a copy

    // Calculate thinking time based on AI difficulty and complexity with exponential backoff
    const isComplexDecision =
      gameState.currentTrick.length > 0 || currentPhase === 'arrastre' || botHand.length < 5;
    const baseThinkingTime = getAIThinkingTime(currentPlayer, isComplexDecision);
    // Apply exponential backoff if we're retrying
    const thinkingTime =
      retryAttemptsRef.current > 0
        ? Math.min(
            baseThinkingTime /
              Math.pow(AI_TIMING.EXPONENTIAL_BACKOFF_BASE, retryAttemptsRef.current),
            AI_TIMING.MIN_THINKING_TIME,
          )
        : baseThinkingTime;

    // Add extra logging for debugging
    console.log('🎯 AI DECISION CONTEXT:', {
      bot: botName,
      turnKey: currentTurnKey,
      trickSize: gameState.currentTrick.length,
      phase: currentPhase,
      isComplex: isComplexDecision,
      thinkingTime,
      timestamp: new Date().toISOString(),
    });

    console.log('🤖 BOT THINKING:', {
      bot: botName,
      handSize: botHand.length,
      thinkingTime: thinkingTime,
    });

    // Calculate dynamic recovery timeout based on actual max thinking time
    const maxPossibleThinkingTime = (() => {
      // Account for deep thinking scenarios (up to 3.5s base)
      // Plus prudent personality (1.3x) and complexity (1.4x)
      const maxDeepThink = 3500; // 3.5 seconds for deep thinking
      const maxMultiplier = 1.3 * 1.4; // Prudent + complex decision
      // Calculate max time + 50% safety margin
      return Math.ceil(maxDeepThink * maxMultiplier * 1.5);
    })();

    // Use the larger of configured timeout or calculated max
    const recoveryTimeout = Math.max(AI_TIMING.RECOVERY_TIMEOUT, maxPossibleThinkingTime);

    // Set recovery timer with defensive checks
    const recovery = setTimeout(() => {
      console.error('⚠️ BOT STUCK - Forcing play for:', botName, {
        botId,
        playerIndex: gameState.currentPlayerIndex,
        turnKey: currentTurnKey,
        thinkingTime: thinkingTime,
        recoveryTimeout: recoveryTimeout,
        timestamp: Date.now(),
      });

      try {
        // Defensive check 1: Ensure we still have a valid bot hand
        if (!botHand || botHand.length === 0) {
          console.error('❌ RECOVERY: Bot has no cards to play');
          return;
        }

        // Defensive check 2: Get fresh game state
        const latestState = gameState;
        if (!latestState) {
          console.error('❌ RECOVERY: Game state is null');
          return;
        }

        // Don't recover-play during animations
        if (latestState.trickAnimating) {
          console.log('🎬 RECOVERY: Skipping - trick animation in progress');
          return;
        }

        // Defensive check 3: Verify it's still the bot's turn
        const currentPlayerInRecovery = latestState.players[latestState.currentPlayerIndex];
        if (currentPlayerInRecovery.id !== botId) {
          console.warn("⚠️ RECOVERY: No longer bot's turn, aborting recovery", {
            expectedBot: botId,
            currentPlayer: currentPlayerInRecovery.id,
          });
          return;
        }

        // Defensive check 4: Get fresh hand from latest state
        const latestHand = latestState.hands.get(botId);
        if (!latestHand || latestHand.length === 0) {
          console.error('❌ RECOVERY: Bot has no cards in latest state');
          return;
        }

        // Try to get valid cards with error handling
        let validCards: Card[] = [];
        try {
          validCards = getValidCards(latestHand, latestState, botId);
        } catch (validCardsError) {
          console.error('❌ RECOVERY: Failed to get valid cards:', validCardsError);
          // Fall back to all cards if validation fails
          validCards = [...latestHand];
        }

        // Select a card to play (prefer valid cards, fallback to any card)
        const cardToPlay = validCards.length > 0 ? validCards[0] : latestHand[0];

        if (!cardToPlay || !cardToPlay.id) {
          console.error('❌ RECOVERY: No valid card to play');
          return;
        }

        console.log('🚨 RECOVERY: Force playing:', `${cardToPlay.value} de ${cardToPlay.suit}`);

        // Defensive call to playCard
        if (typeof playCardRef.current === 'function') {
          playCardRef.current(cardToPlay.id);
        } else {
          console.error('❌ RECOVERY: playCard function not available');
        }
      } catch (error) {
        console.error('❌ RECOVERY FAILED:', error);
        // Log additional context for debugging
        console.error('Recovery context:', {
          botId,
          botName,
          handSize: botHand?.length || 0,
          gamePhase: gameState?.phase,
          currentPlayerIndex: gameState?.currentPlayerIndex,
        });
      } finally {
        // Always clean up state
        setThinkingPlayer(null);
        botRecoveryTimerRef.current = null;
      }
    }, recoveryTimeout);

    console.log('⏰ RECOVERY TIMER SET:', {
      bot: botName,
      actualThinkingTime: thinkingTime,
      recoveryTimeout: recoveryTimeout,
      timerId: recovery,
    });
    botRecoveryTimerRef.current = recovery;

    // Smart AI logic with memory
    const timer = setTimeout(() => {
      // Wrap async logic in IIFE with error handling
      (async () => {
        try {
          // Don't clear recovery timer yet - only clear after successful card play
          // This ensures recovery still happens if cante doesn't lead to card play

          if (botHand.length === 0) {
            console.log('⏳ Bot has no cards in timer callback (dealing in progress?)', botName);
            setThinkingPlayer(null);
            return;
          }

          // Use captured gameState to ensure consistency
          const capturedGameState = {
            ...gameState,
            hands: new Map(gameState.hands), // Ensure we have the current hands
          };

          // Abort if trick is animating
          if (capturedGameState.trickAnimating) {
            console.log('🎬 MAIN TIMER: Skipping - trick animation in progress');
            setThinkingPlayer(null);
            return;
          }

          // Check for cante opportunities ONLY when rules allow declaring
          // Rules: must be in 'playing' phase, trick must be empty, and bot must have won last trick
          const canAttemptCante =
            capturedGameState.phase === 'playing' &&
            capturedGameState.currentTrick.length === 0 &&
            capturedGameState.lastTrickWinner === currentPlayer.id;

          if (canAttemptCante) {
            const cantesuit = shouldAICante(currentPlayer, botHand, capturedGameState);
            if (cantesuit) {
              try {
                console.log('🎺 BOT DECLARING CANTE:', cantesuit);
                cantarRef.current?.(cantesuit);
                // Play card immediately - cante doesn't affect valid cards
                // No delay needed since we continue with current state
              } catch (error) {
                console.error('❌ Error declaring cante:', error);
                // Continue to play card anyway
              }
            }
          }

          // Play card with AI memory - ensure all parameters are defined
          const cardToPlay = playAICard(
            botHand,
            capturedGameState,
            currentPlayer, // Pass full player object
            aiMemoryRef.current,
          );

          if (cardToPlay) {
            console.log('🎯 AI selected card:', {
              bot: botName,
              card: `${cardToPlay.value} de ${cardToPlay.suit}`,
              phase: capturedGameState.phase,
              trickSize: capturedGameState.currentTrick.length,
            });
            // Check if we're trying to play the same card again (stuck state)
            if (lastPlayedCardRef.current === cardToPlay.id) {
              console.error('❌ AI trying to play same card again, selecting different card', {
                lastPlayed: lastPlayedCardRef.current,
                attempting: cardToPlay.id,
                bot: botName,
              });
              // Get valid cards and filter out the stuck card
              const validCards = getValidCards(botHand, capturedGameState, currentPlayer.id);
              const alternativeCards = validCards.filter(c => c.id !== cardToPlay.id);
              const alternativeCard =
                alternativeCards.length > 0
                  ? alternativeCards[0]
                  : validCards.length > 0
                  ? validCards[0]
                  : cardToPlay;
              console.log('🔄 Selected alternative card:', {
                card: `${alternativeCard.value} de ${alternativeCard.suit}`,
                id: alternativeCard.id,
              });
              lastPlayedCardRef.current = alternativeCard.id;
              playCardRef.current?.(alternativeCard.id);
            } else {
              console.log('🤖 BOT PLAYING:', {
                bot: botName,
                card: `${cardToPlay.value} de ${cardToPlay.suit}`,
                validMoves: botHand.length,
              });
              lastPlayedCardRef.current = cardToPlay.id;
              playCardRef.current?.(cardToPlay.id);
            }

            // Clear recovery timer after successful card play
            if (botRecoveryTimerRef.current) {
              clearTimeout(botRecoveryTimerRef.current);
              botRecoveryTimerRef.current = null;
            }

            // Update AI memory with played card
            setAIMemory(prev => updateMemory(prev, botId, cardToPlay));
          } else {
            console.error('❌ BOT FAILED TO SELECT CARD:', botName);
            // Fallback: play any card if AI logic fails
            if (botHand.length > 0) {
              const fallbackCard = botHand[0];
              console.warn(
                '🔧 FALLBACK: Playing first card:',
                `${fallbackCard.value} de ${fallbackCard.suit}`,
              );
              playCardRef.current?.(fallbackCard.id);
              setAIMemory(prev => updateMemory(prev, botId, fallbackCard));
            }
          }
          setThinkingPlayer(null);
        } catch (error) {
          console.error('❌ Error in AI turn logic:', error);
          setThinkingPlayer(null);
          // Clear recovery timer on error
          if (botRecoveryTimerRef.current) {
            clearTimeout(botRecoveryTimerRef.current);
            botRecoveryTimerRef.current = null;
          }
        }
      })();
    }, thinkingTime);

    mainTimerRef.current = timer;

    return () => {
      isCleaningUpRef.current = true;
      if (mainTimerRef.current) {
        clearTimeout(mainTimerRef.current);
        mainTimerRef.current = null;
      }
      if (botRecoveryTimerRef.current) {
        clearTimeout(botRecoveryTimerRef.current);
        botRecoveryTimerRef.current = null;
      }
      setThinkingPlayer(null);
      // Clear last played card ref on cleanup
      lastPlayedCardRef.current = null;
      isCleaningUpRef.current = false;
    };
  }, [
    // Use stable turn key instead of individual properties
    currentTurnKey,
    mockData,
    isDealingComplete,
    gameState?.currentPlayerIndex, // CRITICAL: React to turn changes
    gameState?.trickAnimating, // React to animation state
    // Still avoid full gameState to prevent excessive re-renders
  ]);

  return {
    thinkingPlayer,
  };
}
