# Testing

## Current Status

The repository validates with:

- TypeScript checks
- Production build output
- Unit tests for deterministic random, spatial grid, and particle math/collision

## Test Layers

1. **Unit tests**
- Particle integration math
- Collision response behavior
- Spatial grid neighbor correctness
- Seeded random reproducibility

2. **Integration tests**
- Engine lifecycle (`start`, `stop`, `dispose`)
- Config updates at runtime
- Pointer interactions

3. **Visual regression checks**
- Frame snapshots under fixed seeds
- Bloom on/off comparisons

## Commands

```bash
npm run test
npm run typecheck
npm run build
```
