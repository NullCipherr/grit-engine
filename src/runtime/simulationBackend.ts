import type { SimulationBackend } from '../types';

const EMPTY_WASM_MODULE = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0]);

export function isWasmSupported(): boolean {
  if (typeof WebAssembly === 'undefined') {
    return false;
  }

  try {
    return WebAssembly.validate(EMPTY_WASM_MODULE);
  } catch {
    return false;
  }
}

export function resolveSimulationBackend(requested: SimulationBackend): Exclude<SimulationBackend, 'auto'> {
  if (requested === 'js') {
    return 'js';
  }

  if (requested === 'wasm') {
    return isWasmSupported() ? 'wasm' : 'js';
  }

  return isWasmSupported() ? 'wasm' : 'js';
}
