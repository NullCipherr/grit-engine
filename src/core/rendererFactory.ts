import type { RenderBackend, WorkerTransportCompression } from '../types';
import { Canvas2DRenderer } from './Canvas2DRenderer';
import { OffscreenWorkerRenderer } from './OffscreenWorkerRenderer';
import type { Renderer } from './types';
import { WebGLRenderer } from './WebGLRenderer';

export function resolveRenderBackend(canvas: HTMLCanvasElement, requested: RenderBackend): Exclude<RenderBackend, 'auto'> {
  if (requested === 'offscreen-worker') {
    return 'offscreen-worker';
  }

  if (requested === 'canvas2d') {
    return 'canvas2d';
  }

  if (requested === 'webgl2') {
    return 'webgl2';
  }

  const gl = canvas.getContext('webgl2', {
    antialias: false,
    preserveDrawingBuffer: false,
    alpha: true,
    premultipliedAlpha: true,
    powerPreference: 'high-performance'
  });

  return gl ? 'webgl2' : 'canvas2d';
}

export function createRenderer(
  canvas: HTMLCanvasElement,
  maxParticles: number,
  requested: RenderBackend,
  options?: {
    workerTransportCompression?: WorkerTransportCompression;
  }
): { renderer: Renderer; backend: Exclude<RenderBackend, 'auto'> } {
  const backend = resolveRenderBackend(canvas, requested);

  if (backend === 'offscreen-worker') {
    try {
      return {
        renderer: new OffscreenWorkerRenderer(canvas, maxParticles, {
          compression: options?.workerTransportCompression ?? 'none'
        }),
        backend
      };
    } catch {
      return {
        renderer: new Canvas2DRenderer(canvas, maxParticles),
        backend: 'canvas2d'
      };
    }
  }

  if (backend === 'webgl2') {
    try {
      return {
        renderer: new WebGLRenderer(canvas, maxParticles),
        backend
      };
    } catch {
      return {
        renderer: new Canvas2DRenderer(canvas, maxParticles),
        backend: 'canvas2d'
      };
    }
  }

  return {
    renderer: new Canvas2DRenderer(canvas, maxParticles),
    backend
  };
}
