import { GritEngine, type EngineStats, type PerformancePreset, type RenderBackend } from '../../src';

type BenchmarkRow = {
  requestedBackend: RenderBackend;
  effectiveBackend: RenderBackend;
  avgFps: number;
  avgP95Ms: number;
  avgP99Ms: number;
  maxParticles: number;
  sampleCount: number;
  status: 'ok' | 'unsupported' | 'error';
  notes?: string;
};

const durationInput = document.querySelector<HTMLInputElement>('#duration');
const warmupInput = document.querySelector<HTMLInputElement>('#warmup');
const presetSelect = document.querySelector<HTMLSelectElement>('#preset');
const burstInput = document.querySelector<HTMLInputElement>('#burst');
const runButton = document.querySelector<HTMLButtonElement>('#run');
const statusEl = document.querySelector<HTMLElement>('#status');
const tableBody = document.querySelector<HTMLTableSectionElement>('#result-table tbody');
const jsonOutput = document.querySelector<HTMLElement>('#json-output');
const canvas = document.querySelector<HTMLCanvasElement>('#bench-canvas');

if (
  !durationInput ||
  !warmupInput ||
  !presetSelect ||
  !burstInput ||
  !runButton ||
  !statusEl ||
  !tableBody ||
  !jsonOutput ||
  !canvas
) {
  throw new Error('Falha ao inicializar benchmark browser-side: elementos de UI ausentes.');
}

const offscreenFeatureDetected = (() => {
  if (typeof window === 'undefined') return false;
  if (typeof Worker === 'undefined') return false;
  if (typeof OffscreenCanvas === 'undefined') return false;
  return typeof HTMLCanvasElement.prototype.transferControlToOffscreen === 'function';
})();

async function probeOffscreenWorkerSupport(timeoutMs = 1200): Promise<boolean> {
  if (!offscreenFeatureDetected) return false;

  const probeCanvas = document.createElement('canvas');
  let offscreen: OffscreenCanvas;
  try {
    offscreen = probeCanvas.transferControlToOffscreen();
  } catch {
    return false;
  }

  const probeWorkerSource = `
    self.onmessage = (event) => {
      const canvas = event.data?.canvas;
      if (!canvas) {
        self.postMessage({ ok: false });
        return;
      }
      try {
        let ctx = canvas.getContext('2d', { alpha: true, desynchronized: true });
        if (!ctx) ctx = canvas.getContext('2d');
        self.postMessage({ ok: !!ctx });
      } catch {
        self.postMessage({ ok: false });
      }
    };
  `;

  return await new Promise<boolean>((resolve) => {
    const blob = new Blob([probeWorkerSource], { type: 'text/javascript' });
    const workerUrl = URL.createObjectURL(blob);
    const worker = new Worker(workerUrl);

    const settle = (supported: boolean) => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
      resolve(supported);
    };

    const timer = window.setTimeout(() => {
      settle(false);
    }, timeoutMs);

    worker.onmessage = (event) => {
      window.clearTimeout(timer);
      settle(Boolean((event.data as { ok?: boolean } | null)?.ok));
    };

    worker.onerror = () => {
      window.clearTimeout(timer);
      settle(false);
    };

    worker.postMessage({ canvas: offscreen }, [offscreen]);
  });
}

const OFFSCREEN_SUPPORTED = await probeOffscreenWorkerSupport();

const BENCH_BACKENDS: RenderBackend[] = ['webgl2', 'canvas2d', 'offscreen-worker'];

function average(values: number[]) {
  if (values.length === 0) return 0;
  return values.reduce((acc, value) => acc + value, 0) / values.length;
}

function wait(ms: number) {
  return new Promise<void>((resolve) => {
    window.setTimeout(resolve, ms);
  });
}

function fillParticles(engine: GritEngine, burstSize: number) {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  const width = canvas.clientWidth * dpr;
  const height = canvas.clientHeight * dpr;
  const centerX = width * 0.5;
  const centerY = height * 0.5;

  const burstCount = Math.max(1, Math.floor(burstSize / 20));
  for (let i = 0; i < burstCount; i++) {
    engine.spawnAt(centerX, centerY);
  }
}

async function runSingleBackend(
  requestedBackend: RenderBackend,
  options: {
    warmupMs: number;
    durationMs: number;
    preset: PerformancePreset;
    burstSize: number;
  }
): Promise<BenchmarkRow> {
  if (requestedBackend === 'offscreen-worker' && !OFFSCREEN_SUPPORTED) {
    return {
      requestedBackend,
      effectiveBackend: 'canvas2d',
      avgFps: 0,
      avgP95Ms: 0,
      avgP99Ms: 0,
      maxParticles: 0,
      sampleCount: 0,
      status: 'unsupported',
      notes: 'offscreen-worker não suportado neste navegador'
    };
  }

  const fpsSamples: number[] = [];
  const p95Samples: number[] = [];
  const p99Samples: number[] = [];
  let particleLimit = 0;
  let warmed = false;

  const engine = new GritEngine({
    canvas,
    seed: 42,
    maxParticles: 60_000,
    spawnBatch: Math.max(100, options.burstSize),
    performancePreset: options.preset,
    renderBackend: requestedBackend,
    simulationBackend: 'wasm',
    workerTransportCompression: 'quantized16',
    onStats: (stats: EngineStats) => {
      particleLimit = Math.max(particleLimit, stats.activeParticleLimit);

      if (!warmed) return;
      fpsSamples.push(stats.fps);
      p95Samples.push(stats.frameTimeP95Ms);
      p99Samples.push(stats.frameTimeP99Ms);
    }
  });

  try {
    engine.resize();
    engine.start();
    fillParticles(engine, options.burstSize);

    await wait(options.warmupMs);
    warmed = true;
    await wait(options.durationMs);

    const effectiveBackend = engine.getRenderBackend();

    return {
      requestedBackend,
      effectiveBackend,
      avgFps: Number(average(fpsSamples).toFixed(2)),
      avgP95Ms: Number(average(p95Samples).toFixed(3)),
      avgP99Ms: Number(average(p99Samples).toFixed(3)),
      maxParticles: particleLimit,
      sampleCount: fpsSamples.length,
      status: 'ok'
    };
  } catch (error) {
    return {
      requestedBackend,
      effectiveBackend: 'canvas2d',
      avgFps: 0,
      avgP95Ms: 0,
      avgP99Ms: 0,
      maxParticles: particleLimit,
      sampleCount: fpsSamples.length,
      status: 'error',
      notes: error instanceof Error ? error.message : 'erro inesperado'
    };
  } finally {
    engine.dispose();
  }
}

function renderRows(rows: BenchmarkRow[]) {
  tableBody.innerHTML = '';

  for (const row of rows) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${row.requestedBackend}</td>
      <td>${row.effectiveBackend}</td>
      <td>${row.avgFps.toFixed(2)}</td>
      <td>${row.avgP95Ms.toFixed(3)}</td>
      <td>${row.avgP99Ms.toFixed(3)}</td>
      <td>${row.maxParticles}</td>
      <td>${row.status}${row.notes ? ` - ${row.notes}` : ''}</td>
    `;
    tableBody.appendChild(tr);
  }

  jsonOutput.textContent = JSON.stringify(rows, null, 2);
}

runButton.addEventListener('click', async () => {
  runButton.disabled = true;
  statusEl.classList.remove('status-error');
  statusEl.textContent = 'Executando benchmark browser-side...';

  const durationMs = Math.max(2000, Number(durationInput.value) || 5000);
  const warmupMs = Math.max(500, Number(warmupInput.value) || 1500);
  const burstSize = Math.max(100, Number(burstInput.value) || 320);
  const preset = (presetSelect.value as PerformancePreset) ?? 'balanced';

  const rows: BenchmarkRow[] = [];

  for (const backend of BENCH_BACKENDS) {
    statusEl.textContent = `Rodando backend ${backend}...`;
    const row = await runSingleBackend(backend, {
      durationMs,
      warmupMs,
      preset,
      burstSize
    });
    rows.push(row);
  }

  renderRows(rows);

  const hasError = rows.some((row) => row.status === 'error');
  if (hasError) {
    statusEl.classList.add('status-error');
    statusEl.textContent = 'Benchmark concluído com erros em um ou mais backends.';
  } else {
    statusEl.textContent = 'Benchmark concluído com sucesso.';
  }

  runButton.disabled = false;
});
