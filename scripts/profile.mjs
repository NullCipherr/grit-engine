import { performance } from 'node:perf_hooks';

import { DEFAULT_SIM_CONFIG, Particle, SpatialGrid } from '../dist/index.js';

const SAMPLES = 120000;
const rand = () => 0.5;

function measureParticleUpdate(config) {
  const particle = new Particle(200, 200, 'rgba(255,255,255,1)', config, rand);
  const neighbors = [];

  const t0 = performance.now();
  for (let i = 0; i < SAMPLES; i++) {
    particle.update(config, 1920, 1080, null, null, neighbors, [], 1);
  }
  const t1 = performance.now();

  return {
    total_ms: Number((t1 - t0).toFixed(3)),
    ns_per_update: Number((((t1 - t0) * 1_000_000) / SAMPLES).toFixed(1))
  };
}

function measureSpatialLookup() {
  const grid = new SpatialGrid(40);
  const particles = [];

  for (let i = 0; i < 16000; i++) {
    particles.push(new Particle(i % 1920, (i * 13) % 1080, 'rgba(255,255,255,1)', DEFAULT_SIM_CONFIG, rand));
  }

  for (let i = 0; i < particles.length; i++) {
    grid.add(particles[i]);
  }

  const out = [];
  const probe = particles[(particles.length / 2) | 0];

  const t0 = performance.now();
  for (let i = 0; i < SAMPLES; i++) {
    grid.getNeighborsInto(probe, out);
  }
  const t1 = performance.now();

  return {
    total_ms: Number((t1 - t0).toFixed(3)),
    ns_per_lookup: Number((((t1 - t0) * 1_000_000) / SAMPLES).toFixed(1))
  };
}

const fastConfig = {
  ...DEFAULT_SIM_CONFIG,
  flocking: false,
  collisions: false,
  particleLife: 10000,
  friction: 0.992
};

const fullConfig = {
  ...DEFAULT_SIM_CONFIG,
  flocking: true,
  collisions: true,
  particleLife: 10000,
  friction: 0.985
};

const fast = measureParticleUpdate(fastConfig);
const full = measureParticleUpdate(fullConfig);
const lookup = measureSpatialLookup();

console.table([
  {
    probe: 'particle-update-fast',
    samples: SAMPLES,
    total_ms: fast.total_ms,
    ns_per_op: fast.ns_per_update
  },
  {
    probe: 'particle-update-full',
    samples: SAMPLES,
    total_ms: full.total_ms,
    ns_per_op: full.ns_per_update
  },
  {
    probe: 'spatial-lookup',
    samples: SAMPLES,
    total_ms: lookup.total_ms,
    ns_per_op: lookup.ns_per_lookup
  }
]);
