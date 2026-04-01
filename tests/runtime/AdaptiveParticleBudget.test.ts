import { describe, expect, it } from 'vitest';

import { AdaptiveParticleBudget } from '../../src/runtime/AdaptiveParticleBudget';
import { DEFAULT_ADAPTIVE_BUDGET } from '../../src/types';

describe('AdaptiveParticleBudget', () => {
  it('reduz limite sob pressão alta de frame-time', () => {
    const budget = new AdaptiveParticleBudget(10000, {
      ...DEFAULT_ADAPTIVE_BUDGET,
      updateIntervalFrames: 1
    });

    budget.update(30, 35);
    const snapshot = budget.snapshot();

    expect(snapshot.activeParticleLimit).toBeLessThan(10000);
    expect(snapshot.scale).toBeLessThan(1);
  });

  it('recupera limite com frame-time saudável', () => {
    const budget = new AdaptiveParticleBudget(10000, {
      ...DEFAULT_ADAPTIVE_BUDGET,
      updateIntervalFrames: 1
    });

    budget.update(30, 35);
    const downscaled = budget.snapshot().activeParticleLimit;

    for (let i = 0; i < 20; i++) {
      budget.update(9, 10);
    }

    const recovered = budget.snapshot();
    expect(recovered.activeParticleLimit).toBeGreaterThan(downscaled);
    expect(recovered.activeParticleLimit).toBeLessThanOrEqual(10000);
  });

  it('reset restaura escala padrão', () => {
    const budget = new AdaptiveParticleBudget(8000, {
      ...DEFAULT_ADAPTIVE_BUDGET,
      updateIntervalFrames: 1
    });

    budget.update(40, 45);
    budget.reset();

    const snapshot = budget.snapshot();
    expect(snapshot.activeParticleLimit).toBe(8000);
    expect(snapshot.scale).toBe(1);
  });
});
