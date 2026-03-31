import { describe, expect, it } from 'vitest';

import { Particle } from '../../src/core/Particle';
import { SpatialGrid } from '../../src/core/SpatialGrid';
import { DEFAULT_SIM_CONFIG } from '../../src/types';

describe('SpatialGrid', () => {
  it('returns nearby particles from adjacent cells', () => {
    const grid = new SpatialGrid(20);
    const rand = () => 0.5;

    const a = new Particle(10, 10, 'rgba(255,255,255,1)', DEFAULT_SIM_CONFIG, rand);
    const b = new Particle(18, 18, 'rgba(255,255,255,1)', DEFAULT_SIM_CONFIG, rand);
    const far = new Particle(220, 220, 'rgba(255,255,255,1)', DEFAULT_SIM_CONFIG, rand);

    grid.add(a);
    grid.add(b);
    grid.add(far);

    const neighbors = grid.getNeighbors(a);

    expect(neighbors).toContain(b);
    expect(neighbors).not.toContain(far);
  });
});
