export interface FrameTimeSummary {
  sampleCount: number;
  avgMs: number;
  p95Ms: number;
  p99Ms: number;
}

const MIN_FRAME_MS = 0;

export class FrameTimeWindow {
  private readonly samples: Float32Array;
  private readonly buckets: Uint32Array;
  private readonly bucketSizeMs: number;
  private readonly maxBucketMs: number;

  private writeIndex = 0;
  private size = 0;
  private sumMs = 0;

  constructor(capacity = 300, bucketSizeMs = 0.25, maxBucketMs = 120) {
    const safeCapacity = Math.max(1, capacity | 0);
    const safeBucketSize = Math.max(0.05, bucketSizeMs);
    const safeMaxBucket = Math.max(16, maxBucketMs);

    this.samples = new Float32Array(safeCapacity);
    this.bucketSizeMs = safeBucketSize;
    this.maxBucketMs = safeMaxBucket;
    this.buckets = new Uint32Array(Math.floor(safeMaxBucket / safeBucketSize) + 1);
  }

  push(frameMs: number) {
    const clamped = this.clampFrameMs(frameMs);

    if (this.size === this.samples.length) {
      const old = this.samples[this.writeIndex];
      this.sumMs -= old;
      this.buckets[this.toBucket(old)]--;
    } else {
      this.size++;
    }

    this.samples[this.writeIndex] = clamped;
    this.sumMs += clamped;
    this.buckets[this.toBucket(clamped)]++;

    this.writeIndex++;
    if (this.writeIndex >= this.samples.length) {
      this.writeIndex = 0;
    }
  }

  reset() {
    this.samples.fill(0);
    this.buckets.fill(0);
    this.writeIndex = 0;
    this.size = 0;
    this.sumMs = 0;
  }

  snapshot(out?: FrameTimeSummary): FrameTimeSummary {
    const target = out ?? {
      sampleCount: 0,
      avgMs: 0,
      p95Ms: 0,
      p99Ms: 0
    };

    if (this.size === 0) {
      target.sampleCount = 0;
      target.avgMs = 0;
      target.p95Ms = 0;
      target.p99Ms = 0;
      return target;
    }

    target.sampleCount = this.size;
    target.avgMs = this.sumMs / this.size;
    target.p95Ms = this.percentileFromHistogram(0.95);
    target.p99Ms = this.percentileFromHistogram(0.99);

    return target;
  }

  private clampFrameMs(frameMs: number): number {
    if (!Number.isFinite(frameMs)) return MIN_FRAME_MS;
    if (frameMs < MIN_FRAME_MS) return MIN_FRAME_MS;
    if (frameMs > this.maxBucketMs) return this.maxBucketMs;
    return frameMs;
  }

  private toBucket(value: number): number {
    const raw = Math.floor(value / this.bucketSizeMs);
    if (raw < 0) return 0;
    if (raw >= this.buckets.length) return this.buckets.length - 1;
    return raw;
  }

  private percentileFromHistogram(percentile: number): number {
    const threshold = Math.max(1, Math.ceil(this.size * percentile));
    let cumulative = 0;

    for (let i = 0; i < this.buckets.length; i++) {
      cumulative += this.buckets[i];
      if (cumulative >= threshold) {
        return i * this.bucketSizeMs;
      }
    }

    return this.maxBucketMs;
  }
}
