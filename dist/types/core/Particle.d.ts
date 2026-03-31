/**
 * Copyright (c) NullCipherr.
 * Licensed under the GRIT Source-Available License.
 */
import type { SimConfig } from '../types';
import { Obstacle } from './Obstacle';
export declare class Particle {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    ax: number;
    ay: number;
    life: number;
    maxLife: number;
    size: number;
    baseSize: number;
    hue: number;
    mass: number;
    private flockingTimer;
    private flockAvgVx;
    private flockAvgVy;
    private flockAvgX;
    private flockAvgY;
    private flockNeighborCount;
    private colorString;
    constructor(x: number, y: number, color: string, config: SimConfig, random?: () => number);
    update(config: SimConfig, canvasWidth: number, canvasHeight: number, mouseX: number | null, mouseY: number | null, neighbors: Particle[], obstacles: Obstacle[], dt: number): void;
    draw(ctx: CanvasRenderingContext2D, config: SimConfig, spriteCanvas?: HTMLCanvasElement): void;
    isDead(): boolean;
}
//# sourceMappingURL=Particle.d.ts.map