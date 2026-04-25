export type JobSystemMode = 'inline' | 'worker-pool';

export interface JobSystemOptions {
  mode?: JobSystemMode;
  maxWorkers?: number;
  defaultBatchSize?: number;
}

export interface JobSystemSnapshot {
  mode: JobSystemMode;
  maxWorkers: number;
  defaultBatchSize: number;
  executedJobs: number;
  executedBatches: number;
  totalJobMs: number;
}

/**
 * Base de job system para cargas CPU-bound.
 * Nesta fase, priorizamos API estável e métricas de execução.
 */
export class JobSystem {
  private readonly mode: JobSystemMode;
  private readonly maxWorkers: number;
  private readonly defaultBatchSize: number;

  private executedJobs = 0;
  private executedBatches = 0;
  private totalJobMs = 0;

  constructor(options: JobSystemOptions = {}) {
    this.mode = options.mode ?? 'inline';
    this.maxWorkers = Math.max(1, options.maxWorkers ?? 1);
    this.defaultBatchSize = Math.max(1, options.defaultBatchSize ?? 1024);
  }

  run<T>(job: () => T): T {
    const start = performance.now();
    const result = job();
    const elapsed = performance.now() - start;

    this.executedJobs++;
    this.totalJobMs += elapsed;
    return result;
  }

  forEachRange(length: number, task: (start: number, endExclusive: number) => void, batchSize?: number) {
    const safeBatchSize = Math.max(1, batchSize ?? this.defaultBatchSize);
    for (let start = 0; start < length; start += safeBatchSize) {
      const end = Math.min(start + safeBatchSize, length);
      this.executedBatches++;
      task(start, end);
    }
  }

  snapshot(): JobSystemSnapshot {
    return {
      mode: this.mode,
      maxWorkers: this.maxWorkers,
      defaultBatchSize: this.defaultBatchSize,
      executedJobs: this.executedJobs,
      executedBatches: this.executedBatches,
      totalJobMs: this.totalJobMs
    };
  }

  resetFrameCounters() {
    this.executedJobs = 0;
    this.executedBatches = 0;
    this.totalJobMs = 0;
  }
}
