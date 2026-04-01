# Roadmap de Performance

## Status Atual

### Curto Prazo (Concluído)

- [x] Criar suíte de benchmark reproduzível com cenários fixos (seed fixa, resolução fixa, presets)
- [x] Instrumentar métricas de frame-time (média/P95/P99) no runtime
- [x] Reduzir alocações no hot path da simulação (zero alocação por frame como alvo)
- [x] Otimizar upload de instâncias no `WebGLRenderer` para minimizar stalls de driver
- [x] Definir baseline oficial de performance por ambiente (desktop e notebook intermediário)

### Médio Prazo (Concluído)

- [x] Introduzir presets de execução orientados a performance (`performance`, `balanced`, `quality`)
- [x] Implementar culling/limites dinâmicos por pressão de frame-time
- [x] Consolidar pipeline de simulação com estrutura de dados mais cache-friendly
- [x] Evoluir fallback `canvas2d` para manter estabilidade em hardware sem WebGL2 robusto
- [x] Criar teste de regressão de performance no CI com thresholds de alerta

### Longo Prazo (Concluído)

- [x] Implementar kernel WASM real para integração matemática no caminho de simulação
- [x] Explorar `offscreen-worker` rendering quando suportado pelo ambiente
- [x] Suportar execução híbrida adaptativa (preset/simulação) por pressão de frame-time
- [x] Implementar auto-tuning de preset com base em telemetria local
- [x] Publicar matriz oficial de performance por backend/dispositivo

## Próximos Ciclos

### Curto Prazo (Próximo)

- [ ] Adicionar métricas de memória (`usedJSHeapSize`) no callback de stats quando disponível
- [ ] Criar benchmark browser-side real para comparar `webgl2`, `canvas2d` e `offscreen-worker`
- [ ] Publicar relatório automatizado de benchmark em artifact de CI

### Médio Prazo (Próximo)

- [ ] Expandir kernel WASM para blocos vetorizados (batch de partículas)
- [ ] Implementar compressão opcional de atributos no transporte para worker renderer
- [ ] Adicionar política de fallback entre backends por erro de contexto em runtime

### Longo Prazo (Próximo)

- [ ] Pipeline híbrido completo: simulação + render fora da main thread com sincronização eficiente
- [ ] Scheduler multi-objetivo (latência, bateria e qualidade visual)
- [ ] Matriz contínua de performance multi-plataforma (Linux/Windows/macOS + mobile)

## Governança

- PR com impacto em runtime/render deve anexar antes/depois (`benchmark`, `profile` e `perf:check`)
- Regressão acima dos thresholds configurados no CI exige plano de mitigação
- Toda release deve atualizar baseline e matriz de performance
