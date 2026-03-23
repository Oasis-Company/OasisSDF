/**
 * Engine Lifecycle Integration Tests
 * Tests for initialization, cleanup, and resource management
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Engine } from '../../src/engine/Engine.js';
import { PerformanceProfiler } from '../../src/utils/PerformanceProfiler.js';
import { MemoryProfiler } from '../../src/utils/MemoryProfiler.js';

describe('Engine Lifecycle Integration', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    if (typeof document !== 'undefined') {
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
    }
  });

  describe('Initialization', () => {
    it('should initialize engine successfully', async () => {
      if (!canvas || !navigator.gpu) return;

      const engine = new Engine({ canvas });
      
      try {
        await engine.initialize();
        
        expect(engine.isInitialized()).toBe(true);
        expect(engine.getDevice()).toBeDefined();
        expect(engine.getContext()).toBeDefined();
      } finally {
        engine.cleanup();
      }
    });

    it('should handle multiple initialization calls', async () => {
      if (!canvas || !navigator.gpu) return;

      const engine = new Engine({ canvas });
      
      try {
        await engine.initialize();
        await engine.initialize();
        
        expect(engine.isInitialized()).toBe(true);
      } finally {
        engine.cleanup();
      }
    });

    it('should fail gracefully without WebGPU', async () => {
      if (!canvas) return;
      
      const originalGPU = navigator.gpu;
      (navigator as any).gpu = undefined;

      try {
        const engine = new Engine({ canvas });
        
        await expect(engine.initialize()).rejects.toThrow();
      } finally {
        (navigator as any).gpu = originalGPU;
      }
    });
  });

  describe('Cleanup', () => {
    it('should cleanup resources properly', async () => {
      if (!canvas || !navigator.gpu) return;

      const engine = new Engine({ canvas });
      await engine.initialize();
      
      engine.addObject({
        type: 1,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      });

      engine.cleanup();
      
      expect(engine.isInitialized()).toBe(false);
    });

    it('should handle multiple cleanup calls', async () => {
      if (!canvas || !navigator.gpu) return;

      const engine = new Engine({ canvas });
      await engine.initialize();
      
      engine.cleanup();
      engine.cleanup();
      
      expect(engine.isInitialized()).toBe(false);
    });

    it('should cleanup after render loop', async () => {
      if (!canvas || !navigator.gpu) return;

      const engine = new Engine({ canvas });
      await engine.initialize();
      
      engine.start();
      await new Promise(resolve => setTimeout(resolve, 100));
      engine.stop();
      
      engine.cleanup();
      
      expect(engine.isInitialized()).toBe(false);
    });
  });

  describe('Resource Management', () => {
    it('should manage object lifecycle', async () => {
      if (!canvas || !navigator.gpu) return;

      const engine = new Engine({ canvas, maxObjects: 100 });
      
      try {
        await engine.initialize();
        
        const index1 = engine.addObject({
          type: 1,
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        });
        
        const index2 = engine.addObject({
          type: 1,
          position: [1, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        });
        
        expect(index1).toBe(0);
        expect(index2).toBe(1);
        
        engine.removeObject(index1);
        
      } finally {
        engine.cleanup();
      }
    });

    it('should manage scene lifecycle', async () => {
      if (!canvas || !navigator.gpu) return;

      const engine = new Engine({ canvas });
      
      try {
        await engine.initialize();
        
        const scene1 = engine.createScene('test-scene-1');
        expect(scene1).toBeDefined();
        
        engine.setActiveScene('test-scene-1');
        expect(engine.getActiveScene().name).toBe('test-scene-1');
        
      } finally {
        engine.cleanup();
      }
    });

    it('should handle light management', async () => {
      if (!canvas || !navigator.gpu) return;

      const engine = new Engine({ canvas });
      
      try {
        await engine.initialize();
        
        const scene = engine.getActiveScene();
        const lightIndex = scene.addLight({
          type: 0,
          direction: [-1, -1, -1],
          color: [1, 1, 1],
          intensity: 1.0
        });
        
        expect(lightIndex).toBeGreaterThanOrEqual(0);
        
        scene.removeLight(lightIndex);
        
      } finally {
        engine.cleanup();
      }
    });
  });

  describe('Error Handling', () => {
    it('should handle operations before initialization', () => {
      if (!canvas) return;

      const engine = new Engine({ canvas });
      
      expect(() => engine.render(0.016)).toThrow();
    });

    it('should handle operations after cleanup', async () => {
      if (!canvas || !navigator.gpu) return;

      const engine = new Engine({ canvas });
      await engine.initialize();
      engine.cleanup();
      
      expect(() => engine.render(0.016)).toThrow();
    });

    it('should handle invalid object data', async () => {
      if (!canvas || !navigator.gpu) return;

      const engine = new Engine({ canvas });
      
      try {
        await engine.initialize();
        
        expect(() => {
          engine.addObject({
            type: -1,
            position: [0, 0, 0],
            rotation: [0, 0, 0],
            scale: [0, 0, 0]
          });
        }).not.toThrow();
        
      } finally {
        engine.cleanup();
      }
    });
  });

  describe('Performance During Lifecycle', () => {
    it('should maintain performance during initialization', async () => {
      if (!canvas || !navigator.gpu) return;

      const profiler = new PerformanceProfiler();
      profiler.start();
      
      const engine = new Engine({ canvas });
      await engine.initialize();
      
      profiler.stop();
      
      const stats = profiler.getStatistics();
      expect(stats.avgFrameTime).toBeLessThan(1000);
      
      engine.cleanup();
    });

    it('should maintain performance during cleanup', async () => {
      if (!canvas || !navigator.gpu) return;

      const engine = new Engine({ canvas });
      await engine.initialize();
      
      for (let i = 0; i < 50; i++) {
        engine.addObject({
          type: 1,
          position: [i, 0, 0],
          rotation: [0, 0, 0],
          scale: [0.5, 0.5, 0.5]
        });
      }
      
      const profiler = new PerformanceProfiler();
      profiler.start();
      
      engine.cleanup();
      
      profiler.stop();
      
      const stats = profiler.getStatistics();
      expect(stats.avgFrameTime).toBeLessThan(100);
    });
  });

  describe('Memory During Lifecycle', () => {
    it('should not leak memory during repeated init/cleanup', async () => {
      if (!canvas || !navigator.gpu) return;

      const memoryProfiler = new MemoryProfiler();
      
      for (let i = 0; i < 3; i++) {
        const engine = new Engine({ canvas });
        await engine.initialize();
        
        for (let j = 0; j < 10; j++) {
          engine.addObject({
            type: 1,
            position: [j, 0, 0],
            rotation: [0, 0, 0],
            scale: [0.5, 0.5, 0.5]
          });
        }
        
        engine.cleanup();
        memoryProfiler.takeSnapshot();
      }
      
      const stats = memoryProfiler.getStatistics();
      expect(stats.potentialLeak).toBe(false);
    });
  });
});
