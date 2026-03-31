export interface SimConfig {
    gravity: number;
    friction: number;
    attraction: number;
    repulsion: number;
    particleLife: number;
    particleSize: number;
    vortex: boolean;
    bloom: boolean;
    flocking: boolean;
    collisions: boolean;
    obstacleMode: boolean;
}
export interface EngineStats {
    particleCount: number;
    fps: number;
}
export interface GritEngineOptions {
    canvas: HTMLCanvasElement;
    overlayCanvas?: HTMLCanvasElement;
    maxParticles?: number;
    spawnBatch?: number;
    gridCellSize?: number;
    maxDpr?: number;
    config?: Partial<SimConfig>;
    onStats?: (stats: EngineStats) => void;
}
export declare const DEFAULT_SIM_CONFIG: SimConfig;
//# sourceMappingURL=types.d.ts.map