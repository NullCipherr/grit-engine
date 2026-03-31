import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      name: 'NullCipherrGritEngine',
      formats: ['es', 'umd'],
      fileName: (format) => (format === 'es' ? 'index.js' : 'index.umd.js')
    },
    rollupOptions: {
      output: {
        exports: 'named'
      }
    }
  }
});
