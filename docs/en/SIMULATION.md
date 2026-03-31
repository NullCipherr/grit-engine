# Simulation Model

## Particle Lifecycle

Each particle stores:

- Position (`x`, `y`)
- Velocity (`vx`, `vy`)
- Acceleration (`ax`, `ay`)
- Visual attributes (`size`, `hue`, `life`, `maxLife`)

Lifecycle phases per frame:

1. Input forces (attraction/repulsion and vortex)
2. Flocking adjustments
3. Particle-particle collision resolution
4. Obstacle collision response
5. Boundary constraints and damping
6. Life decay and removal

## Neighborhood Lookup

A hashed grid (`SpatialGrid`) maps particles into cells.
Neighbor queries are constrained to local adjacent cells for performance.

## Config Contract

`SimConfig` controls behavior:

- `gravity`, `friction`
- `attraction`, `repulsion`
- `particleLife`, `particleSize`
- `vortex`, `bloom`, `flocking`, `collisions`, `obstacleMode`

## Time Step

Delta time is normalized and clamped to avoid extreme jumps under frame drops.
