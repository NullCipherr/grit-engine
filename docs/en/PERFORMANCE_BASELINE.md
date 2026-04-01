# Performance Baseline

## Ambiente de Referência

- Data da medição: `2026-03-30T22:21:42-03:00`
- Sistema: `Linux 6.19.9-arch1-1`
- CPU: `13th Gen Intel(R) Core(TM) i7-1355U`
- Núcleos lógicos: `12`
- Arquitetura: `x86_64`
- Node.js: `v22.22.2`
- npm: `11.12.1`

## Benchmark Reproduzível (`npm run benchmark`)

| Cenário | Preset | Resolução | Partículas | Frames | Seed | Avg frame (ms) | P95 (ms) | P99 (ms) | FPS estimado | Throughput (partículas/s) |
| --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| `perf-1080p-performance` | `performance` | 1920x1080 | 18000 | 120 | 42 | 4.539 | 8.074 | 9.274 | 220.32 | 3963449 |
| `perf-1080p-balanced` | `balanced` | 1920x1080 | 12000 | 120 | 42 | 25.479 | 32.628 | 39.218 | 39.25 | 470952 |
| `perf-1440p-quality` | `quality` | 2560x1440 | 9000 | 120 | 42 | 13.52 | 18.58 | 27.748 | 73.96 | 665638 |
| `spatial-grid-probe` | `balanced` | 1920x1080 | 30000 | 2000 | 42 | 0.0048 | 0 | 0 | 0 | 14844115 |

## Perfil Micro (`npm run profile`)

| Probe | Samples | Total (ms) | ns/op |
| --- | ---: | ---: | ---: |
| `particle-update-fast` | 120000 | 15.662 | 130.5 |
| `particle-update-full` | 120000 | 18.258 | 152.2 |
| `spatial-lookup` | 120000 | 190.969 | 1591.4 |

## Uso

1. Rode `npm run benchmark` para comparação por cenário.
2. Rode `npm run profile` para hotspots de operação.
3. Compare contra esta baseline antes de mergear mudanças de runtime/render.
4. Para CI, use `npm run perf:check` (usa `performance-baseline.json`).
