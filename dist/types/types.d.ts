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
    spatialBackend: SpatialBackendType;
    subsystemMs: SubsystemTimingsMs;
    jobs: JobSystemSnapshot;
    usedJSHeapSize?: number;
    jsHeapSizeLimit?: number;
}
export type PluginStage = 'pre-sim' | 'post-sim' | 'render-prep' | 'render';
export interface ReplayFrame {
    particles: Float32Array;
    count: number;
    frame: number;
}
export interface ReplayTape {
    version: 1;
    createdAt: number;
    sourceSeed: number | null;
    frameStride: number;
    frames: ReplayFrame[];
}
export interface DeterministicSnapshot {
    seed: number | null;
    frame: number;
    particles: Float32Array;
    count: number;
}
export interface SubsystemTimingsMs {
    frameTotal: number;
    plugins: number;
    simulation: number;
    external: number;
    spatial: number;
    render: number;
    jobs: number;
}
export interface QualityGovernorPolicy {
    enabled: boolean;
    highWatermarkMs: number;
    lowWatermarkMs: number;
    cooldownFrames: number;
    degradationOrder: Array<'postprocessing' | 'preset' | 'simulation-rate'>;
}
export interface ExternalParticleState {
    x: number;
    y: number;
    vx?: number;
    vy?: number;
    size?: number;
    life?: number;
    maxLife?: number;
    hue?: number;
}
export interface ExternalPackedLayout {
    x: number;
    y: number;
    vx?: number;
    vy?: number;
    size?: number;
    life?: number;
    maxLife?: number;
    hue?: number;
}
export interface ExternalPackedParticles {
    kind: 'packed-f32';
    data: Float32Array;
    stride: number;
    count?: number;
    layout?: ExternalPackedLayout;
}
export interface ExternalObjectParticles {
    kind: 'objects';
    particles: readonly ExternalParticleState[];
}
export type ExternalFramePayload = ExternalPackedParticles | ExternalObjectParticles;
export interface ExternalFrameContext {
    readonly canvasWidth: number;
    readonly canvasHeight: number;
    readonly dt: number;
    readonly frame: number;
    readonly now: number;
    readonly pointerX: number | null;
    readonly pointerY: number | null;
    readonly config: Readonly<SimConfig>;
}
export type ExternalFrameProvider = (context: ExternalFrameContext) => readonly ExternalParticleState[];
export interface ExternalSimulationCapabilities {
    packedBuffer?: boolean;
    providesVelocity?: boolean;
    providesLife?: boolean;
    providesHue?: boolean;
    deterministic?: boolean;
    supportsMultiRate?: boolean;
}
export interface ExternalSimulationDescriptor {
    apiVersion: 2;
    id: string;
    name?: string;
    capabilities?: ExternalSimulationCapabilities;
}
export interface ExternalSimulationV2 {
    descriptor: ExternalSimulationDescriptor;
    getFrame(context: ExternalFrameContext): ExternalFramePayload;
    onAttach?(context: ExternalFrameContext): void;
    onDetach?(): void;
}
export type ExecutionMode = 'main-thread' | 'worker-ticker';
export type RenderBackend = 'auto' | 'webgl2' | 'canvas2d' | 'offscreen-worker';
export type SimulationBackend = 'auto' | 'js' | 'wasm';
export type PerformancePreset = 'performance' | 'balanced' | 'quality';
export type WorkerTransportCompression = 'none' | 'quantized16';
export type SpatialBackendType = 'grid' | 'bruteforce';
export type JobSystemMode = 'inline' | 'worker-pool';
export interface JobSystemSnapshot {
    mode: JobSystemMode;
    maxWorkers: number;
    defaultBatchSize: number;
    executedJobs: number;
    executedBatches: number;
    totalJobMs: number;
}
export interface JobSystemOptions {
    mode?: JobSystemMode;
    maxWorkers?: number;
    defaultBatchSize?: number;
}
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
    onPreSim?(context: GritPluginFrameContext): void;
    onPostSim?(context: GritPluginFrameContext): void;
    onRenderPrep?(context: GritPluginFrameContext): void;
    onRender?(context: GritPluginFrameContext): void;
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
    workerTransportCompression?: WorkerTransportCompression;
    runtimeBackendFallback?: boolean;
    postProcessing?: Partial<PostProcessingOptions>;
    config?: Partial<SimConfig>;
    spatialBackend?: SpatialBackendType;
    jobSystem?: JobSystemOptions;
    qualityGovernor?: Partial<QualityGovernorPolicy>;
    externalSimulation?: ExternalSimulationV2;
    externalFrameProvider?: ExternalFrameProvider;
    simulationStepHz?: number;
    externalStepHz?: number;
    maxSimulationStepsPerFrame?: number;
    onStats?: (stats: EngineStats) => void;
}
export declare const DEFAULT_SIM_CONFIG: SimConfig;
export declare const DEFAULT_POST_PROCESSING: PostProcessingOptions;
export declare const DEFAULT_ADAPTIVE_BUDGET: AdaptiveBudgetOptions;
export declare const DEFAULT_QUALITY_GOVERNOR: QualityGovernorPolicy;
//# sourceMappingURL=types.d.ts.map