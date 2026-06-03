/**
 * xoshiro128** seeded PRNG
 * Cryptographically sound enough for game fairness verification
 */
export class SeededRandom {
  private state: Uint32Array;

  constructor(seed: string) {
    // Hash the seed string into 4 32-bit integers
    this.state = new Uint32Array(4);
    let hash = 0;
    for (let i = 0; i < seed.length; i++) {
      const char = seed.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Initialize state from hash
    this.state[0] = hash >>> 0;
    this.state[1] = (hash * 16807) >>> 0;
    this.state[2] = (hash * 48271) >>> 0;
    this.state[3] = (hash * 69621) >>> 0;
    
    // Warm up
    for (let i = 0; i < 20; i++) this.next();
  }

  private rotl(x: number, k: number): number {
    return ((x << k) | (x >>> (32 - k))) >>> 0;
  }

  next(): number {
    const result = this.rotl((this.state[1] * 5) >>> 0, 7) * 9;
    const t = this.state[1] << 9;

    this.state[2] ^= this.state[0];
    this.state[3] ^= this.state[1];
    this.state[1] ^= this.state[2];
    this.state[0] ^= this.state[3];
    this.state[2] ^= t;
    this.state[3] = this.rotl(this.state[3], 11);

    return (result >>> 0) / 4294967296;
  }

  /**
   * Fisher-Yates shuffle using seeded random
   */
  shuffle<T>(array: T[]): T[] {
    const result = [...array];
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    return result;
  }
}

/**
 * Generate a room code: 6 characters, uppercase, no ambiguous chars
 */
export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // No I, O, 0, 1
  const array = new Uint32Array(6);
  crypto.getRandomValues(array);
  return Array.from(array, (n) => chars[n % chars.length]).join('');
}

/**
 * Generate a seed from room code + timestamp
 */
export function generateSeed(roomCode: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return roomCode + '-' + timestamp + '-' + random;
}