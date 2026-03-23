import { Engine } from '../../../src/engine/Engine.js';
import { Primitives } from '../../../src/objects/Primitives.js';
import { SDFPrimitive } from '../../../src/types/index.js';

describe('Capsule Primitive Integration', () => {
  let canvas: HTMLCanvasElement;
  let engine: Engine;

  beforeAll(() => {
    // Create a canvas element
    canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 768;
    document.body.appendChild(canvas);
  });

  afterAll(() => {
    // Clean up
    if (canvas && canvas.parentNode) {
      canvas.parentNode.removeChild(canvas);
    }
    if (engine) {
      engine.cleanup();
    }
  });

  beforeEach(() => {
    // Create a new engine instance before each test
    engine = new Engine({ canvas });
  });

  afterEach(() => {
    // Clean up engine after each test
    if (engine) {
      engine.cleanup();
    }
  });

  it('should render capsule primitive', async () => {
    if (!canvas || !navigator.gpu) {
      console.log('WebGPU not available, skipping test');
      return;
    }

    await engine.initialize();

    // Create a capsule primitive
    const capsule = Primitives.capsule(1, 0.3, {
      transform: {
        position: [0, 0, -5]
      }
    });

    // Add capsule to scene
    const objectIndex = engine.addObject(capsule);
    expect(objectIndex).toBe(0);

    // Render a frame
    expect(() => engine.render(0.016)).not.toThrow();
  });

  it('should render multiple capsule primitives', async () => {
    if (!canvas || !navigator.gpu) {
      console.log('WebGPU not available, skipping test');
      return;
    }

    await engine.initialize();

    // Create multiple capsule primitives
    for (let i = 0; i < 5; i++) {
      const capsule = Primitives.capsule(0.8, 0.2, {
        transform: {
          position: [i - 2, 0, -5]
        }
      });
      engine.addObject(capsule);
    }

    // Render a frame
    expect(() => engine.render(0.016)).not.toThrow();
  });

  it('should handle capsule transformations', async () => {
    if (!canvas || !navigator.gpu) {
      console.log('WebGPU not available, skipping test');
      return;
    }

    await engine.initialize();

    // Create a capsule with transformations
    const capsule = Primitives.capsule(1.5, 0.4, {
      transform: {
        position: [1, 1, -5],
        rotation: [Math.PI / 4, Math.PI / 4, 0],
        scale: [0.5, 1.2, 0.5]
      }
    });

    const objectIndex = engine.addObject(capsule);
    expect(objectIndex).toBe(0);

    // Render a frame
    expect(() => engine.render(0.016)).not.toThrow();
  });

  it('should handle capsule materials', async () => {
    if (!canvas || !navigator.gpu) {
      console.log('WebGPU not available, skipping test');
      return;
    }

    await engine.initialize();

    // Create a capsule with material
    const capsule = Primitives.capsule(1, 0.3, {
      transform: {
        position: [0, 0, -5]
      },
      material: {
        color: [0, 1, 0],
        metallic: 0.6,
        roughness: 0.4
      }
    });

    const objectIndex = engine.addObject(capsule);
    expect(objectIndex).toBe(0);

    // Render a frame
    expect(() => engine.render(0.016)).not.toThrow();
  });

  it('should maintain performance with capsule primitives', async () => {
    if (!canvas || !navigator.gpu) {
      console.log('WebGPU not available, skipping test');
      return;
    }

    await engine.initialize();

    // Create multiple capsule primitives
    const capsuleCount = 20;
    for (let i = 0; i < capsuleCount; i++) {
      const angle = (i / capsuleCount) * Math.PI * 2;
      const capsule = Primitives.capsule(0.5, 0.15, {
        transform: {
          position: [Math.cos(angle) * 2, Math.sin(angle) * 2, -5],
          rotation: [angle, angle, 0]
        }
      });
      engine.addObject(capsule);
    }

    // Measure rendering time
    const startTime = performance.now();
    engine.render(0.016);
    const endTime = performance.now();
    const renderTime = endTime - startTime;

    // Render time should be reasonable
    expect(renderTime).toBeLessThan(16); // Less than 60 FPS threshold
  });
});
