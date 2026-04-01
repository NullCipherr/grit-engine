const MUL_ADD_WASM_MODULE = new Uint8Array([
  0x00, 0x61, 0x73, 0x6d,
  0x01, 0x00, 0x00, 0x00,
  0x01, 0x08, 0x01, 0x60, 0x03, 0x7c, 0x7c, 0x7c, 0x01, 0x7c,
  0x03, 0x02, 0x01, 0x00,
  0x07, 0x0d, 0x01, 0x09, 0x69, 0x6e, 0x74, 0x65, 0x67, 0x72, 0x61, 0x74, 0x65, 0x00, 0x00,
  0x0a, 0x0c, 0x01, 0x0a, 0x00, 0x20, 0x00, 0x20, 0x01, 0x20, 0x02, 0xa2, 0xa0, 0x0b
]);

export interface WasmMathKernel {
  readonly ready: boolean;
  mulAdd(base: number, value: number, factor: number): number;
}

export class WasmMulAddKernel implements WasmMathKernel {
  ready = false;
  private integrateFn: ((base: number, value: number, factor: number) => number) | null = null;

  async init() {
    if (typeof WebAssembly === 'undefined') return;

    try {
      const module = await WebAssembly.instantiate(MUL_ADD_WASM_MODULE);
      const fn = (module.instance.exports as { integrate?: unknown }).integrate;

      if (typeof fn === 'function') {
        this.integrateFn = fn as (base: number, value: number, factor: number) => number;
        this.ready = true;
      }
    } catch {
      this.integrateFn = null;
      this.ready = false;
    }
  }

  mulAdd(base: number, value: number, factor: number): number {
    if (!this.integrateFn) {
      return base + value * factor;
    }

    return this.integrateFn(base, value, factor);
  }
}
