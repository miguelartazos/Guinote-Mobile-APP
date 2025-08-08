import { getAIThinkingTime } from '../aiPlayer';
import { AI_TIMING } from '../../constants/gameConstants';
import type { Player } from '../../types/game.types';

describe('AI Timing vs Recovery Timeout', () => {
  const difficulties = ['easy', 'medium', 'hard'] as const;
  const personalities = ['aggressive', 'prudent', 'tricky'] as const;
  
  it.each(difficulties)('should have recovery timeout > max thinking time for %s difficulty', (difficulty) => {
    personalities.forEach(personality => {
      // Create test player
      const player: Player = {
        id: 'test-bot',
        name: 'Test Bot',
        isBot: true,
        difficulty,
        personality,
        teamId: 0,
        hand: [],
        position: 0,
        isConnected: true,
      };
      
      // Test both simple and complex decisions
      const simpleDecisions: number[] = [];
      const complexDecisions: number[] = [];
      
      // Run multiple simulations to account for randomness
      for (let i = 0; i < 100; i++) {
        simpleDecisions.push(getAIThinkingTime(player, false));
        complexDecisions.push(getAIThinkingTime(player, true));
      }
      
      const maxSimpleTime = Math.max(...simpleDecisions);
      const maxComplexTime = Math.max(...complexDecisions);
      const absoluteMax = Math.max(maxSimpleTime, maxComplexTime);
      
      // Log for debugging
      console.log(`${difficulty} ${personality}:`, {
        maxSimple: maxSimpleTime,
        maxComplex: maxComplexTime,
        recoveryTimeout: AI_TIMING.RECOVERY_TIMEOUT,
      });
      
      // Recovery timeout should be greater than any possible thinking time
      expect(AI_TIMING.RECOVERY_TIMEOUT).toBeGreaterThan(absoluteMax);
      
      // Verify no thinking time exceeds 80% of recovery timeout (safety margin)
      expect(absoluteMax).toBeLessThan(AI_TIMING.RECOVERY_TIMEOUT * 0.8);
    });
  });
  
  it('should calculate correct maximum possible thinking time', () => {
    // This matches the calculation in useAITurn.ts
    const maxBase = 1200 + 200; // Max time + complexity bonus
    const maxMultiplier = 1.2; // Prudent personality
    const safetyMargin = 1.5;
    const calculatedMax = Math.ceil(maxBase * maxMultiplier * safetyMargin);
    
    // Should be 2520ms
    expect(calculatedMax).toBe(2520);
    
    // Recovery timeout should cover this
    expect(AI_TIMING.RECOVERY_TIMEOUT).toBeGreaterThanOrEqual(2500);
  });
  
  it('should handle edge case of very slow prudent/hard AI', () => {
    const player: Player = {
      id: 'slow-bot',
      name: 'Slow Bot',
      isBot: true,
      difficulty: 'hard',
      personality: 'prudent',
      teamId: 0,
      hand: [],
      position: 0,
      isConnected: true,
    };
    
    // Test complex decision with max values
    let maxTime = 0;
    for (let i = 0; i < 1000; i++) {
      const time = getAIThinkingTime(player, true);
      maxTime = Math.max(maxTime, time);
    }
    
    console.log('Max time for prudent/hard/complex:', maxTime);
    
    // Should never exceed theoretical maximum
    const theoreticalMax = (1200 + 200) * 1.2; // 1680ms
    expect(maxTime).toBeLessThanOrEqual(theoreticalMax);
    
    // Recovery timeout should handle this with margin
    expect(AI_TIMING.RECOVERY_TIMEOUT).toBeGreaterThan(theoreticalMax);
  });
});