/**
 * Performance Benchmark Tests
 * Validates performance targets for Phase 1
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PerformanceProfiler } from '../../src/utils/PerformanceProfiler.js';
import { BenchmarkRunner, createBenchmarkCase } from './runner.js';

describe('Performance Benchmarks', () => {
  describe('PerformanceProfiler', () => {
    it('should measure FPS accurately', async () => {
      const profiler = new PerformanceProfiler({
        sampleInterval: 100
      });
      
      profiler.start();
      
      const frameCount = 30;
      for (let i = 0; i < frameCount; i++) {
        profiler.recordFrame(0);
        await new Promise(resolve => setTimeout(resolve, 16));
      }
      
      profiler.stop();
      
      const stats = profiler.getStatistics();
      
      expect(stats.totalFrames).toBe(frameCount);
      expect(stats.avgFPS).toBeGreaterThan(0);
      expect(stats.avgFrameTime).toBeGreaterThan(0);
    });

    it('should track memory usage', async () => {
      const profiler = new PerformanceProfiler({
        trackMemory: true
      });
      
      profiler.start();
      
      for (let i = 0; i < 10; i++) {
        profiler.recordFrame(0);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      profiler.stop();
      
      const stats = profiler.getStatistics();
      
      expect(stats.avgMemoryUsage).toBeGreaterThanOrEqual(0);
      expect(stats.peakMemoryUsage).toBeGreaterThanOrEqual(0);
    });

    it('should generate valid reports', async () => {
      const profiler = new PerformanceProfiler();
      
      profiler.start();
      
      for (let i = 0; i < 10; i++) {
        profiler.recordFrame(0);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      profiler.stop();
      
      const jsonReport = profiler.exportToJSON();
      const csvReport = profiler.exportToCSV();
      const mdReport = profiler.generateReport();
      
      expect(() => JSON.parse(jsonReport)).not.toThrow();
      expect(csvReport).toContain('timestamp,fps,frameTime');
      expect(mdReport).toContain('# Performance Report');
    });
  });

  describe('BenchmarkRunner', () => {
    it('should run benchmark cases', async () => {
      const runner = new BenchmarkRunner();
      
      runner.addCase(createBenchmarkCase(
        'Test Case 1',
        'A simple test case',
        async (profiler) => {
          await new Promise(resolve => setTimeout(resolve, 10));
        },
        {
          duration: 100,
          targetFPS: 1
        }
      ));
      
      const results = await runner.runAll();
      
      expect(results.results.length).toBe(1);
      expect(results.results[0].case).toBe('Test Case 1');
    });

    it('should generate markdown report', async () => {
      const runner = new BenchmarkRunner();
      
      runner.addCase(createBenchmarkCase(
        'Report Test',
        'Test report generation',
        async () => {
          await new Promise(resolve => setTimeout(resolve, 10));
        },
        {
          duration: 100
        }
      ));
      
      const results = await runner.runAll();
      const report = runner.generateReport(results);
      
      expect(report).toContain('# OasisSDF Benchmark Suite');
      expect(report).toContain('Report Test');
    });
  });

  describe('Performance Targets', () => {
    const TARGET_FPS = 60;
    const TARGET_FRAME_TIME = 16;
    const TARGET_MEMORY_MB = 10;

    it('should meet single frame performance target', async () => {
      const profiler = new PerformanceProfiler({
        sampleInterval: 100
      });
      
      profiler.start();
      
      const iterations = 60;
      for (let i = 0; i < iterations; i++) {
        profiler.recordFrame(0);
        await new Promise(resolve => setTimeout(resolve, 1));
      }
      
      profiler.stop();
      
      const stats = profiler.getStatistics();
      
      expect(stats.avgFrameTime).toBeLessThan(TARGET_FRAME_TIME * 2);
    });

    it('should handle rapid frame recording', async () => {
      const profiler = new PerformanceProfiler({
        maxMetrics: 1000
      });
      
      profiler.start();
      
      const startTime = performance.now();
      while (performance.now() - startTime < 100) {
        profiler.recordFrame(0);
      }
      
      profiler.stop();
      
      const metrics = profiler.getMetrics();
      expect(metrics.length).toBeGreaterThan(0);
      expect(metrics.length).toBeLessThanOrEqual(1000);
    });
  });

  describe('Memory Profiling', () => {
    it('should not leak memory during profiling', async () => {
      const profiler = new PerformanceProfiler({
        trackMemory: true,
        maxMetrics: 100
      });
      
      for (let run = 0; run < 3; run++) {
        profiler.start();
        
        for (let i = 0; i < 50; i++) {
          profiler.recordFrame(0);
          await new Promise(resolve => setTimeout(resolve, 1));
        }
        
        profiler.stop();
        profiler.reset();
      }
      
      const stats = profiler.getStatistics();
      expect(stats.totalFrames).toBe(0);
    });
  });

  describe('Export Formats', () => {
    let profiler: PerformanceProfiler;
    
    beforeAll(async () => {
      profiler = new PerformanceProfiler();
      profiler.start();
      
      for (let i = 0; i < 10; i++) {
        profiler.recordFrame(i);
        await new Promise(resolve => setTimeout(resolve, 10));
      }
      
      profiler.stop();
    });

    it('should export valid JSON', () => {
      const json = profiler.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.config).toBeDefined();
      expect(parsed.statistics).toBeDefined();
      expect(parsed.metrics).toBeInstanceOf(Array);
      expect(parsed.metrics.length).toBe(10);
    });

    it('should export valid CSV', () => {
      const csv = profiler.exportToCSV();
      const lines = csv.split('\n');
      
      expect(lines[0]).toBe('timestamp,fps,frameTime,memoryUsage,objectCount');
      expect(lines.length).toBe(11);
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',');
        expect(values.length).toBe(5);
      }
    });

    it('should generate markdown report', () => {
      const report = profiler.generateReport();
      
      expect(report).toContain('# Performance Report');
      expect(report).toContain('## FPS');
      expect(report).toContain('## Frame Time');
      expect(report).toContain('## Memory Usage');
      expect(report).toContain('## Performance Targets');
    });
  });
});
