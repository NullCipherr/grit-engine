import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const THROUGHPUT_DROP_THRESHOLD = Number(process.env.PERF_THROUGHPUT_DROP_THRESHOLD ?? 0.35);
const FRAME_INCREASE_THRESHOLD = Number(process.env.PERF_FRAME_INCREASE_THRESHOLD ?? 0.35);

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

    const minThroughput = baseline.throughput_particles_per_sec * (1 - THROUGHPUT_DROP_THRESHOLD);
    if (current.throughput_particles_per_sec < minThroughput) {
      failures.push({
        scenario: baseline.scenario,
        reason: 'throughput abaixo do limite',
        baseline: baseline.throughput_particles_per_sec,
        current: current.throughput_particles_per_sec,
        threshold: minThroughput
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

const baselineRows = loadBaseline();
const currentRows = runBenchmarkJson();
const failures = compareRows(baselineRows, currentRows);

console.table(currentRows);

if (failures.length > 0) {
  console.error('\n[perf-check] Regressões detectadas:');
  console.table(failures);
  process.exit(1);
}

console.log('\n[perf-check] OK: sem regressões acima dos thresholds configurados.');
