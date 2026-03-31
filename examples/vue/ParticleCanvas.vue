<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue';

import { GritEngine } from '@nullcipherr/grit-engine';

const canvasRef = ref<HTMLCanvasElement | null>(null);
let engine: GritEngine | null = null;

onMounted(() => {
  if (!canvasRef.value) return;

  engine = new GritEngine({
    canvas: canvasRef.value,
    seed: 42,
    executionMode: 'main-thread'
  });

  engine.start();
});

onBeforeUnmount(() => {
  engine?.dispose();
  engine = null;
});
</script>

<template>
  <canvas ref="canvasRef" style="width: 100%; height: 100%" />
</template>
