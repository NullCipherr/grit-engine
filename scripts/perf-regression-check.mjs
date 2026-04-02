import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const THROUGHPUT_DROP_THRESHOLD = Number(process.env.PERF_THROUGHPUT_DROP_THRESHOLD ?? 0.35);
const FRAME_INCREASE_THRESHOLD = Number(process.env.PERF_FRAME_INCREASE_THRESHOLD ?? 0.35);
const THROUGHPUT_DROP_THRESHOLD_SPATIAL_GRID_PROBE = Number(
  process.env.PERF_THROUGHPUT_DROP_THRESHOLD_SPATIAL_GRID_PROBE ?? 0.5
);
const REPORT_DIR = 'artifacts/performance';

function ensureReportDir() {
  mkdirSync(REPORT_DIR, { recursive: true });
}

function runBenchmarkJson() {
  const output = execSync('node scripts/benchmark.mjs', { encoding: 'utf-8' });
  const jsonStart = output.indexOf('[\n');

  if (jsonStart < 0) {
    throw new Error('Não foi possível localizar bloco JSON na saída do benchmark.');
  }

  const jsonText = output.slice(jsonStart);
  return JSON.parse(jsonText);
}

function loadBaseline() {
  return JSON.parse(readFileSync('docs/en/performance-baseline.json', 'utf-8'));
}

function throughputDropThresholdForScenario(scenario) {
  if (scenario === 'spatial-grid-probe') {
    return THROUGHPUT_DROP_THRESHOLD_SPATIAL_GRID_PROBE;
  }

  return THROUGHPUT_DROP_THRESHOLD;
}

function compareRows(baselineRows, currentRows) {
  const currentByScenario = new Map(currentRows.map((row) => [row.scenario, row]));
  const failures = [];

  for (const baseline of baselineRows) {
    const current = currentByScenario.get(baseline.scenario);
    if (!current) {
      failures.push({
        scenario: baseline.scenario,
        reason: 'cenário ausente no benchmark atual'
      });
      continue;
    }

    const throughputThreshold = throughputDropThresholdForScenario(baseline.scenario);
    const minThroughput = baseline.throughput_particles_per_sec * (1 - throughputThreshold);
    if (current.throughput_particles_per_sec < minThroughput) {
      failures.push({
        scenario: baseline.scenario,
        reason: 'throughput abaixo do limite',
        baseline: baseline.throughput_particles_per_sec,
        current: current.throughput_particles_per_sec,
        threshold: minThroughput,
        appliedThreshold: throughputThreshold
      });
    }

    const maxP95 = baseline.p95_frame_ms * (1 + FRAME_INCREASE_THRESHOLD);
    if (baseline.p95_frame_ms > 0 && current.p95_frame_ms > maxP95) {
      failures.push({
        scenario: baseline.scenario,
        reason: 'P95 acima do limite',
        baseline: baseline.p95_frame_ms,
        current: current.p95_frame_ms,
        threshold: maxP95
      });
    }
  }

  return failures;
}

function buildMarkdownReport(currentRows, failures) {
  const lines = [];

  lines.push('# Performance Regression Report');
  lines.push('');
  lines.push(`- Throughput threshold: ${THROUGHPUT_DROP_THRESHOLD}`);
  lines.push(`- Throughput threshold (spatial-grid-probe): ${THROUGHPUT_DROP_THRESHOLD_SPATIAL_GRID_PROBE}`);
  lines.push(`- P95 threshold: ${FRAME_INCREASE_THRESHOLD}`);
  lines.push(`- Failures: ${failures.length}`);
  lines.push('');
  lines.push('## Current Benchmark');
  lines.push('');
  lines.push('| Scenario | Avg Frame (ms) | P95 (ms) | P99 (ms) | Throughput (particles/s) |');
  lines.push('|---|---:|---:|---:|---:|');

  for (const row of currentRows) {
    lines.push(
      `| ${row.scenario} | ${row.avg_frame_ms} | ${row.p95_frame_ms} | ${row.p99_frame_ms} | ${row.throughput_particles_per_sec} |`
    );
  }

  if (failures.length > 0) {
    lines.push('');
    lines.push('## Regressions');
    lines.push('');
    lines.push('| Scenario | Reason | Baseline | Current | Threshold |');
    lines.push('|---|---|---:|---:|---:|');
    for (const failure of failures) {
      lines.push(
        `| ${failure.scenario} | ${failure.reason} | ${failure.baseline ?? '-'} | ${failure.current ?? '-'} | ${failure.threshold ?? '-'} |`
      );
    }
  }

  lines.push('');
  lines.push(`_Generated at ${new Date().toISOString()}_`);

  return lines.join('\n');
}

function writeReports(currentRows, failures) {
  ensureReportDir();

  const payload = {
    generatedAt: new Date().toISOString(),
    thresholds: {
      throughputDrop: THROUGHPUT_DROP_THRESHOLD,
      throughputDropSpatialGridProbe: THROUGHPUT_DROP_THRESHOLD_SPATIAL_GRID_PROBE,
      frameIncrease: FRAME_INCREASE_THRESHOLD
    },
    currentRows,
    failures
  };

  writeFileSync(`${REPORT_DIR}/perf-report.json`, JSON.stringify(payload, null, 2), 'utf-8');
  writeFileSync(`${REPORT_DIR}/perf-report.md`, buildMarkdownReport(currentRows, failures), 'utf-8');
}

const baselineRows = loadBaseline();
const currentRows = runBenchmarkJson();
const failures = compareRows(baselineRows, currentRows);
writeReports(currentRows, failures);

console.table(currentRows);

if (failures.length > 0) {
  console.error('\n[perf-check] Regressões detectadas:');
  console.table(failures);
  process.exit(1);
}

console.log('\n[perf-check] OK: sem regressões acima dos thresholds configurados.');
