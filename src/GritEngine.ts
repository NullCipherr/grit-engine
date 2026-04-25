import { createRenderer } from './core/rendererFactory';
import type { Renderer } from './core/types';
import { Obstacle } from './core/Obstacle';
import { Particle } from './core/Particle';
import { createSpatialBackend, type SpatialBackend } from './core/spatialBackend';
import { AdaptiveParticleBudget } from './runtime/AdaptiveParticleBudget';
import { FrameTimeWindow, type FrameTimeSummary } from './runtime/FrameTimeWindow';
import { resolvePerformancePreset } from './runtime/performancePresets';
import { LocalTelemetryTuner } from './runtime/TelemetryTuner';
import { WasmMulAddKernel } from './runtime/WasmMathKernel';
import { WorkerTicker } from './runtime/WorkerTicker';
import { JobSystem } from './runtime/JobSystem';
import { resolveSimulationBackend } from './runtime/simulationBackend';
import {
  DEFAULT_ADAPTIVE_BUDGET,
  DEFAULT_POST_PROCESSING,
  DEFAULT_QUALITY_GOVERNOR,
  DEFAULT_SIM_CONFIG,
  type DeterministicSnapshot,
  type EngineStats,
  type ExternalFramePayload,
  type ExternalFrameProvider,
  type ExternalPackedLayout,
  type ExternalParticleState,
  type ExternalSimulationV2,
  type GritEngineOptions,
  type GritPlugin,
  type GritPluginFrameContext,
  type GritPluginParticleContext,
  type JobSystemSnapshot,
  type PluginStage,
  type PerformancePreset,
  type QualityGovernorPolicy,
  type PostProcessingOptions,
  type RenderBackend,
  type SimConfig,
  type SimulationBackend,
  type SpatialBackendType,
  type SubsystemTimingsMs,
  type ReplayTape,
  type WorkerTransportCompression
} from './types';
import { SeededRandom } from './utils/SeededRandom';

const UI_UPDATE_INTERVAL_MS = 200;
const EMPTY_NEIGHBORS: Particle[] = [];
const SPAWN_COLORS = [
  'rgba(102, 138, 255, 1)',
  'rgba(156, 135, 188, 1)',
  'rgba(52, 211, 153, 1)'
];

interface MutablePluginFrameContext {
  config: Readonly<SimConfig>;
  canvasWidth: number;
  canvasHeight: number;
  dt: number;
  frame: number;
  now: number;
}

interface MutablePluginParticleContext extends MutablePluginFrameContext {
  pointerX: number | null;
  pointerY: number | null;
}

interface PerformanceMemoryShape {
  usedJSHeapSize?: number;
  jsHeapSizeLimit?: number;
}

export class GritEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly overlayCanvas?: HTMLCanvasElement;
  private readonly overlayCtx: CanvasRenderingContext2D | null;
  private readonly maxParticles: number;
  private readonly spawnBatch: number;
  private readonly maxDpr: number;
  private readonly executionMode: GritEngineOptions['executionMode'];
  private readonly onStats?: (stats: EngineStats) => void;
  private readonly workerTransportCompression: WorkerTransportCompression;
  private readonly runtimeBackendFallbackEnabled: boolean;

  private renderer: Renderer;
  private renderBackend: Exclude<RenderBackend, 'auto'>;
  private simulationBackend: Exclude<SimulationBackend, 'auto'>;
  private performancePreset: PerformancePreset;
  private readonly hybridAdaptiveEnabled: boolean;
  private performancePresetLockedByUser = false;
  private hybridCooldownTicks = 0;
  private adaptiveBudget: AdaptiveParticleBudget;
  private activeParticleLimit: number;

  private spatialBackendType: SpatialBackendType;
  private readonly spatialCellSize: number;
  private spatial: SpatialBackend;
  private readonly jobSystem: JobSystem;
  private requestId: number | null = null;
  private workerTicker: WorkerTicker | null = null;
  private running = false;
  private paused = false;

  private particles: Particle[] = [];
  private obstacles: Obstacle[] = [];
  private neighborsBuffer: Particle[] = [];
  private overlayDirty = true;

  private pointer = { x: null as number | null, y: null as number | null };

  private config: SimConfig;
  private postProcessing: PostProcessingOptions;

  private frameCount = 0;
  private frameIndex = 0;
  private lastTime = performance.now();
  private lastFpsTime = performance.now();
  private lastUiUpdate = performance.now();
  private fps = 0;
  private random: (() => number) | null = null;
  private seededRandom: SeededRandom | null = null;
  private readonly telemetryTuner: LocalTelemetryTuner;
  private wasmKernel: WasmMulAddKernel | null = null;
  private wasmMulAdd: ((base: number, value: number, factor: number) => number) | null = null;
  private frameTimeWindow = new FrameTimeWindow(360, 0.25, 120);
  private frameTimeSummary: FrameTimeSummary = {
    sampleCount: 0,
    avgMs: 0,
    p95Ms: 0,
    p99Ms: 0
  };
  private adaptiveScale = 1;
  private usedJSHeapSize: number | undefined = undefined;
  private jsHeapSizeLimit: number | undefined = undefined;
  private subsystemMs: SubsystemTimingsMs = {
    frameTotal: 0,
    plugins: 0,
    simulation: 0,
    external: 0,
    spatial: 0,
    render: 0,
    jobs: 0
  };
  private simulationStepMs = 16.666;
  private externalStepMs = 16.666;
  private simulationAccumulatorMs = 0;
  private externalAccumulatorMs = 0;
  private maxSimulationStepsPerFrame = 4;
  private qualityGovernor: QualityGovernorPolicy = DEFAULT_QUALITY_GOVERNOR;
  private qualityGovernorCooldown = 0;

  private pluginsById = new Map<string, GritPlugin>();
  private forcePlugins: GritPlugin[] = [];
  private constraintPlugins: GritPlugin[] = [];
  private framePlugins: GritPlugin[] = [];
  private stagePlugins: GritPlugin[] = [];

  private pluginFrameContext: MutablePluginFrameContext = {
    config: DEFAULT_SIM_CONFIG,
    canvasWidth: 0,
    canvasHeight: 0,
    dt: 0,
    frame: 0,
    now: 0
  };

  private pluginParticleContext: MutablePluginParticleContext = {
    config: DEFAULT_SIM_CONFIG,
    canvasWidth: 0,
    canvasHeight: 0,
    dt: 0,
    frame: 0,
    now: 0,
    pointerX: null,
    pointerY: null
  };

  private externalFrameProvider: ExternalFrameProvider | null = null;
  private externalSimulation: ExternalSimulationV2 | null = null;
  private cachedExternalFramePayload: ExternalFramePayload | null = null;
  private readonly externalFallbackParticleColor = 'rgba(102, 138, 255, 1)';
  private replayRecording = false;
  private replayMaxFrames = 0;
  private replayFrames: ReplayTape['frames'] = [];
  private replayPlayback: ReplayTape | null = null;
  private replayPlaybackIndex = 0;
  private replayLoop = false;

  constructor(options: GritEngineOptions) {
    this.canvas = options.canvas;
    this.overlayCanvas = options.overlayCanvas;
    this.overlayCtx = this.overlayCanvas?.getContext('2d') ?? null;
    this.maxParticles = options.maxParticles ?? 50_000;
    this.spawnBatch = options.spawnBatch ?? 100;
    this.maxDpr = options.maxDpr ?? 2;
    this.executionMode = options.executionMode ?? 'main-thread';
    this.onStats = options.onStats;
    this.workerTransportCompression = options.workerTransportCompression ?? 'none';
    this.runtimeBackendFallbackEnabled = options.runtimeBackendFallback ?? true;
    this.hybridAdaptiveEnabled = options.hybridAdaptive ?? true;
    this.telemetryTuner = new LocalTelemetryTuner(options.autoTune ?? true);
    this.qualityGovernor = {
      ...DEFAULT_QUALITY_GOVERNOR,
      ...options.qualityGovernor
    };

    const requestedPreset = options.performancePreset ?? 'balanced';
    this.performancePreset = this.telemetryTuner.recommendPreset(requestedPreset);
    const presetBundle = resolvePerformancePreset(this.performancePreset);

    this.config = {
      ...presetBundle.config,
      ...options.config
    };

    this.postProcessing = {
      ...presetBundle.postProcessing,
      ...options.postProcessing,
      bloom: options.config?.bloom ?? options.postProcessing?.bloom ?? presetBundle.postProcessing.bloom
    };

    this.adaptiveBudget = new AdaptiveParticleBudget(this.maxParticles, {
      ...DEFAULT_ADAPTIVE_BUDGET,
      ...options.adaptiveBudget
    });
    this.activeParticleLimit = this.maxParticles;

    this.spatialCellSize = options.gridCellSize ?? 40;
    this.spatialBackendType = options.spatialBackend ?? 'grid';
    this.spatial = createSpatialBackend(this.spatialBackendType, this.spatialCellSize);
    this.jobSystem = new JobSystem(options.jobSystem);

    const { renderer, backend } = createRenderer(this.canvas, this.maxParticles, options.renderBackend ?? 'auto', {
      workerTransportCompression: this.workerTransportCompression
    });
    this.renderer = renderer;
    this.renderBackend = backend;
    this.bindRendererErrorHandler();

    this.simulationBackend = resolveSimulationBackend(options.simulationBackend ?? 'auto');
    this.tryInitializeWasmKernel();

    this.configureRandom(options.seed);
    this.externalFrameProvider = options.externalFrameProvider ?? null;
    this.externalSimulation = options.externalSimulation ?? null;
    this.simulationStepMs = 1000 / Math.max(options.simulationStepHz ?? 60, 1);
    this.externalStepMs = 1000 / Math.max(options.externalStepHz ?? 60, 1);
    this.maxSimulationStepsPerFrame = Math.max(1, options.maxSimulationStepsPerFrame ?? 4);

    this.resize();
    if (this.externalSimulation?.onAttach) {
      this.externalSimulation.onAttach(this.buildExternalFrameContext(1, performance.now()));
    }
    this.redrawOverlay();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.lastFpsTime = this.lastTime;
    this.lastUiUpdate = this.lastTime;
    this.frameTimeWindow.reset();
    this.adaptiveBudget.reset();
    this.activeParticleLimit = this.maxParticles;
    this.adaptiveScale = 1;

    if (this.executionMode === 'worker-ticker' && typeof Worker !== 'undefined') {
      this.workerTicker = new WorkerTicker((timestamp) => {
        this.animate(timestamp);
      });
      this.workerTicker.start();
      return;
    }

    this.requestId = requestAnimationFrame(this.animate);
  }

  stop() {
    this.running = false;

    if (this.workerTicker) {
      this.workerTicker.stop();
      this.workerTicker.dispose();
      this.workerTicker = null;
    }

    if (this.requestId !== null) {
      cancelAnimationFrame(this.requestId);
      this.requestId = null;
    }
  }

  dispose() {
    this.stop();
    this.externalSimulation?.onDetach?.();
    this.telemetryTuner.persist(this.performancePreset);
    this.clearPlugins();
    this.renderer.dispose();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, this.maxDpr);

    const canvasRect = this.canvas.getBoundingClientRect();
    const cssWidth = Math.max(1, Math.floor(canvasRect.width));
    const cssHeight = Math.max(1, Math.floor(canvasRect.height));

    const pixelWidth = Math.max(1, Math.floor(cssWidth * dpr));
    const pixelHeight = Math.max(1, Math.floor(cssHeight * dpr));

    if (this.canvas.width !== pixelWidth || this.canvas.height !== pixelHeight) {
      this.canvas.width = pixelWidth;
      this.canvas.height = pixelHeight;
      this.canvas.style.width = `${cssWidth}px`;
      this.canvas.style.height = `${cssHeight}px`;
    }

    if (this.overlayCanvas) {
      if (this.overlayCanvas.width !== pixelWidth || this.overlayCanvas.height !== pixelHeight) {
        this.overlayCanvas.width = pixelWidth;
        this.overlayCanvas.height = pixelHeight;
        this.overlayCanvas.style.width = `${cssWidth}px`;
        this.overlayCanvas.style.height = `${cssHeight}px`;
        this.overlayDirty = true;
      }
    }

    if (this.overlayCtx) {
      this.overlayCtx.setTransform(1, 0, 0, 1, 0, 0);
      this.overlayCtx.scale(dpr, dpr);
    }
  }

  updateSettings(config: Partial<SimConfig>) {
    this.config = {
      ...this.config,
      ...config
    };

    if (typeof config.bloom === 'boolean') {
      this.postProcessing = {
        ...this.postProcessing,
        bloom: config.bloom
      };
    }
  }

  getSettings(): SimConfig {
    return { ...this.config };
  }

  updatePostProcessing(options: Partial<PostProcessingOptions>) {
    this.postProcessing = {
      ...this.postProcessing,
      ...options
    };
  }

  getPostProcessing(): PostProcessingOptions {
    return { ...this.postProcessing };
  }

  getRenderBackend() {
    return this.renderBackend;
  }

  setRenderBackend(backend: RenderBackend) {
    const { renderer, backend: resolvedBackend } = createRenderer(this.canvas, this.maxParticles, backend, {
      workerTransportCompression: this.workerTransportCompression
    });

    this.renderer.dispose();
    this.renderer = renderer;
    this.renderBackend = resolvedBackend;
    this.bindRendererErrorHandler();
  }

  getSimulationBackend() {
    return this.simulationBackend;
  }

  setSimulationBackend(backend: SimulationBackend) {
    this.simulationBackend = resolveSimulationBackend(backend);
    this.tryInitializeWasmKernel();
  }

  getPerformancePreset() {
    return this.performancePreset;
  }

  setPerformancePreset(preset: PerformancePreset) {
    this.performancePresetLockedByUser = true;
    this.applyPerformancePreset(preset);
  }

  setPerformancePresetLock(locked: boolean) {
    this.performancePresetLockedByUser = locked;
  }

  getPerformancePresetLock() {
    return this.performancePresetLockedByUser;
  }

  setAdaptiveBudgetEnabled(enabled: boolean) {
    this.adaptiveBudget.setEnabled(enabled);
  }

  setPaused(paused: boolean) {
    this.paused = paused;
  }

  getPaused() {
    return this.paused;
  }

  setPointer(x: number, y: number) {
    this.pointer = { x, y };
  }

  clearPointer() {
    this.pointer = { x: null, y: null };
  }

  setExternalFrameProvider(provider: ExternalFrameProvider | null) {
    this.externalSimulation?.onDetach?.();
    this.externalSimulation = null;
    this.externalFrameProvider = provider;
    if (!provider) return;
    this.neighborsBuffer.length = 0;
    this.obstacles.length = 0;
    this.overlayDirty = true;
  }

  getExternalFrameProviderEnabled() {
    return this.externalFrameProvider !== null || this.externalSimulation !== null;
  }

  setExternalSimulation(simulation: ExternalSimulationV2 | null) {
    this.externalSimulation?.onDetach?.();
    this.externalFrameProvider = null;
    this.externalSimulation = simulation;
    this.cachedExternalFramePayload = null;
    this.externalAccumulatorMs = 0;

    if (!simulation) return;
    this.neighborsBuffer.length = 0;
    this.obstacles.length = 0;
    this.overlayDirty = true;
    try {
      simulation.onAttach?.(this.buildExternalFrameContext(1, performance.now()));
    } catch {
      this.externalSimulation = null;
    }
  }

  getExternalSimulationDescriptor() {
    return this.externalSimulation?.descriptor ?? null;
  }

  setSimulationStepHz(stepHz: number) {
    this.simulationStepMs = 1000 / Math.max(stepHz, 1);
  }

  setExternalStepHz(stepHz: number) {
    this.externalStepMs = 1000 / Math.max(stepHz, 1);
  }

  getSchedulerConfig() {
    return {
      simulationStepHz: 1000 / this.simulationStepMs,
      externalStepHz: 1000 / this.externalStepMs,
      maxSimulationStepsPerFrame: this.maxSimulationStepsPerFrame
    };
  }

  setSpatialBackend(type: SpatialBackendType) {
    if (this.spatialBackendType === type) return;
    this.spatialBackendType = type;
    this.spatial = createSpatialBackend(type, this.spatialCellSize);
  }

  getSpatialBackend() {
    return this.spatialBackendType;
  }

  getJobSystemSnapshot(): JobSystemSnapshot {
    return this.jobSystem.snapshot();
  }

  setQualityGovernorPolicy(policy: Partial<QualityGovernorPolicy>) {
    this.qualityGovernor = {
      ...this.qualityGovernor,
      ...policy
    };
  }

  getQualityGovernorPolicy() {
    return { ...this.qualityGovernor };
  }

  startReplayRecording(maxFrames = 1800) {
    this.replayRecording = true;
    this.replayMaxFrames = Math.max(1, maxFrames | 0);
    this.replayFrames = [];
  }

  stopReplayRecording(): ReplayTape | null {
    if (!this.replayRecording) return null;
    this.replayRecording = false;
    return {
      version: 1,
      createdAt: Date.now(),
      sourceSeed: this.getSeed(),
      frameStride: 8,
      frames: this.replayFrames.slice()
    };
  }

  playReplay(tape: ReplayTape, loop = false) {
    this.replayPlayback = tape;
    this.replayPlaybackIndex = 0;
    this.replayLoop = loop;
  }

  stopReplayPlayback() {
    this.replayPlayback = null;
    this.replayPlaybackIndex = 0;
    this.replayLoop = false;
  }

  isReplayPlaybackEnabled() {
    return this.replayPlayback !== null;
  }

  getDeterministicSnapshot(): DeterministicSnapshot {
    return {
      seed: this.getSeed(),
      frame: this.frameIndex,
      particles: this.exportParticlesPacked(),
      count: this.particles.length
    };
  }

  spawnAt(x: number, y: number) {
    if (this.particles.length >= this.activeParticleLimit) return;

    const available = this.activeParticleLimit - this.particles.length;
    const amount = available < this.spawnBatch ? available : this.spawnBatch;

    for (let i = 0; i < amount; i++) {
      const rand = this.getRandom();
      const color = SPAWN_COLORS[(rand() * SPAWN_COLORS.length) | 0];
      this.particles.push(new Particle(x, y, color, this.config, rand));
    }
  }

  setSeed(seed: number) {
    this.configureRandom(seed);
  }

  getSeed(): number | null {
    return this.seededRandom?.getSeed() ?? null;
  }

  addObstacle(x: number, y: number) {
    this.obstacles.push(new Obstacle(x, y));
    this.overlayDirty = true;
  }

  clear() {
    this.particles.length = 0;
    this.obstacles.length = 0;
    this.neighborsBuffer.length = 0;
    this.overlayDirty = true;
    this.emitStats(true);
  }

  getStats(): EngineStats {
    this.frameTimeWindow.snapshot(this.frameTimeSummary);
    const budget = this.adaptiveBudget.snapshot();
    this.sampleMemoryStats();
    this.activeParticleLimit = budget.activeParticleLimit;
    this.adaptiveScale = budget.scale;

    return {
      particleCount: this.particles.length,
      fps: this.fps,
      frameTimeAvgMs: this.frameTimeSummary.avgMs,
      frameTimeP95Ms: this.frameTimeSummary.p95Ms,
      frameTimeP99Ms: this.frameTimeSummary.p99Ms,
      activeParticleLimit: this.activeParticleLimit,
      adaptiveScale: this.adaptiveScale,
      effectivePreset: this.performancePreset,
      spatialBackend: this.spatialBackendType,
      subsystemMs: this.subsystemMs,
      jobs: this.jobSystem.snapshot(),
      usedJSHeapSize: this.usedJSHeapSize,
      jsHeapSizeLimit: this.jsHeapSizeLimit
    };
  }

  registerPlugin(plugin: GritPlugin) {
    if (!plugin.id) {
      throw new Error('Plugin precisa definir id único');
    }

    if (this.pluginsById.has(plugin.id)) {
      throw new Error(`Plugin com id "${plugin.id}" já registrado`);
    }

    this.pluginsById.set(plugin.id, plugin);

    if (plugin.applyForce) {
      this.forcePlugins.push(plugin);
    }

    if (plugin.applyConstraint) {
      this.constraintPlugins.push(plugin);
    }

    if (plugin.onFrameStart || plugin.onFrameEnd) {
      this.framePlugins.push(plugin);
    }

    if (plugin.onPreSim || plugin.onPostSim || plugin.onRenderPrep || plugin.onRender) {
      this.stagePlugins.push(plugin);
    }

    plugin.onRegister?.();
  }

  unregisterPlugin(pluginId: string) {
    const plugin = this.pluginsById.get(pluginId);
    if (!plugin) {
      return false;
    }

    this.pluginsById.delete(pluginId);
    this.forcePlugins = this.forcePlugins.filter((entry) => entry.id !== pluginId);
    this.constraintPlugins = this.constraintPlugins.filter((entry) => entry.id !== pluginId);
    this.framePlugins = this.framePlugins.filter((entry) => entry.id !== pluginId);
    this.stagePlugins = this.stagePlugins.filter((entry) => entry.id !== pluginId);
    plugin.onUnregister?.();

    return true;
  }

  clearPlugins() {
    for (const plugin of this.pluginsById.values()) {
      plugin.onUnregister?.();
    }

    this.pluginsById.clear();
    this.forcePlugins.length = 0;
    this.constraintPlugins.length = 0;
    this.framePlugins.length = 0;
    this.stagePlugins.length = 0;
  }

  getPlugins(): readonly GritPlugin[] {
    return Array.from(this.pluginsById.values());
  }

  private animate = (currentTime: number) => {
    if (!this.running) return;

    if (!this.paused) {
      const frameStart = performance.now();
      const frameMs = currentTime - this.lastTime;
      const dt = Math.min(frameMs / 16.666, 3);
      this.lastTime = currentTime;
      this.frameIndex++;
      this.frameTimeWindow.push(frameMs);
      this.jobSystem.resetFrameCounters();
      this.subsystemMs = {
        frameTotal: 0,
        plugins: 0,
        simulation: 0,
        external: 0,
        spatial: 0,
        render: 0,
        jobs: 0
      };

      const { x: mx, y: my } = this.pointer;
      this.applyActiveParticleBudget();

      this.updatePluginContexts(dt, currentTime, mx, my);
      const pluginStart = performance.now();
      this.runFrameStartPlugins();
      this.runStagePlugins('pre-sim');
      this.subsystemMs.plugins += performance.now() - pluginStart;

      if (this.replayPlayback) {
        const replayFrame = this.replayPlayback.frames[this.replayPlaybackIndex];
        if (replayFrame) {
          this.consumeExternalPackedParticles(replayFrame.particles, 8, replayFrame.count, {
            x: 0,
            y: 1,
            vx: 2,
            vy: 3,
            size: 4,
            life: 5,
            maxLife: 6,
            hue: 7
          });
        }

        this.replayPlaybackIndex++;
        if (this.replayPlaybackIndex >= this.replayPlayback.frames.length) {
          if (this.replayLoop) {
            this.replayPlaybackIndex = 0;
          } else {
            this.stopReplayPlayback();
          }
        }
      } else if (this.externalSimulation || this.externalFrameProvider) {
        const externalStart = performance.now();
        this.externalAccumulatorMs += frameMs;
        let steps = 0;
        while (this.externalAccumulatorMs >= this.externalStepMs && steps < this.maxSimulationStepsPerFrame) {
          const externalDt = Math.min(this.externalStepMs / 16.666, 3);
          const context = this.buildExternalFrameContext(externalDt, currentTime);
          try {
            if (this.externalSimulation) {
              this.cachedExternalFramePayload = this.externalSimulation.getFrame(context);
            } else if (this.externalFrameProvider) {
              this.cachedExternalFramePayload = {
                kind: 'objects',
                particles: this.externalFrameProvider(context)
              };
            }
          } catch {
            // Mantém o último frame válido para evitar quebra visual por exceção externa.
          }
          this.externalAccumulatorMs -= this.externalStepMs;
          steps++;
        }

        if (this.cachedExternalFramePayload) {
          this.consumeExternalFramePayload(this.cachedExternalFramePayload);
        }
        this.subsystemMs.external += performance.now() - externalStart;
      } else {
        const simStart = performance.now();
        this.simulationAccumulatorMs += frameMs;
        let steps = 0;
        while (this.simulationAccumulatorMs >= this.simulationStepMs && steps < this.maxSimulationStepsPerFrame) {
          const simDt = Math.min(this.simulationStepMs / 16.666, 3);
          this.runInternalSimulationStep(mx, my, simDt);
          this.simulationAccumulatorMs -= this.simulationStepMs;
          steps++;
        }
        this.subsystemMs.simulation += performance.now() - simStart;
      }

      const pluginEndStart = performance.now();
      this.runStagePlugins('post-sim');
      this.runFrameEndPlugins();
      this.subsystemMs.plugins += performance.now() - pluginEndStart;

      if (this.replayRecording && !this.replayPlayback) {
        this.replayFrames.push({
          particles: this.exportParticlesPacked(),
          count: this.particles.length,
          frame: this.frameIndex
        });
        if (this.replayFrames.length > this.replayMaxFrames) {
          this.replayFrames.shift();
        }
      }

      this.runStagePlugins('render-prep');
      const renderStart = performance.now();
      this.renderer.render(this.particles, this.canvas.width, this.canvas.height, this.postProcessing);
      this.redrawOverlay();
      this.subsystemMs.render += performance.now() - renderStart;
      this.runStagePlugins('render');

      this.frameCount++;
      const elapsed = currentTime - this.lastFpsTime;
      if (elapsed >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / elapsed);
        this.frameCount = 0;
        this.lastFpsTime = currentTime;
      }

      if (currentTime - this.lastUiUpdate >= UI_UPDATE_INTERVAL_MS) {
        this.lastUiUpdate = currentTime;
        this.subsystemMs.jobs = this.jobSystem.snapshot().totalJobMs;
        this.subsystemMs.frameTotal = performance.now() - frameStart;
        this.emitStats();
      }
    } else {
      this.lastTime = currentTime;
    }

    this.requestId = requestAnimationFrame(this.animate);
  };

  private runInternalSimulationStep(mouseX: number | null, mouseY: number | null, dt: number) {
    const spatialStart = performance.now();
    this.spatial.clear();
    const particleCount = this.particles.length;
    this.jobSystem.run(() => {
      this.jobSystem.forEachRange(particleCount, (start, end) => {
        for (let i = start; i < end; i++) {
          this.spatial.add(this.particles[i]);
        }
      }, 1024);
    });
    this.subsystemMs.spatial += performance.now() - spatialStart;

    const useNeighbors = this.config.flocking || this.config.collisions;

    let aliveWriteIndex = 0;
    for (let i = 0; i < particleCount; i++) {
      const particle = this.particles[i];

      let neighbors = EMPTY_NEIGHBORS;
      if (useNeighbors) {
        this.spatial.getNeighborsInto(particle, this.neighborsBuffer);
        neighbors = this.neighborsBuffer;
      } else {
        this.neighborsBuffer.length = 0;
      }

      this.runForcePlugins(particle);

      if (this.simulationBackend === 'wasm') {
        this.updateParticleWasmPath(particle, neighbors, mouseX, mouseY, dt);
      } else {
        this.updateParticleJsPath(particle, neighbors, mouseX, mouseY, dt);
      }

      this.runConstraintPlugins(particle);

      if (!particle.isDead()) {
        this.particles[aliveWriteIndex++] = particle;
      }
    }

    if (aliveWriteIndex !== particleCount) {
      this.particles.length = aliveWriteIndex;
    }
  }

  private buildExternalFrameContext(dt: number, now: number) {
    return {
      canvasWidth: this.canvas.width,
      canvasHeight: this.canvas.height,
      dt,
      frame: this.frameIndex,
      now,
      pointerX: this.pointer.x,
      pointerY: this.pointer.y,
      config: this.config
    } as const;
  }

  private consumeExternalFramePayload(payload: ExternalFramePayload) {
    if (payload.kind === 'packed-f32') {
      this.consumeExternalPackedParticles(payload.data, payload.stride, payload.count, payload.layout);
      return;
    }
    this.consumeExternalObjectParticles(payload.particles);
  }

  private consumeExternalObjectParticles(states: readonly ExternalParticleState[]) {
    const cappedCount = Math.min(states.length, this.activeParticleLimit);
    this.ensureParticleCapacity(cappedCount);

    for (let i = 0; i < cappedCount; i++) {
      this.writeExternalParticle(this.particles[i], states[i]);
    }

    this.particles.length = cappedCount;
  }

  private consumeExternalPackedParticles(
    data: Float32Array,
    stride: number,
    count?: number,
    layout?: ExternalPackedLayout
  ) {
    const safeStride = Math.max(stride | 0, 2);
    if (!Number.isFinite(safeStride) || safeStride <= 0) return;
    const availableCount = Math.floor(data.length / safeStride);
    if (availableCount <= 0) {
      this.particles.length = 0;
      return;
    }
    const finalCount = Math.min(count ?? availableCount, availableCount, this.activeParticleLimit);
    this.ensureParticleCapacity(finalCount);

    const map = {
      x: this.normalizeLayoutIndex(layout?.x, safeStride, 0),
      y: this.normalizeLayoutIndex(layout?.y, safeStride, 1),
      vx: this.normalizeLayoutIndex(layout?.vx, safeStride, -1),
      vy: this.normalizeLayoutIndex(layout?.vy, safeStride, -1),
      size: this.normalizeLayoutIndex(layout?.size, safeStride, -1),
      life: this.normalizeLayoutIndex(layout?.life, safeStride, -1),
      maxLife: this.normalizeLayoutIndex(layout?.maxLife, safeStride, -1),
      hue: this.normalizeLayoutIndex(layout?.hue, safeStride, -1)
    };

    for (let i = 0; i < finalCount; i++) {
      const base = i * safeStride;
      const dst = this.particles[i];
      dst.x = this.safeRead(data, base, map.x, 0);
      dst.y = this.safeRead(data, base, map.y, 0);
      dst.vx = map.vx >= 0 ? this.safeRead(data, base, map.vx, 0) : 0;
      dst.vy = map.vy >= 0 ? this.safeRead(data, base, map.vy, 0) : 0;
      dst.ax = 0;
      dst.ay = 0;
      dst.baseSize = map.size >= 0 ? this.safeRead(data, base, map.size, this.config.particleSize) : this.config.particleSize;
      dst.size = dst.baseSize;
      dst.mass = dst.baseSize > 0.1 ? dst.baseSize : 0.1;
      dst.maxLife = map.maxLife >= 0 ? this.safeRead(data, base, map.maxLife, 1) : 1;
      dst.life = map.life >= 0 ? this.safeRead(data, base, map.life, dst.maxLife) : dst.maxLife;
      dst.hue = map.hue >= 0 ? this.safeRead(data, base, map.hue, 200) : 200;
    }

    this.particles.length = finalCount;
  }

  private ensureParticleCapacity(targetCount: number) {
    if (this.particles.length >= targetCount) return;
    const rand = this.getRandom();
    const missing = targetCount - this.particles.length;
    for (let i = 0; i < missing; i++) {
      this.particles.push(new Particle(0, 0, this.externalFallbackParticleColor, this.config, rand));
    }
  }

  private writeExternalParticle(dst: Particle, src: ExternalParticleState) {
    dst.x = Number.isFinite(src.x) ? src.x : 0;
    dst.y = Number.isFinite(src.y) ? src.y : 0;
    dst.vx = src.vx ?? 0;
    dst.vy = src.vy ?? 0;
    dst.ax = 0;
    dst.ay = 0;
    dst.baseSize = Number.isFinite(src.size ?? NaN) ? (src.size as number) : this.config.particleSize;
    dst.size = dst.baseSize;
    dst.mass = dst.baseSize > 0.1 ? dst.baseSize : 0.1;
    dst.maxLife = Number.isFinite(src.maxLife ?? NaN) ? (src.maxLife as number) : 1;
    dst.life = Number.isFinite(src.life ?? NaN) ? (src.life as number) : dst.maxLife;
    dst.hue = Number.isFinite(src.hue ?? NaN) ? (src.hue as number) : 200;
  }

  private normalizeLayoutIndex(index: number | undefined, stride: number, fallback: number) {
    if (typeof index !== 'number' || !Number.isFinite(index)) return fallback;
    const normalized = index | 0;
    if (normalized < 0 || normalized >= stride) return fallback;
    return normalized;
  }

  private safeRead(data: Float32Array, base: number, offset: number, fallback: number) {
    const idx = base + offset;
    if (idx < 0 || idx >= data.length) return fallback;
    const value = data[idx];
    return Number.isFinite(value) ? value : fallback;
  }

  private exportParticlesPacked(): Float32Array {
    const stride = 8;
    const out = new Float32Array(this.particles.length * stride);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const base = i * stride;
      out[base] = p.x;
      out[base + 1] = p.y;
      out[base + 2] = p.vx;
      out[base + 3] = p.vy;
      out[base + 4] = p.size;
      out[base + 5] = p.life;
      out[base + 6] = p.maxLife;
      out[base + 7] = p.hue;
    }

    return out;
  }

  private updateParticleJsPath(
    particle: Particle,
    neighbors: Particle[],
    mouseX: number | null,
    mouseY: number | null,
    dt: number
  ) {
    particle.update(
      this.config,
      this.canvas.width,
      this.canvas.height,
      mouseX,
      mouseY,
      neighbors,
      this.obstacles,
      dt
    );
  }

  private updateParticleWasmPath(
    particle: Particle,
    neighbors: Particle[],
    mouseX: number | null,
    mouseY: number | null,
    dt: number
  ) {
    // Caminho de compatibilidade para kernels WASM: quando nenhum kernel externo é
    // injetado, a engine mantém o mesmo contrato e usa o integrador JS como fallback.
    particle.update(
      this.config,
      this.canvas.width,
      this.canvas.height,
      mouseX,
      mouseY,
      neighbors,
      this.obstacles,
      dt,
      this.wasmMulAdd ?? undefined
    );
  }

  private updatePluginContexts(dt: number, now: number, pointerX: number | null, pointerY: number | null) {
    this.pluginFrameContext.config = this.config;
    this.pluginFrameContext.canvasWidth = this.canvas.width;
    this.pluginFrameContext.canvasHeight = this.canvas.height;
    this.pluginFrameContext.dt = dt;
    this.pluginFrameContext.frame = this.frameIndex;
    this.pluginFrameContext.now = now;

    this.pluginParticleContext.config = this.config;
    this.pluginParticleContext.canvasWidth = this.canvas.width;
    this.pluginParticleContext.canvasHeight = this.canvas.height;
    this.pluginParticleContext.dt = dt;
    this.pluginParticleContext.frame = this.frameIndex;
    this.pluginParticleContext.now = now;
    this.pluginParticleContext.pointerX = pointerX;
    this.pluginParticleContext.pointerY = pointerY;
  }

  private runFrameStartPlugins() {
    if (this.framePlugins.length === 0) return;

    for (let i = 0; i < this.framePlugins.length; i++) {
      const plugin = this.framePlugins[i];
      if (plugin.enabled === false || !plugin.onFrameStart) continue;
      plugin.onFrameStart(this.pluginFrameContext as GritPluginFrameContext);
    }
  }

  private runFrameEndPlugins() {
    if (this.framePlugins.length === 0) return;

    for (let i = 0; i < this.framePlugins.length; i++) {
      const plugin = this.framePlugins[i];
      if (plugin.enabled === false || !plugin.onFrameEnd) continue;
      plugin.onFrameEnd(this.pluginFrameContext as GritPluginFrameContext);
    }
  }

  private runStagePlugins(stage: PluginStage) {
    if (this.stagePlugins.length === 0) return;

    for (let i = 0; i < this.stagePlugins.length; i++) {
      const plugin = this.stagePlugins[i];
      if (plugin.enabled === false) continue;

      if (stage === 'pre-sim' && plugin.onPreSim) {
        plugin.onPreSim(this.pluginFrameContext as GritPluginFrameContext);
      } else if (stage === 'post-sim' && plugin.onPostSim) {
        plugin.onPostSim(this.pluginFrameContext as GritPluginFrameContext);
      } else if (stage === 'render-prep' && plugin.onRenderPrep) {
        plugin.onRenderPrep(this.pluginFrameContext as GritPluginFrameContext);
      } else if (stage === 'render' && plugin.onRender) {
        plugin.onRender(this.pluginFrameContext as GritPluginFrameContext);
      }
    }
  }

  private runForcePlugins(particle: Particle) {
    if (this.forcePlugins.length === 0) return;

    for (let i = 0; i < this.forcePlugins.length; i++) {
      const plugin = this.forcePlugins[i];
      if (plugin.enabled === false || !plugin.applyForce) continue;
      plugin.applyForce(particle, this.pluginParticleContext as GritPluginParticleContext);
    }
  }

  private runConstraintPlugins(particle: Particle) {
    if (this.constraintPlugins.length === 0) return;

    for (let i = 0; i < this.constraintPlugins.length; i++) {
      const plugin = this.constraintPlugins[i];
      if (plugin.enabled === false || !plugin.applyConstraint) continue;
      plugin.applyConstraint(particle, this.pluginParticleContext as GritPluginParticleContext);
    }
  }

  private redrawOverlay() {
    if (!this.overlayCanvas || !this.overlayCtx || !this.overlayDirty) return;

    const rect = this.overlayCanvas.getBoundingClientRect();
    this.overlayCtx.clearRect(0, 0, rect.width, rect.height);

    for (let i = 0; i < this.obstacles.length; i++) {
      this.obstacles[i].draw(this.overlayCtx);
    }

    this.overlayDirty = false;
  }

  private emitStats(force = false) {
    this.frameTimeWindow.snapshot(this.frameTimeSummary);
    this.adaptiveBudget.update(this.frameTimeSummary.p95Ms, this.frameTimeSummary.p99Ms);
    this.telemetryTuner.capture(this.frameTimeSummary.p99Ms, this.fps);
    this.applyHybridRuntimeTuning();

    const budget = this.adaptiveBudget.snapshot();
    this.sampleMemoryStats();
    this.activeParticleLimit = budget.activeParticleLimit;
    this.adaptiveScale = budget.scale;

    if (!this.onStats && !force) return;

    this.onStats?.({
      particleCount: this.particles.length,
      fps: this.fps,
      frameTimeAvgMs: this.frameTimeSummary.avgMs,
      frameTimeP95Ms: this.frameTimeSummary.p95Ms,
      frameTimeP99Ms: this.frameTimeSummary.p99Ms,
      activeParticleLimit: this.activeParticleLimit,
      adaptiveScale: this.adaptiveScale,
      effectivePreset: this.performancePreset,
      spatialBackend: this.spatialBackendType,
      subsystemMs: this.subsystemMs,
      jobs: this.jobSystem.snapshot(),
      usedJSHeapSize: this.usedJSHeapSize,
      jsHeapSizeLimit: this.jsHeapSizeLimit
    });
  }

  private applyActiveParticleBudget() {
    if (this.particles.length <= this.activeParticleLimit) return;
    this.particles.length = this.activeParticleLimit;
  }

  private applyHybridRuntimeTuning() {
    if (!this.hybridAdaptiveEnabled && !this.qualityGovernor.enabled) return;
    if (this.performancePresetLockedByUser) return;

    if (this.hybridCooldownTicks > 0 || this.qualityGovernorCooldown > 0) {
      this.hybridCooldownTicks = Math.max(0, this.hybridCooldownTicks - 1);
      this.qualityGovernorCooldown = Math.max(0, this.qualityGovernorCooldown - 1);
      return;
    }

    const p99 = this.frameTimeSummary.p99Ms;

    if (this.qualityGovernor.enabled) {
      if (p99 > this.qualityGovernor.highWatermarkMs) {
        this.applyQualityDegradationStep();
        this.qualityGovernorCooldown = this.qualityGovernor.cooldownFrames;
        return;
      }

      if (p99 < this.qualityGovernor.lowWatermarkMs) {
        this.applyQualityRecoveryStep();
        this.qualityGovernorCooldown = this.qualityGovernor.cooldownFrames;
        return;
      }
    }

    if (this.hybridAdaptiveEnabled) {
      if (p99 > 30 && this.performancePreset !== 'performance') {
        this.applyPerformancePreset('performance');
        this.setSimulationBackend('wasm');
        this.hybridCooldownTicks = 12;
        return;
      }

      if (p99 < 14 && this.performancePreset === 'performance') {
        this.applyPerformancePreset('balanced');
        this.hybridCooldownTicks = 12;
        return;
      }

      if (p99 < 10 && this.performancePreset === 'balanced') {
        this.applyPerformancePreset('quality');
        this.hybridCooldownTicks = 18;
      }
    }
  }

  private applyQualityDegradationStep() {
    for (let i = 0; i < this.qualityGovernor.degradationOrder.length; i++) {
      const step = this.qualityGovernor.degradationOrder[i];
      if (step === 'postprocessing') {
        if (this.postProcessing.bloom || this.postProcessing.vignette || this.postProcessing.trailStrength > 0.64) {
          this.postProcessing = {
            ...this.postProcessing,
            bloom: false,
            vignette: false,
            trailStrength: Math.max(0.56, this.postProcessing.trailStrength - 0.08)
          };
          return;
        }
      } else if (step === 'preset') {
        if (this.performancePreset === 'quality') {
          this.applyPerformancePreset('balanced');
          return;
        }
        if (this.performancePreset === 'balanced') {
          this.applyPerformancePreset('performance');
          return;
        }
      } else if (step === 'simulation-rate') {
        const hz = 1000 / this.simulationStepMs;
        if (hz > 30) {
          this.setSimulationStepHz(Math.max(30, hz - 10));
          return;
        }
      }
    }
  }

  private applyQualityRecoveryStep() {
    const hz = 1000 / this.simulationStepMs;
    if (hz < 60) {
      this.setSimulationStepHz(Math.min(60, hz + 10));
      return;
    }

    if (!this.postProcessing.bloom || !this.postProcessing.vignette) {
      this.postProcessing = {
        ...this.postProcessing,
        bloom: true,
        vignette: true,
        trailStrength: Math.min(0.84, this.postProcessing.trailStrength + 0.05)
      };
      return;
    }

    if (this.performancePreset === 'performance') {
      this.applyPerformancePreset('balanced');
      return;
    }
    if (this.performancePreset === 'balanced') {
      this.applyPerformancePreset('quality');
    }
  }

  private applyPerformancePreset(preset: PerformancePreset) {
    const bundle = resolvePerformancePreset(preset);
    this.performancePreset = preset;
    this.config = { ...bundle.config };
    this.postProcessing = { ...bundle.postProcessing };
  }

  private tryInitializeWasmKernel() {
    if (this.simulationBackend !== 'wasm') return;
    if (this.wasmKernel) return;

    this.wasmKernel = new WasmMulAddKernel();
    this.wasmKernel
      .init()
      .then(() => {
        if (!this.wasmKernel?.ready) return;
        this.wasmMulAdd = (base: number, value: number, factor: number) =>
          this.wasmKernel!.mulAdd(base, value, factor);
      })
      .catch(() => {
        this.wasmMulAdd = null;
      });
  }

  private bindRendererErrorHandler() {
    this.renderer.setErrorHandler?.((reason) => {
      this.handleRendererRuntimeError(reason);
    });
  }

  private handleRendererRuntimeError(_reason: string) {
    if (!this.runtimeBackendFallbackEnabled) return;

    const nextBackend = this.resolveFallbackBackend(this.renderBackend);
    if (!nextBackend) return;

    let nextRendererPayload: ReturnType<typeof createRenderer> | null = null;
    try {
      nextRendererPayload = createRenderer(this.canvas, this.maxParticles, nextBackend, {
        workerTransportCompression: this.workerTransportCompression
      });
    } catch {
      return;
    }
    if (!nextRendererPayload) return;

    this.renderer.dispose();
    this.renderer = nextRendererPayload.renderer;
    this.renderBackend = nextRendererPayload.backend;
    this.bindRendererErrorHandler();
  }

  private resolveFallbackBackend(current: Exclude<RenderBackend, 'auto'>): Exclude<RenderBackend, 'auto'> | null {
    if (current === 'offscreen-worker') return 'webgl2';
    if (current === 'webgl2') return 'canvas2d';
    return null;
  }

  private sampleMemoryStats() {
    const perf = performance as Performance & {
      memory?: PerformanceMemoryShape;
    };
    const memory = perf.memory;
    if (!memory) return;
    if (typeof memory.usedJSHeapSize === 'number') {
      this.usedJSHeapSize = memory.usedJSHeapSize;
    }
    if (typeof memory.jsHeapSizeLimit === 'number') {
      this.jsHeapSizeLimit = memory.jsHeapSizeLimit;
    }
  }

  private configureRandom(seed?: number) {
    if (typeof seed !== 'number') {
      this.seededRandom = null;
      this.random = null;
      return;
    }

    this.seededRandom = new SeededRandom(seed);
    this.random = () => this.seededRandom!.next();
  }

  private getRandom(): () => number {
    return this.random ?? Math.random;
  }
}
