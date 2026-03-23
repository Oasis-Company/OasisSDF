/**
 * Performance Metrics Interface
 * Stores frame-level performance data
 */
export interface PerformanceMetrics {
  /** Frames per second */
  fps: number;
  /** Frame time in milliseconds */
  frameTime: number;
  /** GPU time in milliseconds (if available) */
  gpuTime?: number;
  /** Memory usage in MB */
  memoryUsage: number;
  /** Number of objects in scene */
  objectCount: number;
  /** Timestamp of measurement */
  timestamp: number;
}

/**
 * Performance Statistics
 * Aggregated performance data
 */
export interface PerformanceStatistics {
  /** Average FPS */
  avgFPS: number;
  /** Minimum FPS */
  minFPS: number;
  /** Maximum FPS */
  maxFPS: number;
  /** Average frame time in ms */
  avgFrameTime: number;
  /** Minimum frame time in ms */
  minFrameTime: number;
  /** Maximum frame time in ms */
  maxFrameTime: number;
  /** Average memory usage in MB */
  avgMemoryUsage: number;
  /** Peak memory usage in MB */
  peakMemoryUsage: number;
  /** Total frames recorded */
  totalFrames: number;
  /** Duration of recording in ms */
  duration: number;
}

/**
 * Performance Profiler Configuration
 */
export interface ProfilerConfig {
  /** Enable GPU timing (requires WebGPU timestamp queries) */
  enableGPUTiming?: boolean;
  /** Sample interval in ms (default: 1000 for 1 second) */
  sampleInterval?: number;
  /** Maximum number of metrics to store */
  maxMetrics?: number;
  /** Enable memory tracking */
  trackMemory?: boolean;
}

/**
 * Performance Profiler Class
 * Tracks FPS, frame time, GPU time, and memory usage
 */
export class PerformanceProfiler {
  private metrics: PerformanceMetrics[] = [];
  private config: Required<ProfilerConfig>;
  
  private lastFrameTime: number = 0;
  private frameCount: number = 0;
  private lastFpsUpdate: number = 0;
  private currentFps: number = 0;
  private frameTimes: number[] = [];
  
  private isRunning: boolean = false;
  private startTime: number = 0;

  constructor(config: ProfilerConfig = {}) {
    this.config = {
      enableGPUTiming: config.enableGPUTiming ?? false,
      sampleInterval: config.sampleInterval ?? 1000,
      maxMetrics: config.maxMetrics ?? 10000,
      trackMemory: config.trackMemory ?? true
    };
  }

  start(): void {
    if (this.isRunning) {
      return;
    }
    
    this.isRunning = true;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.lastFpsUpdate = this.startTime;
    this.frameCount = 0;
    this.currentFps = 0;
    this.frameTimes = [];
    this.metrics = [];
  }

  stop(): void {
    this.isRunning = false;
  }

  recordFrame(objectCount: number = 0): void {
    if (!this.isRunning) {
      return;
    }

    const now = performance.now();
    const frameTime = now - this.lastFrameTime;
    this.lastFrameTime = now;
    
    this.frameCount++;
    this.frameTimes.push(frameTime);

    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }

    const elapsed = now - this.lastFpsUpdate;
    if (elapsed >= this.config.sampleInterval) {
      this.currentFps = (this.frameCount / elapsed) * 1000;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    const metrics: PerformanceMetrics = {
      fps: this.currentFps,
      frameTime: frameTime,
      memoryUsage: this.getMemoryUsage(),
      objectCount: objectCount,
      timestamp: now
    };

    this.metrics.push(metrics);

    if (this.metrics.length > this.config.maxMetrics) {
      this.metrics.shift();
    }
  }

  getCurrentFPS(): number {
    return this.currentFps;
  }

  getCurrentFrameTime(): number {
    if (this.frameTimes.length === 0) {
      return 0;
    }
    const sum = this.frameTimes.reduce((a, b) => a + b, 0);
    return sum / this.frameTimes.length;
  }

  private getMemoryUsage(): number {
    if (!this.config.trackMemory) {
      return 0;
    }

    const memory = (performance as any).memory;
    if (memory) {
      return memory.usedJSHeapSize / (1024 * 1024);
    }

    return 0;
  }

  getMetrics(): PerformanceMetrics[] {
    return [...this.metrics];
  }

  getStatistics(): PerformanceStatistics {
    if (this.metrics.length === 0) {
      return {
        avgFPS: 0,
        minFPS: 0,
        maxFPS: 0,
        avgFrameTime: 0,
        minFrameTime: 0,
        maxFrameTime: 0,
        avgMemoryUsage: 0,
        peakMemoryUsage: 0,
        totalFrames: 0,
        duration: 0
      };
    }

    const fpsValues = this.metrics.map(m => m.fps).filter(f => f > 0);
    const frameTimes = this.metrics.map(m => m.frameTime);
    const memoryValues = this.metrics.map(m => m.memoryUsage);

    return {
      avgFPS: fpsValues.length > 0 ? fpsValues.reduce((a, b) => a + b, 0) / fpsValues.length : 0,
      minFPS: fpsValues.length > 0 ? Math.min(...fpsValues) : 0,
      maxFPS: fpsValues.length > 0 ? Math.max(...fpsValues) : 0,
      avgFrameTime: frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length,
      minFrameTime: Math.min(...frameTimes),
      maxFrameTime: Math.max(...frameTimes),
      avgMemoryUsage: memoryValues.length > 0 ? memoryValues.reduce((a, b) => a + b, 0) / memoryValues.length : 0,
      peakMemoryUsage: memoryValues.length > 0 ? Math.max(...memoryValues) : 0,
      totalFrames: this.metrics.length,
      duration: performance.now() - this.startTime
    };
  }

  getAverageFPS(): number {
    return this.getStatistics().avgFPS;
  }

  getAverageFrameTime(): number {
    return this.getStatistics().avgFrameTime;
  }

  exportToJSON(): string {
    return JSON.stringify({
      config: this.config,
      statistics: this.getStatistics(),
      metrics: this.metrics
    }, null, 2);
  }

  exportToCSV(): string {
    const headers = 'timestamp,fps,frameTime,memoryUsage,objectCount\n';
    const rows = this.metrics.map(m => 
      `${m.timestamp},${m.fps},${m.frameTime},${m.memoryUsage},${m.objectCount}`
    ).join('\n');
    
    return headers + rows;
  }

  generateReport(): string {
    const stats = this.getStatistics();
    
    return `# Performance Report

## Summary
- **Duration**: ${(stats.duration / 1000).toFixed(2)} seconds
- **Total Frames**: ${stats.totalFrames}

## FPS
- **Average**: ${stats.avgFPS.toFixed(1)}
- **Min**: ${stats.minFPS.toFixed(1)}
- **Max**: ${stats.maxFPS.toFixed(1)}

## Frame Time
- **Average**: ${stats.avgFrameTime.toFixed(2)} ms
- **Min**: ${stats.minFrameTime.toFixed(2)} ms
- **Max**: ${stats.maxFrameTime.toFixed(2)} ms

## Memory Usage
- **Average**: ${stats.avgMemoryUsage.toFixed(2)} MB
- **Peak**: ${stats.peakMemoryUsage.toFixed(2)} MB

## Performance Targets
| Metric | Target | Actual | Status |
|--------|--------|--------|--------|
| FPS | >60 | ${stats.avgFPS.toFixed(1)} | ${stats.avgFPS >= 60 ? '✅ Pass' : '❌ Fail'} |
| Frame Time | <16ms | ${stats.avgFrameTime.toFixed(2)}ms | ${stats.avgFrameTime < 16 ? '✅ Pass' : '❌ Fail'} |
`;
  }

  reset(): void {
    this.metrics = [];
    this.frameTimes = [];
    this.frameCount = 0;
    this.currentFps = 0;
    this.startTime = performance.now();
    this.lastFrameTime = this.startTime;
    this.lastFpsUpdate = this.startTime;
  }

  isActive(): boolean {
    return this.isRunning;
  }
}
