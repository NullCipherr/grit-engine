/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { Particle } from './Particle';
export declare class WebGLRenderer {
    private canvas;
    private gl;
    private program;
    private fadeProgram;
    private vao;
    private fadeVao;
    private instanceBuffer;
    private quadBuffer;
    private maxParticles;
    private instanceData;
    private uResolutionLoc;
    private uBloomLoc;
    private firstFrame;
    private isContextLost;
    private lastWidth;
    private lastHeight;
    private lastBloom;
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
    render(particles: readonly Particle[], width: number, height: number, bloom: boolean): void;
    resizeMaxParticles(maxParticles: number): void;
    private disposeGpuResources;
    dispose(): void;
}
//# sourceMappingURL=WebGLRenderer.d.ts.map