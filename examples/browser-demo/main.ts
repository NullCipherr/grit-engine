import {
  DEFAULT_POST_PROCESSING,
  DEFAULT_SIM_CONFIG,
  GritEngine,
  type GritPlugin,
  type PerformancePreset,
  type RenderBackend,
  type SimulationBackend
} from '../../src';

const canvas = document.querySelector<HTMLCanvasElement>('#sim-canvas');
const overlayCanvas = document.querySelector<HTMLCanvasElement>('#overlay-canvas');
const statsEl = document.querySelector<HTMLElement>('#stats');
const spawnButton = document.querySelector<HTMLButtonElement>('#spawn');
const pauseButton = document.querySelector<HTMLButtonElement>('#pause');
const clearButton = document.querySelector<HTMLButtonElement>('#clear');
const presetSelect = document.querySelector<HTMLSelectElement>('#preset');
const renderSelect = document.querySelector<HTMLSelectElement>('#render-backend');
const simulationSelect = document.querySelector<HTMLSelectElement>('#simulation-backend');
const adaptiveBudgetToggle = document.querySelector<HTMLInputElement>('#toggle-adaptive-budget');
const bloomToggle = document.querySelector<HTMLInputElement>('#toggle-bloom');
const vignetteToggle = document.querySelector<HTMLInputElement>('#toggle-vignette');
const trailInput = document.querySelector<HTMLInputElement>('#trail');
const forcePluginToggle = document.querySelector<HTMLInputElement>('#toggle-force-plugin');
const constraintPluginToggle = document.querySelector<HTMLInputElement>('#toggle-constraint-plugin');

if (
  !canvas ||
  !overlayCanvas ||
  !statsEl ||
  !spawnButton ||
  !pauseButton ||
  !clearButton ||
  !presetSelect ||
  !renderSelect ||
  !simulationSelect ||
  !adaptiveBudgetToggle ||
  !bloomToggle ||
  !vignetteToggle ||
  !trailInput ||
  !forcePluginToggle ||
  !constraintPluginToggle
) {
  throw new Error('Falha ao inicializar a demo: elementos de UI não encontrados.');
}

const offscreenSupported = (() => {
  if (typeof window === 'undefined') return false;
  if (typeof Worker === 'undefined') return false;
  if (typeof OffscreenCanvas === 'undefined') return false;
  return typeof HTMLCanvasElement.prototype.transferControlToOffscreen === 'function';
})();

const offscreenOption = renderSelect.querySelector<HTMLOptionElement>('option[value="offscreen-worker"]');
if (offscreenOption && !offscreenSupported) {
  offscreenOption.disabled = true;
  offscreenOption.textContent = 'offscreen-worker (indisponível)';
}

const url = new URL(window.location.href);
const renderFromQuery = url.searchParams.get('render');
if (renderFromQuery === 'auto' || renderFromQuery === 'webgl2' || renderFromQuery === 'canvas2d' || renderFromQuery === 'offscreen-worker') {
  if (renderFromQuery === 'offscreen-worker' && !offscreenSupported) {
    renderSelect.value = 'auto';
  } else {
    renderSelect.value = renderFromQuery;
  }
}

const engine = new GritEngine({
  canvas,
  overlayCanvas,
  seed: 42,
  maxParticles: 80_000,
  spawnBatch: 220,
  performancePreset: 'balanced',
  renderBackend: renderSelect.value as RenderBackend,
  simulationBackend: 'auto',
  postProcessing: {
    ...DEFAULT_POST_PROCESSING,
    bloom: true,
    trailStrength: 0.72
  },
  config: {
    ...DEFAULT_SIM_CONFIG,
    attraction: 11,
    collisions: true,
    flocking: true,
    bloom: true,
    gravity: 0.05,
    friction: 0.985
  },
  onStats: ({ fps, particleCount, frameTimeP95Ms, frameTimeP99Ms, activeParticleLimit, adaptiveScale }) => {
    statsEl.textContent = `FPS: ${fps} | P95: ${frameTimeP95Ms.toFixed(2)}ms | P99: ${frameTimeP99Ms.toFixed(2)}ms | Partículas: ${particleCount}/${activeParticleLimit} | Escala: ${(adaptiveScale * 100).toFixed(0)}% | Render: ${engine.getRenderBackend()} | Sim: ${engine.getSimulationBackend()}`;
  }
});

const orbitalWindPlugin: GritPlugin = {
  id: 'orbital-wind',
  name: 'Orbital Wind Force',
  enabled: true,
  applyForce(particle, ctx) {
    const cx = ctx.canvasWidth * 0.5;
    const cy = ctx.canvasHeight * 0.5;
    const dx = particle.x - cx;
    const dy = particle.y - cy;
    const dist = Math.max(Math.hypot(dx, dy), 1);

    const swirl = 0.0007;
    particle.ax += (-dy / dist) * swirl * dist;
    particle.ay += (dx / dist) * swirl * dist;

    const wind = Math.sin((ctx.now * 0.0015) + particle.id * 0.003) * 0.02;
    particle.ax += wind;
  }
};

const arenaConstraintPlugin: GritPlugin = {
  id: 'arena-constraint',
  name: 'Arena Constraint',
  enabled: true,
  applyConstraint(particle, ctx) {
    const cx = ctx.canvasWidth * 0.5;
    const cy = ctx.canvasHeight * 0.5;
    const dx = particle.x - cx;
    const dy = particle.y - cy;
    const radius = Math.min(ctx.canvasWidth, ctx.canvasHeight) * 0.48;
    const dist = Math.hypot(dx, dy);

    if (dist <= radius) return;

    const nx = dx / dist;
    const ny = dy / dist;
    particle.x = cx + nx * radius;
    particle.y = cy + ny * radius;

    const bounce = -0.45;
    const dot = particle.vx * nx + particle.vy * ny;
    particle.vx -= (1 + bounce) * dot * nx;
    particle.vy -= (1 + bounce) * dot * ny;
  }
};

engine.registerPlugin(orbitalWindPlugin);
engine.registerPlugin(arenaConstraintPlugin);

function spawnBurstAtCenter() {
  const rect = canvas.getBoundingClientRect();
  const x = rect.width * (window.devicePixelRatio || 1) * 0.5;
  const y = rect.height * (window.devicePixelRatio || 1) * 0.5;

  for (let i = 0; i < 8; i++) {
    engine.spawnAt(x, y);
  }
}

let pointerDown = false;

canvas.addEventListener('pointerdown', (event) => {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const x = (event.clientX - rect.left) * dpr;
  const y = (event.clientY - rect.top) * dpr;

  if (event.shiftKey) {
    engine.addObstacle(x / dpr, y / dpr);
    return;
  }

  pointerDown = true;
  engine.setPointer(x, y);
  engine.spawnAt(x, y);
});

canvas.addEventListener('pointermove', (event) => {
  const rect = canvas.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  const x = (event.clientX - rect.left) * dpr;
  const y = (event.clientY - rect.top) * dpr;

  engine.setPointer(x, y);

  if (pointerDown) {
    engine.spawnAt(x, y);
  }
});

const releasePointer = () => {
  pointerDown = false;
  engine.clearPointer();
};

canvas.addEventListener('pointerup', releasePointer);
canvas.addEventListener('pointerleave', releasePointer);

spawnButton.addEventListener('click', () => {
  spawnBurstAtCenter();
});

pauseButton.addEventListener('click', () => {
  const next = !engine.getPaused();
  engine.setPaused(next);
  pauseButton.textContent = next ? 'Retomar' : 'Pausar';
});

clearButton.addEventListener('click', () => {
  engine.clear();
});

presetSelect.addEventListener('change', () => {
  engine.setPerformancePreset(presetSelect.value as PerformancePreset);
});

renderSelect.addEventListener('change', () => {
  if (renderSelect.value === 'offscreen-worker' && !offscreenSupported) {
    renderSelect.value = 'auto';
    return;
  }

  // Força recriação completa do contexto de canvas ao trocar backend.
  // Alguns navegadores não permitem alternar 2D/WebGL no mesmo canvas já inicializado.
  const next = new URL(window.location.href);
  next.searchParams.set('render', renderSelect.value);
  window.location.href = next.toString();
});

simulationSelect.addEventListener('change', () => {
  engine.setSimulationBackend(simulationSelect.value as SimulationBackend);
});

adaptiveBudgetToggle.addEventListener('change', () => {
  engine.setAdaptiveBudgetEnabled(adaptiveBudgetToggle.checked);
});

bloomToggle.addEventListener('change', () => {
  const checked = bloomToggle.checked;
  engine.updateSettings({ bloom: checked });
  engine.updatePostProcessing({ bloom: checked });
});

vignetteToggle.addEventListener('change', () => {
  engine.updatePostProcessing({ vignette: vignetteToggle.checked });
});

trailInput.addEventListener('input', () => {
  engine.updatePostProcessing({ trailStrength: Number(trailInput.value) });
});

forcePluginToggle.addEventListener('change', () => {
  orbitalWindPlugin.enabled = forcePluginToggle.checked;
});

constraintPluginToggle.addEventListener('change', () => {
  arenaConstraintPlugin.enabled = constraintPluginToggle.checked;
});

window.addEventListener('resize', () => engine.resize());

engine.start();
spawnBurstAtCenter();
