import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Engine } from '../../../src/engine/Engine.js';
import { Primitives } from '../../../src/objects/Primitives.js';
import { PerformanceProfiler } from '../../../src/utils/PerformanceProfiler.js';

describe('Box Primitive Integration', () => {
  let engine: Engine;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    if (typeof document !== 'undefined') {
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
      engine = new Engine({ canvas });
    }
  });

  afterEach(() => {
    if (engine) {
      engine.cleanup();
    }
  });

  it('should render box primitive', async () => {
    if (!canvas || !navigator.gpu) return;

    await engine.initialize();
    
    const box = Primitives.box(1, 1, 1, {
      transform: {
        position: [0, 0, -5]
      }
    });
    
    const objectIndex = engine.addObject(box);
    expect(objectIndex).toBe(0);
    
    expect(() => engine.render(0.016)).not.toThrow();
  });

  it('should render multiple box primitives', async () => {
    if (!canvas || !navigator.gpu) return;

    await engine.initialize();
    
    for (let i = 0; i < 10; i++) {
      const box = Primitives.box(0.5, 0.5, 0.5, {
        transform: {
          position: [
            (i % 5) - 2,
            Math.floor(i / 5) - 1,
            -5
          ]
        }
      });
      engine.addObject(box);
    }
    
    expect(() => engine.render(0.016)).not.toThrow();
  });

  it('should handle box transformations', async () => {
    if (!canvas || !navigator.gpu) return;

    await engine.initialize();
    
    const box = Primitives.box(1, 1, 1, {
      transform: {
        position: [0, 0, -5],
        rotation: [Math.PI/4, Math.PI/4, 0],
        scale: [1.5, 0.8, 1.2]
      }
    });
    
    engine.addObject(box);
    
    expect(() => engine.render(0.016)).not.toThrow();
  });

  it('should handle box materials', async () => {
    if (!canvas || !navigator.gpu) return;

    await engine.initialize();
    
    const box = Primitives.box(1, 1, 1, {
      transform: {
        position: [0, 0, -5]
      },
      material: {
        color: [1, 0, 0],
        metallic: 0.8,
        roughness: 0.2
      }
    });
    
    engine.addObject(box);
    
    expect(() => engine.render(0.016)).not.toThrow();
  });

  it('should maintain performance with box primitives', async () => {
    if (!canvas || !navigator.gpu) return;

    await engine.initialize();
    
    for (let i = 0; i < 50; i++) {
      const box = Primitives.box(0.2, 0.2, 0.2, {
        transform: {
          position: [
            (Math.random() - 0.5) * 10,
            (Math.random() - 0.5) * 10,
            -5 - Math.random() * 5
          ]
        }
      });
      engine.addObject(box);
    }
    
    const profiler = new PerformanceProfiler();
    profiler.start();
    
    for (let frame = 0; frame < 10; frame++) {
      engine.render(0.016);
      profiler.recordFrame(50);
    }
    
    profiler.stop();
    
    const stats = profiler.getStatistics();
    expect(stats.avgFrameTime).toBeLessThan(32); // < 30 FPS
  });
});
