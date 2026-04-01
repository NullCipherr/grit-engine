import { performance } from 'node:perf_hooks';

import { Particle, SpatialGrid, resolvePerformancePreset } from '../dist/index.js';

const SCENARIOS = [
  {
    name: 'perf-1080p-performance',
    width: 1920,
    height: 1080,
    particles: 18000,
    frames: 120,
    preset: 'performance',
    seed: 42
  },
  {
    name: 'perf-1080p-balanced',
    width: 1920,
    height: 1080,
    particles: 12000,
    frames: 120,
    preset: 'balanced',
    seed: 42
  },
  {
    name: 'perf-1440p-quality',
    width: 2560,
    height: 1440,
    particles: 9000,
    frames: 120,
    preset: 'quality',
    seed: 42
  }
];

const EMPTY_OBSTACLES = [];
const DT = 1;

function createSeededRandom(seed) {
  let state = seed >>> 0;

  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function percentile(values, p) {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil(sorted.length * p) - 1);
  return sorted[index];
}

function buildConfig(preset) {
  return {
    ...resolvePerformancePreset(preset).config,
    particleLife: 10000,
    particleSize: 3
  };
}

function runSimulationScenario(scenario) {
  const config = buildConfig(scenario.preset);
  const random = createSeededRandom(scenario.seed);

  const particles = new Array(scenario.particles);
  const grid = new SpatialGrid(40);

  for (let i = 0; i < scenario.particles; i++) {
    particles[i] = new Particle(
      random() * scenario.width,
      random() * scenario.height,
      'rgba(255,255,255,1)',
      config,
      random
    );
  }

  const frameTimes = new Array(scenario.frames);
  const neighborsBuffer = [];
  const useNeighbors = config.flocking || config.collisions;

  const totalStart = performance.now();

  for (let frame = 0; frame < scenario.frames; frame++) {
    const frameStart = performance.now();

    grid.clear();
    for (let i = 0; i < particles.length; i++) {
      grid.add(particles[i]);
    }

    for (let i = particles.length - 1; i >= 0; i--) {
      const particle = particles[i];

      if (useNeighbors) {
        grid.getNeighborsInto(particle, neighborsBuffer);
      } else {
        neighborsBuffer.length = 0;
      }

      particle.update(
        config,
        scenario.width,
        scenario.height,
        null,
        null,
        neighborsBuffer,
        EMPTY_OBSTACLES,
        DT
      );
    }

    frameTimes[frame] = performance.now() - frameStart;
  }

  const totalMs = performance.now() - totalStart;
  const avgFrameMs = frameTimes.reduce((acc, value) => acc + value, 0) / frameTimes.length;
  const p95Ms = percentile(frameTimes, 0.95);
  const p99Ms = percentile(frameTimes, 0.99);

  return {
    scenario: scenario.name,
    preset: scenario.preset,
    resolution: `${scenario.width}x${scenario.height}`,
    particles: scenario.particles,
    frames: scenario.frames,
    seed: scenario.seed,
    avg_frame_ms: Number(avgFrameMs.toFixed(3)),
    p95_frame_ms: Number(p95Ms.toFixed(3)),
    p99_frame_ms: Number(p99Ms.toFixed(3)),
    est_fps: Number((1000 / avgFrameMs).toFixed(2)),
    throughput_particles_per_sec: Number(((scenario.particles * scenario.frames) / (totalMs / 1000)).toFixed(0))
  };
}

function runSpatialGridProbe() {
  const random = createSeededRandom(42);
  const grid = new SpatialGrid(32);
  const config = buildConfig('balanced');
  const particles = [];

  for (let i = 0; i < 30000; i++) {
    particles.push(
      new Particle(random() * 1920, random() * 1080, 'rgba(255,255,255,1)', config, random)
    );
  }

  const t0 = performance.now();
  for (let i = 0; i < particles.length; i++) {
    grid.add(particles[i]);
  }
  const t1 = performance.now();

  const probe = particles[(particles.length / 2) | 0];
  const out = [];

  const t2 = performance.now();
  for (let i = 0; i < 2000; i++) {
    grid.getNeighborsInto(probe, out);
  }
  const t3 = performance.now();

  return {
    scenario: 'spatial-grid-probe',
    preset: 'balanced',
    resolution: '1920x1080',
    particles: particles.length,
    frames: 2000,
    seed: 42,
    avg_frame_ms: Number(((t3 - t2) / 2000).toFixed(4)),
    p95_frame_ms: 0,
    p99_frame_ms: 0,
    est_fps: 0,
    throughput_particles_per_sec: Number((particles.length / ((t1 - t0) / 1000)).toFixed(0))
  };
}

const rows = SCENARIOS.map(runSimulationScenario);
rows.push(runSpatialGridProbe());

console.table(rows);
console.log(JSON.stringify(rows, null, 2));
