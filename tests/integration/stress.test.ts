/**
 * Stress Tests
 * Tests for high-load scenarios and stability
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Engine } from '../../src/engine/Engine.js';
import { PerformanceProfiler } from '../../src/utils/PerformanceProfiler.js';
import { MemoryProfiler } from '../../src/utils/MemoryProfiler.js';

describe('Stress Tests', () => {
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    if (typeof document !== 'undefined') {
      canvas = document.createElement('canvas');
      canvas.width = 800;
      canvas.height = 600;
    }
  });

  describe('Object Count Stress', () => {
    it('should handle 100 objects', async () => {
      if (!canvas || !navigator.gpu) return;

      const engine = new Engine({ canvas, maxObjects: 200 });
      
      try {
        await engine.initialize();
        
        for (let i = 0; i < 100; i++) {
          engine.addObject({
            type: 1,
            position: [
              (Math.random() - 0.5) * 10,
              (Math.random() - 0.5) * 10,
              (Math.random() - 0.5) * 10
            ],
            rotation: [0, 0, 0],
            scale: [0.2, 0.2, 0.2]
          });
        }
        
        const profiler = new PerformanceProfiler();
        profiler.start();
        
        for (let frame = 0; frame < 30; frame++) {
          engine.render(0.016);
          profiler.recordFrame(100);
        }
        
        profiler.stop();
        
        const stats = profiler.getStatistics();
        expect(stats.totalFrames).toBe(30);
        
      } finally {
        engine.cleanup();
      }
    });

    it('should handle 500 objects', async () => {
      if (!canvas || !navigator.gpu) return;

      const engine = new Engine({ canvas, maxObjects: 1000 });
      
      try {
        await engine.initialize();
        
        for (let i = 0; i < 500; i++) {
          engine.addObject({
            type: 1,
            position: [
              (Math.random() - 0.5) * 20,
              (Math.random() - 0.5) * 20,
              (Math.random() - 0.5) * 20
            ],
            rotation: [0, 0, 0],
            scale: [0.1, 0.1, 0.1]
          });
        }
        
        const profiler = new PerformanceProfiler();
        profiler.start();
        
        for (let frame = 0; frame < 30; frame++) {
          engine.render(0.016);
          profiler.recordFrame(500);
        }
        
        profiler.stop();
        
        const stats = profiler.getStatistics();
        expect(stats.totalFrames).toBe(30);
        
      } finally {
        engine.cleanup();
      }
    }, 30000);
  });

  describe('Scene Switching Stress', () => {
    it('should handle rapid scene switching', async () => {
      if (!canvas || !navigator.gpu) return;

      const engine = new Engine({ canvas });
      
      try {
        await engine.initialize();
        
        const scenes = ['scene1', 'scene2', 'scene3'];
        
        for (const name of scenes) {
          engine.createScene(name);
        }
        
        for (let i = 0; i < 20; i++) {
          const sceneName = scenes[i % scenes.length];
          engine.setActiveScene(sceneName);
          
          const scene = engine.getActiveScene();
          scene.addObject({
            type: 1,
            position: [i, 0, 0],
            rotation: [0, 0, 0],
            scale: [0.5, 0.5, 0.5]
          });
        }
        
        expect(engine.getActiveScene()).toBeDefined();
        
      } finally {
        engine.cleanup();
      }
    });

    it('should handle scene creation and destruction', async () => {
      if (!canvas || !navigator.gpu) return;

      const engine = new Engine({ canvas });
      
      try {
        await engine.initialize();
        
        for (let round = 0; round < 5; round++) {
          for (let i = 0; i < 5; i++) {
            const name = `temp-scene-${round}-${i}`;
            engine.createScene(name);
          }
          
          engine.setActiveScene('default');
        }
        
        const scenes = engine.getAllScenes();
        expect(scenes.length).toBeGreaterThan(0);
        
      } finally {
        engine.cleanup();
      }
    });
  });

  describe('Render Loop Stress', () => {
    it('should handle continuous rendering', async () => {
      if (!canvas || !navigator.gpu) return;

      const engine = new Engine({ canvas });
      
      try {
        await engine.initialize();
        
        engine.addObject({
          type: 1,
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        });
        
        const profiler = new PerformanceProfiler();
        profiler.start();
        
        const frameCount = 100;
        for (let i = 0; i < frameCount; i++) {
          engine.render(0.016);
          profiler.recordFrame(1);
        }
        
        profiler.stop();
        
        const stats = profiler.getStatistics();
        expect(stats.totalFrames).toBe(frameCount);
        
      } finally {
        engine.cleanup();
      }
    });

    it('should handle start/stop cycles', async () => {
      if (!canvas || !navigator.gpu) return;

      const engine = new Engine({ canvas });
      
      try {
        await engine.initialize();
        
        for (let cycle = 0; cycle < 5; cycle++) {
          engine.start();
          await new Promise(resolve => setTimeout(resolve, 50));
          engine.stop();
          await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        expect(engine.isInitialized()).toBe(true);
        
      } finally {
        engine.cleanup();
      }
    });
  });

  describe('Memory Stress', () => {
    it('should handle memory under load', async () => {
      if (!canvas || !navigator.gpu) return;

      const memoryProfiler = new MemoryProfiler();
      const engine = new Engine({ canvas, maxObjects: 500 });
      
      try {
        await engine.initialize();
        
        for (let round = 0; round < 3; round++) {
          for (let i = 0; i < 100; i++) {
            engine.addObject({
              type: 1,
              position: [i, round, 0],
              rotation: [0, 0, 0],
              scale: [0.3, 0.3, 0.3]
            });
          }
          
          engine.render(0.016);
          memoryProfiler.takeSnapshot(100 * (round + 1));
        }
        
        const stats = memoryProfiler.getStatistics();
        expect(stats.potentialLeak).toBe(false);
        
      } finally {
        engine.cleanup();
      }
    });

    it('should maintain stability with object churn', async () => {
      if (!canvas || !navigator.gpu) return;

      const engine = new Engine({ canvas, maxObjects: 100 });
      
      try {
        await engine.initialize();
        
        for (let round = 0; round < 10; round++) {
          const indices: number[] = [];
          
          for (let i = 0; i < 50; i++) {
            const index = engine.addObject({
              type: 1,
              position: [i, round, 0],
              rotation: [0, 0, 0],
              scale: [0.2, 0.2, 0.2]
            });
            indices.push(index);
          }
          
          engine.render(0.016);
          
          for (const index of indices) {
            engine.removeObject(index);
          }
        }
        
        expect(engine.isInitialized()).toBe(true);
        
      } finally {
        engine.cleanup();
      }
    });
  });

  describe('Long Running Stability', () => {
    it('should remain stable over extended operation', async () => {
      if (!canvas || !navigator.gpu) return;

      const engine = new Engine({ canvas });
      const profiler = new PerformanceProfiler();
      
      try {
        await engine.initialize();
        
        engine.addObject({
          type: 1,
          position: [0, 0, 0],
          rotation: [0, 0, 0],
          scale: [1, 1, 1]
        });
        
        profiler.start();
        
        const duration = 2000;
        const startTime = performance.now();
        
        while (performance.now() - startTime < duration) {
          engine.render(0.016);
          profiler.recordFrame(1);
        }
        
        profiler.stop();
        
        const stats = profiler.getStatistics();
        expect(stats.totalFrames).toBeGreaterThan(60);
        
      } finally {
        engine.cleanup();
      }
    }, 10000);
  });
});
