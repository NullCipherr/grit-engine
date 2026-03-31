/**
 * Copyright (c) NullCipherr.
 * Licensed under the GRIT Source-Available License.
 */
export declare class Obstacle {
    x: number;
    y: number;
    radius: number;
    color: string;
    constructor(x: number, y: number, radius?: number);
    draw(ctx: CanvasRenderingContext2D): void;
    contains(x: number, y: number): boolean;
}
//# sourceMappingURL=Obstacle.d.ts.map