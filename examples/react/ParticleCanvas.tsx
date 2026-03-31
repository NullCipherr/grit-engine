import { useEffect, useRef } from 'react';

import { GritEngine } from '@nullcipherr/grit-engine';

export function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const engine = new GritEngine({
      canvas: canvasRef.current,
      seed: 42,
      executionMode: 'main-thread'
    });

    engine.start();

    return () => {
      engine.dispose();
    };
  }, []);

  return <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />;
}
