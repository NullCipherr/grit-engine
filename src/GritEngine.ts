import { createRenderer } from './core/rendererFactory';
import type { Renderer } from './core/types';
import { Obstacle } from './core/Obstacle';
import { Particle } from './core/Particle';
import { SpatialGrid } from './core/SpatialGrid';
import { WorkerTicker } from './runtime/WorkerTicker';
import { resolveSimulationBackend } from './runtime/simulationBackend';
import {
  DEFAULT_POST_PROCESSING,
  DEFAULT_SIM_CONFIG,
  type EngineStats,
  type GritEngineOptions,
  type GritPlugin,
  type GritPluginFrameContext,
  type GritPluginParticleContext,
  type PostProcessingOptions,
  type RenderBackend,
  type SimConfig,
  type SimulationBackend
} from './types';
import { SeededRandom } from './utils/SeededRandom';

const UI_UPDATE_INTERVAL_MS = 200;
const EMPTY_NEIGHBORS: Particle[] = [];

export class GritEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly overlayCanvas?: HTMLCanvasElement;
  private readonly overlayCtx: CanvasRenderingContext2D | null;
  private readonly maxParticles: number;
  private readonly spawnBatch: number;
  private readonly maxDpr: number;
  private readonly executionMode: GritEngineOptions['executionMode'];
  private readonly onStats?: (stats: EngineStats) => void;

  private renderer: Renderer;
  private renderBackend: Exclude<RenderBackend, 'auto'>;
  private simulationBackend: Exclude<SimulationBackend, 'auto'>;

  private grid: SpatialGrid;
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

  private pluginsById = new Map<string, GritPlugin>();
  private forcePlugins: GritPlugin[] = [];
  private constraintPlugins: GritPlugin[] = [];
  private framePlugins: GritPlugin[] = [];

  private pluginFrameContext: GritPluginFrameContext = {
    config: DEFAULT_SIM_CONFIG,
    canvasWidth: 0,
    canvasHeight: 0,
    dt: 0,
    frame: 0,
    now: 0
  };

  private pluginParticleContext: GritPluginParticleContext = {
    config: DEFAULT_SIM_CONFIG,
    canvasWidth: 0,
    canvasHeight: 0,
    dt: 0,
    frame: 0,
    now: 0,
    pointerX: null,
    pointerY: null
  };

  constructor(options: GritEngineOptions) {
    this.canvas = options.canvas;
    this.overlayCanvas = options.overlayCanvas;
    this.overlayCtx = this.overlayCanvas?.getContext('2d') ?? null;
    this.maxParticles = options.maxParticles ?? 50_000;
    this.spawnBatch = options.spawnBatch ?? 100;
    this.maxDpr = options.maxDpr ?? 2;
    this.executionMode = options.executionMode ?? 'main-thread';
    this.onStats = options.onStats;

    this.config = {
      ...DEFAULT_SIM_CONFIG,
      ...options.config
    };

    this.postProcessing = {
      ...DEFAULT_POST_PROCESSING,
      ...options.postProcessing,
      bloom: options.config?.bloom ?? options.postProcessing?.bloom ?? DEFAULT_POST_PROCESSING.bloom
    };

    this.grid = new SpatialGrid(options.gridCellSize ?? 40);

    const { renderer, backend } = createRenderer(this.canvas, this.maxParticles, options.renderBackend ?? 'auto');
    this.renderer = renderer;
    this.renderBackend = backend;

    this.simulationBackend = resolveSimulationBackend(options.simulationBackend ?? 'auto');

    this.configureRandom(options.seed);

    this.resize();
    this.redrawOverlay();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.lastFpsTime = this.lastTime;
    this.lastUiUpdate = this.lastTime;

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
    const { renderer, backend: resolvedBackend } = createRenderer(this.canvas, this.maxParticles, backend);

    this.renderer.dispose();
    this.renderer = renderer;
    this.renderBackend = resolvedBackend;
  }

  getSimulationBackend() {
    return this.simulationBackend;
  }

  setSimulationBackend(backend: SimulationBackend) {
    this.simulationBackend = resolveSimulationBackend(backend);
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

  spawnAt(x: number, y: number) {
    if (this.particles.length >= this.maxParticles) return;

    const colors = [
      'rgba(102, 138, 255, 1)',
      'rgba(156, 135, 188, 1)',
      'rgba(52, 211, 153, 1)'
    ];

    const available = this.maxParticles - this.particles.length;
    const amount = available < this.spawnBatch ? available : this.spawnBatch;

    for (let i = 0; i < amount; i++) {
      const rand = this.getRandom();
      const color = colors[(rand() * colors.length) | 0];
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
    return {
      particleCount: this.particles.length,
      fps: this.fps
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
  }

  getPlugins(): readonly GritPlugin[] {
    return Array.from(this.pluginsById.values());
  }

  private animate = (currentTime: number) => {
    if (!this.running) return;

    if (!this.paused) {
      const dt = Math.min((currentTime - this.lastTime) / 16.666, 3);
      this.lastTime = currentTime;
      this.frameIndex++;

      const { x: mx, y: my } = this.pointer;

      this.grid.clear();
      for (let i = 0; i < this.particles.length; i++) {
        this.grid.add(this.particles[i]);
      }

      const useNeighbors = this.config.flocking || this.config.collisions;

      this.updatePluginContexts(dt, currentTime, mx, my);
      this.runFrameStartPlugins();

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const particle = this.particles[i];

        let neighbors = EMPTY_NEIGHBORS;
        if (useNeighbors) {
          this.grid.getNeighborsInto(particle, this.neighborsBuffer);
          neighbors = this.neighborsBuffer;
        } else {
          this.neighborsBuffer.length = 0;
        }

        this.runForcePlugins(particle);

        if (this.simulationBackend === 'wasm') {
          this.updateParticleWasmPath(particle, neighbors, mx, my, dt);
        } else {
          this.updateParticleJsPath(particle, neighbors, mx, my, dt);
        }

        this.runConstraintPlugins(particle);

        if (particle.isDead()) {
          this.particles.splice(i, 1);
        }
      }

      this.runFrameEndPlugins();

      this.renderer.render(this.particles, this.canvas.width, this.canvas.height, this.postProcessing);
      this.redrawOverlay();

      this.frameCount++;
      const elapsed = currentTime - this.lastFpsTime;
      if (elapsed >= 1000) {
        this.fps = Math.round((this.frameCount * 1000) / elapsed);
        this.frameCount = 0;
        this.lastFpsTime = currentTime;
      }

      if (currentTime - this.lastUiUpdate >= UI_UPDATE_INTERVAL_MS) {
        this.lastUiUpdate = currentTime;
        this.emitStats();
      }
    } else {
      this.lastTime = currentTime;
    }

    this.requestId = requestAnimationFrame(this.animate);
  };

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
      dt
    );
  }

  private updatePluginContexts(dt: number, now: number, pointerX: number | null, pointerY: number | null) {
    this.pluginFrameContext = {
      config: this.config,
      canvasWidth: this.canvas.width,
      canvasHeight: this.canvas.height,
      dt,
      frame: this.frameIndex,
      now
    };

    this.pluginParticleContext = {
      ...this.pluginFrameContext,
      pointerX,
      pointerY
    };
  }

  private runFrameStartPlugins() {
    if (this.framePlugins.length === 0) return;

    for (let i = 0; i < this.framePlugins.length; i++) {
      const plugin = this.framePlugins[i];
      if (plugin.enabled === false || !plugin.onFrameStart) continue;
      plugin.onFrameStart(this.pluginFrameContext);
    }
  }

  private runFrameEndPlugins() {
    if (this.framePlugins.length === 0) return;

    for (let i = 0; i < this.framePlugins.length; i++) {
      const plugin = this.framePlugins[i];
      if (plugin.enabled === false || !plugin.onFrameEnd) continue;
      plugin.onFrameEnd(this.pluginFrameContext);
    }
  }

  private runForcePlugins(particle: Particle) {
    if (this.forcePlugins.length === 0) return;

    for (let i = 0; i < this.forcePlugins.length; i++) {
      const plugin = this.forcePlugins[i];
      if (plugin.enabled === false || !plugin.applyForce) continue;
      plugin.applyForce(particle, this.pluginParticleContext);
    }
  }

  private runConstraintPlugins(particle: Particle) {
    if (this.constraintPlugins.length === 0) return;

    for (let i = 0; i < this.constraintPlugins.length; i++) {
      const plugin = this.constraintPlugins[i];
      if (plugin.enabled === false || !plugin.applyConstraint) continue;
      plugin.applyConstraint(particle, this.pluginParticleContext);
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
    if (!this.onStats && !force) return;
    this.onStats?.({
      particleCount: this.particles.length,
      fps: this.fps
    });
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
