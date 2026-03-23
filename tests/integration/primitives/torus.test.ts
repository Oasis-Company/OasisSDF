import { Engine } from '../../../src/engine/Engine.js';
import { Primitives } from '../../../src/objects/Primitives.js';
import { SDFPrimitive } from '../../../src/types/index.js';

describe('Torus Primitive Integration', () => {
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

  it('should render torus primitive', async () => {
    if (!canvas || !navigator.gpu) {
      console.log('WebGPU not available, skipping test');
      return;
    }

    await engine.initialize();

    // Create a torus primitive
    const torus = Primitives.torus(1, 0.3, {
      transform: {
        position: [0, 0, -5]
      }
    });

    // Add torus to scene
    const objectIndex = engine.addObject(torus);
    expect(objectIndex).toBe(0);

    // Render a frame
    expect(() => engine.render(0.016)).not.toThrow();
  });

  it('should render multiple torus primitives', async () => {
    if (!canvas || !navigator.gpu) {
      console.log('WebGPU not available, skipping test');
      return;
    }

    await engine.initialize();

    // Create multiple torus primitives
    for (let i = 0; i < 5; i++) {
      const torus = Primitives.torus(0.5, 0.2, {
        transform: {
          position: [i - 2, 0, -5]
        }
      });
      engine.addObject(torus);
    }

    // Render a frame
    expect(() => engine.render(0.016)).not.toThrow();
  });

  it('should handle torus transformations', async () => {
    if (!canvas || !navigator.gpu) {
      console.log('WebGPU not available, skipping test');
      return;
    }

    await engine.initialize();

    // Create a torus with transformations
    const torus = Primitives.torus(1, 0.3, {
      transform: {
        position: [1, 1, -5],
        rotation: [Math.PI / 4, Math.PI / 4, 0],
        scale: [1.5, 0.5, 1]
      }
    });

    const objectIndex = engine.addObject(torus);
    expect(objectIndex).toBe(0);

    // Render a frame
    expect(() => engine.render(0.016)).not.toThrow();
  });

  it('should handle torus materials', async () => {
    if (!canvas || !navigator.gpu) {
      console.log('WebGPU not available, skipping test');
      return;
    }

    await engine.initialize();

    // Create a torus with material
    const torus = Primitives.torus(1, 0.3, {
      transform: {
        position: [0, 0, -5]
      },
      material: {
        color: [1, 0, 0],
        metallic: 0.8,
        roughness: 0.2
      }
    });

    const objectIndex = engine.addObject(torus);
    expect(objectIndex).toBe(0);

    // Render a frame
    expect(() => engine.render(0.016)).not.toThrow();
  });

  it('should maintain performance with torus primitives', async () => {
    if (!canvas || !navigator.gpu) {
      console.log('WebGPU not available, skipping test');
      return;
    }

    await engine.initialize();

    // Create multiple torus primitives
    const torusCount = 20;
    for (let i = 0; i < torusCount; i++) {
      const angle = (i / torusCount) * Math.PI * 2;
      const torus = Primitives.torus(0.3, 0.1, {
        transform: {
          position: [Math.cos(angle) * 2, Math.sin(angle) * 2, -5]
        }
      });
      engine.addObject(torus);
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
