/**
 * Copyright (c) NullCipherr.
 * Licensed under the GRIT Source-Available License.
 */
import type { PostProcessingOptions } from '../types';
import type { Renderer } from './types';
import { Particle } from './Particle';
export declare class WebGLRenderer implements Renderer {
    private canvas;
    private gl;
    private program;
    private fadeProgram;
    private vaos;
    private fadeVao;
    private instanceBuffers;
    private activeInstanceSlot;
    private quadBuffer;
    private maxParticles;
    private instanceData;
    private uResolutionLoc;
    private uBloomLoc;
    private uVignetteLoc;
    private uFadeAlphaLoc;
    private firstFrame;
    private isContextLost;
    private lastWidth;
    private lastHeight;
    private lastBloom;
    private lastVignette;
    private lastFadeAlpha;
    private readonly huePalette;
    constructor(canvas: HTMLCanvasElement, maxParticles?: number);
    private attachContextEvents;
    private detachContextEvents;
    private handleContextLost;
    private handleContextRestored;
    private buildHuePalette;
    private hslToRgb;
    private initResources;
    private createProgram;
    render(particles: readonly Particle[], width: number, height: number, postProcessing: PostProcessingOptions): void;
    resizeMaxParticles(maxParticles: number): void;
    private disposeGpuResources;
    dispose(): void;
}
//# sourceMappingURL=WebGLRenderer.d.ts.map