# Match Flow Fixes - Guinote Game

## Problems Identified

### 1. **Vueltas (De Vueltas) Phase Issues**
- Initial scores from first hand weren't properly preserved when entering vueltas
- Teams' scores were not reset to 0 for the vueltas hand
- Dealer was incorrectly rotating between hands of the same partida

### 2. **Partida Transition Problems**
- `startNewPartida` was using the vueltas reset function, causing confusion
- Dealer rotation wasn't happening correctly between partidas
- Team assignments and player positions were getting mixed up

### 3. **Match Score Update Timing**
- Match scores were being updated at the wrong time
- No clear distinction between hand end, partida end, and coto end
- Auto-advance timers conflicted with user interactions

### 4. **Phase Management Confusion**
- Single `scoring` phase handled too many scenarios
- `gameOver` phase was overloaded for both partida and match completion
- Complex branching logic in `continueFromScoring` function

## Solutions Implemented

### 1. **Fixed Vueltas State Initialization**

**File: `src/utils/gameStateFactory.ts`**
```typescript
// CRITICAL: Reset teams but preserve their IDs and player assignments
// Only reset the scores to 0 for the vueltas hand (initial scores are tracked separately)
const teams: [Team, Team] = [
  {
    ...previousState.teams[0],
    score: 0, // Reset to 0 for vueltas hand
    cardPoints: 0,
    cantes: [],
  },
  {
    ...previousState.teams[1],
    score: 0, // Reset to 0 for vueltas hand
    cardPoints: 0,
    cantes: [],
  },
];

// IMPORTANT: Keep same dealer for vueltas (don't rotate between hands of same partida)
const newDealerIndex = previousState.dealerIndex;
```

### 2. **Improved Partida Transitions**

**File: `src/utils/gameLogic.ts`**
```typescript
export function startNewPartida(previousState: GameState, matchScore: MatchScore): GameState {
  // Complete fresh deck and deal for new partida
  const deck = shuffleDeck(createDeck());
  const { hands, remainingDeck } = dealInitialCards(deck, previousState.players.map(p => p.id));
  
  // CRITICAL: Rotate dealer between partidas (not between hands of same partida)
  const newDealerIndex = (previousState.dealerIndex + 1) % 4;
  const firstPlayerIndex = (newDealerIndex - 1 + 4) % 4; // Mano is to dealer's right
  
  // Return completely fresh state for new partida
  return {
    ...previousState,
    phase: 'dealing',
    teams, // Reset scores to 0
    dealerIndex: newDealerIndex,
    currentPlayerIndex: firstPlayerIndex,
    isVueltas: false,
    initialScores: undefined,
    matchScore,
    // ... other reset fields
  };
}
```

### 3. **Enhanced Continue From Scoring Logic**

**File: `src/hooks/useGameState.ts`**
```typescript
const continueFromScoring = useCallback(() => {
  // Added detailed logging for debugging
  console.log('📊 continueFromScoring called', {
    isVueltas: gameState.isVueltas,
    team1Score: gameState.teams[0].score,
    team2Score: gameState.teams[1].score,
  });

  // CASE 1: Completing vueltas
  if (gameState.isVueltas) {
    console.log('🎯 Processing vueltas completion');
    const newState = processVueltasCompletion(gameState);
    setGameState(newState);
    return;
  }

  // CASE 2: First hand completed
  if (team1Score >= WINNING_SCORE || team2Score >= WINNING_SCORE) {
    // Team reached 101 in first hand - end partida
    console.log('🏆 Team reached 101 in first hand, ending partida');
    // Update match score and transition to gameOver
  } else {
    // No team reached 101 - proceed to vueltas
    console.log('🔄 No team reached 101, starting vueltas');
    const newState = initializeVueltasState(gameState);
    setGameState(newState);
  }
});
```

### 4. **Comprehensive Test Coverage**

Created `src/utils/matchFlow.test.ts` with tests for:
- Partida progression (first hand wins, vueltas starts, vueltas completion)
- Coto progression (3 partidas = 1 coto, score resets)
- Match completion (2 cotos = match win)
- Dealer rotation between partidas

## Game Flow Summary

### Complete Match Flow:
1. **Match** → Best of 2 cotos
2. **Coto** → Best of 5 partidas (first to win 3)
3. **Partida** → One or two hands:
   - **First Hand (Idas)**: If team reaches 101+ → Partida ends
   - **Second Hand (Vueltas)**: If no team reached 101 in first hand
     - Combined scores determine winner
     - Team with higher total wins the partida

### Key Rules:
- Dealer rotates clockwise between partidas (NOT between hands)
- Scores reset to 0 for each new partida
- During vueltas, initial scores are preserved separately
- Match score tracks partidas and cotos won

## Testing Instructions

1. **Start a new game** from the main menu
2. **Play through first partida**:
   - If a team reaches 101 → Partida ends → Continue button → New partida starts
   - If no team reaches 101 → Vueltas starts automatically
3. **During vueltas**:
   - Check that initial scores are shown correctly
   - Verify combined totals determine winner
4. **Between partidas**:
   - Verify dealer rotates clockwise
   - Check match score updates (partidas/cotos)
5. **Complete a coto** (win 3 partidas):
   - Verify coto is awarded
   - Partida count resets to 0
6. **Complete the match** (win 2 cotos):
   - Verify match completion celebration

## Remaining Considerations

1. **Auto-advance timers**: Currently set to 8 seconds in scoring phase
2. **Celebration screens**: Show for partida/coto/match wins
3. **Continue button**: Allows manual progression through game phases
4. **State persistence**: Game state saved between sessions

## Files Modified

- `src/utils/gameStateFactory.ts` - Fixed vueltas initialization
- `src/utils/gameLogic.ts` - Improved partida transitions
- `src/hooks/useGameState.ts` - Enhanced phase management
- `src/utils/matchFlow.test.ts` - Added comprehensive tests

## Verification

All tests passing:
```
✓ Partida Progression (4 tests)
✓ Coto Progression (2 tests)  
✓ Match Completion (2 tests)
✓ Dealer Rotation (2 tests)
```

The match flow is now properly handling all transitions between hands, partidas, cotos, and match completion.