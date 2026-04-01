import {
  DEFAULT_POST_PROCESSING,
  DEFAULT_SIM_CONFIG,
  type PerformancePreset,
  type PostProcessingOptions,
  type SimConfig
} from '../types';

export interface PerformancePresetBundle {
  preset: PerformancePreset;
  config: SimConfig;
  postProcessing: PostProcessingOptions;
}

function mergePreset(
  preset: PerformancePreset,
  config: Partial<SimConfig>,
  postProcessing: Partial<PostProcessingOptions>
): PerformancePresetBundle {
  return {
    preset,
    config: {
      ...DEFAULT_SIM_CONFIG,
      ...config
    },
    postProcessing: {
      ...DEFAULT_POST_PROCESSING,
      ...postProcessing,
      bloom: postProcessing.bloom ?? config.bloom ?? DEFAULT_POST_PROCESSING.bloom
    }
  };
}

const PRESETS: Record<PerformancePreset, PerformancePresetBundle> = {
  performance: mergePreset(
    'performance',
    {
      attraction: 3,
      repulsion: 0,
      gravity: 0.03,
      friction: 0.992,
      particleLife: 120,
      particleSize: 2.5,
      flocking: false,
      collisions: false,
      vortex: false,
      bloom: false
    },
    {
      bloom: false,
      trailStrength: 0.64,
      vignette: false
    }
  ),
  balanced: mergePreset(
    'balanced',
    {
      attraction: 6,
      repulsion: 0,
      gravity: 0.05,
      friction: 0.985,
      particleLife: 150,
      particleSize: 3,
      flocking: true,
      collisions: true,
      vortex: false,
      bloom: true
    },
    {
      bloom: true,
      trailStrength: 0.72,
      vignette: false
    }
  ),
  quality: mergePreset(
    'quality',
    {
      attraction: 10,
      repulsion: 2,
      gravity: 0.05,
      friction: 0.98,
      particleLife: 180,
      particleSize: 3.4,
      flocking: true,
      collisions: true,
      vortex: true,
      bloom: true
    },
    {
      bloom: true,
      trailStrength: 0.8,
      vignette: true
    }
  )
};

export function resolvePerformancePreset(preset: PerformancePreset): PerformancePresetBundle {
  return PRESETS[preset];
}

export function listPerformancePresets(): readonly PerformancePreset[] {
  return ['performance', 'balanced', 'quality'];
}
