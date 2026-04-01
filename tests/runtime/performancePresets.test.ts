import { describe, expect, it } from 'vitest';

import { listPerformancePresets, resolvePerformancePreset } from '../../src/runtime/performancePresets';

describe('performancePresets', () => {
  it('retorna os três presets esperados', () => {
    expect(listPerformancePresets()).toEqual(['performance', 'balanced', 'quality']);
  });

  it('preset performance desativa custos visuais pesados', () => {
    const preset = resolvePerformancePreset('performance');

    expect(preset.config.flocking).toBe(false);
    expect(preset.config.collisions).toBe(false);
    expect(preset.postProcessing.bloom).toBe(false);
  });

  it('preset quality mantém qualidade máxima ativa', () => {
    const preset = resolvePerformancePreset('quality');

    expect(preset.config.vortex).toBe(true);
    expect(preset.config.bloom).toBe(true);
    expect(preset.postProcessing.vignette).toBe(true);
  });
});
