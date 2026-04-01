# Performance Matrix

## Objetivo

Registrar compatibilidade e comportamento de performance por backend/render path e tipo de dispositivo, com foco em comparação de releases.

## Matriz Atual

| Dispositivo | SO | Render Backend | Simulation Backend | Preset | Resultado |
| --- | --- | --- | --- | --- | --- |
| i7-1355U (12 threads) | Linux 6.19 | `webgl2` | `wasm` | `performance` | Estável, alta taxa de throughput |
| i7-1355U (12 threads) | Linux 6.19 | `webgl2` | `js` | `balanced` | Estável, custo moderado |
| i7-1355U (12 threads) | Linux 6.19 | `canvas2d` | `js` | `balanced` | Estável com degradação adaptativa |
| i7-1355U (12 threads) | Linux 6.19 | `offscreen-worker` | `js` | `performance` | Experimental, reduz disputa de main thread |

## Referências de Medição

- Baseline detalhada: [PERFORMANCE_BASELINE.md](./PERFORMANCE_BASELINE.md)
- Dados estruturados para automação: [performance-baseline.json](./performance-baseline.json)
- Roadmap de performance: [ROADMAP.md](./ROADMAP.md)

## Próximas Atualizações da Matriz

- Adicionar medições em Windows + macOS
- Incluir hardware de entrada (GPU integrada antiga)
- Incluir mobile browsers com `canvas2d`
