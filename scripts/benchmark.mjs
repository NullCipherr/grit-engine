import { performance } from 'node:perf_hooks';

import { DEFAULT_SIM_CONFIG, Particle, SpatialGrid } from '../dist/index.js';

const ITERATIONS = 10_000;
const rand = () => 0.5;

function benchmarkSpatialGrid() {
  const grid = new SpatialGrid(40);
  const particles = [];

  for (let i = 0; i < ITERATIONS; i++) {
    particles.push(
      new Particle(i % 800, (i * 3) % 600, 'rgba(255,255,255,1)', DEFAULT_SIM_CONFIG, rand)
    );
  }

  const t0 = performance.now();
  for (let i = 0; i < particles.length; i++) {
    grid.add(particles[i]);
  }
  const t1 = performance.now();

  const probe = particles[(particles.length / 2) | 0];
  const t2 = performance.now();
  for (let i = 0; i < 1000; i++) {
    grid.getNeighbors(probe);
  }
  const t3 = performance.now();

  return {
    insertMs: Number((t1 - t0).toFixed(2)),
    queryMs: Number((t3 - t2).toFixed(2)),
    particles: particles.length
  };
}

const spatial = benchmarkSpatialGrid();

console.table([
  {
    scenario: 'spatial-grid',
    particles: spatial.particles,
    insert_ms: spatial.insertMs,
    query_1000_ms: spatial.queryMs
  }
]);
