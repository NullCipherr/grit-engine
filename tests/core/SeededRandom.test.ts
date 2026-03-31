import { describe, expect, it } from 'vitest';

import { SeededRandom } from '../../src/utils/SeededRandom';

describe('SeededRandom', () => {
  it('generates deterministic sequences for the same seed', () => {
    const a = new SeededRandom(1234);
    const b = new SeededRandom(1234);

    const seqA = Array.from({ length: 6 }, () => a.next());
    const seqB = Array.from({ length: 6 }, () => b.next());

    expect(seqA).toEqual(seqB);
  });

  it('changes sequence when seed changes', () => {
    const a = new SeededRandom(1234);
    const b = new SeededRandom(9876);

    const seqA = Array.from({ length: 4 }, () => a.next());
    const seqB = Array.from({ length: 4 }, () => b.next());

    expect(seqA).not.toEqual(seqB);
  });
});
