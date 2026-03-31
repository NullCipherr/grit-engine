<script lang="ts">
  import { onDestroy, onMount } from 'svelte';

  import { GritEngine } from '@nullcipherr/grit-engine';

  let canvasEl: HTMLCanvasElement;
  let engine: GritEngine | null = null;

  onMount(() => {
    engine = new GritEngine({
      canvas: canvasEl,
      seed: 42,
      executionMode: 'main-thread'
    });

    engine.start();
  });

  onDestroy(() => {
    engine?.dispose();
    engine = null;
  });
</script>

<canvas bind:this={canvasEl} style="width: 100%; height: 100%" />
