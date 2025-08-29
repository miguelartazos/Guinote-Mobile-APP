import type {
  Card,
  GameState,
  GamePhase,
  TrickCard,
  Player,
  PlayerId,
  DifficultyLevel,
  AIPersonality,
} from '../types/game.types';
import type { SpanishSuit } from '../types/cardTypes';
import { CARD_POINTS } from '../types/game.types';
import { isValidPlay, calculateTrickWinner } from './gameLogic';
import type { CardMemory } from './aiMemory';
import {
  getRemainingHighCards,
  getMemorySize,
  getRemainingTrumps,
  hasHighestTrump,
} from './aiMemory';
import {
  AI_DECISION_THRESHOLDS as AI_THRESHOLDS,
  AI_PROBABILITIES,
  AI_FALLBACK_ID,
} from '../constants/gameConstants';

function getCardPower(card: Card): number {
  const powerRanking: Record<number, number> = {
    1: 10, // As
    3: 9, // Tres
    12: 8, // Rey
    10: 7, // Sota (higher than Caballo in Guiñote)
    11: 6, // Caballo (lower than Sota in Guiñote)
    7: 5,
    6: 4,
    5: 3,
    4: 2,
    2: 1, // Dos
  };
  return powerRanking[card.value] || 0;
}

function getCardPoints(card: Card): number {
  return CARD_POINTS[card.value] || 0;
}

function canWinTrick(
  card: Card,
  currentTrick: readonly TrickCard[],
  trumpSuit: SpanishSuit,
  playerId: PlayerId,
): boolean {
  if (currentTrick.length === 0) return true;

  const trickWithAI = [...currentTrick, { playerId, card }];
  const winnerId = calculateTrickWinner(trickWithAI, trumpSuit);

  return winnerId === playerId;
}

function getTrickPoints(trick: readonly TrickCard[]): number {
  return trick.reduce((sum, tc) => sum + getCardPoints(tc.card), 0);
}

function hasCante(hand: readonly Card[], suit: SpanishSuit): boolean {
  const hasRey = hand.some(c => c.suit === suit && c.value === 12);
  const hasSota = hand.some(c => c.suit === suit && c.value === 10);
  return hasRey && hasSota;
}

function shouldPreserveCante(card: Card, hand: readonly Card[], gameState: GameState): boolean {
  // Don't preserve cantes if game is almost over
  if (gameState.phase === 'arrastre' || gameState.deck.length < AI_THRESHOLDS.CANTE_FEW_CARDS)
    return false;

  // Check if this card is part of a cante
  if (card.value === 12 || card.value === 10) {
    const canCante = hasCante(hand, card.suit);
    if (!canCante) return false;

    // Check if we already canted this suit
    const team = gameState.teams.find(t => t.playerIds.includes(gameState.currentPlayer));
    if (team?.cantes.some(c => c.suit === card.suit)) {
      return false; // Already canted, no need to preserve
    }

    // Preserve trump cantes more carefully
    if (card.suit === gameState.trumpSuit) {
      // Always preserve trump cante until late game
      return gameState.deck.length > 10;
    }

    // Preserve non-trump cantes in early-mid game
    return gameState.deck.length > 15;
  }

  return false;
}

function playEasyAI(
  validCards: readonly Card[],
  _currentTrick: readonly TrickCard[],
  _trumpSuit: SpanishSuit,
): Card {
  // Easy AI: Random with slight preference for lower cards
  // Makes obvious mistakes, plays randomly 80% of the time
  if (Math.random() < 0.8) {
    // 80% random play
    const randomIndex = Math.floor(Math.random() * validCards.length);
    return validCards[randomIndex];
  } else {
    // 20% prefer lower cards to seem less threatening
    const sortedCards = [...validCards].sort((a, b) => getCardPower(a) - getCardPower(b));
    return sortedCards[0];
  }
}

function playMediumAI(
  validCards: readonly Card[],
  hand: readonly Card[],
  gameState: GameState,
  playerId: PlayerId,
  _memory?: CardMemory,
): Card {
  // Medium AI: Phase-aware strategy with trump conservation
  const card = playStrategicCard(validCards, hand, gameState, playerId);

  // Additional trump conservation check
  const { trumpSuit, phase } = gameState;
  if (
    card.suit === trumpSuit &&
    phase === 'playing' &&
    gameState.deck.length > AI_THRESHOLDS.MANY_CARDS_LEFT
  ) {
    // Try to find a non-trump alternative
    const nonTrumps = validCards.filter(c => c.suit !== trumpSuit);
    if (nonTrumps.length > 0 && Math.random() < AI_PROBABILITIES.SAVE_TRUMP_EARLY) {
      // 70% chance to save trump in early game
      return nonTrumps[Math.floor(Math.random() * nonTrumps.length)];
    }
  }

  return card;
}

function playHardAI(
  validCards: readonly Card[],
  hand: readonly Card[],
  gameState: GameState,
  memory: CardMemory,
  partnerId: PlayerId,
  playerId: PlayerId,
): Card {
  const { currentTrick, trumpSuit, phase } = gameState;

  // Advanced card counting with memory optimization
  const suits: SpanishSuit[] = ['oros', 'copas', 'espadas', 'bastos'];
  const suitStrengths = new Map<SpanishSuit, number>();

  // Only use memory if it's not too large (prevent performance issues)
  const memorySize = getMemorySize(memory);
  const useMemory = memorySize < 30; // Limit memory usage

  suits.forEach(suit => {
    // Use memory if available and not too large, otherwise use heuristics
    const remaining = useMemory ? getRemainingHighCards(memory, suit) : suit === trumpSuit ? 3 : 2; // Estimate if no memory
    suitStrengths.set(suit, remaining);
  });

  // Starting a trick with card counting
  if (currentTrick.length === 0) {
    // Preserve cantes intelligently
    const playableCards = validCards.filter(card => !shouldPreserveCante(card, hand, gameState));
    const cardsToConsider = playableCards.length > 0 ? playableCards : validCards;

    // Phase-aware leading
    if (phase === 'arrastre') {
      // In arrastre, prefer bleeding trumps when strong
      const trumps = cardsToConsider.filter(c => c.suit === trumpSuit);
      const nonTrumps = cardsToConsider.filter(c => c.suit !== trumpSuit);

      // We do not have reliable memory in medium AI; use simple heuristics
      const haveManyTrumps = trumps.length >= 3;
      if (trumps.length > 0 && haveManyTrumps) {
        return [...trumps].sort((a, b) => getCardPower(b) - getCardPower(a))[0];
      }

      if (nonTrumps.length > 0) {
        // Lead with lowest non-trump
        return [...nonTrumps].sort((a, b) => getCardPower(a) - getCardPower(b))[0];
      }
      // Only trumps left
      return [...trumps].sort((a, b) => getCardPower(a) - getCardPower(b))[0];
    } else {
      // Draw phase - use memory to lead intelligently
      const nonTrumps = cardsToConsider.filter(c => c.suit !== trumpSuit);
      if (nonTrumps.length > 0) {
        // Find suits where we have low cards and opponents might have high cards
        const lowCards = nonTrumps.filter(c => getCardPower(c) < AI_THRESHOLDS.LOW_POWER_CARD);
        if (lowCards.length > 0) {
          // Lead with low card in suit with many remaining high cards
          return [...lowCards].sort((a, b) => {
            const aRemaining = suitStrengths.get(a.suit) || 0;
            const bRemaining = suitStrengths.get(b.suit) || 0;
            return bRemaining - aRemaining;
          })[0];
        }

        // No low cards - lead with high cards in depleted suits
        const highCards = nonTrumps.filter(c => getCardPower(c) >= 8);
        if (highCards.length > 0) {
          return [...highCards].sort((a, b) => {
            const aRemaining = suitStrengths.get(a.suit) || 0;
            const bRemaining = suitStrengths.get(b.suit) || 0;
            return aRemaining - bRemaining; // Lead in suits with fewer high cards
          })[0];
        }
      }
    }
  }

  // Following with phase-aware logic and (for hard AI) memory
  if (currentTrick.length > 0) {
    const trickValue = getTrickPoints(currentTrick);
    const winningCards = validCards.filter(card =>
      canWinTrick(card, currentTrick, trumpSuit, playerId),
    );

    // Partner is winning the trick
    const currentWinner = calculateTrickWinner(currentTrick, trumpSuit);
    if (currentWinner === partnerId) {
      if (phase === 'arrastre') {
        // Cargar in arrastre
        const nonTrumps = validCards.filter(c => c.suit !== trumpSuit);
        const cardsToGive = nonTrumps.length > 0 ? nonTrumps : validCards;
        return [...cardsToGive].sort((a, b) => getCardPoints(b) - getCardPoints(a))[0];
      }
      // Robada: avoid cargar; discard lowest points
      const nonTrumps = validCards.filter(c => c.suit !== trumpSuit);
      const safeDiscards = nonTrumps.length > 0 ? nonTrumps : validCards;
      return [...safeDiscards].sort((a, b) => getCardPoints(a) - getCardPoints(b))[0];
    }

    // Opponent winning - must we take it?
    if (trickValue >= AI_THRESHOLDS.HIGH_VALUE_TRICK && winningCards.length > 0) {
      // Try to win without trumps first
      const nonTrumpWinners = winningCards.filter(c => c.suit !== trumpSuit);
      if (nonTrumpWinners.length > 0) {
        return [...nonTrumpWinners].sort((a, b) => getCardPower(a) - getCardPower(b))[0];
      }
      // Use trump only if necessary
      return [...winningCards].sort((a, b) => getCardPower(a) - getCardPower(b))[0];
    }

    // Check if we can duck safely based on memory
    const leadSuit = currentTrick[0].card.suit;
    const remainingInSuit = suitStrengths.get(leadSuit) || 0;

    // If few high cards remain in suit, we can duck more safely
    if (remainingInSuit <= 1 && trickValue < AI_THRESHOLDS.VALUABLE_TRICK) {
      const losingCards = validCards.filter(c => !winningCards.includes(c));
      if (losingCards.length > 0) {
        // Discard low points, preferring non-trumps
        const nonTrumpLosers = losingCards.filter(c => c.suit !== trumpSuit);
        const toDiscard = nonTrumpLosers.length > 0 ? nonTrumpLosers : losingCards;
        return [...toDiscard].sort((a, b) => getCardPoints(a) - getCardPoints(b))[0];
      }
    }
  }

  // Fallback to strategic play
  return playStrategicCard(validCards, hand, gameState, playerId);
}

function applyPersonality(
  card: Card,
  validCards: readonly Card[],
  personality: AIPersonality,
  gameState: GameState,
  randomValue: number = Math.random(),
): Card {
  const { currentTrick, trumpSuit } = gameState;

  switch (personality) {
    case 'prudent': {
      // Defensive: avoid playing high cards early
      if (currentTrick.length === 0 && gameState.deck.length > AI_THRESHOLDS.MANY_CARDS_LEFT) {
        const lowCards = validCards.filter(c => getCardPower(c) <= AI_THRESHOLDS.LOW_POWER_CARD);
        if (lowCards.length > 0) {
          return lowCards[Math.floor(Math.random() * lowCards.length)];
        }
      }
      break;
    }

    case 'aggressive': {
      // Aggressive: prefer high cards but STILL conserve trumps in arrastre
      if (currentTrick.length === 0) {
        // In arrastre, do not override base strategy (let bleeding logic stand)
        if (gameState.phase !== 'arrastre') {
          // Draw phase - can be more aggressive
          const highCards = validCards.filter(c => getCardPower(c) >= 8);
          if (highCards.length > 0) {
            return highCards[0];
          }
        }
      }
      // Trump only occasionally (15% chance) and never in arrastre when leading
      const trumps = validCards.filter(c => c.suit === trumpSuit);
      if (
        trumps.length > 0 &&
        randomValue < AI_PROBABILITIES.AGGRESSIVE_TRUMP &&
        (gameState.phase === 'playing' || currentTrick.length > 0)
      ) {
        return [...trumps].sort((a, b) => getCardPower(b) - getCardPower(a))[0];
      }
      break;
    }

    case 'tricky': {
      // Unpredictable: sometimes make unexpected plays
      if (
        randomValue < AI_PROBABILITIES.TRICKY_RANDOM &&
        // Avoid random overrides when leading in arrastre
        !(gameState.phase === 'arrastre' && currentTrick.length === 0)
      ) {
        // 30% chance of random play
        const randomIndex = Math.floor(randomValue * validCards.length);
        return validCards[randomIndex];
      }
      break;
    }
  }

  return card;
}

function selectLeadingCard(
  cardsToConsider: readonly Card[],
  trumpSuit: SpanishSuit,
  phase: GamePhase,
  gameState: GameState,
): Card {
  // Safety check - ensure we have cards to consider
  if (cardsToConsider.length === 0) {
    console.error('❌ selectLeadingCard: No cards to consider!');
    return cardsToConsider[0]; // This will throw, but gives better error
  }

  const nonTrumps = cardsToConsider.filter(c => c.suit !== trumpSuit);
  const trumps = cardsToConsider.filter(c => c.suit === trumpSuit);
  const opponentHasForty = gameState.teams.some(
    team =>
      // Opponent team:
      !team.playerIds.includes(gameState.players[gameState.currentPlayerIndex]?.id as PlayerId) &&
      team.cantes?.some(c => c.suit === trumpSuit && c.points === 40),
  );

  // ARRASTRE PHASE - Prefer bleeding trumps when strong
  if (phase === 'arrastre') {
    // Log decision context
    console.log('🎯 Arrastre leading decision:', {
      trumpCount: trumps.length,
      nonTrumpCount: nonTrumps.length,
      opponentHasForty,
    });

    if (trumps.length > 0 && (trumps.length >= 3 || opponentHasForty)) {
      const selected = [...trumps].sort((a, b) => getCardPower(b) - getCardPower(a))[0];
      console.log('🎯 Leading with strong trump:', `${selected.value} de ${selected.suit}`);
      return selected;
    }
    if (nonTrumps.length > 0) {
      const selected = [...nonTrumps].sort((a, b) => getCardPower(a) - getCardPower(b))[0];
      console.log('🎯 Leading with low non-trump:', `${selected.value} de ${selected.suit}`);
      return selected;
    }
    const selected = [...trumps].sort((a, b) => getCardPower(a) - getCardPower(b))[0];
    console.log('🎯 Leading with only trump:', `${selected.value} de ${selected.suit}`);
    return selected;
  }

  // DRAW PHASE - Strategic freedom
  if (phase === 'playing' && nonTrumps.length > 0) {
    // If opponent has declared 40 in trump, occasionally lead trump to pressure
    if (opponentHasForty && trumps.length >= 2) {
      return [...trumps].sort((a, b) => getCardPower(b) - getCardPower(a))[0];
    }
    // Early game: prioritize descartarse by shedding a short non-trump suit
    if (gameState.deck.length > AI_THRESHOLDS.MANY_CARDS_LEFT) {
      const suitCounts = new Map<SpanishSuit, number>();
      nonTrumps.forEach(c => {
        suitCounts.set(c.suit, (suitCounts.get(c.suit) || 0) + 1);
      });
      const targetSuit = [...suitCounts.entries()].sort((a, b) => a[1] - b[1])[0]?.[0];
      const targetSuitCards = targetSuit ? nonTrumps.filter(c => c.suit === targetSuit) : nonTrumps;
      // Play lowest power in that suit to avoid winning
      return [...targetSuitCards].sort((a, b) => getCardPower(a) - getCardPower(b))[0];
    }
    // Early game with many cards left
    if (gameState.deck.length > AI_THRESHOLDS.MANY_CARDS_LEFT) {
      // Lead with medium strength cards to probe
      const mediumCards = nonTrumps.filter(c => {
        const power = getCardPower(c);
        return power >= 4 && power <= 7;
      });
      if (mediumCards.length > 0) {
        return mediumCards[Math.floor(Math.random() * mediumCards.length)];
      }
    }

    // Mid-late draw phase - lead with high non-trumps
    const highCards = nonTrumps.filter(c => getCardPower(c) >= 8);
    if (highCards.length > 0) {
      return highCards[0];
    }

    // No high cards - play lowest non-trump
    return [...nonTrumps].sort((a, b) => getCardPower(a) - getCardPower(b))[0];
  }

  // Only trumps left - play lowest
  return [...trumps].sort((a, b) => getCardPower(a) - getCardPower(b))[0];
}

function selectFollowingCard(
  validCards: readonly Card[],
  winningCards: readonly Card[],
  trickValue: number,
  gameState: GameState,
  shouldDuck: boolean = Math.random() < AI_PROBABILITIES.DUCK_LOW_TRICK,
): Card {
  const { phase, trumpSuit } = gameState;

  // Separate trumps and non-trumps
  const nonTrumpWinners = winningCards.filter(c => c.suit !== trumpSuit);
  const trumpWinners = winningCards.filter(c => c.suit === trumpSuit);
  const nonTrumpLosers = validCards.filter(c => c.suit !== trumpSuit && !winningCards.includes(c));
  const trumpLosers = validCards.filter(c => c.suit === trumpSuit && !winningCards.includes(c));

  // PHASE-AWARE STRATEGY
  if (phase === 'arrastre' || gameState.isVueltas) {
    // ARRASTRE: Very conservative with trumps
    if (winningCards.length > 0) {
      // High value trick - must win but preserve trumps if possible
      if (trickValue >= AI_THRESHOLDS.HIGH_VALUE_TRICK) {
        // Try to win without trumps first
        if (nonTrumpWinners.length > 0) {
          return [...nonTrumpWinners].sort((a, b) => getCardPower(a) - getCardPower(b))[0];
        }
        // Only use trump if necessary
        return [...trumpWinners].sort((a, b) => getCardPower(a) - getCardPower(b))[0];
      }

      // Medium value - try to win without trumps
      if (trickValue >= AI_THRESHOLDS.VALUABLE_TRICK && nonTrumpWinners.length > 0) {
        return [...nonTrumpWinners].sort((a, b) => getCardPower(a) - getCardPower(b))[0];
      }
    }

    // Can't win or low value - never waste trumps
    if (nonTrumpLosers.length > 0) {
      // Discard lowest point non-trump
      return [...nonTrumpLosers].sort((a, b) => getCardPoints(a) - getCardPoints(b))[0];
    }

    // Only trumps left - play lowest
    return [...validCards].sort((a, b) => getCardPower(a) - getCardPower(b))[0];
  }

  // DRAW PHASE: More flexible but still smart
  if (phase === 'playing') {
    if (winningCards.length > 0) {
      // Very valuable trick - win it
      if (trickValue >= AI_THRESHOLDS.HIGH_VALUE_TRICK) {
        // Prefer non-trumps for winning
        if (nonTrumpWinners.length > 0) {
          return [...nonTrumpWinners].sort((a, b) => getCardPower(a) - getCardPower(b))[0];
        }
        // Use trump only if needed
        if (Math.random() > AI_PROBABILITIES.SAVE_TRUMP_DRAW) {
          return [...trumpWinners].sort((a, b) => getCardPower(a) - getCardPower(b))[0];
        }
      }

      // Low value trick in early game - often duck
      if (
        gameState.deck.length > AI_THRESHOLDS.MANY_CARDS_LEFT &&
        trickValue < AI_THRESHOLDS.LOW_VALUE_TRICK &&
        shouldDuck
      ) {
        // Prefer discarding non-trumps
        if (nonTrumpLosers.length > 0) {
          return [...nonTrumpLosers].sort((a, b) => getCardPoints(a) - getCardPoints(b))[0];
        }
      }

      // Default: win with non-trump if possible
      if (nonTrumpWinners.length > 0) {
        return [...nonTrumpWinners].sort((a, b) => getCardPower(a) - getCardPower(b))[0];
      }

      // Only use trump if really needed (15% chance in draw phase)
      if (trumpWinners.length > 0 && Math.random() < AI_PROBABILITIES.AGGRESSIVE_TRUMP) {
        return [...trumpWinners].sort((a, b) => getCardPower(a) - getCardPower(b))[0];
      }
    }
  }

  // Can't win - discard wisely
  // Always prefer discarding non-trumps
  if (nonTrumpLosers.length > 0) {
    return [...nonTrumpLosers].sort((a, b) => getCardPoints(a) - getCardPoints(b))[0];
  }

  // Only trumps available - play lowest
  const sortedByPoints = [...validCards].sort((a, b) => {
    const pointDiff = getCardPoints(a) - getCardPoints(b);
    if (pointDiff !== 0) return pointDiff;
    return getCardPower(a) - getCardPower(b);
  });

  return sortedByPoints[0];
}

function playStrategicCard(
  validCards: readonly Card[],
  hand: readonly Card[],
  gameState: GameState,
  playerId: PlayerId,
): Card {
  const { currentTrick, trumpSuit, phase } = gameState;

  // Starting a trick
  if (currentTrick.length === 0) {
    // Avoid winning the 4th trick (últimas) of robada to not lead arrastre
    if (gameState.trickCount === 3 && phase === 'playing') {
      const nonTrumps = validCards.filter(c => c.suit !== trumpSuit);
      const candidates = nonTrumps.length > 0 ? nonTrumps : validCards;
      return [...candidates].sort((a, b) => getCardPower(a) - getCardPower(b))[0];
    }
    // Filter out cards that are part of cantes we want to preserve
    const playableCards = validCards.filter(card => !shouldPreserveCante(card, hand, gameState));

    // If all cards are part of cantes, use all valid cards
    const cardsToConsider = playableCards.length > 0 ? playableCards : validCards;

    return selectLeadingCard(cardsToConsider, trumpSuit, phase, gameState);
  }

  // Following in a trick
  const trickValue = getTrickPoints(currentTrick);

  // Check if partner is winning
  let partnerIsWinning = false;
  if (currentTrick.length > 0) {
    const currentWinner = calculateTrickWinner(currentTrick, trumpSuit);
    const team = gameState.teams.find(t => t.playerIds.includes(playerId));
    if (team && team.playerIds.includes(currentWinner) && currentWinner !== playerId) {
      partnerIsWinning = true;
    }
  }

  // Special 4th player strategy in arrastre when partner is winning
  const isFourthPlayer = currentTrick.length === 3;
  const leadSuit = currentTrick.length > 0 ? currentTrick[0].card.suit : null;
  const hasSuit = leadSuit ? hand.some(c => c.suit === leadSuit) : false;
  
  if (phase === 'arrastre' && isFourthPlayer && partnerIsWinning && !hasSuit) {
    // 4th player with partner winning and no suit - can discard anything
    // Strategy: discard lowest value cards, preserve trumps and high cards
    const sortedByValue = [...validCards].sort((a, b) => {
      // First prefer non-trumps
      if (a.suit === trumpSuit && b.suit !== trumpSuit) return 1;
      if (a.suit !== trumpSuit && b.suit === trumpSuit) return -1;
      // Then sort by points
      return getCardPoints(a) - getCardPoints(b);
    });
    return sortedByValue[0]; // Play lowest value non-trump if possible
  }

  // If partner is winning a valuable trick, give them points
  if (partnerIsWinning && trickValue >= AI_THRESHOLDS.VALUABLE_TRICK) {
    // Give high point cards to partner
    const sortedByPoints = [...validCards].sort((a, b) => getCardPoints(b) - getCardPoints(a));
    // But avoid giving trumps if possible
    const nonTrumps = sortedByPoints.filter(c => c.suit !== trumpSuit);
    if (nonTrumps.length > 0) {
      return nonTrumps[0];
    }
    return sortedByPoints[0];
  }

  // Can we win the trick?
  const winningCards = validCards.filter(card =>
    canWinTrick(card, currentTrick, trumpSuit, playerId),
  );

  return selectFollowingCard(validCards, winningCards, trickValue, gameState);
}

export function playAICard(
  hand: readonly Card[],
  gameState: GameState,
  player?: Player,
  memory?: CardMemory,
): Card | null {
  const { currentTrick, trumpSuit, phase } = gameState;

  // Ensure player ID is always defined for validation
  const playerId = player?.id || AI_FALLBACK_ID;

  // Get all valid cards
  const validCards = hand.filter(card =>
    isValidPlay(
      card,
      hand,
      currentTrick,
      trumpSuit,
      phase,
      playerId, // Always pass a defined ID
      gameState,
    ),
  );

  // If no valid cards in arrastre, something is wrong - try to find a valid card
  if (validCards.length === 0) {
    console.error('❌ CRITICAL: No valid cards found! This should never happen.', {
      phase,
      handSize: hand.length,
      trickSize: currentTrick.length,
      trumpSuit,
      playerId,
    });

    // Enhanced fallback logic - validate each candidate before returning
    if (hand.length > 0) {
      // Try different strategies to find a valid card

      // Strategy 1: If starting a trick, all cards should be valid
      if (currentTrick.length === 0) {
        // In arrastre, when starting a trick, all cards should be valid
        // Double-check each card
        for (const card of hand) {
          if (isValidPlay(card, hand, currentTrick, trumpSuit, phase, playerId, gameState)) {
            console.warn('🔧 Fallback: Found valid card for trick start:', 
              `${card.value} de ${card.suit}`);
            return card;
          }
        }
      } else {
        // Strategy 2: Try to follow suit
        const leadSuit = currentTrick[0].card.suit;
        const suitCards = hand.filter(c => c.suit === leadSuit);
        for (const card of suitCards) {
          if (isValidPlay(card, hand, currentTrick, trumpSuit, phase, playerId, gameState)) {
            console.warn('🔧 Fallback: Found valid suit card:', 
              `${card.value} de ${card.suit}`);
            return card;
          }
        }

        // Strategy 3: Try trumps
        const trumpCards = hand.filter(c => c.suit === trumpSuit);
        for (const card of trumpCards) {
          if (isValidPlay(card, hand, currentTrick, trumpSuit, phase, playerId, gameState)) {
            console.warn('🔧 Fallback: Found valid trump:', 
              `${card.value} de ${card.suit}`);
            return card;
          }
        }

        // Strategy 4: Try any card
        for (const card of hand) {
          if (isValidPlay(card, hand, currentTrick, trumpSuit, phase, playerId, gameState)) {
            console.warn('🔧 Fallback: Found valid card:', 
              `${card.value} de ${card.suit}`);
            return card;
          }
        }
      }

      // CRITICAL: No valid card found after trying everything
      // This indicates a serious bug in the game rules
      // Return the first card as absolute last resort to prevent game freeze
      console.error('❌ CRITICAL BUG: No valid moves found after trying all cards!', {
        phase,
        currentTrick: currentTrick.map(tc => `${tc.card.value} de ${tc.card.suit}`),
        hand: hand.map(c => `${c.value} de ${c.suit}`),
        trumpSuit,
        playerId,
      });
      console.error('🚨 Returning first card to prevent freeze - THIS IS A BUG!');
      return hand[0];
    }
    return null;
  }

  if (validCards.length === 1) return validCards[0];

  const difficulty = player?.difficulty || 'medium';
  const personality = player?.personality || 'aggressive';

  let selectedCard: Card;

  // Select card based on difficulty
  switch (difficulty) {
    case 'easy':
      selectedCard = playEasyAI(validCards, currentTrick, trumpSuit);
      break;

    case 'hard': {
      // Find partner ID
      const team = gameState.teams.find(t => t.playerIds.includes(playerId));
      const partnerId = team?.playerIds.find(id => id !== playerId);

      if (memory && partnerId) {
        selectedCard = playHardAI(validCards, hand, gameState, memory, partnerId, playerId);
      } else {
        // Fallback to medium if no memory
        selectedCard = playMediumAI(validCards, hand, gameState, playerId, memory);
      }
      break;
    }

    case 'medium':
    default:
      selectedCard = playMediumAI(validCards, hand, gameState, playerId, memory);
      break;
  }

  // Apply personality modifier
  if (player?.personality) {
    selectedCard = applyPersonality(selectedCard, validCards, personality, gameState);
  }

  return selectedCard;
}

export function shouldAICante(
  player: Player,
  hand: readonly Card[],
  gameState: GameState,
): SpanishSuit | null {
  const difficulty = player.difficulty || 'medium';
  const personality = player.personality || 'aggressive';

  // Find all possible cantes
  const suits: SpanishSuit[] = ['oros', 'copas', 'espadas', 'bastos'];
  const possibleCantes = suits.filter(suit => hasCante(hand, suit));

  if (possibleCantes.length === 0) return null;

  // Easy: Always cante immediately
  if (difficulty === 'easy') {
    return possibleCantes[0];
  }

  // Check game phase and score
  const team = gameState.teams.find(t => t.playerIds.includes(player.id));
  const otherTeam = gameState.teams.find(t => !t.playerIds.includes(player.id));

  if (!team || !otherTeam) return null;

  const scoreDiff = team.score - otherTeam.score;

  // Hard: Strategic cante timing
  if (difficulty === 'hard') {
    // Don't cante if we're way ahead
    if (scoreDiff > AI_THRESHOLDS.CANTE_AHEAD_THRESHOLD) return null;

    // Cante trump suit last for maximum benefit
    const nonTrumpCantes = possibleCantes.filter(suit => suit !== gameState.trumpSuit);

    if (nonTrumpCantes.length > 0) {
      return nonTrumpCantes[0];
    }

    // Save trump cante for arrastre phase
    if (
      gameState.phase === 'playing' &&
      gameState.deck.length > AI_THRESHOLDS.CANTE_DECK_THRESHOLD
    ) {
      return null;
    }

    return possibleCantes[0];
  }

  // Medium: Basic timing
  // Cante if behind or in arrastre phase
  if (scoreDiff < AI_THRESHOLDS.CANTE_BEHIND_THRESHOLD || gameState.phase === 'arrastre') {
    return possibleCantes[0];
  }

  // Personality modifiers
  switch (personality) {
    case 'aggressive':
      // Aggressive: cante early
      if (Math.random() < AI_PROBABILITIES.AGGRESSIVE_CANTE) return possibleCantes[0];
      break;

    case 'prudent':
      // Defensive: save cantes
      if (gameState.phase === 'arrastre' || scoreDiff < AI_THRESHOLDS.CANTE_FAR_BEHIND_THRESHOLD) {
        return possibleCantes[0];
      }
      break;

    case 'tricky':
      // Unpredictable timing
      if (Math.random() < AI_PROBABILITIES.TRICKY_CANTE) return possibleCantes[0];
      break;
  }

  return null;
}

function gaussianRandom(): number {
  // Box-Muller transform for normal distribution
  let u = 0,
    v = 0;
  while (u === 0) u = Math.random(); // Converting [0,1) to (0,1)
  while (v === 0) v = Math.random();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  // Normalize to 0-1 range with most values around 0.5
  return Math.max(0, Math.min(1, num / 4 + 0.5));
}

export function getAIThinkingTime(player: Player, isComplexDecision: boolean = false): number {
  const difficulty = player.difficulty || 'medium';

  // Base times in milliseconds - more human-like ranges
  const baseTimes: Record<DifficultyLevel, [number, number]> = {
    easy: [300, 800], // Quick but not instant
    medium: [500, 1400], // More deliberate
    hard: [700, 1800], // Thoughtful player
  };

  const [min, max] = baseTimes[difficulty];

  // Personality base modifiers
  let personalityMultiplier = 1;
  let snapDecisionChance = 0.1; // 10% base chance for quick play
  let deepThinkChance = 0.05; // 5% base chance for long think

  switch (player.personality) {
    case 'aggressive':
      personalityMultiplier = 0.75; // Generally faster
      snapDecisionChance = 0.2; // More snap decisions
      deepThinkChance = 0.02; // Rarely overthinks
      break;
    case 'prudent':
      personalityMultiplier = 1.3; // Generally slower
      snapDecisionChance = 0.05; // Rarely snaps
      deepThinkChance = 0.15; // Often thinks deeply
      break;
    case 'tricky':
      personalityMultiplier = 0.9;
      snapDecisionChance = 0.15;
      deepThinkChance = 0.1;
      // Add extra randomness for tricky players
      personalityMultiplier *= 0.7 + Math.random() * 0.6;
      break;
  }

  // Contextual modifiers
  const complexityModifier = isComplexDecision ? 1.4 : 1.0;

  // Random decision types (snap, normal, deep think)
  const roll = Math.random();

  if (roll < snapDecisionChance && !isComplexDecision) {
    // Snap decision - very quick play
    const snapTime = 150 + Math.random() * 250; // 150-400ms
    return Math.floor(snapTime * personalityMultiplier);
  } else if (roll > 1 - deepThinkChance && isComplexDecision) {
    // Deep thinking - extra long pause
    const thinkTime = 2000 + Math.random() * 1500; // 2-3.5 seconds
    return Math.floor(thinkTime * personalityMultiplier);
  }

  // Normal play with natural distribution
  const normalizedValue = gaussianRandom();
  const baseTime = min + (max - min) * normalizedValue;

  // Add micro-hesitations (small random variations)
  const microHesitation = Math.random() < 0.3 ? 50 + Math.random() * 150 : 0;

  // Calculate final time with all modifiers
  const finalTime = (baseTime + microHesitation) * personalityMultiplier * complexityModifier;

  // Add very slight "thinking" variation to make it less predictable
  const jitter = -20 + Math.random() * 40; // ±20ms jitter

  return Math.floor(Math.max(100, finalTime + jitter)); // Never less than 100ms
}
