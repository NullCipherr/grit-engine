export interface RandomSource {
  next(): number;
  setSeed(seed: number): void;
  getSeed(): number;
}

const UINT32_MAX_PLUS_ONE = 0x1_0000_0000;

export class SeededRandom implements RandomSource {
  private state: number;
  private initialSeed: number;

  constructor(seed: number) {
    const normalized = seed >>> 0;
    this.state = normalized || 1;
    this.initialSeed = normalized || 1;
  }

  next(): number {
    this.state += 0x6d2b79f5;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32_MAX_PLUS_ONE;
  }

  setSeed(seed: number): void {
    const normalized = seed >>> 0;
    this.initialSeed = normalized || 1;
    this.state = this.initialSeed;
  }

  getSeed(): number {
    return this.initialSeed;
  }
}
