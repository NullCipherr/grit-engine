import type { Particle } from './Particle';
import type { PostProcessingOptions } from '../types';

export interface Renderer {
  render(particles: readonly Particle[], width: number, height: number, postProcessing: PostProcessingOptions): void;
  resizeMaxParticles(maxParticles: number): void;
  dispose(): void;
}
