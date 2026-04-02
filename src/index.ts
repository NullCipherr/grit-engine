export { GritEngine } from './GritEngine';
export { Particle } from './core/Particle';
export { Obstacle } from './core/Obstacle';
export { SpatialGrid } from './core/SpatialGrid';
export { WebGLRenderer } from './core/WebGLRenderer';
export { Canvas2DRenderer } from './core/Canvas2DRenderer';
export { OffscreenWorkerRenderer } from './core/OffscreenWorkerRenderer';
export { listPerformancePresets, resolvePerformancePreset } from './runtime/performancePresets';
export { DEFAULT_ADAPTIVE_BUDGET, DEFAULT_POST_PROCESSING, DEFAULT_SIM_CONFIG } from './types';
export type {
  AdaptiveBudgetOptions,
  EngineStats,
  ExecutionMode,
  GritEngineOptions,
  GritPlugin,
  GritPluginFrameContext,
  GritPluginParticleContext,
  PerformancePreset,
  PostProcessingOptions,
  RenderBackend,
  WorkerTransportCompression,
  SimConfig,
  SimulationBackend
} from './types';
