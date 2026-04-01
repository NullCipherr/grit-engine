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
});
