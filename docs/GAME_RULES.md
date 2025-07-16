# Guiñote Game Rules - Technical Reference

## Game Overview

Guiñote is a Spanish trick-taking card game for 2 or 4 players (in partnerships). The goal is to be the first team to reach 101 points.

## The Deck

- **40 cards** from Spanish deck (baraja española)
- **4 suits**: Oros (coins), Copas (cups), Espadas (swords), Bastos (clubs)
- **10 ranks per suit**: 1, 2, 3, 4, 5, 6, 7, Sota (10), Caballo (11), Rey (12)

## Card Rankings (Power)

Order from highest to lowest:

1. As (Ace/1)
2. Tres (3)
3. Rey (King/12)
4. Caballo (Knight/11)
5. Sota (Jack/10)
6. 7, 6, 5, 4, 2

## Card Values (Points)

```typescript
const CARD_VALUES: Record<number, number> = {
  1: 11, // As (Ace)
  3: 10, // Tres
  12: 4, // Rey (King)
  11: 2, // Caballo (Knight)
  10: 3, // Sota (Jack)
  // Rest: 0 points
};
```

## Game Setup

### Dealing

- First game: Random player deals
- Subsequent games: Winner of "10 últimas" deals
- Deal pattern: 3 cards + 3 cards to each player (6 total)

### Trump Card

- 4 players: 25th card (place face-up under deck)
- 2 players: 13th card

```typescript
interface GameSetup {
  players: Player[]; // 2 or 4
  hands: Card[][]; // 6 cards each
  trumpCard: Card; // Visible under deck
  trumpSuit: Suit; // Determined by trump card
  deck: Card[]; // Remaining cards
  currentPlayer: number; // Dealer + 1
}
```

## Gameplay Phases

### Phase 1: Normal Play (Libre)

- Players can play any card
- No obligation to follow suit
- No obligation to beat cards
- Winner of trick leads next

### Phase 2: Arrastre (Forced Play)

Triggered when deck is empty:

- Must follow suit if possible
- Must beat the highest card if possible
- If can't follow suit, must play trump
- If can't beat, play lowest card

## Special Rules

### Cantes (Declarations)

```typescript
interface Cante {
  type: 'VEINTE' | 'CUARENTA';
  suit: Suit;
  points: 20 | 40;
}
```

Requirements:

- Have Rey + Sota of same suit
- Won the previous trick
- Declare before playing next card
- 40 points if trump suit, 20 otherwise

### Cambio de Siete (Seven Exchange)

- Player with 7 of trumps can exchange with trump card
- Must have won last trick
- Only during Phase 1 (while deck has cards)

### Diez Últimas (Last Ten)

- Team that wins the last trick gets 10 bonus points
- Critical for close games
- Winner deals next game

### Renuncio (Revoke)

Automatic loss if:

- Don't follow suit when required (arrastre)
- Don't beat when required (arrastre)
- Play out of turn
- Show cards illegally

## Scoring

```typescript
function calculateScore(tricks: Trick[]): TeamScores {
  const scores = { team1: 0, team2: 0 };

  // Card points
  tricks.forEach(trick => {
    const points = trick.cards.reduce(
      (sum, card) => sum + (CARD_VALUES[card.rank] || 0),
      0,
    );
    scores[trick.winner.team] += points;
  });

  // Cantes
  cantes.forEach(cante => {
    scores[cante.team] += cante.points;
  });

  // Last trick bonus
  if (lastTrick) {
    scores[lastTrick.winner.team] += 10;
  }

  return scores;
}
```

### Winning Conditions

- First team to 101 points wins the game
- Partida: Single game to 101
- Coto: Best of 3 partidas

### "30 Malas" Rule

- Cannot win with cantes alone
- Must have at least 30 points from cards
- Prevents winning purely through declarations

## Move Validation

```typescript
function isValidMove(
  gameState: GameState,
  player: Player,
  card: Card,
): ValidationResult {
  // Check turn
  if (gameState.currentPlayer !== player.id) {
    return { valid: false, reason: 'NOT_YOUR_TURN' };
  }

  // Check card ownership
  if (!player.hand.includes(card)) {
    return { valid: false, reason: 'CARD_NOT_IN_HAND' };
  }

  // Phase 1: Any card is valid
  if (gameState.phase === 'LIBRE') {
    return { valid: true };
  }

  // Phase 2: Arrastre rules
  if (gameState.phase === 'ARRASTRE') {
    const trick = gameState.currentTrick;
    const leadSuit = trick[0]?.suit;

    // Must follow suit
    const hasSuit = player.hand.some(c => c.suit === leadSuit);
    if (hasSuit && card.suit !== leadSuit) {
      return { valid: false, reason: 'MUST_FOLLOW_SUIT' };
    }

    // Must beat if possible
    const highestInTrick = getHighestCard(trick, gameState.trumpSuit);
    const canBeat = player.hand.some(c =>
      beats(c, highestInTrick, gameState.trumpSuit),
    );

    if (canBeat && !beats(card, highestInTrick, gameState.trumpSuit)) {
      return { valid: false, reason: 'MUST_BEAT' };
    }
  }

  return { valid: true };
}
```

## AI Decision Making

### Strategy Considerations

- Card counting: Track played cards
- Partner signals: First card indicates strength
- Trump management: Save trumps for arrastre
- Cante timing: Declare early if safe
- Point denial: Block opponent cantes

### Difficulty Levels

```typescript
const AI_STRATEGIES = {
  easy: {
    cardMemory: 0, // No memory
    optimalMoves: 0.3, // 30% optimal
    canteDelay: 0, // Immediate
  },
  medium: {
    cardMemory: 0.5, // Recent tricks
    optimalMoves: 0.5, // 50% optimal
    canteDelay: 1, // 1 round delay
  },
  hard: {
    cardMemory: 0.8, // Most cards
    optimalMoves: 0.8, // 80% optimal
    canteDelay: 2, // Strategic delay
  },
  expert: {
    cardMemory: 1.0, // Perfect memory
    optimalMoves: 0.95, // Near optimal
    canteDelay: 'optimal', // Calculated
  },
};
```

## Implementation Types

```typescript
type Suit = 'oros' | 'copas' | 'espadas' | 'bastos';
type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 10 | 11 | 12;

interface Card {
  suit: Suit;
  rank: Rank;
  id: string; // e.g., "oros_7"
}

interface Player {
  id: string;
  name: string;
  team: 1 | 2;
  hand: Card[];
}

interface Trick {
  cards: Card[];
  players: Player[];
  winner?: Player;
  leadSuit: Suit;
}

enum GamePhase {
  WAITING = 'WAITING',
  DEALING = 'DEALING',
  LIBRE = 'LIBRE',
  ARRASTRE = 'ARRASTRE',
  COUNTING = 'COUNTING',
  FINISHED = 'FINISHED',
}

interface GameState {
  id: string;
  phase: GamePhase;
  players: Player[];
  currentPlayer: number;
  trumpSuit: Suit;
  trumpCard: Card;
  deck: Card[];
  currentTrick: Card[];
  completedTricks: Trick[];
  score: { team1: number; team2: number };
  cantes: Cante[];
}
```

## Critical Edge Cases

1. **Last card of deck**: Triggers arrastre phase
2. **Multiple cantes**: Only one per turn allowed
3. **Seven exchange**: Timing on last possible turn
4. **Trick with all trumps**: Highest trump wins
5. **No valid moves**: Should never happen if rules followed
6. **Exact 101 points**: Game ends immediately
7. **Tie at 100**: Next point wins
8. **All cards same suit**: Highest rank wins

## Testing Scenarios

### Must Test

- All cante combinations (8 possible)
- Seven exchange at various times
- Arrastre phase transitions
- Renuncio detection (all types)
- Scoring edge cases
- 10 últimas in various scenarios
- AI decision making per difficulty
- Network disconnection during game
- Voice message during animations
- Card playing validation
