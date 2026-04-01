import type { PostProcessingOptions } from '../types';
import type { Renderer } from './types';
import { Particle } from './Particle';

const BG_COLOR = '#11131c';
const PACKED_STRIDE = 5; // x,y,size,hue,alpha

const WORKER_SOURCE = `
let canvas = null;
let ctx = null;
let maxParticles = 50000;
let firstFrame = true;

self.onmessage = (event) => {
  const data = event.data;

  if (data.type === 'init') {
    canvas = data.canvas;
    if (typeof data.maxParticles === 'number') {
      maxParticles = data.maxParticles;
    }
    if (canvas) {
      ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
      if (!ctx) {
        self.postMessage({ type: 'error', message: 'offscreen-2d-context-unavailable' });
        return;
      }
      self.postMessage({ type: 'ready' });
    }
    return;
  }

  if (data.type === 'set-max-particles') {
    if (typeof data.maxParticles === 'number') {
      maxParticles = data.maxParticles;
    }
    return;
  }

  if (!ctx || !canvas) return;

  if (data.type === 'resize') {
    canvas.width = data.width;
    canvas.height = data.height;
    firstFrame = true;
    return;
  }

  if (data.type !== 'render') {
    return;
  }

  try {
    const width = data.width;
    const height = data.height;
    const bloom = data.bloom;
    const trailStrength = data.trailStrength;
    const vignette = data.vignette;

    if (firstFrame) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = '${BG_COLOR}';
      ctx.fillRect(0, 0, width, height);
      firstFrame = false;
    }

    const fadeAlpha = Math.min(Math.max(1 - trailStrength, 0.04), 0.92);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = fadeAlpha;
    ctx.fillStyle = '${BG_COLOR}';
    ctx.fillRect(0, 0, width, height);

    const packed = data.packed;
    const count = Math.min(data.count, maxParticles);
    ctx.globalCompositeOperation = bloom ? 'lighter' : 'source-over';

    for (let i = 0; i < count; i++) {
      const offset = i * ${PACKED_STRIDE};
      const x = packed[offset];
      const y = packed[offset + 1];
      const size = packed[offset + 2];
      const hue = packed[offset + 3];
      const alpha = packed[offset + 4];

      if (alpha <= 0.01) continue;

      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'hsl(' + hue + ', 85%, 65%)';
      ctx.beginPath();
      ctx.arc(x, y, bloom ? size * 1.8 : size, 0, Math.PI * 2);
      ctx.fill();
    }

    if (vignette) {
      const gradient = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        Math.min(width, height) * 0.18,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75
      );
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);
    }
  } catch (error) {
    self.postMessage({ type: 'error', message: error instanceof Error ? error.message : 'render-error' });
  }

  self.postMessage({ type: 'rendered' });
};
`;

export class OffscreenWorkerRenderer implements Renderer {
  private readonly worker: Worker;
  private readonly workerUrl: string;
  private maxParticles: number;
  private packedData: Float32Array;
  private inFlight = false;
  private ready = false;
  private failed = false;
  private lastWidth = -1;
  private lastHeight = -1;

  constructor(canvas: HTMLCanvasElement, maxParticles: number) {
    if (typeof Worker === 'undefined' || typeof canvas.transferControlToOffscreen !== 'function') {
      throw new Error('Offscreen worker rendering not supported');
    }

    const blob = new Blob([WORKER_SOURCE], { type: 'text/javascript' });
    this.workerUrl = URL.createObjectURL(blob);
    this.worker = new Worker(this.workerUrl);

    const offscreen = canvas.transferControlToOffscreen();
    this.maxParticles = maxParticles;
    this.packedData = new Float32Array(maxParticles * PACKED_STRIDE);

    this.worker.onmessage = (event) => {
      const type = (event.data as { type?: string } | null)?.type;

      if (type === 'ready') {
        this.ready = true;
        return;
      }

      if (type === 'error') {
        this.failed = true;
      }

      this.inFlight = false;
    };

    this.worker.onerror = () => {
      this.failed = true;
      this.inFlight = false;
    };

    this.worker.postMessage(
      {
        type: 'init',
        canvas: offscreen,
        maxParticles
      },
      [offscreen]
    );
  }

  render(particles: readonly Particle[], width: number, height: number, postProcessing: PostProcessingOptions) {
    if (this.failed || !this.ready || this.inFlight) return;

    if (width !== this.lastWidth || height !== this.lastHeight) {
      this.worker.postMessage({ type: 'resize', width, height });
      this.lastWidth = width;
      this.lastHeight = height;
    }

    const count = Math.min(particles.length, this.maxParticles);
    let offset = 0;

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      const speedSq = p.vx * p.vx + p.vy * p.vy;
      const hue = ((p.hue + Math.min(speedSq * 1.25, 60)) % 360 + 360) % 360;
      const alpha = p.life > 0 ? p.life / p.maxLife : 0;

      this.packedData[offset++] = p.x;
      this.packedData[offset++] = p.y;
      this.packedData[offset++] = p.size;
      this.packedData[offset++] = hue;
      this.packedData[offset++] = alpha;
    }

    this.inFlight = true;
    this.worker.postMessage({
      type: 'render',
      width,
      height,
      count,
      bloom: postProcessing.bloom,
      trailStrength: postProcessing.trailStrength,
      vignette: postProcessing.vignette,
      packed: this.packedData
    });
  }

  resizeMaxParticles(maxParticles: number) {
    if (maxParticles === this.maxParticles) return;
    this.maxParticles = maxParticles;
    this.packedData = new Float32Array(maxParticles * PACKED_STRIDE);
    this.worker.postMessage({ type: 'set-max-particles', maxParticles });
  }

  dispose() {
    this.worker.terminate();
    URL.revokeObjectURL(this.workerUrl);
  }
}
