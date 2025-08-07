import { useEffect, useRef, useState } from 'react';
import type { GameState, PlayerId, Card } from '../types/game.types';
import type { SpanishSuit } from '../types/cardTypes';
import {
  playAICard,
  shouldAICante,
  getAIThinkingTime,
} from '../utils/aiPlayer';
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
  setAIMemory: (
    memory: CardMemory | ((prev: CardMemory) => CardMemory),
  ) => void;
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
}: UseAITurnProps): UseAITurnReturn {
  const [thinkingPlayer, setThinkingPlayer] = useState<PlayerId | null>(null);
  const botRecoveryTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTurnKeyRef = useRef<string>('');

  // Use refs to prevent stale closures
  const playCardRef = useRef(playCard);
  const cantarRef = useRef(cantar);

  // Update refs when callbacks change
  useEffect(() => {
    playCardRef.current = playCard;
  }, [playCard]);

  useEffect(() => {
    cantarRef.current = cantar;
  }, [cantar]);

  // Main AI turn logic
  useEffect(() => {
    // Early validation with detailed logging
    if (!gameState) {
      console.log('🚫 AI Turn: No game state');
      return;
    }

    if (gameState.phase !== 'playing' && gameState.phase !== 'arrastre') {
      console.log('🚫 AI Turn: Invalid phase:', gameState.phase);
      return;
    }

    if (gameState.trickAnimating) {
      console.log('🚫 AI Turn: Trick animation in progress');
      return;
    }

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

    if (!currentPlayer.isBot) {
      console.log('🚫 AI Turn: Not a bot turn');
      return;
    }

    if (!playerHand || playerHand.length === 0) {
      console.error('❌ AI Turn: Bot has no cards!', currentPlayer.name);
      return;
    }

    // Check if this is the same turn key as last time (indicates stuck state)
    const isSameTurnKey = lastTurnKeyRef.current === currentTurnKey;
    if (isSameTurnKey && thinkingPlayer === currentPlayer.id) {
      console.warn('⚠️ AI Turn: Same turn key detected, bot might be stuck', {
        playerId: currentPlayer.id,
        turnKey: currentTurnKey,
      });
    }
    lastTurnKeyRef.current = currentTurnKey;

    // Set thinking indicator
    setThinkingPlayer(currentPlayer.id);

    // Clear any existing recovery timer
    if (botRecoveryTimerRef.current) {
      clearTimeout(botRecoveryTimerRef.current);
      botRecoveryTimerRef.current = null;
    }

    // Capture all necessary data in closure to prevent stale references
    const botId = currentPlayer.id;
    const botName = currentPlayer.name;
    const currentPhase = gameState.phase;
    // const currentTrumpSuit = gameState.trumpSuit; // Not used in recovery
    const botHand = [...(gameState.hands.get(botId) || [])]; // Make a copy

    // Calculate thinking time based on AI difficulty and complexity
    const isComplexDecision =
      gameState.currentTrick.length > 0 ||
      currentPhase === 'arrastre' ||
      botHand.length < 5;
    const thinkingTime = getAIThinkingTime(currentPlayer, isComplexDecision);

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

    // Set recovery timer with defensive checks
    const recovery = setTimeout(() => {
      console.error('⚠️ BOT STUCK - Forcing play for:', botName, {
        botId,
        playerIndex: gameState.currentPlayerIndex,
        turnKey: currentTurnKey,
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

        // Defensive check 3: Verify it's still the bot's turn
        const currentPlayerInRecovery =
          latestState.players[latestState.currentPlayerIndex];
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
          console.error(
            '❌ RECOVERY: Failed to get valid cards:',
            validCardsError,
          );
          // Fall back to all cards if validation fails
          validCards = [...latestHand];
        }

        // Select a card to play (prefer valid cards, fallback to any card)
        const cardToPlay =
          validCards.length > 0 ? validCards[0] : latestHand[0];

        if (!cardToPlay || !cardToPlay.id) {
          console.error('❌ RECOVERY: No valid card to play');
          return;
        }

        console.log(
          '🚨 RECOVERY: Force playing:',
          `${cardToPlay.value} de ${cardToPlay.suit}`,
        );

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
    }, AI_TIMING.RECOVERY_TIMEOUT);

    console.log('⏰ RECOVERY TIMER SET:', {
      bot: botName,
      timeout: AI_TIMING.RECOVERY_TIMEOUT,
      timerId: recovery,
    });
    botRecoveryTimerRef.current = recovery;

    // Smart AI logic with memory
    const timer = setTimeout(() => {
      // Clear recovery timer if bot plays normally
      if (recovery) {
        clearTimeout(recovery);
        botRecoveryTimerRef.current = null;
      }

      if (botHand.length === 0) {
        console.error('❌ BOT HAS NO CARDS:', botName);
        setThinkingPlayer(null);
        return;
      }

      // Use captured gameState to ensure consistency
      const capturedGameState = {
        ...gameState,
        hands: new Map(gameState.hands), // Ensure we have the current hands
      };

      // Check for cante opportunities
      const cantesuit = shouldAICante(
        currentPlayer,
        botHand,
        capturedGameState,
      );
      if (cantesuit) {
        console.log('🎺 BOT DECLARING CANTE:', cantesuit);
        cantarRef.current?.(cantesuit);
        setThinkingPlayer(null);
        return;
      }

      // Play card with AI memory - ensure all parameters are defined
      const cardToPlay = playAICard(
        botHand,
        capturedGameState,
        currentPlayer, // Pass full player object
        aiMemory,
      );

      if (cardToPlay) {
        console.log('🤖 BOT PLAYING:', {
          bot: botName,
          card: `${cardToPlay.value} de ${cardToPlay.suit}`,
          validMoves: botHand.length,
        });
        playCardRef.current?.(cardToPlay.id);
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
    }, thinkingTime);

    return () => {
      clearTimeout(timer);
      if (recovery) {
        clearTimeout(recovery);
        botRecoveryTimerRef.current = null;
      }
      setThinkingPlayer(null);
    };
  }, [
    // Use stable turn key instead of individual properties
    currentTurnKey,
    mockData,
    gameState,
    aiMemory,
    setAIMemory,
    // Remove thinkingPlayer to prevent re-render loops
  ]);

  return {
    thinkingPlayer,
  };
}
