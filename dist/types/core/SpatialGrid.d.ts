/**
 * Copyright (c) NullCipherr.
 * Licensed under the GRIT Source-Available License.
 */
import { Particle } from './Particle';
export declare class SpatialGrid {
    private grid;
    cellSize: number;
    private invCellSize;
    constructor(cellSize: number);
    setCellSize(cellSize: number): void;
    clear(): void;
    private toGridCoord;
    private hash;
    add(p: Particle): void;
    getNeighbors(p: Particle): Particle[];
    getNeighborsInto(p: Particle, out: Particle[]): void;
    getCellParticlesAt(x: number, y: number): Particle[];
}
//# sourceMappingURL=SpatialGrid.d.ts.map