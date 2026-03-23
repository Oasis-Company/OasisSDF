/**
 * Memory Stress Tests
 * Tests for memory stability and leak detection
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { MemoryProfiler } from '../../src/utils/MemoryProfiler.js';

describe('Memory Stress Tests', () => {
  let profiler: MemoryProfiler;

  beforeEach(() => {
    profiler = new MemoryProfiler({
      trackGPUBuffers: true,
      trackJSHeap: true,
      maxSnapshots: 100
    });
  });

  afterEach(() => {
    profiler.reset();
  });

  describe('Buffer Allocation Stress', () => {
    it('should handle many buffer allocations', () => {
      const count = 1000;
      
      for (let i = 0; i < count; i++) {
        profiler.recordBufferAllocation(`buffer-${i}`, 1024);
      }
      
      const stats = profiler.getStatistics();
      expect(stats.totalAllocations).toBe(count);
      expect(stats.activeBufferCount).toBe(count);
    });

    it('should handle rapid allocations and deallocations', () => {
      const iterations = 100;
      
      for (let i = 0; i < iterations; i++) {
        profiler.recordBufferAllocation(`buffer-${i}`, 1024);
        profiler.recordBufferDeallocation(`buffer-${i}`);
      }
      
      const stats = profiler.getStatistics();
      expect(stats.totalAllocations).toBe(iterations);
      expect(stats.totalDeallocations).toBe(iterations);
      expect(stats.activeBufferCount).toBe(0);
    });

    it('should handle large buffer allocations', () => {
      const largeSize = 10 * 1024 * 1024;
      
      profiler.recordBufferAllocation('large-buffer', largeSize);
      
      const stats = profiler.getStatistics();
      expect(stats.currentGPUMemory).toBeCloseTo(10, 1);
    });
  });

  describe('Memory Leak Detection', () => {
    it('should not detect leak with stable memory', () => {
      for (let i = 0; i < 10; i++) {
        profiler.takeSnapshot(10);
      }
      
      const stats = profiler.getStatistics();
      expect(stats.potentialLeak).toBe(false);
    });

    it('should handle allocation patterns correctly', () => {
      for (let round = 0; round < 5; round++) {
        for (let i = 0; i < 10; i++) {
          profiler.recordBufferAllocation(`buffer-${round}-${i}`, 1024);
        }
        
        profiler.takeSnapshot(round * 10);
        
        for (let i = 0; i < 10; i++) {
          profiler.recordBufferDeallocation(`buffer-${round}-${i}`);
        }
      }
      
      const stats = profiler.getStatistics();
      expect(stats.activeBufferCount).toBe(0);
    });
  });

  describe('Snapshot Management', () => {
    it('should manage snapshot limit correctly', () => {
      const maxSnapshots = 10;
      const limitedProfiler = new MemoryProfiler({
        maxSnapshots
      });
      
      for (let i = 0; i < 20; i++) {
        limitedProfiler.takeSnapshot(i);
      }
      
      const snapshots = limitedProfiler.getSnapshots();
      expect(snapshots.length).toBe(maxSnapshots);
    });

    it('should maintain snapshot order', () => {
      for (let i = 0; i < 5; i++) {
        profiler.takeSnapshot(i);
      }
      
      const snapshots = profiler.getSnapshots();
      for (let i = 0; i < snapshots.length; i++) {
        expect(snapshots[i].objectCount).toBe(i);
      }
    });
  });

  describe('Memory Statistics', () => {
    it('should track peak memory correctly', () => {
      profiler.recordBufferAllocation('buffer1', 5 * 1024 * 1024);
      profiler.takeSnapshot();
      
      profiler.recordBufferAllocation('buffer2', 3 * 1024 * 1024);
      profiler.takeSnapshot();
      
      profiler.recordBufferDeallocation('buffer1');
      profiler.takeSnapshot();
      
      const stats = profiler.getStatistics();
      expect(stats.peakGPUMemory).toBeCloseTo(8, 1);
      expect(stats.currentGPUMemory).toBeCloseTo(3, 1);
    });

    it('should calculate allocation/deallocation ratios', () => {
      for (let i = 0; i < 20; i++) {
        profiler.recordBufferAllocation(`buffer-${i}`, 1024);
      }
      
      for (let i = 0; i < 15; i++) {
        profiler.recordBufferDeallocation(`buffer-${i}`);
      }
      
      const stats = profiler.getStatistics();
      expect(stats.totalAllocations).toBe(20);
      expect(stats.totalDeallocations).toBe(15);
      expect(stats.activeBufferCount).toBe(5);
    });
  });

  describe('Export and Reporting', () => {
    it('should export complete memory data', () => {
      profiler.recordBufferAllocation('buffer1', 1024);
      profiler.recordBufferAllocation('buffer2', 2048);
      profiler.takeSnapshot(5);
      
      const json = profiler.exportToJSON();
      const data = JSON.parse(json);
      
      expect(data.bufferAllocations.length).toBe(2);
      expect(data.snapshots.length).toBe(1);
      expect(data.statistics).toBeDefined();
    });

    it('should generate readable report', () => {
      profiler.recordBufferAllocation('buffer1', 1024 * 1024);
      profiler.takeSnapshot(10);
      
      const report = profiler.generateReport();
      
      expect(report).toContain('Current GPU Memory');
      expect(report).toContain('Peak GPU Memory');
      expect(report).toContain('Active Buffers');
      expect(report).toContain('Memory Leak Detection');
    });
  });

  describe('Long-running Stability', () => {
    it('should maintain stability over many operations', async () => {
      const operations = 500;
      
      for (let i = 0; i < operations; i++) {
        const id = `buffer-${i}`;
        profiler.recordBufferAllocation(id, 1024);
        
        if (i % 3 === 0) {
          profiler.recordBufferDeallocation(id);
        }
        
        if (i % 50 === 0) {
          profiler.takeSnapshot(i);
        }
      }
      
      const stats = profiler.getStatistics();
      expect(stats.totalAllocations).toBe(operations);
      expect(profiler.getSnapshots().length).toBeGreaterThan(0);
    });
  });
});
