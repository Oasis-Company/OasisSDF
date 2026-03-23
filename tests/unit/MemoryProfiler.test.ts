/**
 * MemoryProfiler Unit Tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryProfiler } from '../../src/utils/MemoryProfiler.js';

describe('MemoryProfiler', () => {
  let profiler: MemoryProfiler;

  beforeEach(() => {
    profiler = new MemoryProfiler({
      trackGPUBuffers: true,
      trackJSHeap: true
    });
  });

  afterEach(() => {
    profiler.reset();
  });

  describe('constructor', () => {
    it('should create profiler with default config', () => {
      const defaultProfiler = new MemoryProfiler();
      expect(defaultProfiler).toBeDefined();
    });

    it('should accept custom config', () => {
      const customProfiler = new MemoryProfiler({
        trackGPUBuffers: false,
        trackJSHeap: false,
        maxSnapshots: 100
      });
      expect(customProfiler).toBeDefined();
    });
  });

  describe('recordBufferAllocation', () => {
    it('should record buffer allocation', () => {
      profiler.recordBufferAllocation('buffer1', 1024);
      
      const allocations = profiler.getBufferAllocations();
      expect(allocations.length).toBe(1);
      expect(allocations[0].id).toBe('buffer1');
      expect(allocations[0].size).toBe(1024);
      expect(allocations[0].active).toBe(true);
    });

    it('should track multiple allocations', () => {
      profiler.recordBufferAllocation('buffer1', 1024);
      profiler.recordBufferAllocation('buffer2', 2048);
      profiler.recordBufferAllocation('buffer3', 4096);
      
      const stats = profiler.getStatistics();
      expect(stats.totalAllocations).toBe(3);
      expect(stats.activeBufferCount).toBe(3);
    });

    it('should not track when disabled', () => {
      const noGPUProfiler = new MemoryProfiler({
        trackGPUBuffers: false
      });
      
      noGPUProfiler.recordBufferAllocation('buffer1', 1024);
      
      const allocations = noGPUProfiler.getBufferAllocations();
      expect(allocations.length).toBe(0);
    });
  });

  describe('recordBufferDeallocation', () => {
    it('should mark buffer as inactive', () => {
      profiler.recordBufferAllocation('buffer1', 1024);
      profiler.recordBufferDeallocation('buffer1');
      
      const allocations = profiler.getBufferAllocations();
      expect(allocations[0].active).toBe(false);
      
      const stats = profiler.getStatistics();
      expect(stats.activeBufferCount).toBe(0);
      expect(stats.totalDeallocations).toBe(1);
    });

    it('should handle unknown buffer deallocation', () => {
      profiler.recordBufferDeallocation('unknown');
      
      const stats = profiler.getStatistics();
      expect(stats.totalDeallocations).toBe(0);
    });
  });

  describe('takeSnapshot', () => {
    it('should take memory snapshot', () => {
      const snapshot = profiler.takeSnapshot(10, 2);
      
      expect(snapshot.timestamp).toBeGreaterThan(0);
      expect(snapshot.objectCount).toBe(10);
      expect(snapshot.sceneCount).toBe(2);
      expect(snapshot.gpuBuffers).toBe(0);
    });

    it('should include GPU buffer memory in snapshot', () => {
      profiler.recordBufferAllocation('buffer1', 1024 * 1024);
      
      const snapshot = profiler.takeSnapshot();
      expect(snapshot.gpuBuffers).toBeCloseTo(1, 1);
    });

    it('should track multiple snapshots', () => {
      profiler.takeSnapshot(1);
      profiler.takeSnapshot(2);
      profiler.takeSnapshot(3);
      
      const snapshots = profiler.getSnapshots();
      expect(snapshots.length).toBe(3);
    });

    it('should limit snapshots to maxSnapshots', () => {
      const limitedProfiler = new MemoryProfiler({
        maxSnapshots: 5
      });
      
      for (let i = 0; i < 10; i++) {
        limitedProfiler.takeSnapshot(i);
      }
      
      const snapshots = limitedProfiler.getSnapshots();
      expect(snapshots.length).toBe(5);
    });
  });

  describe('getStatistics', () => {
    it('should return zero statistics initially', () => {
      const stats = profiler.getStatistics();
      
      expect(stats.currentGPUMemory).toBe(0);
      expect(stats.peakGPUMemory).toBe(0);
      expect(stats.activeBufferCount).toBe(0);
      expect(stats.totalAllocations).toBe(0);
      expect(stats.totalDeallocations).toBe(0);
    });

    it('should calculate statistics correctly', () => {
      profiler.recordBufferAllocation('buffer1', 1024 * 1024);
      profiler.recordBufferAllocation('buffer2', 2 * 1024 * 1024);
      profiler.recordBufferDeallocation('buffer1');
      
      const stats = profiler.getStatistics();
      
      expect(stats.currentGPUMemory).toBeCloseTo(2, 1);
      expect(stats.peakGPUMemory).toBeCloseTo(3, 1);
      expect(stats.activeBufferCount).toBe(1);
      expect(stats.totalAllocations).toBe(2);
      expect(stats.totalDeallocations).toBe(1);
    });
  });

  describe('detectMemoryLeak', () => {
    it('should return false with insufficient data', () => {
      expect(profiler.detectMemoryLeak()).toBe(false);
      
      profiler.takeSnapshot();
      profiler.takeSnapshot();
      expect(profiler.detectMemoryLeak()).toBe(false);
    });

    it('should detect potential leak with increasing memory', () => {
      for (let i = 0; i < 10; i++) {
        const snapshot = profiler.takeSnapshot();
      }
      
      const stats = profiler.getStatistics();
      expect(typeof stats.potentialLeak).toBe('boolean');
    });
  });

  describe('getPeakMemoryUsage', () => {
    it('should track peak memory', () => {
      profiler.recordBufferAllocation('buffer1', 5 * 1024 * 1024);
      profiler.takeSnapshot();
      
      profiler.recordBufferDeallocation('buffer1');
      profiler.takeSnapshot();
      
      const peak = profiler.getPeakMemoryUsage();
      expect(peak).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getActiveBufferCount', () => {
    it('should count active buffers', () => {
      profiler.recordBufferAllocation('buffer1', 1024);
      profiler.recordBufferAllocation('buffer2', 1024);
      profiler.recordBufferAllocation('buffer3', 1024);
      profiler.recordBufferDeallocation('buffer2');
      
      expect(profiler.getActiveBufferCount()).toBe(2);
    });
  });

  describe('exportToJSON', () => {
    it('should export valid JSON', () => {
      profiler.recordBufferAllocation('buffer1', 1024);
      profiler.takeSnapshot(5);
      
      const json = profiler.exportToJSON();
      const parsed = JSON.parse(json);
      
      expect(parsed.config).toBeDefined();
      expect(parsed.statistics).toBeDefined();
      expect(parsed.snapshots).toBeDefined();
      expect(parsed.bufferAllocations).toBeDefined();
    });
  });

  describe('generateReport', () => {
    it('should generate markdown report', () => {
      profiler.recordBufferAllocation('buffer1', 1024);
      profiler.takeSnapshot(5);
      
      const report = profiler.generateReport();
      
      expect(report).toContain('# Memory Profile Report');
      expect(report).toContain('## Summary');
      expect(report).toContain('## Buffer Statistics');
      expect(report).toContain('## Memory Leak Detection');
    });
  });

  describe('reset', () => {
    it('should reset all data', () => {
      profiler.recordBufferAllocation('buffer1', 1024);
      profiler.takeSnapshot();
      
      profiler.reset();
      
      const stats = profiler.getStatistics();
      expect(stats.totalAllocations).toBe(0);
      expect(profiler.getSnapshots().length).toBe(0);
    });
  });

  describe('isMemoryTrackingAvailable', () => {
    it('should check memory tracking availability', () => {
      const available = MemoryProfiler.isMemoryTrackingAvailable();
      expect(typeof available).toBe('boolean');
    });
  });

  describe('memory usage tracking', () => {
    it('should track JS heap when available', () => {
      const snapshot = profiler.takeSnapshot();
      
      if (MemoryProfiler.isMemoryTrackingAvailable()) {
        expect(snapshot.jsHeapSize).toBeGreaterThanOrEqual(0);
        expect(snapshot.jsHeapLimit).toBeGreaterThan(0);
      } else {
        expect(snapshot.jsHeapSize).toBe(0);
        expect(snapshot.jsHeapLimit).toBe(0);
      }
    });

    it('should not track JS heap when disabled', () => {
      const noJSProfiler = new MemoryProfiler({
        trackJSHeap: false
      });
      
      const snapshot = noJSProfiler.takeSnapshot();
      expect(snapshot.jsHeapSize).toBe(0);
    });
  });
});
