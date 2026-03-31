import { GritEngine } from '@nullcipherr/grit-engine';

const canvas = document.querySelector<HTMLCanvasElement>('#sim-canvas');

if (!canvas) {
  throw new Error('Canvas #sim-canvas not found');
}

const engine = new GritEngine({
  canvas,
  seed: 42,
  executionMode: 'main-thread'
});

engine.start();
