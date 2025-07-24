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
import type { SpanishSuit } from '../components/game/SpanishCard';
import { CARD_POINTS } from '../types/game.types';
import { isValidPlay, calculateTrickWinner } from './gameLogic';
import type { CardMemory } from './aiMemory';
import { getRemainingHighCards } from './aiMemory';

// AI decision thresholds
const AI_THRESHOLDS = {
  VALUABLE_TRICK: 10,
  HIGH_VALUE_TRICK: 15,
  LOW_POWER_CARD: 5,
  MANY_CARDS_LEFT: 20,
  LOW_VALUE_TRICK: 5,
  CANTE_AHEAD_THRESHOLD: 40,
  CANTE_BEHIND_THRESHOLD: -20,
  CANTE_FAR_BEHIND_THRESHOLD: -30,
  CANTE_DECK_THRESHOLD: 15,
  CANTE_FEW_CARDS: 8,
} as const;

// AI probability constants
const AI_PROBABILITIES = {
  DUCK_LOW_TRICK: 0.5,
  AGGRESSIVE_CANTE: 0.8,
  AGGRESSIVE_TRUMP: 0.7,
  TRICKY_RANDOM: 0.3,
  TRICKY_CANTE: 0.6,
} as const;

function getCardPower(card: Card): number {
  const powerRanking: Record<number, number> = {
    1: 10, // As
    3: 9, // Tres
    12: 8, // Rey
    11: 7, // Caballo
    10: 6, // Sota
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
): boolean {
  if (currentTrick.length === 0) return true;

  const trickWithAI = [...currentTrick, { playerId: 'ai' as any, card }];
  const winnerId = calculateTrickWinner(trickWithAI, trumpSuit);

  return winnerId === 'ai';
}

function getTrickPoints(trick: readonly TrickCard[]): number {
  return trick.reduce((sum, tc) => sum + getCardPoints(tc.card), 0);
}

function hasCante(hand: readonly Card[], suit: SpanishSuit): boolean {
  const hasRey = hand.some(c => c.suit === suit && c.value === 12);
  const hasSota = hand.some(c => c.suit === suit && c.value === 10);
  return hasRey && hasSota;
}

function shouldPreserveCante(
  card: Card,
  hand: readonly Card[],
  gameState: GameState,
): boolean {
  // Don't preserve cantes if game is almost over
  if (
    gameState.phase === 'arrastre' ||
    gameState.deck.length < AI_THRESHOLDS.CANTE_FEW_CARDS
  )
    return false;

  // Check if this card is part of a cante
  if (card.value === 12 || card.value === 10) {
    return hasCante(hand, card.suit);
  }

  return false;
}

function playEasyAI(
  validCards: readonly Card[],
  _currentTrick: readonly TrickCard[],
  _trumpSuit: SpanishSuit,
): Card {
  // Easy AI: Random valid card
  const randomIndex = Math.floor(Math.random() * validCards.length);
  return validCards[randomIndex];
}

function playMediumAI(
  validCards: readonly Card[],
  hand: readonly Card[],
  gameState: GameState,
  _memory?: CardMemory,
): Card {
  // Medium AI: Current implementation with basic strategy
  return playStrategicCard(validCards, hand, gameState);
}

function playHardAI(
  validCards: readonly Card[],
  hand: readonly Card[],
  gameState: GameState,
  memory: CardMemory,
  partnerId: PlayerId,
): Card {
  const { currentTrick, trumpSuit } = gameState;

  // Count remaining high cards in each suit
  const suits: SpanishSuit[] = ['oros', 'copas', 'espadas', 'bastos'];
  const suitStrengths = new Map<SpanishSuit, number>();

  suits.forEach(suit => {
    const remaining = getRemainingHighCards(memory, suit);
    suitStrengths.set(suit, remaining);
  });

  // Starting a trick with card counting
  if (currentTrick.length === 0) {
    // Lead with suits where opponents likely have high cards
    const nonTrumps = validCards.filter(c => c.suit !== trumpSuit);

    if (nonTrumps.length > 0) {
      // Find suits where we have low cards and opponents might have high cards
      const lowCards = nonTrumps.filter(
        c => getCardPower(c) < AI_THRESHOLDS.LOW_POWER_CARD,
      );
      if (lowCards.length > 0) {
        // Lead with low card in suit with many remaining high cards
        return [...lowCards].sort((a, b) => {
          const aRemaining = suitStrengths.get(a.suit) || 0;
          const bRemaining = suitStrengths.get(b.suit) || 0;
          return bRemaining - aRemaining;
        })[0];
      }
    }
  }

  // Following with perfect memory
  if (currentTrick.length > 0) {
    const trickValue = getTrickPoints(currentTrick);
    const winningCards = validCards.filter(card =>
      canWinTrick(card, currentTrick, trumpSuit),
    );

    // Partner is winning the trick
    const currentWinner = calculateTrickWinner(currentTrick, trumpSuit);
    if (currentWinner === partnerId && winningCards.length > 0) {
      // Give points to partner
      return [...validCards].sort(
        (a, b) => getCardPoints(b) - getCardPoints(a),
      )[0];
    }

    // High value trick - win with optimal card
    if (
      trickValue >= AI_THRESHOLDS.HIGH_VALUE_TRICK &&
      winningCards.length > 0
    ) {
      return [...winningCards].sort(
        (a, b) => getCardPower(a) - getCardPower(b),
      )[0];
    }
  }

  // Fallback to strategic play
  return playStrategicCard(validCards, hand, gameState);
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
      if (
        currentTrick.length === 0 &&
        gameState.deck.length > AI_THRESHOLDS.MANY_CARDS_LEFT
      ) {
        const lowCards = validCards.filter(
          c => getCardPower(c) <= AI_THRESHOLDS.LOW_POWER_CARD,
        );
        if (lowCards.length > 0) {
          return lowCards[Math.floor(Math.random() * lowCards.length)];
        }
      }
      break;
    }

    case 'aggressive': {
      // Aggressive: prefer high cards and trumps
      if (currentTrick.length === 0) {
        const highCards = validCards.filter(c => getCardPower(c) >= 8);
        if (highCards.length > 0) {
          return highCards[0];
        }
      }
      // Trump aggressively
      const trumps = validCards.filter(c => c.suit === trumpSuit);
      if (
        trumps.length > 0 &&
        randomValue < AI_PROBABILITIES.AGGRESSIVE_TRUMP
      ) {
        return [...trumps].sort((a, b) => getCardPower(b) - getCardPower(a))[0];
      }
      break;
    }

    case 'tricky': {
      // Unpredictable: sometimes make unexpected plays
      if (randomValue < AI_PROBABILITIES.TRICKY_RANDOM) {
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
): Card {
  // In arrastre phase, be more conservative
  if (phase === 'arrastre') {
    // Lead with low non-trump cards first
    const nonTrumps = cardsToConsider.filter(c => c.suit !== trumpSuit);
    if (nonTrumps.length > 0) {
      return [...nonTrumps].sort(
        (a, b) => getCardPower(a) - getCardPower(b),
      )[0];
    }
  }

  // Normal phase: lead with highest non-trump
  const nonTrumps = cardsToConsider.filter(c => c.suit !== trumpSuit);
  if (nonTrumps.length > 0) {
    return [...nonTrumps].sort((a, b) => getCardPower(b) - getCardPower(a))[0];
  }

  // Only trumps left, play lowest
  return [...cardsToConsider].sort(
    (a, b) => getCardPower(a) - getCardPower(b),
  )[0];
}

function selectFollowingCard(
  validCards: readonly Card[],
  winningCards: readonly Card[],
  trickValue: number,
  gameState: GameState,
  shouldDuck: boolean = Math.random() < AI_PROBABILITIES.DUCK_LOW_TRICK,
): Card {
  const { phase } = gameState;

  if (winningCards.length > 0) {
    // Trick has valuable points, try to win it
    if (trickValue >= AI_THRESHOLDS.VALUABLE_TRICK) {
      // Win with lowest possible winning card
      return [...winningCards].sort(
        (a, b) => getCardPower(a) - getCardPower(b),
      )[0];
    }

    // Low value trick in early game, maybe let it go
    if (
      phase === 'playing' &&
      gameState.deck.length > AI_THRESHOLDS.MANY_CARDS_LEFT &&
      trickValue < AI_THRESHOLDS.LOW_VALUE_TRICK
    ) {
      // 50% chance to duck
      if (shouldDuck) {
        const losingCards = validCards.filter(c => !winningCards.includes(c));
        if (losingCards.length > 0) {
          return [...losingCards].sort(
            (a, b) => getCardPoints(a) - getCardPoints(b),
          )[0];
        }
      }
    }

    // Default: win with lowest winning card
    return [...winningCards].sort(
      (a, b) => getCardPower(a) - getCardPower(b),
    )[0];
  }

  // Can't win, play lowest point card
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
): Card {
  const { currentTrick, trumpSuit, phase } = gameState;

  // Starting a trick
  if (currentTrick.length === 0) {
    // Filter out cards that are part of cantes we want to preserve
    const playableCards = validCards.filter(
      card => !shouldPreserveCante(card, hand, gameState),
    );

    // If all cards are part of cantes, use all valid cards
    const cardsToConsider =
      playableCards.length > 0 ? playableCards : validCards;

    return selectLeadingCard(cardsToConsider, trumpSuit, phase);
  }

  // Following in a trick
  const trickValue = getTrickPoints(currentTrick);

  // Can we win the trick?
  const winningCards = validCards.filter(card =>
    canWinTrick(card, currentTrick, trumpSuit),
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

  // Get all valid cards
  const validCards = hand.filter(card =>
    isValidPlay(card, hand, currentTrick, trumpSuit, phase),
  );

  if (validCards.length === 0) return null;
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
      const team = gameState.teams.find(t =>
        player ? t.playerIds.includes(player.id) : false,
      );
      const partnerId = team?.playerIds.find(id => id !== player?.id);

      if (memory && partnerId) {
        selectedCard = playHardAI(
          validCards,
          hand,
          gameState,
          memory,
          partnerId,
        );
      } else {
        // Fallback to medium if no memory
        selectedCard = playMediumAI(validCards, hand, gameState, memory);
      }
      break;
    }

    case 'medium':
    default:
      selectedCard = playMediumAI(validCards, hand, gameState, memory);
      break;
  }

  // Apply personality modifier
  if (player?.personality) {
    selectedCard = applyPersonality(
      selectedCard,
      validCards,
      personality,
      gameState,
    );
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
    const nonTrumpCantes = possibleCantes.filter(
      suit => suit !== gameState.trumpSuit,
    );

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
  if (
    scoreDiff < AI_THRESHOLDS.CANTE_BEHIND_THRESHOLD ||
    gameState.phase === 'arrastre'
  ) {
    return possibleCantes[0];
  }

  // Personality modifiers
  switch (personality) {
    case 'aggressive':
      // Aggressive: cante early
      if (Math.random() < AI_PROBABILITIES.AGGRESSIVE_CANTE)
        return possibleCantes[0];
      break;

    case 'prudent':
      // Defensive: save cantes
      if (
        gameState.phase === 'arrastre' ||
        scoreDiff < AI_THRESHOLDS.CANTE_FAR_BEHIND_THRESHOLD
      ) {
        return possibleCantes[0];
      }
      break;

    case 'tricky':
      // Unpredictable timing
      if (Math.random() < AI_PROBABILITIES.TRICKY_CANTE)
        return possibleCantes[0];
      break;
  }

  return null;
}

export function getAIThinkingTime(
  player: Player,
  isComplexDecision: boolean = false,
): number {
  const difficulty = player.difficulty || 'medium';

  // Base times in milliseconds
  const baseTimes: Record<DifficultyLevel, [number, number]> = {
    easy: [500, 1000],
    medium: [800, 1500],
    hard: [1000, 2000],
  };

  const [min, max] = baseTimes[difficulty];

  // Add extra time for complex decisions
  const complexityBonus = isComplexDecision ? 500 : 0;

  // Personality affects thinking time
  let personalityMultiplier = 1;
  switch (player.personality) {
    case 'aggressive':
      personalityMultiplier = 0.8; // Faster decisions
      break;
    case 'prudent':
      personalityMultiplier = 1.2; // Slower, careful decisions
      break;
    case 'tricky':
      personalityMultiplier = Math.random() * 0.8 + 0.6; // Variable
      break;
  }

  const adjustedMin = (min + complexityBonus) * personalityMultiplier;
  const adjustedMax = (max + complexityBonus) * personalityMultiplier;

  return Math.floor(Math.random() * (adjustedMax - adjustedMin) + adjustedMin);
}
