import type { GritEngine } from '../GritEngine';
import type { PerformancePreset, SpatialBackendType } from '../types';

export interface GritControlCenterOptions {
  container?: HTMLElement;
  title?: string;
  refreshMs?: number;
  showReplay?: boolean;
  showQualityGovernor?: boolean;
  showScheduler?: boolean;
}

export class GritControlCenter {
  private readonly engine: GritEngine;
  private readonly root: HTMLElement;
  private readonly statsEl: HTMLElement;
  private readonly options: Required<GritControlCenterOptions>;
  private timer: number | null = null;
  private lastReplay: ReturnType<GritEngine['stopReplayRecording']> = null;

  constructor(engine: GritEngine, options: GritControlCenterOptions = {}) {
    this.engine = engine;
    this.options = {
      container: options.container ?? document.body,
      title: options.title ?? 'Grit Control Center',
      refreshMs: options.refreshMs ?? 300,
      showReplay: options.showReplay ?? true,
      showQualityGovernor: options.showQualityGovernor ?? true,
      showScheduler: options.showScheduler ?? true
    };

    this.root = document.createElement('aside');
    this.root.setAttribute('aria-label', 'Grit Control Center');
    this.root.style.cssText = [
      'position:fixed',
      'right:12px',
      'top:12px',
      'z-index:9999',
      'width:320px',
      'max-width:90vw',
      'padding:12px',
      'border-radius:12px',
      'background:rgba(10,14,20,.88)',
      'border:1px solid rgba(255,255,255,.12)',
      'backdrop-filter: blur(8px)',
      'font:12px/1.4 ui-sans-serif,system-ui',
      'color:#eef2f7',
      'box-shadow:0 10px 28px rgba(0,0,0,.35)'
    ].join(';');

    const title = document.createElement('h2');
    title.textContent = this.options.title;
    title.style.cssText = 'margin:0 0 8px 0;font-size:13px;letter-spacing:.02em';
    this.root.appendChild(title);

    const controls = document.createElement('div');
    controls.style.cssText = 'display:grid;grid-template-columns:1fr 1fr;gap:8px';

    const pauseBtn = document.createElement('button');
    pauseBtn.textContent = 'Pausar';
    pauseBtn.onclick = () => {
      const next = !this.engine.getPaused();
      this.engine.setPaused(next);
      pauseBtn.textContent = next ? 'Continuar' : 'Pausar';
    };
    controls.appendChild(pauseBtn);

    const clearBtn = document.createElement('button');
    clearBtn.textContent = 'Limpar';
    clearBtn.onclick = () => this.engine.clear();
    controls.appendChild(clearBtn);

    const presetSel = document.createElement('select');
    (['performance', 'balanced', 'quality'] as PerformancePreset[]).forEach((preset) => {
      const opt = document.createElement('option');
      opt.value = preset;
      opt.textContent = preset;
      presetSel.appendChild(opt);
    });
    presetSel.value = this.engine.getPerformancePreset();
    presetSel.onchange = () => this.engine.setPerformancePreset(presetSel.value as PerformancePreset);
    controls.appendChild(this.labeled('Preset', presetSel));

    const spatialSel = document.createElement('select');
    (['grid', 'bruteforce'] as SpatialBackendType[]).forEach((backend) => {
      const opt = document.createElement('option');
      opt.value = backend;
      opt.textContent = backend;
      spatialSel.appendChild(opt);
    });
    spatialSel.value = this.engine.getSpatialBackend();
    spatialSel.onchange = () => this.engine.setSpatialBackend(spatialSel.value as SpatialBackendType);
    controls.appendChild(this.labeled('Spatial', spatialSel));

    if (this.options.showScheduler) {
      const scheduler = this.engine.getSchedulerConfig();
      const simHz = document.createElement('input');
      simHz.type = 'range';
      simHz.min = '20';
      simHz.max = '120';
      simHz.value = String(Math.round(scheduler.simulationStepHz));
      simHz.oninput = () => this.engine.setSimulationStepHz(Number(simHz.value));
      controls.appendChild(this.labeled('Sim Hz', simHz));

      const extHz = document.createElement('input');
      extHz.type = 'range';
      extHz.min = '10';
      extHz.max = '120';
      extHz.value = String(Math.round(scheduler.externalStepHz));
      extHz.oninput = () => this.engine.setExternalStepHz(Number(extHz.value));
      controls.appendChild(this.labeled('Ext Hz', extHz));
    }

    if (this.options.showQualityGovernor) {
      const qPolicy = this.engine.getQualityGovernorPolicy();
      const qToggle = document.createElement('input');
      qToggle.type = 'checkbox';
      qToggle.checked = qPolicy.enabled;
      qToggle.onchange = () => this.engine.setQualityGovernorPolicy({ enabled: qToggle.checked });
      controls.appendChild(this.labeled('Q Governor', qToggle));
    }

    if (this.options.showReplay) {
      const recBtn = document.createElement('button');
      recBtn.textContent = 'Rec';
      recBtn.onclick = () => {
        this.engine.startReplayRecording(1200);
      };
      controls.appendChild(recBtn);

      const stopRecBtn = document.createElement('button');
      stopRecBtn.textContent = 'Stop Rec';
      stopRecBtn.onclick = () => {
        this.lastReplay = this.engine.stopReplayRecording();
      };
      controls.appendChild(stopRecBtn);

      const playBtn = document.createElement('button');
      playBtn.textContent = 'Play Replay';
      playBtn.onclick = () => {
        if (!this.lastReplay) return;
        this.engine.playReplay(this.lastReplay, true);
      };
      controls.appendChild(playBtn);

      const stopPlayBtn = document.createElement('button');
      stopPlayBtn.textContent = 'Stop Replay';
      stopPlayBtn.onclick = () => this.engine.stopReplayPlayback();
      controls.appendChild(stopPlayBtn);
    }

    this.root.appendChild(controls);

    this.statsEl = document.createElement('pre');
    this.statsEl.style.cssText = 'margin:10px 0 0;max-height:220px;overflow:auto;padding:8px;background:rgba(0,0,0,.25);border-radius:8px';
    this.root.appendChild(this.statsEl);

    this.options.container.appendChild(this.root);
    this.refresh();
    this.timer = window.setInterval(() => this.refresh(), this.options.refreshMs);
  }

  dispose() {
    if (this.timer !== null) {
      window.clearInterval(this.timer);
      this.timer = null;
    }
    this.root.remove();
  }

  private refresh() {
    const stats = this.engine.getStats();
    const scheduler = this.engine.getSchedulerConfig();
    const jobs = this.engine.getJobSystemSnapshot();

    this.statsEl.textContent = [
      `fps=${stats.fps} particles=${stats.particleCount}`,
      `p95=${stats.frameTimeP95Ms.toFixed(2)} p99=${stats.frameTimeP99Ms.toFixed(2)}`,
      `backend=${stats.spatialBackend} preset=${stats.effectivePreset}`,
      `simMs=${stats.subsystemMs.simulation.toFixed(2)} extMs=${stats.subsystemMs.external.toFixed(2)} renderMs=${stats.subsystemMs.render.toFixed(2)}`,
      `jobs=${jobs.executedJobs} batches=${jobs.executedBatches} jobMs=${jobs.totalJobMs.toFixed(2)}`,
      `simHz=${scheduler.simulationStepHz.toFixed(1)} extHz=${scheduler.externalStepHz.toFixed(1)}`
    ].join('\n');
  }

  private labeled(label: string, input: HTMLElement) {
    const wrap = document.createElement('label');
    wrap.style.cssText = 'display:flex;flex-direction:column;gap:4px';
    const text = document.createElement('span');
    text.textContent = label;
    text.style.cssText = 'opacity:.78';
    wrap.appendChild(text);
    wrap.appendChild(input);
    return wrap;
  }
}
