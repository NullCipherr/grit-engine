import { Obstacle } from './core/Obstacle';
import { Particle } from './core/Particle';
import { SpatialGrid } from './core/SpatialGrid';
import { WebGLRenderer } from './core/WebGLRenderer';
import { DEFAULT_SIM_CONFIG, type EngineStats, type GritEngineOptions, type SimConfig } from './types';

const UI_UPDATE_INTERVAL_MS = 200;
const EMPTY_NEIGHBORS: Particle[] = [];

export class GritEngine {
  private readonly canvas: HTMLCanvasElement;
  private readonly overlayCanvas?: HTMLCanvasElement;
  private readonly overlayCtx: CanvasRenderingContext2D | null;
  private readonly maxParticles: number;
  private readonly spawnBatch: number;
  private readonly maxDpr: number;
  private readonly onStats?: (stats: EngineStats) => void;

  private renderer: WebGLRenderer;
  private grid: SpatialGrid;
  private requestId: number | null = null;
  private running = false;
  private paused = false;

  private particles: Particle[] = [];
  private obstacles: Obstacle[] = [];
  private neighborsBuffer: Particle[] = [];
  private overlayDirty = true;

  private pointer = { x: null as number | null, y: null as number | null };

  private config: SimConfig;

  private frameCount = 0;
  private lastTime = performance.now();
  private lastFpsTime = performance.now();
  private lastUiUpdate = performance.now();
  private fps = 0;

  constructor(options: GritEngineOptions) {
    this.canvas = options.canvas;
    this.overlayCanvas = options.overlayCanvas;
    this.overlayCtx = this.overlayCanvas?.getContext('2d') ?? null;
    this.maxParticles = options.maxParticles ?? 50_000;
    this.spawnBatch = options.spawnBatch ?? 100;
    this.maxDpr = options.maxDpr ?? 2;
    this.onStats = options.onStats;
    this.config = {
      ...DEFAULT_SIM_CONFIG,
      ...options.config
    };

    this.grid = new SpatialGrid(options.gridCellSize ?? 40);
    this.renderer = new WebGLRenderer(this.canvas, this.maxParticles);

    this.resize();
    this.redrawOverlay();
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.lastTime = performance.now();
    this.lastFpsTime = this.lastTime;
    this.lastUiUpdate = this.lastTime;
    this.requestId = requestAnimationFrame(this.animate);
  }

  stop() {
    this.running = false;
    if (this.requestId !== null) {
      cancelAnimationFrame(this.requestId);
      this.requestId = null;
    }
  }

  dispose() {
    this.stop();
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
  }

  getSettings(): SimConfig {
    return { ...this.config };
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
      const color = colors[(Math.random() * colors.length) | 0];
      this.particles.push(new Particle(x, y, color, this.config));
    }
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

  private animate = (currentTime: number) => {
    if (!this.running) return;

    if (!this.paused) {
      const dt = Math.min((currentTime - this.lastTime) / 16.666, 3);
      this.lastTime = currentTime;

      const { x: mx, y: my } = this.pointer;

      this.grid.clear();
      for (let i = 0; i < this.particles.length; i++) {
        this.grid.add(this.particles[i]);
      }

      const useNeighbors = this.config.flocking || this.config.collisions;

      for (let i = this.particles.length - 1; i >= 0; i--) {
        const particle = this.particles[i];

        let neighbors = EMPTY_NEIGHBORS;
        if (useNeighbors) {
          this.grid.getNeighborsInto(particle, this.neighborsBuffer);
          neighbors = this.neighborsBuffer;
        } else {
          this.neighborsBuffer.length = 0;
        }

        particle.update(
          this.config,
          this.canvas.width,
          this.canvas.height,
          mx,
          my,
          neighbors,
          this.obstacles,
          dt
        );

        if (particle.isDead()) {
          this.particles.splice(i, 1);
        }
      }

      this.renderer.render(this.particles, this.canvas.width, this.canvas.height, this.config.bloom);
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
}
