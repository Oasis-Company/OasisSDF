/**
 * Performance Benchmark Utilities
 * Provides helper functions for running performance benchmarks
 */

import { PerformanceProfiler, type PerformanceStatistics } from '../../src/utils/PerformanceProfiler.js';

export interface BenchmarkConfig {
  /** Duration of benchmark in milliseconds */
  duration: number;
  /** Number of objects to test */
  objectCounts: number[];
  /** Warmup time in milliseconds */
  warmupTime?: number;
  /** Cooldown time between tests in milliseconds */
  cooldownTime?: number;
}

export interface BenchmarkResult {
  objectCount: number;
  statistics: PerformanceStatistics;
  passed: boolean;
  targetFPS: number;
}

export interface BenchmarkReport {
  config: BenchmarkConfig;
  results: BenchmarkResult[];
  timestamp: string;
  browser: string;
  passed: boolean;
}

/**
 * Create a mock canvas for testing
 */
export function createMockCanvas(width: number = 800, height: number = 600): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

/**
 * Wait for specified milliseconds
 */
export function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Run a benchmark with the given render function
 */
export async function runBenchmark(
  renderFn: (objectCount: number, profiler: PerformanceProfiler) => void,
  config: BenchmarkConfig
): Promise<BenchmarkReport> {
  const results: BenchmarkResult[] = [];
  const targetFPS = 60;

  for (const objectCount of config.objectCounts) {
    const profiler = new PerformanceProfiler({
      sampleInterval: 500,
      trackMemory: true
    });

    profiler.start();

    const startTime = performance.now();
    const endTime = startTime + config.duration;

    while (performance.now() < endTime) {
      renderFn(objectCount, profiler);
      await new Promise(resolve => requestAnimationFrame(resolve));
    }

    profiler.stop();

    const statistics = profiler.getStatistics();
    const passed = statistics.avgFPS >= targetFPS;

    results.push({
      objectCount,
      statistics,
      passed,
      targetFPS
    });

    if (config.cooldownTime) {
      await sleep(config.cooldownTime);
    }
  }

  return {
    config,
    results,
    timestamp: new Date().toISOString(),
    browser: getBrowserInfo(),
    passed: results.every(r => r.passed)
  };
}

/**
 * Run a simple frame rate test
 */
export async function measureFrameRate(
  frameFn: () => void,
  duration: number = 1000
): Promise<PerformanceStatistics> {
  const profiler = new PerformanceProfiler();
  profiler.start();

  const startTime = performance.now();
  const endTime = startTime + duration;

  while (performance.now() < endTime) {
    frameFn();
    profiler.recordFrame(0);
    await new Promise(resolve => requestAnimationFrame(resolve));
  }

  profiler.stop();
  return profiler.getStatistics();
}

/**
 * Get browser information
 */
function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  
  if (ua.includes('Chrome')) {
    const match = ua.match(/Chrome\/(\d+)/);
    return `Chrome ${match ? match[1] : 'unknown'}`;
  }
  if (ua.includes('Firefox')) {
    const match = ua.match(/Firefox\/(\d+)/);
    return `Firefox ${match ? match[1] : 'unknown'}`;
  }
  if (ua.includes('Safari')) {
    const match = ua.match(/Version\/(\d+)/);
    return `Safari ${match ? match[1] : 'unknown'}`;
  }
  if (ua.includes('Edge')) {
    const match = ua.match(/Edge\/(\d+)/);
    return `Edge ${match ? match[1] : 'unknown'}`;
  }
  
  return 'Unknown Browser';
}

/**
 * Generate a benchmark report in markdown format
 */
export function generateBenchmarkReport(report: BenchmarkReport): string {
  let md = `# Performance Benchmark Report

**Date**: ${report.timestamp}
**Browser**: ${report.browser}
**Duration**: ${report.config.duration}ms per test

## Results Summary

| Object Count | Avg FPS | Min FPS | Max FPS | Avg Frame Time | Status |
|-------------|---------|---------|---------|----------------|--------|
`;

  for (const result of report.results) {
    const status = result.passed ? '✅ Pass' : '❌ Fail';
    md += `| ${result.objectCount} | ${result.statistics.avgFPS.toFixed(1)} | ${result.statistics.minFPS.toFixed(1)} | ${result.statistics.maxFPS.toFixed(1)} | ${result.statistics.avgFrameTime.toFixed(2)}ms | ${status} |\n`;
  }

  md += `
## Performance Targets

| Metric | Target | Status |
|--------|--------|--------|
| Single Object FPS | >60 | ${report.results.find(r => r.objectCount === 1)?.passed ? '✅' : '❌'} |
| 100 Objects FPS | >60 | ${report.results.find(r => r.objectCount === 100)?.passed ? '✅' : '❌'} |
| Frame Time | <16ms | ${report.results.every(r => r.statistics.avgFrameTime < 16) ? '✅' : '❌'} |

## Overall Result: ${report.passed ? '✅ All tests passed' : '❌ Some tests failed'}
`;

  return md;
}
