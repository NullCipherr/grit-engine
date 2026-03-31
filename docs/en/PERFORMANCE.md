# Performance

## Current Optimizations

- Spatial hashing to avoid global neighbor scans
- Capped neighbor counts in collision/flocking passes
- Reused arrays to reduce allocation churn
- Precomputed color lookup for render hot path
- Compact per-instance data layout for GPU upload

## Measuring Performance

Track:

- Average FPS
- 95th percentile frame time
- Memory growth during long sessions
- Particle count versus frame stability

## Tuning Guidelines

- Reduce `maxParticles` first on low-end devices.
- Keep DPR capped for mobile contexts.
- Disable flocking/collisions for stress scenarios.
- Prefer batch spawning over single-particle events.

## Future Work

- Worker offload for simulation step
- Optional WASM physics backend
- Benchmark harness with reproducible scenarios
