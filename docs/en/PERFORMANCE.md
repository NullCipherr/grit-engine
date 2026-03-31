# Performance

## Current Optimizations

- Spatial hashing to avoid global neighbor scans
- Capped neighbor counts in collision/flocking passes
- Reused arrays to reduce allocation churn
- Precomputed color lookup for render hot path
- Compact per-instance data layout for GPU upload

## Profiling and Benchmark Tooling

- `npm run benchmark`: baseline grid insertion/query benchmark
- `npm run profile`: particle update throughput profile

Outputs are printed as console tables to support quick comparisons across commits.

## Measuring Performance

Track:

- Average FPS
- 95th percentile frame time
- Memory growth during long sessions
- Particle count versus frame stability

## Tuning Guidelines

- Reduce `maxParticles` first on low-end devices
- Keep DPR capped for mobile contexts
- Disable flocking/collisions for stress scenarios
- Prefer batch spawning over single-particle events

## Future Work

- Worker offload for full simulation step
- Optional WASM physics backend
- Automated benchmark history tracking in CI
