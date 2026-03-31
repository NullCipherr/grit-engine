# Architecture

## Goal

GRIT Engine isolates simulation and rendering into a framework-agnostic core.
UI frameworks should only provide adapters and lifecycle wiring.

## Core Modules

- `src/GritEngine.ts`: runtime orchestration and public API.
- `src/core/Particle.ts`: force integration, flocking, and collision behavior.
- `src/core/SpatialGrid.ts`: neighborhood acceleration structure.
- `src/core/WebGLRenderer.ts`: WebGL2 instanced draw pipeline.
- `src/core/Obstacle.ts`: obstacle geometry and hit logic.
- `src/types.ts`: shared contracts.

## Data Flow

1. Consumer initializes engine with canvases and config.
2. Runtime loop updates particles and obstacle interactions.
3. Spatial grid feeds local neighbors into hot physics paths.
4. Renderer uploads instance data and draws current state.
5. Optional stats callback emits FPS and particle count.

## Integration Pattern

Keep UI/state outside the engine:

- UI handles controls and events.
- Adapter forwards input/config changes to engine methods.
- Engine owns deterministic simulation and rendering workload.
