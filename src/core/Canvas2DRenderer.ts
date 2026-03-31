/**
 * Copyright (c) NullCipherr.
 * Licensed under the GRIT Source-Available License.
 */

import type { PostProcessingOptions } from '../types';
import type { Renderer } from './types';
import { Particle } from './Particle';

const BG_COLOR = '#11131c';

export class Canvas2DRenderer implements Renderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private maxParticles: number;
  private firstFrame = true;

  constructor(canvas: HTMLCanvasElement, maxParticles: number = 50000) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) {
      throw new Error('Canvas2D not supported');
    }

    this.ctx = ctx;
    this.maxParticles = maxParticles;
  }

  render(particles: readonly Particle[], width: number, height: number, postProcessing: PostProcessingOptions) {
    const ctx = this.ctx;

    if (this.firstFrame) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, width, height);
      this.firstFrame = false;
    }

    const trailStrength = Math.max(0, Math.min(postProcessing.trailStrength, 1));
    const fadeAlpha = Math.min(Math.max(1 - trailStrength, 0.04), 0.92);

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = fadeAlpha;
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, width, height);

    const count = Math.min(this.maxParticles, particles.length);
    ctx.globalCompositeOperation = postProcessing.bloom ? 'lighter' : 'source-over';

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      const alpha = p.life > 0 ? p.life / p.maxLife : 0;

      ctx.globalAlpha = alpha;

      const speedSq = p.vx * p.vx + p.vy * p.vy;
      const hue = (p.hue + Math.min(speedSq * 1.25, 60)) | 0;

      if (postProcessing.bloom) {
        const radius = p.size * 2.6;
        const gradient = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, radius);
        gradient.addColorStop(0, `hsla(${hue}, 85%, 70%, 1)`);
        gradient.addColorStop(1, `hsla(${hue}, 85%, 70%, 0)`);
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(p.x, p.y, radius, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = `hsl(${hue}, 85%, 65%)`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (postProcessing.vignette) {
      const vignette = ctx.createRadialGradient(
        width * 0.5,
        height * 0.5,
        Math.min(width, height) * 0.18,
        width * 0.5,
        height * 0.5,
        Math.max(width, height) * 0.75
      );
      vignette.addColorStop(0, 'rgba(0, 0, 0, 0)');
      vignette.addColorStop(1, 'rgba(0, 0, 0, 0.4)');
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = vignette;
      ctx.fillRect(0, 0, width, height);
    }
  }

  resizeMaxParticles(maxParticles: number) {
    this.maxParticles = maxParticles;
  }

  dispose() {
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.globalAlpha = 1;
  }
}
