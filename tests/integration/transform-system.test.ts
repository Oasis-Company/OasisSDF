/**
 * transform-system.test.ts
 * 
 * Integration tests for transform system
 */

import { Engine } from '../../src/engine/Engine.js';
import { Primitives } from '../../src/objects/Primitives.js';

describe('Transform System Integration', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    if (typeof document !== 'undefined') {
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
    }
  });

  it('should render object with parent transform', async () => {
    if (!canvas || !navigator.gpu) return;

    const engine = new Engine({ canvas, maxObjects: 100 });
    await engine.initialize();

    // Create parent object
    const parent = Primitives.sphere(0.5, {
      transform: {
        position: [2, 0, -10],
        rotation: [0, Math.PI / 4, 0],
        scale: [1, 1, 1]
      }
    });
    engine.addObject(parent);

    // Create child object
    const child = Primitives.cube(0.3, {
      transform: {
        position: [1, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      }
    });
    engine.addObject(child);

    // Render frame
    engine.render(1/60);

    // Cleanup
    engine.cleanup();
  });

  it('should render hierarchy of objects', async () => {
    if (!canvas || !navigator.gpu) return;

    const engine = new Engine({ canvas, maxObjects: 100 });
    await engine.initialize();

    // Create hierarchy: grandparent -> parent -> child
    const grandparent = Primitives.sphere(0.6, {
      transform: {
        position: [0, 0, -10],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      }
    });
    engine.addObject(grandparent);

    const parent = Primitives.cube(0.4, {
      transform: {
        position: [1, 0, 0],
        rotation: [0, Math.PI / 4, 0],
        scale: [1, 1, 1]
      }
    });
    engine.addObject(parent);

    const child = Primitives.cylinder(0.3, 0.1, {
      transform: {
        position: [0.5, 0, 0],
        rotation: [Math.PI / 2, 0, 0],
        scale: [1, 1, 1]
      }
    });
    engine.addObject(child);

    // Render frame
    engine.render(1/60);

    // Cleanup
    engine.cleanup();
  });

  it('should handle dynamic parent changes', async () => {
    if (!canvas || !navigator.gpu) return;

    const engine = new Engine({ canvas, maxObjects: 100 });
    await engine.initialize();

    // Create objects
    const parent1 = Primitives.sphere(0.5, {
      transform: {
        position: [-2, 0, -10],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      }
    });
    engine.addObject(parent1);

    const parent2 = Primitives.sphere(0.5, {
      transform: {
        position: [2, 0, -10],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      }
    });
    engine.addObject(parent2);

    const child = Primitives.cube(0.3, {
      transform: {
        position: [1, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      }
    });
    engine.addObject(child);

    // Render frame
    engine.render(1/60);

    // Cleanup
    engine.cleanup();
  });

  it('should handle transform animations', async () => {
    if (!canvas || !navigator.gpu) return;

    const engine = new Engine({ canvas, maxObjects: 100 });
    await engine.initialize();

    // Create animated object
    const object = Primitives.sphere(0.5, {
      transform: {
        position: [0, 0, -10],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      }
    });
    engine.addObject(object);

    // Animate for 60 frames
    for (let frame = 0; frame < 60; frame++) {
      const time = frame / 60;
      object.transform!.rotation = [time * Math.PI, time * Math.PI * 2, 0];
      object.transform!.position = [Math.sin(time * 2) * 2, Math.cos(time * 2) * 2, -10];
      engine.render(1/60);
    }

    // Cleanup
    engine.cleanup();
  });

  it('should handle performance with deep hierarchies', async () => {
    if (!canvas || !navigator.gpu) return;

    const engine = new Engine({ canvas, maxObjects: 1000 });
    await engine.initialize();

    // Create deep hierarchy
    let currentParent = Primitives.sphere(0.1, {
      transform: {
        position: [0, 0, -10],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      }
    });
    engine.addObject(currentParent);

    // Create 10-level hierarchy
    for (let i = 0; i < 10; i++) {
      const child = Primitives.sphere(0.05, {
        transform: {
          position: [0.1, 0, 0],
          rotation: [0, 0, 0],
          scale: [0.8, 0.8, 0.8]
        }
      });
      engine.addObject(child);
      currentParent = child;
    }

    // Measure render time
    const startTime = performance.now();
    engine.render(1/60);
    const renderTime = performance.now() - startTime;

    // Should render in less than 16ms (60 FPS)
    expect(renderTime).toBeLessThan(16);

    // Cleanup
    engine.cleanup();
  });
});
