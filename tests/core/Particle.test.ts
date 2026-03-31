import { describe, expect, it } from 'vitest';

import { Particle } from '../../src/core/Particle';
import type { SimConfig } from '../../src/types';

const TEST_CONFIG: SimConfig = {
  gravity: 0.1,
  friction: 0.95,
  attraction: 0,
  repulsion: 0,
  particleLife: 200,
  particleSize: 4,
  vortex: false,
  bloom: false,
  flocking: false,
  collisions: true,
  obstacleMode: false
};

describe('Particle', () => {
  it('applies gravity over time', () => {
    const particle = new Particle(50, 50, 'rgba(255,255,255,1)', TEST_CONFIG, () => 0.5);
    particle.vx = 0;
    particle.vy = 0;

    particle.update(TEST_CONFIG, 500, 500, null, null, [], [], 1);

    expect(particle.vy).toBeGreaterThan(0);
    expect(particle.y).toBeGreaterThan(50);
  });

  it('resolves collisions by separating overlapping particles', () => {
    const a = new Particle(100, 100, 'rgba(255,255,255,1)', TEST_CONFIG, () => 0.5);
    const b = new Particle(101, 100, 'rgba(255,255,255,1)', TEST_CONFIG, () => 0.5);

    a.size = 5;
    b.size = 5;
    a.vx = 1;
    b.vx = -1;

    const initialDistance = Math.abs(b.x - a.x);
    a.update(TEST_CONFIG, 500, 500, null, null, [b], [], 1);

    const dx = b.x - a.x;
    expect(Math.abs(dx)).toBeGreaterThan(initialDistance);
  });
});
