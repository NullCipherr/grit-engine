/**
 * Copyright (c) NullCipherr.
 * Licensed under the GRIT Source-Available License.
 */

import type { PostProcessingOptions } from '../types';
import type { Renderer } from './types';
import { Particle } from './Particle';

const BG_COLOR = '#11131c';
const HUE_BUCKETS = 48;
const SPRITE_SIZE = 48;
const TARGET_RENDER_MS = 16.67;

export class Canvas2DRenderer implements Renderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly ctx: CanvasRenderingContext2D;
  private maxParticles: number;
  private firstFrame = true;

  private drawStride = 1;
  private smoothedRenderMs = TARGET_RENDER_MS;

  private readonly solidColorPalette: string[];
  private readonly glowSpritePalette: Array<HTMLCanvasElement | null>;

  constructor(canvas: HTMLCanvasElement, maxParticles: number = 50000) {
    this.canvas = canvas;
    const ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
    if (!ctx) {
      throw new Error('Canvas2D not supported');
    }

    this.ctx = ctx;
    this.maxParticles = maxParticles;
    this.solidColorPalette = this.buildSolidPalette();
    this.glowSpritePalette = this.buildGlowPalette();
  }

  render(particles: readonly Particle[], width: number, height: number, postProcessing: PostProcessingOptions) {
    const renderStart = performance.now();
    const ctx = this.ctx;

    if (this.firstFrame) {
      ctx.globalAlpha = 1;
      ctx.fillStyle = BG_COLOR;
      ctx.fillRect(0, 0, width, height);
      this.firstFrame = false;
    }

    this.updateQualityPolicy(particles.length, postProcessing.bloom);

    const trailStrength = Math.max(0, Math.min(postProcessing.trailStrength, 1));
    const fadeAlpha = Math.min(Math.max(1 - trailStrength, 0.04), 0.92);

    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = fadeAlpha;
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, width, height);

    const count = Math.min(this.maxParticles, particles.length);
    ctx.globalCompositeOperation = postProcessing.bloom ? 'lighter' : 'source-over';

    if (this.drawStride > 1) {
      this.renderFastPath(particles, count, postProcessing.bloom);
    } else {
      this.renderQualityPath(particles, count, postProcessing.bloom);
    }

    if (postProcessing.vignette && this.drawStride < 4) {
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

    const renderMs = performance.now() - renderStart;
    this.smoothedRenderMs += (renderMs - this.smoothedRenderMs) * 0.08;
  }

  resizeMaxParticles(maxParticles: number) {
    this.maxParticles = maxParticles;
  }

  dispose() {
    this.ctx.globalCompositeOperation = 'source-over';
    this.ctx.globalAlpha = 1;
  }

  private updateQualityPolicy(particleCount: number, bloom: boolean) {
    const pressureFactor = particleCount / Math.max(this.maxParticles, 1);
    const bloomPenalty = bloom ? 1.45 : 1;
    const effectiveCost = this.smoothedRenderMs * bloomPenalty * (1 + pressureFactor * 0.35);

    if (effectiveCost > TARGET_RENDER_MS * 1.45) {
      this.drawStride = Math.min(this.drawStride + 1, 4);
    } else if (effectiveCost < TARGET_RENDER_MS * 0.86) {
      this.drawStride = Math.max(this.drawStride - 1, 1);
    }
  }

  private renderFastPath(particles: readonly Particle[], count: number, bloom: boolean) {
    const ctx = this.ctx;

    for (let i = 0; i < count; i += this.drawStride) {
      const p = particles[i];
      const alpha = p.life > 0 ? p.life / p.maxLife : 0;
      if (alpha <= 0.01) continue;

      ctx.globalAlpha = alpha;
      const paletteIndex = this.paletteIndex(p.hue + Math.min((p.vx * p.vx + p.vy * p.vy) * 1.25, 60));

      if (bloom) {
        const sprite = this.glowSpritePalette[paletteIndex];
        if (sprite) {
          const radius = p.size * 2.4;
          const diameter = radius * 2;
          ctx.drawImage(sprite, p.x - radius, p.y - radius, diameter, diameter);
        } else {
          ctx.fillStyle = this.solidColorPalette[paletteIndex];
          ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
        }
      } else {
        ctx.fillStyle = this.solidColorPalette[paletteIndex];
        ctx.fillRect(p.x - p.size, p.y - p.size, p.size * 2, p.size * 2);
      }
    }
  }

  private renderQualityPath(particles: readonly Particle[], count: number, bloom: boolean) {
    const ctx = this.ctx;

    for (let i = 0; i < count; i++) {
      const p = particles[i];
      const alpha = p.life > 0 ? p.life / p.maxLife : 0;
      if (alpha <= 0.01) continue;

      ctx.globalAlpha = alpha;
      const paletteIndex = this.paletteIndex(p.hue + Math.min((p.vx * p.vx + p.vy * p.vy) * 1.25, 60));

      if (bloom) {
        const sprite = this.glowSpritePalette[paletteIndex];
        if (sprite) {
          const radius = p.size * 2.6;
          const diameter = radius * 2;
          ctx.drawImage(sprite, p.x - radius, p.y - radius, diameter, diameter);
          continue;
        }
      }

      ctx.fillStyle = this.solidColorPalette[paletteIndex];
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private paletteIndex(hue: number) {
    const normalized = ((hue % 360) + 360) % 360;
    return Math.floor((normalized / 360) * HUE_BUCKETS) % HUE_BUCKETS;
  }

  private buildSolidPalette() {
    const palette = new Array<string>(HUE_BUCKETS);

    for (let i = 0; i < HUE_BUCKETS; i++) {
      const hue = Math.floor((i / HUE_BUCKETS) * 360);
      palette[i] = `hsl(${hue}, 85%, 65%)`;
    }

    return palette;
  }

  private buildGlowPalette() {
    const palette = new Array<HTMLCanvasElement | null>(HUE_BUCKETS);

    if (typeof document === 'undefined') {
      for (let i = 0; i < HUE_BUCKETS; i++) palette[i] = null;
      return palette;
    }

    for (let i = 0; i < HUE_BUCKETS; i++) {
      const hue = Math.floor((i / HUE_BUCKETS) * 360);
      const sprite = document.createElement('canvas');
      sprite.width = SPRITE_SIZE;
      sprite.height = SPRITE_SIZE;

      const spriteCtx = sprite.getContext('2d');
      if (!spriteCtx) {
        palette[i] = null;
        continue;
      }

      const center = SPRITE_SIZE * 0.5;
      const gradient = spriteCtx.createRadialGradient(center, center, 0, center, center, center);
      gradient.addColorStop(0, `hsla(${hue}, 85%, 70%, 1)`);
      gradient.addColorStop(1, `hsla(${hue}, 85%, 70%, 0)`);

      spriteCtx.fillStyle = gradient;
      spriteCtx.beginPath();
      spriteCtx.arc(center, center, center, 0, Math.PI * 2);
      spriteCtx.fill();

      palette[i] = sprite;
    }

    return palette;
  }
}
