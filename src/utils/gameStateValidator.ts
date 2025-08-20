import type { GameState, CardId } from '../types/game.types';

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate game state for consistency and rule compliance
 */
export function validateGameState(state: GameState): ValidationResult {
  const errors: string[] = [];

  // 1. Check 40 cards total
  const cardsInDeck = state.deck.length;
  const cardsInHands = Array.from(state.hands.values()).reduce((sum, hand) => sum + hand.length, 0);
  const cardsInTrick = state.currentTrick.length;
  const cardsCollected = Array.from(state.collectedTricks.values()).reduce(
    (sum, tricks) => sum + tricks.flat().length,
    0,
  );

  const totalCards = cardsInDeck + cardsInHands + cardsInTrick + cardsCollected;

  if (totalCards !== 40) {
    errors.push(
      `Card count mismatch: ${totalCards}/40 (deck:${cardsInDeck}, hands:${cardsInHands}, trick:${cardsInTrick}, collected:${cardsCollected})`,
    );
  }

  // 2. Check no duplicate cards
  const seenCards = new Set<CardId>();

  // Check deck
  for (const card of state.deck) {
    if (seenCards.has(card.id)) {
      errors.push(`Duplicate card in deck: ${card.id}`);
    }
    seenCards.add(card.id);
  }

  // Check hands
  for (const [playerId, hand] of state.hands) {
    for (const card of hand) {
      if (seenCards.has(card.id)) {
        errors.push(`Duplicate card in hand ${playerId}: ${card.id}`);
      }
      seenCards.add(card.id);
    }
  }

  // Check current trick
  for (const tc of state.currentTrick) {
    if (seenCards.has(tc.card.id)) {
      errors.push(`Duplicate card in current trick: ${tc.card.id}`);
    }
    seenCards.add(tc.card.id);
  }

  // Check collected tricks
  for (const [playerId, tricks] of state.collectedTricks) {
    for (const trick of tricks) {
      for (const tc of trick) {
        if (seenCards.has(tc.card.id)) {
          errors.push(`Duplicate card in collected tricks ${playerId}: ${tc.card.id}`);
        }
        seenCards.add(tc.card.id);
      }
    }
  }

  // 3. Phase transition validation
  if (state.phase === 'arrastre' && state.deck.length > 0) {
    errors.push(`Invalid state: Arrastre phase with ${state.deck.length} cards in deck`);
  }

  if (state.phase === 'playing' && state.deck.length === 0 && !state.isVueltas) {
    errors.push('Invalid state: Playing phase with empty deck (should be arrastre)');
  }

  // 4. Score consistency
  const totalCardPoints = state.teams[0].cardPoints + state.teams[1].cardPoints;
  if (totalCardPoints > 130) {
    errors.push(`Total card points exceed 130: ${totalCardPoints}`);
  }

  // 5. Current player index validation
  if (state.currentPlayerIndex < 0 || state.currentPlayerIndex >= state.players.length) {
    errors.push(`Invalid current player index: ${state.currentPlayerIndex}`);
  }

  // 6. Dealer index validation
  if (state.dealerIndex < 0 || state.dealerIndex >= state.players.length) {
    errors.push(`Invalid dealer index: ${state.dealerIndex}`);
  }

  // 7. Trick size validation
  if (state.currentTrick.length > 4) {
    errors.push(`Current trick has too many cards: ${state.currentTrick.length}`);
  }

  // 8. Team structure validation
  if (state.teams.length !== 2) {
    errors.push(`Invalid number of teams: ${state.teams.length}`);
  }

  // Check each team has exactly 2 players
  for (const team of state.teams) {
    if (team.playerIds.length !== 2) {
      errors.push(`Team ${team.id} has ${team.playerIds.length} players (should be 2)`);
    }
  }

  // 9. Player count validation
  if (state.players.length !== 4) {
    errors.push(`Invalid number of players: ${state.players.length} (should be 4)`);
  }

  // 10. Trump card validation
  if (state.phase === 'playing' || state.phase === 'arrastre') {
    // Trump card should match trump suit
    if (state.trumpCard.suit !== state.trumpSuit) {
      errors.push(
        `Trump card suit (${state.trumpCard.suit}) doesn't match trump suit (${state.trumpSuit})`,
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate state transition between two states
 */
export function validateStateTransition(
  oldState: GameState,
  newState: GameState,
): ValidationResult {
  const errors: string[] = [];

  // Check valid phase transitions
  const validTransitions: Record<string, string[]> = {
    waiting: ['dealing'],
    dealing: ['playing'],
    playing: ['arrastre', 'scoring', 'gameOver'],
    arrastre: ['scoring', 'gameOver'],
    scoring: ['dealing', 'gameOver'],
    gameOver: [],
    finished: [],
  };

  if (oldState.phase !== newState.phase) {
    const allowedPhases = validTransitions[oldState.phase] || [];
    if (!allowedPhases.includes(newState.phase)) {
      errors.push(`Invalid phase transition: ${oldState.phase} -> ${newState.phase}`);
    }
  }

  // Check scores only increase
  for (let i = 0; i < 2; i++) {
    if (newState.teams[i].score < oldState.teams[i].score) {
      errors.push(
        `Team ${i} score decreased: ${oldState.teams[i].score} -> ${newState.teams[i].score}`,
      );
    }
    if (newState.teams[i].cardPoints < oldState.teams[i].cardPoints) {
      errors.push(
        `Team ${i} card points decreased: ${oldState.teams[i].cardPoints} -> ${newState.teams[i].cardPoints}`,
      );
    }
  }

  // Check trick count only increases
  if (newState.trickCount < oldState.trickCount) {
    errors.push(`Trick count decreased: ${oldState.trickCount} -> ${newState.trickCount}`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
