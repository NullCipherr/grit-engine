import { describe, expect, it } from 'vitest';

import { WasmMulAddKernel } from '../../src/runtime/WasmMathKernel';

describe('WasmMulAddKernel', () => {
  it('retorna resultado correto mesmo antes de inicializar', () => {
    const kernel = new WasmMulAddKernel();
    expect(kernel.mulAdd(10, 2, 3)).toBe(16);
  });

  it('inicializa kernel WASM quando suportado', async () => {
    const kernel = new WasmMulAddKernel();
    await kernel.init();

    const result = kernel.mulAdd(1.5, 2, 4);
    expect(result).toBeCloseTo(9.5, 6);
  });

  it('processa lote com mulAddBatch e respeita buffer de saída', async () => {
    const kernel = new WasmMulAddKernel();
    await kernel.init();

    const base = new Float32Array([1, 2, 3, 4]);
    const values = new Float32Array([0.5, 1, 1.5, 2]);
    const out = new Float32Array(4);
    const result = kernel.mulAddBatch(base, values, 2, out);

    expect(result).toBe(out);
    expect(Array.from(out)).toEqual([2, 4, 6, 8]);
  });
});
