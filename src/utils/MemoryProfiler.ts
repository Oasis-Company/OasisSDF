/**
 * Memory Snapshot Interface
 * Captures memory state at a point in time
 */
export interface MemorySnapshot {
  /** Timestamp of snapshot */
  timestamp: number;
  /** Total GPU buffer size in MB */
  gpuBuffers: number;
  /** Number of objects in scene */
  objectCount: number;
  /** Number of scenes */
  sceneCount: number;
  /** JavaScript heap size in MB */
  jsHeapSize: number;
  /** JavaScript heap limit in MB */
  jsHeapLimit: number;
}

/**
 * Buffer Allocation Record
 */
export interface BufferAllocation {
  /** Buffer identifier */
  id: string;
  /** Buffer size in bytes */
  size: number;
  /** Buffer usage flags */
  usage: number;
  /** Creation timestamp */
  createdAt: number;
  /** Whether buffer is still active */
  active: boolean;
}

/**
 * Memory Profiler Configuration
 */
export interface MemoryProfilerConfig {
  /** Enable GPU buffer tracking */
  trackGPUBuffers?: boolean;
  /** Enable JS heap tracking */
  trackJSHeap?: boolean;
  /** Snapshot interval in ms (for automatic snapshots) */
  snapshotInterval?: number;
  /** Maximum snapshots to keep */
  maxSnapshots?: number;
}

/**
 * Memory Statistics
 */
export interface MemoryStatistics {
  /** Current total GPU memory in MB */
  currentGPUMemory: number;
  /** Peak GPU memory in MB */
  peakGPUMemory: number;
  /** Current JS heap size in MB */
  currentJSHeap: number;
  /** Peak JS heap size in MB */
  peakJSHeap: number;
  /** Number of active buffers */
  activeBufferCount: number;
  /** Total buffer allocations */
  totalAllocations: number;
  /** Total buffer deallocations */
  totalDeallocations: number;
  /** Potential memory leak detected */
  potentialLeak: boolean;
}

/**
 * Memory Profiler Class
 * Tracks GPU buffer usage and memory allocation patterns
 */
export class MemoryProfiler {
  private snapshots: MemorySnapshot[] = [];
  private bufferAllocations: Map<string, BufferAllocation> = new Map();
  private config: Required<MemoryProfilerConfig>;
  
  private peakGPUMemory: number = 0;
  private peakJSHeap: number = 0;
  private totalAllocations: number = 0;
  private totalDeallocations: number = 0;

  constructor(config: MemoryProfilerConfig = {}) {
    this.config = {
      trackGPUBuffers: config.trackGPUBuffers ?? true,
      trackJSHeap: config.trackJSHeap ?? true,
      snapshotInterval: config.snapshotInterval ?? 1000,
      maxSnapshots: config.maxSnapshots ?? 1000
    };
  }

  /**
   * Record a buffer allocation
   */
  recordBufferAllocation(id: string, size: number, usage: number = 0): void {
    if (!this.config.trackGPUBuffers) {
      return;
    }

    const allocation: BufferAllocation = {
      id,
      size,
      usage,
      createdAt: performance.now(),
      active: true
    };

    this.bufferAllocations.set(id, allocation);
    this.totalAllocations++;

    const currentGPU = this.getTotalGPUMemory();
    if (currentGPU > this.peakGPUMemory) {
      this.peakGPUMemory = currentGPU;
    }
  }

  /**
   * Record a buffer deallocation
   */
  recordBufferDeallocation(id: string): void {
    if (!this.config.trackGPUBuffers) {
      return;
    }

    const allocation = this.bufferAllocations.get(id);
    if (allocation) {
      allocation.active = false;
      this.totalDeallocations++;
    }
  }

  /**
   * Take a memory snapshot
   */
  takeSnapshot(objectCount: number = 0, sceneCount: number = 0): MemorySnapshot {
    const snapshot: MemorySnapshot = {
      timestamp: performance.now(),
      gpuBuffers: this.getTotalGPUMemory(),
      objectCount,
      sceneCount,
      jsHeapSize: this.getJSHeapSize(),
      jsHeapLimit: this.getJSHeapLimit()
    };

    this.snapshots.push(snapshot);

    if (snapshot.jsHeapSize > this.peakJSHeap) {
      this.peakJSHeap = snapshot.jsHeapSize;
    }

    if (this.snapshots.length > this.config.maxSnapshots) {
      this.snapshots.shift();
    }

    return snapshot;
  }

  /**
   * Get total GPU memory usage in MB
   */
  private getTotalGPUMemory(): number {
    let total = 0;
    for (const [, allocation] of this.bufferAllocations) {
      if (allocation.active) {
        total += allocation.size;
      }
    }
    return total / (1024 * 1024);
  }

  /**
   * Get JavaScript heap size in MB
   */
  private getJSHeapSize(): number {
    if (!this.config.trackJSHeap) {
      return 0;
    }

    const memory = (performance as any).memory;
    if (memory) {
      return memory.usedJSHeapSize / (1024 * 1024);
    }

    return 0;
  }

  /**
   * Get JavaScript heap limit in MB
   */
  private getJSHeapLimit(): number {
    if (!this.config.trackJSHeap) {
      return 0;
    }

    const memory = (performance as any).memory;
    if (memory) {
      return memory.jsHeapSizeLimit / (1024 * 1024);
    }

    return 0;
  }

  /**
   * Get all snapshots
   */
  getSnapshots(): MemorySnapshot[] {
    return [...this.snapshots];
  }

  /**
   * Get memory statistics
   */
  getStatistics(): MemoryStatistics {
    const currentGPU = this.getTotalGPUMemory();
    const currentJSHeap = this.getJSHeapSize();
    
    let activeBufferCount = 0;
    for (const [, allocation] of this.bufferAllocations) {
      if (allocation.active) {
        activeBufferCount++;
      }
    }

    return {
      currentGPUMemory: currentGPU,
      peakGPUMemory: this.peakGPUMemory,
      currentJSHeap,
      peakJSHeap: this.peakJSHeap,
      activeBufferCount,
      totalAllocations: this.totalAllocations,
      totalDeallocations: this.totalDeallocations,
      potentialLeak: this.detectMemoryLeak()
    };
  }

  /**
   * Detect potential memory leaks
   */
  detectMemoryLeak(): boolean {
    if (this.snapshots.length < 3) {
      return false;
    }

    const recentSnapshots = this.snapshots.slice(-10);
    
    let increasingCount = 0;
    for (let i = 1; i < recentSnapshots.length; i++) {
      if (recentSnapshots[i].jsHeapSize > recentSnapshots[i - 1].jsHeapSize) {
        increasingCount++;
      }
    }

    const threshold = recentSnapshots.length * 0.7;
    return increasingCount >= threshold;
  }

  /**
   * Get peak memory usage
   */
  getPeakMemoryUsage(): number {
    return Math.max(this.peakGPUMemory, this.peakJSHeap);
  }

  /**
   * Get active buffer count
   */
  getActiveBufferCount(): number {
    let count = 0;
    for (const [, allocation] of this.bufferAllocations) {
      if (allocation.active) {
        count++;
      }
    }
    return count;
  }

  /**
   * Get buffer allocation details
   */
  getBufferAllocations(): BufferAllocation[] {
    return Array.from(this.bufferAllocations.values());
  }

  /**
   * Export to JSON
   */
  exportToJSON(): string {
    return JSON.stringify({
      config: this.config,
      statistics: this.getStatistics(),
      snapshots: this.snapshots,
      bufferAllocations: Array.from(this.bufferAllocations.values())
    }, null, 2);
  }

  /**
   * Generate markdown report
   */
  generateReport(): string {
    const stats = this.getStatistics();
    
    return `# Memory Profile Report

## Summary
- **Current GPU Memory**: ${stats.currentGPUMemory.toFixed(2)} MB
- **Peak GPU Memory**: ${stats.peakGPUMemory.toFixed(2)} MB
- **Current JS Heap**: ${stats.currentJSHeap.toFixed(2)} MB
- **Peak JS Heap**: ${stats.peakJSHeap.toFixed(2)} MB

## Buffer Statistics
- **Active Buffers**: ${stats.activeBufferCount}
- **Total Allocations**: ${stats.totalAllocations}
- **Total Deallocations**: ${stats.totalDeallocations}

## Memory Leak Detection
- **Potential Leak**: ${stats.potentialLeak ? '⚠️ Yes' : '✅ No'}

## Memory Targets
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| GPU Memory | <10MB | ${stats.currentGPUMemory.toFixed(2)}MB | ${stats.currentGPUMemory < 10 ? '✅ Pass' : '❌ Fail'} |
| JS Heap | <10MB | ${stats.currentJSHeap.toFixed(2)}MB | ${stats.currentJSHeap < 10 ? '✅ Pass' : '❌ Fail'} |
`;
  }

  /**
   * Reset the profiler
   */
  reset(): void {
    this.snapshots = [];
    this.bufferAllocations.clear();
    this.peakGPUMemory = 0;
    this.peakJSHeap = 0;
    this.totalAllocations = 0;
    this.totalDeallocations = 0;
  }

  /**
   * Check if memory tracking is available
   */
  static isMemoryTrackingAvailable(): boolean {
    return typeof (performance as any).memory !== 'undefined';
  }
}
