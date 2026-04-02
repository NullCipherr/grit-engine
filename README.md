<div align="center">
  <img src="docs/assets/grit-engine-logo.png" alt="GRIT Engine Logo" width="220" />
  <h1>GRIT Engine</h1>
  <p><i>A high-performance WebGL2 particle engine for real-time interactive simulations</i></p>

  <p>
    <img src="https://img.shields.io/badge/TypeScript-5.8-2f74c0?style=flat-square&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/WebGL-2.0-111111?style=flat-square" alt="WebGL2" />
    <img src="https://img.shields.io/badge/License-Source--Available-1f6feb?style=flat-square" alt="License" />
  </p>
</div>

---

## Documentation

Technical docs are organized by topic for faster onboarding and easier maintenance.
English is the primary language for this repository.

- [Documentation Index](docs/README.md)
- [Architecture](docs/en/ARCHITECTURE.md)
- [Simulation Model](docs/en/SIMULATION.md)
- [Operations](docs/en/OPERATIONS.md)
- [Performance](docs/en/PERFORMANCE.md)
- [Performance Baseline](docs/en/PERFORMANCE_BASELINE.md)
- [Performance Matrix](docs/en/PERFORMANCE_MATRIX.md)
- [Deployment](docs/en/DEPLOYMENT.md)
- [Testing](docs/en/TESTING.md)
- [Integrations](docs/en/INTEGRATIONS.md)
- [Roadmap](docs/en/ROADMAP.md)

---

## Overview

**GRIT Engine** is a framework-agnostic simulation core that encapsulates:

- Particle lifecycle and force integration;
- Spatial partitioning for neighbor lookup optimization;
- WebGL2 renderer with instancing and optional bloom;
- Imperative runtime API (`start`, `stop`, `resize`, `updateSettings`, etc.);
- TypeScript-first contracts for safe integration.

It is designed to be consumed by wrappers in React, Vue, Svelte, or vanilla JavaScript.

---

## Features

- **Framework-agnostic runtime** with no React dependency.
- **Typed integration API** via `GritEngine`, `GritEngineOptions`, and `SimConfig`.
- **High-capacity simulation** tuned for tens of thousands of particles.
- **Spatial hashing** for efficient flocking and collision neighborhoods.
- **GPU instanced rendering** with additive bloom mode support.
- **Pointer-ready interactions** (spawn, obstacles, attract/repulse).
- **DPR-aware resize pipeline** for visual quality and performance balance.
- **Deterministic seed mode** for reproducible sessions.
- **Optional worker ticker mode** for experimental scheduling.
- **Plugin system** for custom forces and constraints.
- **Optional WASM simulation path** with safe JS fallback.
- **Multiple rendering backends** (`webgl2`, `canvas2d`, and experimental `offscreen-worker`).
- **Execution presets** (`performance`, `balanced`, `quality`) and adaptive particle budget.
- **Hybrid adaptive runtime** with local telemetry-based preset recommendation.
- **Runtime backend fallback policy** for context/runtime failures (`offscreen-worker -> webgl2 -> canvas2d`).
- **Optional worker transport compression** (`quantized16`) for offscreen render payloads.

---

## Architecture

Main runtime flow:

1. Consumer creates a `GritEngine` instance with `canvas` and optional `overlayCanvas`.
2. Engine bootstraps simulation state (`particles`, `obstacles`, `grid`).
3. Render loop advances simulation at `requestAnimationFrame` cadence.
4. `SpatialGrid` provides local neighborhoods for flocking/collision logic.
5. `WebGLRenderer` uploads per-instance attributes and draws the frame.
6. Optional `onStats` callback exposes FPS, frame-time percentiles, adaptive budget and memory telemetry when available.

---

## Performance Notes

Current performance-focused decisions:

- Grid-based neighborhood search instead of `O(n²)` scans.
- Neighbor caps for flocking and collision passes.
- Reused hot-path arrays to reduce GC pressure.
- CPU-to-GPU payload minimized to compact instance tuples.
- Interval-based stats emission to avoid unnecessary UI churn.

For deep details, see [Performance](docs/en/PERFORMANCE.md).

---

## API Snapshot

```ts
import { GritEngine, DEFAULT_SIM_CONFIG, type GritEngineOptions, type SimConfig } from '@nullcipherr/grit-engine';

const engine = new GritEngine({
  canvas,
  overlayCanvas,
  seed: 42,
  executionMode: 'main-thread',
  config: DEFAULT_SIM_CONFIG
});

engine.start();
engine.updateSettings({ attraction: 12, collisions: true });
```

Main methods:

- `start()`
- `stop()`
- `dispose()`
- `resize()`
- `updateSettings(partialConfig)`
- `setPaused(boolean)`
- `setPointer(x, y)`
- `clearPointer()`
- `spawnAt(x, y)`
- `addObstacle(x, y)`
- `clear()`
- `getStats()`
- `setSeed(seed)`
- `getSeed()`
- `setPerformancePreset(preset)`
- `setAdaptiveBudgetEnabled(boolean)`

---

## Tech Stack

- **Language**: TypeScript 5.8
- **Renderer**: WebGL2
- **Build**: Vite 6 (Library Mode)
- **Output**: ESM + UMD + declaration files (`.d.ts`)

---

## Project Structure

```text
.
├── docs/
│   ├── README.md
│   ├── assets/
│   │   └── README.md
│   └── en/
│       ├── ARCHITECTURE.md
│       ├── DEPLOYMENT.md
│       ├── INTEGRATIONS.md
│       ├── OPERATIONS.md
│       ├── PERFORMANCE.md
│       ├── ROADMAP.md
│       ├── SIMULATION.md
│       └── TESTING.md
├── examples/
│   ├── react/
│   ├── svelte/
│   ├── vanilla/
│   └── vue/
├── scripts/
│   ├── benchmark.mjs
│   └── profile.mjs
├── tests/
│   └── core/
├── src/
│   ├── core/
│   │   ├── Obstacle.ts
│   │   ├── Particle.ts
│   │   ├── SpatialGrid.ts
│   │   └── WebGLRenderer.ts
│   ├── GritEngine.ts
│   ├── index.ts
│   └── types.ts
├── CODE_OF_CONDUCT.md
├── CONTRIBUTING.md
├── LICENSE
├── SECURITY.md
├── package.json
├── tsconfig.build.json
├── tsconfig.json
└── vite.config.ts
```

---

## Getting Started

### Prerequisites

- Node.js `18+`
- npm `9+`

### Install

```bash
npm install
```

### Build

```bash
npm run build
```

### Type Check

```bash
npm run typecheck
```

### Watch Build

```bash
npm run dev
```

### Browser Demo

```bash
npm run demo
```

Then open `http://localhost:5173/` (or the URL shown by Vite) to test:

- Spawn burst, pause/resume, and clear simulation;
- Switch render backend (`auto`, `webgl2`, `canvas2d`);
- Switch simulation backend (`auto`, `wasm`, `js`);
- Toggle post-processing (`bloom`, `vignette`, trail strength);
- Enable/disable plugin force and plugin constraint behaviors.

### Test

```bash
npm run test
```

### Benchmark / Profile

```bash
npm run benchmark
npm run benchmark:browser
npm run profile
npm run perf:check
```

---

## Distribution

`package.json` exports:

- `import`: `dist/index.js`
- `require`: `dist/index.umd.js`
- `types`: `dist/types/index.d.ts`

You can consume this package via:

1. Local file dependency (`file:../grit-engine`)
2. Git URL dependency
3. Private package registry

---

## License

This project is distributed under a **source-available** license.
It is **not an OSI open-source license**.

See [LICENSE](LICENSE) for full terms.

---

## Contributing and Security

- [Contributing Guide](CONTRIBUTING.md)
- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Security Policy](SECURITY.md)
