import type { AdaptiveBudgetOptions } from '../types';

export interface AdaptiveBudgetSnapshot {
  activeParticleLimit: number;
  scale: number;
}

export class AdaptiveParticleBudget {
  private readonly baseLimit: number;
  private readonly options: AdaptiveBudgetOptions;

  private scale = 1;
  private activeParticleLimit: number;
  private frameCounter = 0;

  constructor(baseLimit: number, options: AdaptiveBudgetOptions) {
    this.baseLimit = Math.max(1, baseLimit | 0);
    this.options = options;
    this.activeParticleLimit = this.baseLimit;
  }

  reset() {
    this.scale = 1;
    this.activeParticleLimit = this.baseLimit;
    this.frameCounter = 0;
  }

  update(frameP95Ms: number, frameP99Ms: number) {
    if (!this.options.enabled) {
      this.scale = 1;
      this.activeParticleLimit = this.baseLimit;
      return;
    }

    this.frameCounter++;
    if (this.frameCounter % this.options.updateIntervalFrames !== 0) {
      return;
    }

    const pressureMs = frameP99Ms > 0 ? frameP99Ms : frameP95Ms;

    if (pressureMs >= this.options.highWatermarkMs) {
      const overload = (pressureMs - this.options.highWatermarkMs) / this.options.highWatermarkMs;
      this.scale -= this.options.dropRate * (1 + overload);
    } else if (pressureMs <= this.options.lowWatermarkMs) {
      const headroom = (this.options.lowWatermarkMs - pressureMs) / this.options.lowWatermarkMs;
      this.scale += this.options.recoveryRate * (1 + headroom);
    }

    if (this.scale < this.options.minScale) {
      this.scale = this.options.minScale;
    }

    if (this.scale > 1) {
      this.scale = 1;
    }

    this.activeParticleLimit = Math.max(1, Math.floor(this.baseLimit * this.scale));
  }

  setEnabled(enabled: boolean) {
    this.options.enabled = enabled;
    if (!enabled) {
      this.reset();
    }
  }

  snapshot(): AdaptiveBudgetSnapshot {
    return {
      activeParticleLimit: this.activeParticleLimit,
      scale: this.scale
    };
  }
}
