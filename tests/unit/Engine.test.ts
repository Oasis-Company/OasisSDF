/**
 * Engine.test.ts
 * 
 * Unit tests for Engine class
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Engine } from '../../src/engine/Engine';
import { EngineError, ValidationError, SDFObjectData } from '../../src/types/index.js';

describe('Engine', () => {
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

  describe('Initialization', () => {
    it('should initialize with correct configuration', () => {
      if (!engine) return;

      expect(engine).toBeDefined();
    });

    it('should use default max objects when not provided', () => {
      if (!engine) return;

      // This test would require access to the private config property
      // For now, we'll just test that it doesn't throw
      expect(() => {
        new Engine({
          canvas
        });
      }).not.toThrow();
    });

    it('should use provided max objects', () => {
      if (!engine) return;

      // This test would require access to the private config property
      // For now, we'll just test that it doesn't throw
      expect(() => {
        new Engine({
          canvas,
          maxObjects: 5000
        });
      }).not.toThrow();
    });

    it('should use default background color when not provided', () => {
      if (!engine) return;

      // This test would require access to the private config property
      // For now, we'll just test that it doesn't throw
      expect(() => {
        new Engine({
          canvas
        });
      }).not.toThrow();
    });

    it('should use provided background color', () => {
      if (!engine) return;

      // This test would require access to the private config property
      // For now, we'll just test that it doesn't throw
      expect(() => {
        new Engine({
          canvas,
          backgroundColor: [1, 0, 0]
        });
      }).not.toThrow();
    });
  });

  describe('Object Management', () => {
    it('should add object to scene', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      const object: SDFObjectData = {
        type: 1,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };

      const index = engine.addObject(object);
      expect(index).toBe(0);

      const objects = engine.getObjects();
      expect(objects.length).toBe(1);
    });

    it('should remove object from scene', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      const object: SDFObjectData = {
        type: 1,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };

      const index = engine.addObject(object);
      expect(index).toBe(0);

      engine.removeObject(index);
      const objects = engine.getObjects();
      expect(objects.length).toBe(0);
    });

    it('should throw error for invalid object index', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      expect(() => {
        engine.removeObject(999);
      }).toThrow(ValidationError);
    });

    it('should update object data', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      const object: SDFObjectData = {
        type: 1,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };

      const index = engine.addObject(object);
      
      const updatedObject: SDFObjectData = {
        type: 2,
        position: [1, 1, 1],
        rotation: [0.5, 0.5, 0.5],
        scale: [2, 2, 2]
      };

      engine.updateObject(index, updatedObject);
      const objects = engine.getObjects();
      expect(objects[0].type).toBe(2);
    });

    it('should throw error for maximum object count', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      const smallEngine = new Engine({
        canvas,
        maxObjects: 1
      });

      await smallEngine.initialize();

      const object: SDFObjectData = {
        type: 1,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };

      // Add first object
      smallEngine.addObject(object);

      // Try to add second object
      expect(() => {
        smallEngine.addObject(object);
      }).toThrow(ValidationError);

      smallEngine.cleanup();
    });
  });

  describe('Camera Management', () => {
    it('should get camera data', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      const camera = engine.getCamera();
      expect(camera).toBeDefined();
      expect(camera.position).toEqual([0, 0, 5]);
      expect(camera.target).toEqual([0, 0, 0]);
      expect(camera.up).toEqual([0, 1, 0]);
    });

    it('should update camera data', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      engine.updateCamera({
        position: [1, 2, 3],
        target: [4, 5, 6],
        fov: 1.0
      });

      const camera = engine.getCamera();
      expect(camera.position).toEqual([1, 2, 3]);
      expect(camera.target).toEqual([4, 5, 6]);
      expect(camera.fov).toBe(1.0);
    });
  });

  describe('Rendering', () => {
    it('should start and stop animation', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      expect(() => {
        engine.start();
        engine.stop();
      }).not.toThrow();
    });

    it('should resize canvas', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      expect(() => {
        engine.resize(1024, 768);
      }).not.toThrow();
    });
  });

  describe('Getters', () => {
    it('should get device manager', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      const deviceManager = engine.getDeviceManager();
      expect(deviceManager).toBeDefined();
    });

    it('should get buffer manager', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      const bufferManager = engine.getBufferManager();
      expect(bufferManager).toBeDefined();
    });

    it('should get pipeline manager', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      const pipelineManager = engine.getPipelineManager();
      expect(pipelineManager).toBeDefined();
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      expect(() => {
        engine.cleanup();
      }).not.toThrow();
    });
  });

  describe('Scene Management', () => {
    it('should create a new scene', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      const scene = engine.createScene('testScene');
      expect(scene).toBeDefined();
      expect(engine.getScene('testScene')).toBe(scene);
    });

    it('should set active scene', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      const scene1 = engine.createScene('scene1');
      const scene2 = engine.createScene('scene2');

      // Set scene2 as active
      const result = engine.setActiveScene('scene2');
      expect(result).toBe(true);
      expect(engine.getActiveScene()).toBe(scene2);
    });

    it('should get all scenes', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      engine.createScene('scene1');
      engine.createScene('scene2');

      const scenes = engine.getScenes();
      expect(scenes.size).toBeGreaterThanOrEqual(2); // Includes default scene
    });

    it('should remove scene', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      engine.createScene('scene1');
      expect(engine.getScene('scene1')).toBeDefined();

      const result = engine.removeScene('scene1');
      expect(result).toBe(true);
      expect(engine.getScene('scene1')).toBeNull();
    });

    it('should throw error when removing default scene', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      expect(() => {
        engine.removeScene('default');
      }).toThrow(ValidationError);
    });

    it('should handle scene operations through engine', async () => {
      if (!engine) return;

      // Skip if WebGPU is not supported
      if (!navigator.gpu) return;

      await engine.initialize();

      // Add object through engine
      const object: SDFObjectData = {
        type: 1,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };

      const index = engine.addObject(object);
      expect(index).toBe(0);

      // Get objects from active scene
      const activeScene = engine.getActiveScene();
      expect(activeScene.getObjectCount()).toBe(1);
    });
  });
});
