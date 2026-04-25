# Changelog

Todas as mudanças relevantes deste projeto serão documentadas aqui.

Formato inspirado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/) e versionamento semântico.

## [0.2.0] - 2026-04-25

### Adicionado

- **External Simulation API v2** com contrato formal:
  - `ExternalSimulationV2`
  - `ExternalSimulationDescriptor`
  - `ExternalSimulationCapabilities`
- Suporte a payload externo em formato binário de alta performance:
  - `ExternalFramePayload`
  - `ExternalPackedParticles` (`kind: 'packed-f32'`)
  - `ExternalObjectParticles` (`kind: 'objects'`)
- Métodos públicos para integração externa avançada:
  - `setExternalSimulation(...)`
  - `getExternalSimulationDescriptor()`
- Scheduler multi-rate com configuração independente para:
  - frequência da simulação interna (`setSimulationStepHz`)
  - frequência da simulação externa (`setExternalStepHz`)
  - limite de passos por frame (`maxSimulationStepsPerFrame`)
- **Job System** base com API de execução por lote e telemetria:
  - `JobSystem`
  - `getJobSystemSnapshot()`
- **Backend espacial plugável**:
  - `grid` (default)
  - `bruteforce`
  - API: `setSpatialBackend(...)` e `getSpatialBackend()`
- **Telemetria por subsistema** em `EngineStats`:
  - `subsystemMs` (`frameTotal`, `plugins`, `simulation`, `external`, `spatial`, `render`, `jobs`)
  - `spatialBackend`
  - `jobs` (snapshot do sistema de jobs)
- **Quality Governor por política**:
  - `QualityGovernorPolicy`
  - `DEFAULT_QUALITY_GOVERNOR`
  - APIs: `setQualityGovernorPolicy(...)` e `getQualityGovernorPolicy()`
- **Pipeline de plugins por stage**:
  - `onPreSim`
  - `onPostSim`
  - `onRenderPrep`
  - `onRender`
- **Replay e determinismo**:
  - `startReplayRecording(...)`
  - `stopReplayRecording()`
  - `playReplay(...)`
  - `stopReplayPlayback()`
  - `isReplayPlaybackEnabled()`
  - `getDeterministicSnapshot()`
  - Tipos: `ReplayFrame`, `ReplayTape`, `DeterministicSnapshot`
- **Control Center unificado** para inspeção e controle de runtime:
  - `GritControlCenter`

### Alterado

- Fluxo principal da `GritEngine` reorganizado para suportar:
  - integração externa v2;
  - scheduler multi-rate;
  - pipeline de stages;
  - gravação/reprodução de replay;
  - governor de qualidade.
- Estatísticas da engine enriquecidas com métricas operacionais mais detalhadas.
- Export público (`src/index.ts`) expandido para incluir novos tipos e componentes de runtime.
- README atualizado com as novas capacidades da engine-plataforma.

### Corrigido

- Preset manual não é mais sobrescrito indevidamente por ajustes automáticos sem controle.
- Hardening do consumo externo:
  - validação defensiva de índices/layout no modo `packed-f32`;
  - proteção contra valores não finitos;
  - fallback seguro quando provider externo lança exceção.
- Maior robustez do runtime em cenários de payload inválido/instável.

### Infra / Distribuição

- Artefatos `dist/` e tipos `.d.ts` regenerados com as novas APIs.
- Plano de evolução por lotes documentado em `IMPLEMENTATION_BATCH_PLAN.md`.

---

## [0.1.0] - Base

- Núcleo inicial da GRIT Engine com renderização WebGL2/Canvas2D.
- Simulação interna de partículas com spatial grid e plugins base.
