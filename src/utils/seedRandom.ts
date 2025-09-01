/**
 * Seeded random number generator for deterministic AI behavior
 * Uses room ID as seed to ensure consistent AI decisions across all clients
 */

export interface SeededRandom {
  next(): number;
  nextInt(min: number, max: number): number;
  nextBool(probability?: number): boolean;
  shuffle<T>(array: T[]): T[];
}

/**
 * Simple hash function to convert string to number seed
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Linear Congruential Generator (LCG) for deterministic random numbers
 * Uses Park and Miller constants
 */
class LCGRandom implements SeededRandom {
  private seed: number;
  private readonly a = 16807; // Multiplier
  private readonly m = 2147483647; // Modulus (2^31 - 1)

  constructor(seed: number) {
    this.seed = seed % this.m || 1; // Ensure seed is never 0
  }

  /**
   * Generate next random number between 0 and 1
   */
  next(): number {
    this.seed = (this.a * this.seed) % this.m;
    return this.seed / this.m;
  }

  /**
   * Generate random integer between min and max (inclusive)
   */
  nextInt(min: number, max: number): number {
    return Math.floor(this.next() * (max - min + 1)) + min;
  }

  /**
   * Generate random boolean with optional probability
   */
  nextBool(probability: number = 0.5): boolean {
    return this.next() < probability;
  }

  /**
   * Shuffle array in place using Fisher-Yates algorithm
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

/**
 * Create a seeded random number generator from a room ID
 */
export function createSeededRandom(roomId: string): SeededRandom {
  const seed = hashString(roomId);
  return new LCGRandom(seed);
}

/**
 * Create a seeded random generator for a specific turn
 * Combines room ID with turn number for turn-specific randomness
 */
export function createTurnSeededRandom(roomId: string, turnNumber: number): SeededRandom {
  const combinedSeed = `${roomId}_turn_${turnNumber}`;
  const seed = hashString(combinedSeed);
  return new LCGRandom(seed);
}

/**
 * Gaussian random using Box-Muller transform with seeded RNG
 * Returns value between 0 and 1 with normal distribution around 0.5
 */
export function gaussianRandom(rng: SeededRandom): number {
  let u = 0,
    v = 0;
  while (u === 0) u = rng.next(); // Converting [0,1) to (0,1)
  while (v === 0) v = rng.next();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  // Normalize to 0-1 range with most values around 0.5
  return Math.max(0, Math.min(1, num / 4 + 0.5));
}
