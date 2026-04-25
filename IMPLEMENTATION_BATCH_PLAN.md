# Plano de Implementação em Lotes (3 por vez)

Objetivo: evoluir a **grit-engine** para funcionar como runtime universal de simulação/renderização reutilizável por projetos externos (incluindo 2d-neuro-particle).

## Backlog completo

1. External Simulation API v2 (versionada + capacidades).
2. Suporte nativo a buffer binário (`packed-f32`) para integração de alta performance.
3. Scheduler multi-rate (`sim step` e `external step` independentes).
4. Job System com worker pool.
5. Spatial backend plugável (grid/quadtree/hash/BVH).
6. Telemetria/profiler por subsistema.
7. Quality governor configurável por política.
8. Pipeline de plugins por stage (`pre-sim`, `sim`, `render-prep`, `render`).
9. Replay/determinismo (snapshot + replay).
10. Control Center unificado da engine (console/runtime inspector).

## Lotes

### Lote 1 (implementado)

- Item 1: External Simulation API v2.
- Item 2: Buffer binário `packed-f32`.
- Item 3: Scheduler multi-rate.

### Lote 2 (implementado)

- Item 4: Job System com worker pool.
- Item 5: Spatial backend plugável.
- Item 6: Telemetria/profiler por subsistema.

### Lote 3 (implementado)

- Item 7: Quality governor por política.
- Item 8: Pipeline de plugins por stage.
- Item 9: Replay/determinismo.

### Lote 4 (implementado)

- Item 10: Control Center unificado (runtime inspector + comandos).
- Hardening, validação cruzada e documentação final de plataforma.

## Critérios de aceitação do Lote 1

1. Engine aceita integração externa via API v2 com descriptor/capabilities.
2. Engine consome payload `packed-f32` sem precisar converter para objeto por partícula.
3. Engine roda com taxa externa independente da taxa interna/render (`externalStepHz` / `simulationStepHz`).
4. Compatibilidade retroativa mantida com `externalFrameProvider` legado.
