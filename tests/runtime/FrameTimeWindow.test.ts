import { describe, expect, it } from 'vitest';

import { FrameTimeWindow } from '../../src/runtime/FrameTimeWindow';

describe('FrameTimeWindow', () => {
  it('calcula média e percentis com janela cheia', () => {
    const window = new FrameTimeWindow(5, 1, 100);

    window.push(10);
    window.push(20);
    window.push(30);
    window.push(40);
    window.push(50);

    const summary = window.snapshot();

    expect(summary.sampleCount).toBe(5);
    expect(summary.avgMs).toBe(30);
    expect(summary.p95Ms).toBe(50);
    expect(summary.p99Ms).toBe(50);
  });

  it('descarta valores antigos ao exceder capacidade', () => {
    const window = new FrameTimeWindow(3, 1, 100);

    window.push(5);
    window.push(10);
    window.push(15);
    window.push(30);

    const summary = window.snapshot();

    expect(summary.sampleCount).toBe(3);
    expect(summary.avgMs).toBeCloseTo((10 + 15 + 30) / 3, 6);
  });

  it('reseta corretamente', () => {
    const window = new FrameTimeWindow();
    window.push(12);
    window.push(16);

    window.reset();

    const summary = window.snapshot();
    expect(summary.sampleCount).toBe(0);
    expect(summary.avgMs).toBe(0);
    expect(summary.p95Ms).toBe(0);
    expect(summary.p99Ms).toBe(0);
  });
});
