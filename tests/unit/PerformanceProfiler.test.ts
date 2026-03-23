/**
 * PerformanceProfiler Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { PerformanceProfiler, type PerformanceStatistics } from '../../src/utils/PerformanceProfiler.js';

describe('PerformanceProfiler', () => {
  let profiler: PerformanceProfiler;

  beforeEach(() => {
    profiler = new PerformanceProfiler({
      sampleInterval: 100,
      trackMemory: false
    });
  });

  afterEach(() => {
    profiler.stop();
  });

  describe('constructor', () => {
    it('should create profiler with default config', () => {
      const defaultProfiler = new PerformanceProfiler();
      expect(defaultProfiler).toBeDefined();
    });

    it('should accept custom config', () => {
      const customProfiler = new PerformanceProfiler({
        sampleInterval: 500,
        maxMetrics: 1000,
        trackMemory: false
      });
      expect(customProfiler).toBeDefined();
    });
  });

  describe('start/stop', () => {
    it('should start profiling', () => {
      expect(profiler.isActive()).toBe(false);
      profiler.start();
      expect(profiler.isActive()).toBe(true);
    });

    it('should stop profiling', () => {
      profiler.start();
      expect(profiler.isActive()).toBe(true);
      profiler.stop();
      expect(profiler.isActive()).toBe(false);
    });

    it('should not start twice', () => {
      profiler.start();
      profiler.start();
      expect(profiler.isActive()).toBe(true);
    });
  });

  describe('recordFrame', () => {
    it('should not record when not started', () => {
      profiler.recordFrame(0);
      const metrics = profiler.getMetrics();
      expect(metrics.length).toBe(0);
    });

    it('should record frames when started', async () => {
      profiler.start();
      
      for (let i = 0; i < 5; i++) {
        profiler.recordFrame(10);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const metrics = profiler.getMetrics();
      expect(metrics.length).toBe(5);
    });

    it('should track object count', async () => {
      profiler.start();
      
      profiler.recordFrame(5);
      await new Promise(resolve => setTimeout(resolve, 10));
      profiler.recordFrame(10);
      await new Promise(resolve => setTimeout(resolve, 10));
      
      const metrics = profiler.getMetrics();
      expect(metrics[0].objectCount).toBe(5);
      expect(metrics[1].objectCount).toBe(10);
    });

    it('should limit metrics to maxMetrics', async () => {
      const limitedProfiler = new PerformanceProfiler({
        maxMetrics: 5,
        sampleInterval: 10
      });
      
      limitedProfiler.start();
      
      for (let i = 0; i < 10; i++) {
        limitedProfiler.recordFrame(0);
        await new Promise(resolve => setTimeout(resolve, 5));
      }
      
      const metrics = limitedProfiler.getMetrics();
      expect(metrics.length).toBe(5);
    });
  });

  describe('getCurrentFPS', () => {
    it('should return 0 when not started', () => {
      expect(profiler.getCurrentFPS()).toBe(0);
    });

    it('should calculate FPS after sample interval', async () => {
      profiler.start();
      
      for (let i = 0; i < 20; i++) {
        profiler.recordFrame(0);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const fps = profiler.getCurrentFPS();
      expect(fps).toBeGreaterThan(0);
    });
  });

  describe('getCurrentFrameTime', () => {
    it('should return 0 when no frames recorded', () => {
      expect(profiler.getCurrentFrameTime()).toBe(0);
    });

    it('should calculate average frame time', async () => {
      profiler.start();
      
      for (let i = 0; i < 10; i++) {
        profiler.recordFrame(0);
        await new Promise(resolve => setTimeout(resolve, 16));
      }
      
      const frameTime = profiler.getCurrentFrameTime();
      expect(frameTime).toBeGreaterThan(0);
    });
  });

  describe('getStatistics', () => {
    it('should return zero statistics when no metrics', () => {
      const stats = profiler.getStatistics();
      
      expect(stats.avgFPS).toBe(0);
      expect(stats.minFPS).toBe(0);
      expect(stats.maxFPS).toBe(0);
      expect(stats.totalFrames).toBe(0);
    });

    it('should calculate statistics correctly', async () => {
      profiler.start();
      
      for (let i = 0; i < 20; i++) {
        profiler.recordFrame(0);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const stats = profiler.getStatistics();
      
      expect(stats.totalFrames).toBe(20);
      expect(stats.avgFPS).toBeGreaterThanOrEqual(0);
      expect(stats.avgFrameTime).toBeGreaterThan(0);
      expect(stats.duration).toBeGreaterThan(0);
    });
  });

  describe('getAverageFPS', () => {
    it('should return average FPS from statistics', async () => {
      profiler.start();
      
      for (let i = 0; i < 15; i++) {
        profiler.recordFrame(0);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const avgFPS = profiler.getAverageFPS();
      expect(avgFPS).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getAverageFrameTime', () => {
    it('should return average frame time from statistics', async () => {
      profiler.start();
      
      for (let i = 0; i < 10; i++) {
        profiler.recordFrame(0);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const avgFrameTime = profiler.getAverageFrameTime();
      expect(avgFrameTime).toBeGreaterThan(0);
    });
  });

  describe('exportToJSON', () => {
    it('should export valid JSON', async () => {
      profiler.start();
      
      for (let i = 0; i < 5; i++) {
        profiler.recordFrame(0);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const json = profiler.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.config).toBeDefined();
      expect(parsed.statistics).toBeDefined();
      expect(parsed.metrics).toBeDefined();
      expect(Array.isArray(parsed.metrics)).toBe(true);
    });
  });

  describe('exportToCSV', () => {
    it('should export valid CSV', async () => {
      profiler.start();
      
      for (let i = 0; i < 5; i++) {
        profiler.recordFrame(0);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const csv = profiler.exportToCSV();
      const lines = csv.split('\n');
      
      expect(lines[0]).toBe('timestamp,fps,frameTime,memoryUsage,objectCount');
      expect(lines.length).toBe(6);
    });
  });

  describe('generateReport', () => {
    it('should generate markdown report', async () => {
      profiler.start();
      
      for (let i = 0; i < 10; i++) {
        profiler.recordFrame(0);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const report = profiler.generateReport();
      
      expect(report).toContain('# Performance Report');
      expect(report).toContain('## FPS');
      expect(report).toContain('## Frame Time');
      expect(report).toContain('## Memory Usage');
    });
  });

  describe('reset', () => {
    it('should reset all metrics', async () => {
      profiler.start();
      
      for (let i = 0; i < 5; i++) {
        profiler.recordFrame(0);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      expect(profiler.getMetrics().length).toBe(5);
      
      profiler.reset();
      
      expect(profiler.getMetrics().length).toBe(0);
      expect(profiler.getCurrentFPS()).toBe(0);
    });

    it('should keep profiler running after reset', () => {
      profiler.start();
      profiler.reset();
      expect(profiler.isActive()).toBe(true);
    });
  });

  describe('memory tracking', () => {
    it('should track memory when enabled', async () => {
      const memoryProfiler = new PerformanceProfiler({
        trackMemory: true,
        sampleInterval: 10
      });
      
      memoryProfiler.start();
      
      for (let i = 0; i < 5; i++) {
        memoryProfiler.recordFrame(0);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const metrics = memoryProfiler.getMetrics();
      
      expect(metrics[0].memoryUsage).toBeDefined();
      expect(metrics[0].memoryUsage).toBeGreaterThanOrEqual(0);
    });

    it('should not track memory when disabled', async () => {
      const noMemoryProfiler = new PerformanceProfiler({
        trackMemory: false
      });
      
      noMemoryProfiler.start();
      
      for (let i = 0; i < 5; i++) {
        noMemoryProfiler.recordFrame(0);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      const metrics = noMemoryProfiler.getMetrics();
      
      expect(metrics[0].memoryUsage).toBe(0);
    });
  });
});
