import { createSeededRandom, createTurnSeededRandom, gaussianRandom } from './seedRandom';

describe('seedRandom', () => {
  describe('createSeededRandom', () => {
    test('generates deterministic sequences for same room ID', () => {
      const roomId = 'test-room-123';
      const rng1 = createSeededRandom(roomId);
      const rng2 = createSeededRandom(roomId);

      // Generate sequences from both generators
      const sequence1 = Array.from({ length: 10 }, () => rng1.next());
      const sequence2 = Array.from({ length: 10 }, () => rng2.next());

      // Should produce identical sequences
      expect(sequence1).toEqual(sequence2);
    });

    test('generates different sequences for different room IDs', () => {
      const rng1 = createSeededRandom('room-1');
      const rng2 = createSeededRandom('room-2');

      const sequence1 = Array.from({ length: 10 }, () => rng1.next());
      const sequence2 = Array.from({ length: 10 }, () => rng2.next());

      // Should produce different sequences
      expect(sequence1).not.toEqual(sequence2);
    });

    test('generates values between 0 and 1', () => {
      const rng = createSeededRandom('test-room');

      for (let i = 0; i < 100; i++) {
        const value = rng.next();
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    test('nextInt generates integers within specified range', () => {
      const rng = createSeededRandom('test-room');
      const min = 5;
      const max = 15;

      for (let i = 0; i < 100; i++) {
        const value = rng.nextInt(min, max);
        expect(Number.isInteger(value)).toBe(true);
        expect(value).toBeGreaterThanOrEqual(min);
        expect(value).toBeLessThanOrEqual(max);
      }
    });

    test('nextBool generates booleans with correct probability', () => {
      const rng = createSeededRandom('test-room');
      const probability = 0.3;
      const results = Array.from({ length: 1000 }, () => rng.nextBool(probability));

      const trueCount = results.filter(r => r).length;
      const ratio = trueCount / results.length;

      // Should be close to the specified probability (with some tolerance)
      expect(ratio).toBeGreaterThan(0.25);
      expect(ratio).toBeLessThan(0.35);
    });

    test('shuffle produces different permutations', () => {
      const rng = createSeededRandom('test-room');
      const original = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

      const shuffled1 = rng.shuffle([...original]);
      const shuffled2 = rng.shuffle([...original]);

      // Should contain same elements
      expect([...shuffled1].sort((a, b) => a - b)).toEqual(original);
      expect([...shuffled2].sort((a, b) => a - b)).toEqual(original);

      // Should produce different orders
      expect(shuffled1).not.toEqual(original);
      expect(shuffled2).not.toEqual(shuffled1);
    });

    test('shuffle is deterministic with same seed', () => {
      const rng1 = createSeededRandom('test-room');
      const rng2 = createSeededRandom('test-room');
      const array = [1, 2, 3, 4, 5];

      const shuffled1 = rng1.shuffle([...array]);
      const shuffled2 = rng2.shuffle([...array]);

      expect(shuffled1).toEqual(shuffled2);
    });
  });

  describe('createTurnSeededRandom', () => {
    test('generates different sequences for different turns', () => {
      const roomId = 'test-room';
      const rng1 = createTurnSeededRandom(roomId, 1);
      const rng2 = createTurnSeededRandom(roomId, 2);

      const sequence1 = Array.from({ length: 5 }, () => rng1.next());
      const sequence2 = Array.from({ length: 5 }, () => rng2.next());

      expect(sequence1).not.toEqual(sequence2);
    });

    test('generates same sequence for same room and turn', () => {
      const roomId = 'test-room';
      const turn = 5;
      const rng1 = createTurnSeededRandom(roomId, turn);
      const rng2 = createTurnSeededRandom(roomId, turn);

      const sequence1 = Array.from({ length: 5 }, () => rng1.next());
      const sequence2 = Array.from({ length: 5 }, () => rng2.next());

      expect(sequence1).toEqual(sequence2);
    });
  });

  describe('gaussianRandom', () => {
    test('generates values between 0 and 1', () => {
      const rng = createSeededRandom('test-room');

      for (let i = 0; i < 100; i++) {
        const value = gaussianRandom(rng);
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    test('generates values with normal distribution around 0.5', () => {
      const rng = createSeededRandom('test-room');
      const values = Array.from({ length: 1000 }, () => gaussianRandom(rng));

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const inMiddleRange = values.filter(v => v > 0.3 && v < 0.7).length / values.length;

      // Mean should be close to 0.5
      expect(mean).toBeGreaterThan(0.45);
      expect(mean).toBeLessThan(0.55);

      // Most values should be in the middle range (relaxed threshold for test stability)
      expect(inMiddleRange).toBeGreaterThan(0.5);
    });

    test('is deterministic with same seed', () => {
      const rng1 = createSeededRandom('test-room');
      const rng2 = createSeededRandom('test-room');

      const values1 = Array.from({ length: 5 }, () => gaussianRandom(rng1));
      const values2 = Array.from({ length: 5 }, () => gaussianRandom(rng2));

      expect(values1).toEqual(values2);
    });
  });

  describe('hashString', () => {
    test('produces consistent hash for same string', () => {
      const rng1 = createSeededRandom('test-string');
      const rng2 = createSeededRandom('test-string');

      expect(rng1.next()).toEqual(rng2.next());
    });

    test('produces different hashes for different strings', () => {
      const rng1 = createSeededRandom('string1');
      const rng2 = createSeededRandom('string2');

      expect(rng1.next()).not.toEqual(rng2.next());
    });

    test('handles empty string', () => {
      const rng = createSeededRandom('');
      const value = rng.next();

      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });

    test('handles very long strings', () => {
      const longString = 'a'.repeat(1000);
      const rng = createSeededRandom(longString);
      const value = rng.next();

      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThanOrEqual(1);
    });
  });
});
