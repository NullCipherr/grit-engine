# Testing

## Current Status

The repository currently validates through TypeScript checks and production build output.

## Recommended Test Layers

1. **Unit tests**
- Particle integration math
- Collision response behavior
- Spatial grid neighbor correctness

2. **Integration tests**
- Engine lifecycle (`start`, `stop`, `dispose`)
- Config updates at runtime
- Pointer interactions

3. **Visual regression checks**
- Frame snapshots under fixed seeds
- Bloom on/off comparisons

## Baseline Verification Commands

```bash
npm run typecheck
npm run build
```
