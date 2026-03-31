import { describe, expect, it, vi } from 'vitest';

import { isWasmSupported, resolveSimulationBackend } from '../../src/runtime/simulationBackend';

describe('simulationBackend', () => {
  it('mantém backend JS quando solicitado explicitamente', () => {
    expect(resolveSimulationBackend('js')).toBe('js');
  });

  it('faz fallback para JS quando validação WASM falha', () => {
    const validateSpy = vi.spyOn(WebAssembly, 'validate').mockReturnValue(false);

    expect(isWasmSupported()).toBe(false);
    expect(resolveSimulationBackend('wasm')).toBe('js');
    expect(resolveSimulationBackend('auto')).toBe('js');

    validateSpy.mockRestore();
  });

  it('ativa caminho WASM quando suporte está disponível', () => {
    const validateSpy = vi.spyOn(WebAssembly, 'validate').mockReturnValue(true);

    expect(isWasmSupported()).toBe(true);
    expect(resolveSimulationBackend('wasm')).toBe('wasm');
    expect(resolveSimulationBackend('auto')).toBe('wasm');

    validateSpy.mockRestore();
  });
});
