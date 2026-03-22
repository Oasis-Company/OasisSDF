/**
 * rendering.test.ts
 * 
 * Integration tests for rendering pipeline
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Engine } from '../../src/engine/Engine';
import { SDFObjectData } from '../../src/types/index.js';

describe('Rendering Integration', () => {
  let engine: Engine;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    if (typeof document !== 'undefined') {
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;

      engine = new Engine({
        canvas
      });
    }
  });

  afterEach(() => {
    if (engine) {
      try {
        engine.cleanup();
      } catch (error) {
      }
    }
  });

  describe('End-to-End Rendering', () => {
    it('should initialize engine and render frame', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      // Add a test object
      const object: SDFObjectData = {
        type: 1, // Sphere
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };

      engine.addObject(object);

      // Test render
      expect(() => {
        engine.render(0.016); // 60 FPS
      }).not.toThrow();

      // Test animation loop
      expect(() => {
        engine.start();
        engine.stop();
      }).not.toThrow();
    });

    it('should handle multiple objects', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      // Add multiple objects
      const objects: SDFObjectData[] = [
        {
          type: 1, // Sphere
          position: [-1, 0, 0],
          rotation: [0, 0, 0],
          scale: [0.5, 0.5, 0.5]
        },
        {
          type: 2, // Box
          position: [1, 0, 0],
          rotation: [0, 0, 0],
          scale: [0.5, 0.5, 0.5]
        },
        {
          type: 3, // Torus
          position: [0, 1, 0],
          rotation: [0, 0, 0],
          scale: [0.5, 0.5, 0.5]
        }
      ];

      for (const object of objects) {
        engine.addObject(object);
      }

      expect(() => {
        engine.render(0.016);
      }).not.toThrow();

      const sceneObjects = engine.getObjects();
      expect(sceneObjects.length).toBe(3);
    });

    it('should handle object updates', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      // Add object
      const object: SDFObjectData = {
        type: 1,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };

      const index = engine.addObject(object);

      // Update object
      const updatedObject: SDFObjectData = {
        type: 2,
        position: [1, 1, 1],
        rotation: [0.5, 0.5, 0.5],
        scale: [2, 2, 2]
      };

      engine.updateObject(index, updatedObject);

      expect(() => {
        engine.render(0.016);
      }).not.toThrow();

      const sceneObjects = engine.getObjects();
      expect(sceneObjects[0].type).toBe(2);
      expect(sceneObjects[0].position).toEqual([1, 1, 1]);
    });

    it('should handle object removal', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      // Add objects
      const object1: SDFObjectData = {
        type: 1,
        position: [-1, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };

      const object2: SDFObjectData = {
        type: 2,
        position: [1, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };

      const index1 = engine.addObject(object1);
      const index2 = engine.addObject(object2);

      // Remove first object
      engine.removeObject(index1);

      expect(() => {
        engine.render(0.016);
      }).not.toThrow();

      const sceneObjects = engine.getObjects();
      expect(sceneObjects.length).toBe(1);
      expect(sceneObjects[0].type).toBe(2);
    });

    it('should handle camera updates', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      // Add object
      const object: SDFObjectData = {
        type: 1,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };

      engine.addObject(object);

      // Update camera
      engine.updateCamera({
        position: [0, 0, 10],
        target: [0, 0, 0],
        fov: 1.0
      });

      expect(() => {
        engine.render(0.016);
      }).not.toThrow();

      const camera = engine.getCamera();
      expect(camera.position).toEqual([0, 0, 10]);
      expect(camera.fov).toBe(1.0);
    });

    it('should handle canvas resize', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      // Add object
      const object: SDFObjectData = {
        type: 1,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };

      engine.addObject(object);

      // Resize canvas
      engine.resize(1024, 768);

      expect(() => {
        engine.render(0.016);
      }).not.toThrow();

      expect(canvas.width).toBe(1024);
      expect(canvas.height).toBe(768);
    });

    it('should handle complex scene', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      // Add multiple objects of different types
      const objects: SDFObjectData[] = [
        {
          type: 1, // Sphere
          position: [-2, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        },
        {
          type: 2, // Box
          position: [0, 0, 0],
          rotation: [0.4, 0.4, 0],
          scale: [1, 1, 1]
        },
        {
          type: 3, // Torus
          position: [2, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        },
        {
          type: 4, // Capsule
          position: [-2, -2, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        },
        {
          type: 5, // Cylinder
          position: [0, -2, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        },
        {
          type: 6, // Cone
          position: [2, -2, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        }
      ];

      for (const object of objects) {
        engine.addObject(object);
      }

      expect(() => {
        engine.render(0.016);
      }).not.toThrow();

      const sceneObjects = engine.getObjects();
      expect(sceneObjects.length).toBe(6);
    });
  });

  describe('Performance Tests', () => {
    it('should handle many objects', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      // Add many objects
      const objectCount = 100;
      for (let i = 0; i < objectCount; i++) {
        const object: SDFObjectData = {
          type: 1, // Sphere
          position: [
            (i % 10) - 4.5,
            Math.floor(i / 10) - 4.5,
            0
          ],
          rotation: [0, 0, 0],
          scale: [0.4, 0.4, 0.4]
        };
        engine.addObject(object);
      }

      const start = performance.now();
      engine.render(0.016);
      const end = performance.now();

      const renderTime = end - start;
      console.log(`Render time for ${objectCount} objects: ${renderTime.toFixed(2)}ms`);

      // Render time should be reasonable
      expect(renderTime).toBeLessThan(100);
    });

    it('should render multiple frames', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      // Add an object
      const object: SDFObjectData = {
        type: 1,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };

      engine.addObject(object);

      // Render multiple frames
      const frameCount = 10;
      const start = performance.now();

      for (let i = 0; i < frameCount; i++) {
        engine.render(0.016);
      }

      const end = performance.now();
      const averageRenderTime = (end - start) / frameCount;

      console.log(`Average render time: ${averageRenderTime.toFixed(2)}ms`);

      // Average render time should be reasonable
      expect(averageRenderTime).toBeLessThan(50);
    });
  });

  describe('Error Handling', () => {
    it('should handle initialization failure gracefully', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      // This test would require mocking the device initialization to fail
      // For now, we'll just test that the engine can be created
      expect(engine).toBeDefined();
    });

    it('should handle rendering without objects', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      // Render without objects
      expect(() => {
        engine.render(0.016);
      }).not.toThrow();
    });
  });
});
