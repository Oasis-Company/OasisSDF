import { describe, it, expect } from 'vitest';
import { Engine } from '../../src/engine/Engine.js';
import { Primitives } from '../../src/objects/Primitives.js';
import { PerformanceProfiler } from '../../src/utils/PerformanceProfiler.js';
import { MemoryProfiler } from '../../src/utils/MemoryProfiler.js';

describe('Box Primitive Performance', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    if (typeof document !== 'undefined') {
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
    }
  });

  it('should render box primitives at >60 FPS', async () => {
    if (!canvas || !navigator.gpu) return;

    const engine = new Engine({ canvas, maxObjects: 1000 });
    await engine.initialize();
    
    for (let i = 0; i < 100; i++) {
      const box = Primitives.box(0.1, 0.1, 0.1, {
        transform: {
          position: [
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            -10 - Math.random() * 10
          ]
        }
      });
      engine.addObject(box);
    }
    
    const profiler = new PerformanceProfiler();
    profiler.start();
    
    for (let frame = 0; frame < 60; frame++) {
      engine.render(1/60);
      profiler.recordFrame(100);
    }
    
    profiler.stop();
    
    const stats = profiler.getStatistics();
    expect(stats.avgFPS).toBeGreaterThan(60);
    
    engine.cleanup();
  });

  it('should use minimal memory with box primitives', async () => {
    if (!canvas || !navigator.gpu) return;

    const memoryProfiler = new MemoryProfiler();
    const engine = new Engine({ canvas, maxObjects: 1000 });
    
    memoryProfiler.takeSnapshot(0, 0);
    
    await engine.initialize();
    
    for (let i = 0; i < 100; i++) {
      const box = Primitives.box(0.1, 0.1, 0.1, {
        transform: {
          position: [
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            -10 - Math.random() * 10
          ]
        }
      });
      engine.addObject(box);
    }
    
    memoryProfiler.takeSnapshot(100, 1);
    
    const stats = memoryProfiler.getStatistics();
    expect(stats.currentGPUMemory).toBeLessThan(10 * 1024 * 1024); // < 10MB
    
    engine.cleanup();
  });
});

describe('Torus Primitive Performance', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    if (typeof document !== 'undefined') {
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
    }
  });

  it('should render torus primitives at >60 FPS', async () => {
    if (!canvas || !navigator.gpu) return;

    const engine = new Engine({ canvas, maxObjects: 1000 });
    await engine.initialize();
    
    for (let i = 0; i < 100; i++) {
      const torus = Primitives.torus(0.1, 0.04, {
        transform: {
          position: [
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            -10 - Math.random() * 10
          ]
        }
      });
      engine.addObject(torus);
    }
    
    const profiler = new PerformanceProfiler();
    profiler.start();
    
    for (let frame = 0; frame < 60; frame++) {
      engine.render(1/60);
      profiler.recordFrame(100);
    }
    
    profiler.stop();
    
    const stats = profiler.getStatistics();
    expect(stats.avgFPS).toBeGreaterThan(60);
    
    engine.cleanup();
  });

  it('should use minimal memory with torus primitives', async () => {
    if (!canvas || !navigator.gpu) return;

    const memoryProfiler = new MemoryProfiler();
    const engine = new Engine({ canvas, maxObjects: 1000 });
    
    memoryProfiler.takeSnapshot(0, 0);
    
    await engine.initialize();
    
    for (let i = 0; i < 100; i++) {
      const torus = Primitives.torus(0.1, 0.04, {
        transform: {
          position: [
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            -10 - Math.random() * 10
          ]
        }
      });
      engine.addObject(torus);
    }
    
    memoryProfiler.takeSnapshot(100, 1);
    
    const stats = memoryProfiler.getStatistics();
    expect(stats.currentGPUMemory).toBeLessThan(10 * 1024 * 1024); // < 10MB
    
    engine.cleanup();
  });
});

describe('Capsule Primitive Performance', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    if (typeof document !== 'undefined') {
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
    }
  });

  it('should render capsule primitives at >60 FPS', async () => {
    if (!canvas || !navigator.gpu) return;

    const engine = new Engine({ canvas, maxObjects: 1000 });
    await engine.initialize();
    
    for (let i = 0; i < 100; i++) {
      const capsule = Primitives.capsule(0.5, 0.15, {
        transform: {
          position: [
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            -10 - Math.random() * 10
          ],
          rotation: [
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
          ]
        }
      });
      engine.addObject(capsule);
    }
    
    const profiler = new PerformanceProfiler();
    profiler.start();
    
    for (let frame = 0; frame < 60; frame++) {
      engine.render(1/60);
      profiler.recordFrame(100);
    }
    
    profiler.stop();
    
    const stats = profiler.getStatistics();
    expect(stats.avgFPS).toBeGreaterThan(60);
    
    engine.cleanup();
  });

  it('should use minimal memory with capsule primitives', async () => {
    if (!canvas || !navigator.gpu) return;

    const memoryProfiler = new MemoryProfiler();
    const engine = new Engine({ canvas, maxObjects: 1000 });
    
    memoryProfiler.takeSnapshot(0, 0);
    
    await engine.initialize();
    
    for (let i = 0; i < 100; i++) {
      const capsule = Primitives.capsule(0.5, 0.15, {
        transform: {
          position: [
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            -10 - Math.random() * 10
          ]
        }
      });
      engine.addObject(capsule);
    }
    
    memoryProfiler.takeSnapshot(100, 1);
    
    const stats = memoryProfiler.getStatistics();
    expect(stats.currentGPUMemory).toBeLessThan(10 * 1024 * 1024); // < 10MB
    
    engine.cleanup();
  });
});

describe('Cylinder Primitive Performance', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    if (typeof document !== 'undefined') {
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
    }
  });

  it('should render cylinder primitives at >60 FPS', async () => {
    if (!canvas || !navigator.gpu) return;

    const engine = new Engine({ canvas, maxObjects: 1000 });
    await engine.initialize();
    
    for (let i = 0; i < 100; i++) {
      const cylinder = Primitives.cylinder(0.8, 0.2, {
        transform: {
          position: [
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            -10 - Math.random() * 10
          ],
          rotation: [
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
          ]
        }
      });
      engine.addObject(cylinder);
    }
    
    const profiler = new PerformanceProfiler();
    profiler.start();
    
    for (let frame = 0; frame < 60; frame++) {
      engine.render(1/60);
      profiler.recordFrame(100);
    }
    
    profiler.stop();
    
    const stats = profiler.getStatistics();
    expect(stats.avgFPS).toBeGreaterThan(60);
    
    engine.cleanup();
  });

  it('should use minimal memory with cylinder primitives', async () => {
    if (!canvas || !navigator.gpu) return;

    const memoryProfiler = new MemoryProfiler();
    const engine = new Engine({ canvas, maxObjects: 1000 });
    
    memoryProfiler.takeSnapshot(0, 0);
    
    await engine.initialize();
    
    for (let i = 0; i < 100; i++) {
      const cylinder = Primitives.cylinder(0.8, 0.2, {
        transform: {
          position: [
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            -10 - Math.random() * 10
          ]
        }
      });
      engine.addObject(cylinder);
    }
    
    memoryProfiler.takeSnapshot(100, 1);
    
    const stats = memoryProfiler.getStatistics();
    expect(stats.currentGPUMemory).toBeLessThan(10 * 1024 * 1024); // < 10MB
    
    engine.cleanup();
  });
});

describe('Cone Primitive Performance', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    if (typeof document !== 'undefined') {
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
    }
  });

  it('should render cone primitives at >60 FPS', async () => {
    if (!canvas || !navigator.gpu) return;

    const engine = new Engine({ canvas, maxObjects: 1000 });
    await engine.initialize();
    
    for (let i = 0; i < 100; i++) {
      const cone = Primitives.cone(0.8, 0.3, {
        transform: {
          position: [
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            -10 - Math.random() * 10
          ],
          rotation: [
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2,
            Math.random() * Math.PI * 2
          ]
        }
      });
      engine.addObject(cone);
    }
    
    const profiler = new PerformanceProfiler();
    profiler.start();
    
    for (let frame = 0; frame < 60; frame++) {
      engine.render(1/60);
      profiler.recordFrame(100);
    }
    
    profiler.stop();
    
    const stats = profiler.getStatistics();
    expect(stats.avgFPS).toBeGreaterThan(60);
    
    engine.cleanup();
  });

  it('should use minimal memory with cone primitives', async () => {
    if (!canvas || !navigator.gpu) return;

    const memoryProfiler = new MemoryProfiler();
    const engine = new Engine({ canvas, maxObjects: 1000 });
    
    memoryProfiler.takeSnapshot(0, 0);
    
    await engine.initialize();
    
    for (let i = 0; i < 100; i++) {
      const cone = Primitives.cone(0.8, 0.3, {
        transform: {
          position: [
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 20,
            -10 - Math.random() * 10
          ]
        }
      });
      engine.addObject(cone);
    }
    
    memoryProfiler.takeSnapshot(100, 1);
    
    const stats = memoryProfiler.getStatistics();
    expect(stats.currentGPUMemory).toBeLessThan(10 * 1024 * 1024); // < 10MB
    
    engine.cleanup();
  });
});
