import { Particle } from './Particle';
import { SpatialGrid } from './SpatialGrid';

export type SpatialBackendType = 'grid' | 'bruteforce';

export interface SpatialBackend {
  readonly type: SpatialBackendType;
  clear(): void;
  add(p: Particle): void;
  getNeighborsInto(p: Particle, out: Particle[]): void;
}

class GridSpatialBackend implements SpatialBackend {
  readonly type: SpatialBackendType = 'grid';
  private readonly grid: SpatialGrid;

  constructor(cellSize: number) {
    this.grid = new SpatialGrid(cellSize);
  }

  clear() {
    this.grid.clear();
  }

  add(p: Particle) {
    this.grid.add(p);
  }

  getNeighborsInto(p: Particle, out: Particle[]) {
    this.grid.getNeighborsInto(p, out);
  }
}

class BruteForceSpatialBackend implements SpatialBackend {
  readonly type: SpatialBackendType = 'bruteforce';
  private readonly particles: Particle[] = [];

  clear() {
    this.particles.length = 0;
  }

  add(p: Particle) {
    this.particles.push(p);
  }

  getNeighborsInto(p: Particle, out: Particle[]) {
    out.length = 0;
    for (let i = 0; i < this.particles.length; i++) {
      const other = this.particles[i];
      if (other !== p) out.push(other);
    }
  }
}

export function createSpatialBackend(type: SpatialBackendType, cellSize: number): SpatialBackend {
  if (type === 'bruteforce') {
    return new BruteForceSpatialBackend();
  }
  return new GridSpatialBackend(cellSize);
}
