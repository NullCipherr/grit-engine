# Integrations

This page contains reference integration patterns for multiple frameworks.

## Included Example Snippets

- React: `examples/react/ParticleCanvas.tsx`
- Vue: `examples/vue/ParticleCanvas.vue`
- Svelte: `examples/svelte/ParticleCanvas.svelte`
- Vanilla: `examples/vanilla/main.ts`

## Shared Integration Checklist

1. Create a canvas and keep a persistent ref
2. Instantiate `GritEngine` once on mount/init
3. Call `engine.start()` after initialization
4. Forward pointer/config updates through engine methods
5. Call `engine.dispose()` on unmount/teardown

## Deterministic Runs

For reproducible behavior across sessions, pass a fixed `seed`:

```ts
const engine = new GritEngine({
  canvas,
  seed: 42
});
```

## Execution Mode

- `main-thread` (default): simulation + rendering driven by `requestAnimationFrame`
- `worker-ticker` (experimental): worker-driven ticker triggers simulation updates
