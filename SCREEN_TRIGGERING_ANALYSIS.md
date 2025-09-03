# Screen Triggering Analysis: Fin de Mano & Partida Ganada

## Summary

The "fin de mano" (end of hand) and "partida ganada" (match won) screens are correctly implemented and should trigger at the appropriate times. I've added debug logging to help track when they trigger.

## How the Screens Work

### 1. Fin de Mano (HandEndOverlay)
**When it triggers:**
- Phase changes to `'scoring'` after the last trick of a hand
- Located in `GameScreen.tsx` lines 275-333

**Trigger conditions:**
```javascript
// In useGameState.ts lines 646-648
const isLastTrick = 
  prevState.deck.length === 0 && 
  Array.from(newHands.values()).every(hand => hand.length === 0);

// When isLastTrick is true, phase changes to 'scoring' (lines 713-715)
if (isLastTrick) {
  phase = 'scoring';
}
```

**What happens:**
1. When all cards are played (deck empty, all hands empty after last card)
2. Phase transitions to `'scoring'`
3. `HandEndOverlay` component becomes visible
4. Shows team scores, points from this hand, and cantes
5. If a team has 101+ points: shows victory message and auto-advances after 8 seconds
6. If no team has 101+: shows "CONTINUAR" button for user to click

### 2. Partida Ganada (GameEndCelebration) 
**When it triggers:**
- Phase changes to `'gameOver'` when a team wins
- Located in `GameScreen.tsx` lines 456-533 and 885-1027

**Trigger conditions:**
- Team reaches 101+ points (after scoring phase)
- Match completes (team wins required cotos)
- Called from `continueFromScoring()` when game is over

**What happens:**
1. Shows celebration animation (confetti for winner)
2. Displays final scores with animation
3. Shows trophy for match victories
4. Shows "CONTINUAR" button to play again or exit

## Debug Logging Added

I've added console.log statements to track the flow:

### In `gameEngineHelpers.ts`:
- `🎯 determineNextPhase called:` - Shows when phase transitions are evaluated
- `🏆 Transitioning to gameOver phase` - When game ends
- `📊 Transitioning to scoring phase` - When hand ends
- `🃏 isLastTrick check:` - Shows deck/hand sizes to verify last trick detection

### In `GameScreen.tsx`:
- `📊 [FIN DE MANO] Entering scoring phase` - When scoring phase starts
- `📄 [FIN DE MANO] HandEndOverlay should now be visible` - Confirms overlay visibility
- `🏆 [PARTIDA GANADA] Check celebration trigger` - Checks if celebration should show
- `🎮 [PARTIDA GANADA] GameScreen: gameOver phase` - When in game over phase

## Common Issues to Check

1. **Cards not being removed from hands:** 
   - Verify that `newHands` correctly removes played cards
   - Check that card IDs match when removing

2. **Deck not emptying:**
   - Verify deck cards are being drawn after tricks
   - Check post-trick dealing logic

3. **Phase not transitioning:**
   - Check if `isLastTrick` is correctly detecting empty deck/hands
   - Verify phase update logic in `actuallyPlayCard`

4. **Overlays not showing:**
   - Check `showHandEndOverlay` state is set to true
   - Verify Modal visibility props
   - Check if phase changes are triggering useEffect hooks

## Testing Recommendations

1. **Play a quick game to the end** and watch the console for:
   - `isLastTrick check` logs showing deck/hand sizes
   - Phase transition logs
   - Overlay visibility logs

2. **Fast testing:** 
   - Modify initial scores to be close to 101 for faster testing
   - Use console to manually set game state phase to test screens

3. **Key moments to watch:**
   - When playing the last card from hand
   - When deck becomes empty  
   - When team score reaches 101+
   - Transition from scoring to gameOver

## Questions to Answer

To fully debug, we need to know:
1. **Are the screens not showing at all?** Or showing at wrong times?
2. **What does the console output show** when you play through a hand?
3. **Do the debug logs show** the phase transitions happening?
4. **Are there any error messages** in the console?

## Next Steps

1. **Test the game** with the new debug logging
2. **Check console output** for the debug messages
3. **Verify phase transitions** are happening correctly
4. If screens still don't show, check:
   - Modal rendering issues
   - State update timing
   - Animation completion callbacks