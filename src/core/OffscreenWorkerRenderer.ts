import type { PostProcessingOptions, WorkerTransportCompression } from '../types';
import type { Renderer } from './types';
import { Particle } from './Particle';

const BG_COLOR = '#11131c';
const PACKED_STRIDE = 5; // x,y,size,hue,alpha
const SIZE_QUANT_RANGE = 64;

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
      // Alguns navegadores aceitam OffscreenCanvas, mas falham com flags avançadas.
      // Fazemos fallback para assinatura básica antes de marcar erro fatal.
      if (!ctx) {
        ctx = canvas.getContext('2d');
      }
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

    const compression = data.compression || 'none';
    const packed = data.packed;
    const count = Math.min(data.count, maxParticles);
    ctx.globalCompositeOperation = bloom ? 'lighter' : 'source-over';

    for (let i = 0; i < count; i++) {
      const offset = i * ${PACKED_STRIDE};
      let x = 0;
      let y = 0;
      let size = 0;
      let hue = 0;
      let alpha = 0;

      if (compression === 'quantized16') {
        x = (packed[offset] / 65535) * width;
        y = (packed[offset + 1] / 65535) * height;
        size = (packed[offset + 2] / 65535) * ${SIZE_QUANT_RANGE};
        hue = (packed[offset + 3] / 65535) * 360;
        alpha = packed[offset + 4] / 65535;
      } else {
        x = packed[offset];
        y = packed[offset + 1];
        size = packed[offset + 2];
        hue = packed[offset + 3];
        alpha = packed[offset + 4];
      }

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
  private packedDataFloat: Float32Array;
  private packedDataQ16: Uint16Array;
  private compression: WorkerTransportCompression;
  private inFlight = false;
  private ready = false;
  private failed = false;
  private lastErrorReason: string | null = null;
  private lastWidth = -1;
  private lastHeight = -1;
  private onError: ((reason: string) => void) | null = null;

  constructor(
    canvas: HTMLCanvasElement,
    maxParticles: number,
    options?: {
      compression?: WorkerTransportCompression;
    }
  ) {
    if (typeof Worker === 'undefined' || typeof canvas.transferControlToOffscreen !== 'function') {
      throw new Error('Offscreen worker rendering not supported');
    }

    const blob = new Blob([WORKER_SOURCE], { type: 'text/javascript' });
    this.workerUrl = URL.createObjectURL(blob);
    this.worker = new Worker(this.workerUrl);

    const offscreen = canvas.transferControlToOffscreen();
    this.maxParticles = maxParticles;
    this.compression = options?.compression ?? 'none';
    this.packedDataFloat = new Float32Array(maxParticles * PACKED_STRIDE);
    this.packedDataQ16 = new Uint16Array(maxParticles * PACKED_STRIDE);

    this.worker.onmessage = (event) => {
      const type = (event.data as { type?: string } | null)?.type;

      if (type === 'ready') {
        this.ready = true;
        return;
      }

      if (type === 'error') {
        this.failed = true;
        this.lastErrorReason = (event.data as { message?: string }).message ?? 'offscreen-worker-render-error';
        this.onError?.(this.lastErrorReason);
      }

      this.inFlight = false;
    };

    this.worker.onerror = () => {
      this.failed = true;
      this.inFlight = false;
      this.lastErrorReason = 'offscreen-worker-error';
      this.onError?.(this.lastErrorReason);
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

      if (this.compression === 'quantized16') {
        this.packedDataQ16[offset++] = this.quantizeUnit(p.x / Math.max(width, 1));
        this.packedDataQ16[offset++] = this.quantizeUnit(p.y / Math.max(height, 1));
        this.packedDataQ16[offset++] = this.quantizeUnit(p.size / SIZE_QUANT_RANGE);
        this.packedDataQ16[offset++] = this.quantizeUnit(hue / 360);
        this.packedDataQ16[offset++] = this.quantizeUnit(alpha);
      } else {
        this.packedDataFloat[offset++] = p.x;
        this.packedDataFloat[offset++] = p.y;
        this.packedDataFloat[offset++] = p.size;
        this.packedDataFloat[offset++] = hue;
        this.packedDataFloat[offset++] = alpha;
      }
    }

    this.inFlight = true;
    this.worker.postMessage({
      type: 'render',
      compression: this.compression,
      width,
      height,
      count,
      bloom: postProcessing.bloom,
      trailStrength: postProcessing.trailStrength,
      vignette: postProcessing.vignette,
      packed: this.compression === 'quantized16' ? this.packedDataQ16 : this.packedDataFloat
    });
  }

  resizeMaxParticles(maxParticles: number) {
    if (maxParticles === this.maxParticles) return;
    this.maxParticles = maxParticles;
    this.packedDataFloat = new Float32Array(maxParticles * PACKED_STRIDE);
    this.packedDataQ16 = new Uint16Array(maxParticles * PACKED_STRIDE);
    this.worker.postMessage({ type: 'set-max-particles', maxParticles });
  }

  setErrorHandler(handler: ((reason: string) => void) | null) {
    this.onError = handler;
    if (this.onError && this.failed && this.lastErrorReason) {
      this.onError(this.lastErrorReason);
    }
  }

  dispose() {
    this.worker.terminate();
    URL.revokeObjectURL(this.workerUrl);
  }

  private quantizeUnit(value: number) {
    const clamped = Math.max(0, Math.min(1, value));
    return (clamped * 65535) | 0;
  }
}
