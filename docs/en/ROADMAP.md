# Roadmap

## Status Atual

### Curto Prazo (Concluído)

- [x] Estabilizar nomenclatura da API pública e documentação
- [x] Adicionar testes unitários base para matemática core e colisões
- [x] Expandir exemplos de integração para múltiplos frameworks

### Médio Prazo (Concluído)

- [x] Modo determinístico com seed para simulações reprodutíveis
- [x] Execução opcional com worker ticker (experimental)
- [x] Ferramentas de profiling e benchmark com baseline documentado

### Longo Prazo (Concluído)

- [x] Sistema modular de plugins para forças e constraints customizadas
- [x] Caminho opcional de aceleração WASM com fallback seguro para JS
- [x] Backends estendidos de renderização e opções de pós-processamento

## Próximas Entregas

### Curto Prazo

- [ ] Testes automatizados para ciclo de plugins (registro, desregistro, ordem e isolamento)
- [ ] Guia rápido de criação de plugin oficial com exemplos prontos para copiar
- [ ] Telemetria básica de frame-time (ms) no callback de estatísticas

### Médio Prazo

- [ ] API para kernels WASM externos (carregamento, contrato e validação)
- [ ] Snapshot visual determinístico para regressão gráfica (seed fixa)
- [ ] Presets de pós-processamento por perfil (performance, balanced, cinematic)

### Longo Prazo

- [ ] Multi-camada de render com composição offscreen (quando disponível)
- [ ] Runtime multiplayer/sincronização determinística para experiências compartilhadas
- [ ] Ferramental de authoring visual para plugins e cenários interativos

## Direção de Produto

GRIT segue como núcleo reutilizável para produtos internos e comerciais, com camadas de integração por plataforma/framework e foco em previsibilidade, performance e extensibilidade.
