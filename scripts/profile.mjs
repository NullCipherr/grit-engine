import { performance } from 'node:perf_hooks';

import { DEFAULT_SIM_CONFIG, Particle } from '../dist/index.js';

const rand = () => 0.5;

function profileParticleUpdate(samples) {
  const particle = new Particle(200, 200, 'rgba(255,255,255,1)', DEFAULT_SIM_CONFIG, rand);
  const neighbors = [];

  const t0 = performance.now();
  for (let i = 0; i < samples; i++) {
    particle.update(DEFAULT_SIM_CONFIG, 1920, 1080, null, null, neighbors, [], 1);
  }
  const t1 = performance.now();

  return Number((t1 - t0).toFixed(2));
}

const sampleSizes = [10_000, 50_000, 100_000];
const rows = sampleSizes.map((samples) => ({
  scenario: 'particle-update',
  samples,
  total_ms: profileParticleUpdate(samples)
}));

console.table(rows);
