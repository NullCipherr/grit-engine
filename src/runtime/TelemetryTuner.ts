import type { PerformancePreset } from '../types';

interface TelemetryRecord {
  deviceId: string;
  preset: PerformancePreset;
  avgP99Ms: number;
  avgFps: number;
  samples: number;
  updatedAt: number;
}

interface TelemetryStore {
  records: TelemetryRecord[];
}

const STORAGE_KEY = 'grit-engine:telemetry:v2';
const MAX_RECORDS = 24;

function getDeviceId() {
  if (typeof navigator === 'undefined' || typeof screen === 'undefined') {
    return 'server';
  }

  return [
    navigator.userAgent,
    navigator.hardwareConcurrency,
    screen.width,
    screen.height,
    window.devicePixelRatio
  ].join('|');
}

function loadStore(): TelemetryStore {
  if (typeof localStorage === 'undefined') {
    return { records: [] };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { records: [] };

    const parsed = JSON.parse(raw) as TelemetryStore;
    if (!Array.isArray(parsed.records)) {
      return { records: [] };
    }

    return parsed;
  } catch {
    return { records: [] };
  }
}

function saveStore(store: TelemetryStore) {
  if (typeof localStorage === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // noop: storage may be blocked by browser policy
  }
}

export class LocalTelemetryTuner {
  private readonly deviceId = getDeviceId();
  private readonly enabled: boolean;
  private sampleCount = 0;
  private avgP99Ms = 0;
  private avgFps = 0;

  constructor(enabled: boolean) {
    this.enabled = enabled;
  }

  recommendPreset(fallback: PerformancePreset): PerformancePreset {
    if (!this.enabled) return fallback;

    const store = loadStore();
    const record = store.records.find((entry) => entry.deviceId === this.deviceId);

    if (!record || record.samples < 30) {
      return fallback;
    }

    if (record.avgP99Ms > 30 || record.avgFps < 35) {
      return 'performance';
    }

    if (record.avgP99Ms < 16 && record.avgFps > 55) {
      return 'quality';
    }

    return 'balanced';
  }

  capture(frameP99Ms: number, fps: number) {
    if (!this.enabled) return;

    this.sampleCount++;
    this.avgP99Ms += (frameP99Ms - this.avgP99Ms) / this.sampleCount;
    this.avgFps += (fps - this.avgFps) / this.sampleCount;
  }

  persist(preset: PerformancePreset) {
    if (!this.enabled || this.sampleCount === 0) return;

    const store = loadStore();
    const records = store.records.filter((entry) => entry.deviceId !== this.deviceId);

    records.unshift({
      deviceId: this.deviceId,
      preset,
      avgP99Ms: Number(this.avgP99Ms.toFixed(3)),
      avgFps: Number(this.avgFps.toFixed(2)),
      samples: this.sampleCount,
      updatedAt: Date.now()
    });

    if (records.length > MAX_RECORDS) {
      records.length = MAX_RECORDS;
    }

    saveStore({ records });
  }
}
