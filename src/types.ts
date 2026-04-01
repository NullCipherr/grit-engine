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
  frameTimeAvgMs: number;
  frameTimeP95Ms: number;
  frameTimeP99Ms: number;
  activeParticleLimit: number;
  adaptiveScale: number;
  effectivePreset: PerformancePreset;
}

export type ExecutionMode = 'main-thread' | 'worker-ticker';

export type RenderBackend = 'auto' | 'webgl2' | 'canvas2d' | 'offscreen-worker';
export type SimulationBackend = 'auto' | 'js' | 'wasm';
export type PerformancePreset = 'performance' | 'balanced' | 'quality';

export interface AdaptiveBudgetOptions {
  enabled: boolean;
  targetFrameMs: number;
  lowWatermarkMs: number;
  highWatermarkMs: number;
  minScale: number;
  recoveryRate: number;
  dropRate: number;
  updateIntervalFrames: number;
}

export interface PostProcessingOptions {
  bloom: boolean;
  trailStrength: number;
  vignette: boolean;
}

export interface GritPluginFrameContext {
  readonly config: Readonly<SimConfig>;
  readonly canvasWidth: number;
  readonly canvasHeight: number;
  readonly dt: number;
  readonly frame: number;
  readonly now: number;
}

export interface GritPluginParticleContext extends GritPluginFrameContext {
  readonly pointerX: number | null;
  readonly pointerY: number | null;
}

export interface GritPlugin {
  id: string;
  name?: string;
  enabled?: boolean;
  onRegister?(): void;
  onUnregister?(): void;
  onFrameStart?(context: GritPluginFrameContext): void;
  applyForce?(particle: import('./core/Particle').Particle, context: GritPluginParticleContext): void;
  applyConstraint?(particle: import('./core/Particle').Particle, context: GritPluginParticleContext): void;
  onFrameEnd?(context: GritPluginFrameContext): void;
}

export interface GritEngineOptions {
  canvas: HTMLCanvasElement;
  overlayCanvas?: HTMLCanvasElement;
  maxParticles?: number;
  spawnBatch?: number;
  gridCellSize?: number;
  maxDpr?: number;
  seed?: number;
  executionMode?: ExecutionMode;
  renderBackend?: RenderBackend;
  simulationBackend?: SimulationBackend;
  performancePreset?: PerformancePreset;
  adaptiveBudget?: Partial<AdaptiveBudgetOptions>;
  hybridAdaptive?: boolean;
  autoTune?: boolean;
  postProcessing?: Partial<PostProcessingOptions>;
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

export const DEFAULT_POST_PROCESSING: PostProcessingOptions = {
  bloom: true,
  trailStrength: 0.72,
  vignette: false
};

export const DEFAULT_ADAPTIVE_BUDGET: AdaptiveBudgetOptions = {
  enabled: true,
  targetFrameMs: 16.67,
  lowWatermarkMs: 13.5,
  highWatermarkMs: 20.5,
  minScale: 0.35,
  recoveryRate: 0.025,
  dropRate: 0.08,
  updateIntervalFrames: 24
};
