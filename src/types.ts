export interface SimConfig {
  gravity: number;
  friction: number;
  attraction: number;
  repulsion: number;
  particleLife: number;
  particleSize: number;
  vortex: boolean;
  bloom: boolean;
  flocking: boolean;
  collisions: boolean;
  obstacleMode: boolean;
}

export interface EngineStats {
  particleCount: number;
  fps: number;
}

export type ExecutionMode = 'main-thread' | 'worker-ticker';

export interface GritEngineOptions {
  canvas: HTMLCanvasElement;
  overlayCanvas?: HTMLCanvasElement;
  maxParticles?: number;
  spawnBatch?: number;
  gridCellSize?: number;
  maxDpr?: number;
  seed?: number;
  executionMode?: ExecutionMode;
  config?: Partial<SimConfig>;
  onStats?: (stats: EngineStats) => void;
}

export const DEFAULT_SIM_CONFIG: SimConfig = {
  gravity: 0.05,
  friction: 0.98,
  attraction: 6,
  repulsion: 0,
  particleLife: 150,
  particleSize: 3,
  vortex: false,
  bloom: true,
  flocking: true,
  collisions: true,
  obstacleMode: false
};
