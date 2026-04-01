# Performance

## Objetivo

A estratégia de performance da GRIT prioriza previsibilidade de frame-time, throughput estável e baixo overhead de alocação no hot path.

## Métricas Ativas no Runtime

O callback `onStats` agora inclui:

- `fps`
- `frameTimeAvgMs`
- `frameTimeP95Ms`
- `frameTimeP99Ms`
- `particleCount`
- `activeParticleLimit`
- `adaptiveScale`

As métricas de frame-time são calculadas em janela deslizante fixa para evitar alocações recorrentes.

## Tooling

- `npm run benchmark`
  - Suíte reproduzível com cenários fixos (seed, resolução, preset)
  - Saída em tabela + JSON para comparação entre commits
- `npm run profile`
  - Perfil micro de operações críticas (`particle.update` e lookup do grid)
- `npm run perf:check`
  - Validação automática de regressão comparando benchmark atual com baseline versionada

## Baseline Oficial

Consulte [PERFORMANCE_BASELINE.md](./PERFORMANCE_BASELINE.md) para valores de referência por ambiente.
Dados estruturados para automação: [performance-baseline.json](./performance-baseline.json).
Matriz por backend/dispositivo: [PERFORMANCE_MATRIX.md](./PERFORMANCE_MATRIX.md).

## Otimizações Implementadas

- Reuso de buffers no hot path da simulação
- Contexto de plugin mutável interno para evitar recriação por frame
- Paleta de cor pré-computada para render
- Upload de instâncias WebGL com double-buffer de VBO para reduzir risco de stalls
- Instrumentação de frame-time sem alocação por frame (histograma + janela circular)
- Presets de execução (`performance`, `balanced`, `quality`)
- Limite adaptativo de partículas por pressão de frame-time
- Compaction pass para remoção de partículas mortas sem `splice` em loop
- Fallback `canvas2d` com paleta/sprites pré-geradas e degradação progressiva de qualidade
- Kernel WASM real para operação de integração (`mulAdd`) no caminho `simulationBackend='wasm'`
- Backend experimental `offscreen-worker` para exploração de render fora da main thread
- Runtime híbrido adaptativo com telemetria local para ajuste de preset por dispositivo

## Boas Práticas de PR

- Toda alteração no runtime/render deve anexar antes/depois com `npm run benchmark`
- Mudanças em física devem incluir `npm run profile`
- Regressão acima de 5% em P95 exige plano de mitigação
