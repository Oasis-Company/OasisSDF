/**
 * Benchmark Runner
 * Automated benchmark execution for performance validation
 */

import { PerformanceProfiler, type PerformanceStatistics } from '../../src/utils/PerformanceProfiler.js';

export interface BenchmarkCase {
  name: string;
  description: string;
  targetFPS: number;
  targetFrameTime: number;
  targetMemory: number;
  run: () => Promise<BenchmarkResult>;
}

export interface BenchmarkResult {
  passed: boolean;
  statistics: PerformanceStatistics;
  message: string;
}

export interface BenchmarkSuiteResult {
  name: string;
  timestamp: string;
  results: {
    case: string;
    passed: boolean;
    statistics: PerformanceStatistics;
    message: string;
  }[];
  passed: boolean;
  summary: {
    total: number;
    passed: number;
    failed: number;
  };
}

/**
 * Benchmark Runner Class
 * Executes benchmark suites and generates reports
 */
export class BenchmarkRunner {
  private cases: BenchmarkCase[] = [];

  /**
   * Add a benchmark case
   */
  addCase(benchmarkCase: BenchmarkCase): void {
    this.cases.push(benchmarkCase);
  }

  /**
   * Run all benchmark cases
   */
  async runAll(): Promise<BenchmarkSuiteResult> {
    const results: BenchmarkSuiteResult['results'] = [];

    for (const testCase of this.cases) {
      console.log(`Running benchmark: ${testCase.name}...`);
      
      try {
        const result = await testCase.run();
        
        results.push({
          case: testCase.name,
          passed: result.passed,
          statistics: result.statistics,
          message: result.message
        });
      } catch (error) {
        results.push({
          case: testCase.name,
          passed: false,
          statistics: {
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
          },
          message: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`
        });
      }
    }

    const passed = results.filter(r => r.passed).length;
    const failed = results.length - passed;

    return {
      name: 'OasisSDF Benchmark Suite',
      timestamp: new Date().toISOString(),
      results,
      passed: failed === 0,
      summary: {
        total: results.length,
        passed,
        failed
      }
    };
  }

  /**
   * Generate markdown report
   */
  generateReport(suiteResult: BenchmarkSuiteResult): string {
    let md = `# ${suiteResult.name}

**Date**: ${suiteResult.timestamp}

## Summary

- Total Tests: ${suiteResult.summary.total}
- Passed: ${suiteResult.summary.passed}
- Failed: ${suiteResult.summary.failed}
- Overall: ${suiteResult.passed ? '✅ All Passed' : '❌ Some Failed'}

## Results

| Test | Avg FPS | Avg Frame Time | Memory | Status |
|------|---------|----------------|--------|--------|
`;

    for (const result of suiteResult.results) {
      const status = result.passed ? '✅' : '❌';
      md += `| ${result.case} | ${result.statistics.avgFPS.toFixed(1)} | ${result.statistics.avgFrameTime.toFixed(2)}ms | ${result.statistics.avgMemoryUsage.toFixed(2)}MB | ${status} |\n`;
    }

    md += `
## Details

`;
    for (const result of suiteResult.results) {
      md += `### ${result.case}

- **Status**: ${result.passed ? '✅ Passed' : '❌ Failed'}
- **Average FPS**: ${result.statistics.avgFPS.toFixed(1)}
- **Min FPS**: ${result.statistics.minFPS.toFixed(1)}
- **Max FPS**: ${result.statistics.maxFPS.toFixed(1)}
- **Average Frame Time**: ${result.statistics.avgFrameTime.toFixed(2)}ms
- **Peak Memory**: ${result.statistics.peakMemoryUsage.toFixed(2)}MB
- **Duration**: ${(result.statistics.duration / 1000).toFixed(2)}s
- **Message**: ${result.message}

`;
    }

    return md;
  }
}

/**
 * Create a simple benchmark case
 */
export function createBenchmarkCase(
  name: string,
  description: string,
  runFn: (profiler: PerformanceProfiler) => Promise<void>,
  config: {
    targetFPS?: number;
    targetFrameTime?: number;
    targetMemory?: number;
    duration?: number;
  } = {}
): BenchmarkCase {
  const targetFPS = config.targetFPS ?? 60;
  const targetFrameTime = config.targetFrameTime ?? 16;
  const targetMemory = config.targetMemory ?? 10;
  const duration = config.duration ?? 2000;

  return {
    name,
    description,
    targetFPS,
    targetFrameTime,
    targetMemory,
    run: async () => {
      const profiler = new PerformanceProfiler({
        sampleInterval: 500,
        trackMemory: true
      });

      profiler.start();
      
      const startTime = performance.now();
      const endTime = startTime + duration;

      while (performance.now() < endTime) {
        await runFn(profiler);
        profiler.recordFrame(0);
      }

      profiler.stop();

      const stats = profiler.getStatistics();
      const fpsPassed = stats.avgFPS >= targetFPS;
      const frameTimePassed = stats.avgFrameTime <= targetFrameTime;
      const memoryPassed = stats.peakMemoryUsage <= targetMemory;
      const passed = fpsPassed && frameTimePassed && memoryPassed;

      let message = '';
      if (!fpsPassed) {
        message += `FPS ${stats.avgFPS.toFixed(1)} < ${targetFPS}. `;
      }
      if (!frameTimePassed) {
        message += `Frame time ${stats.avgFrameTime.toFixed(2)}ms > ${targetFrameTime}ms. `;
      }
      if (!memoryPassed) {
        message += `Memory ${stats.peakMemoryUsage.toFixed(2)}MB > ${targetMemory}MB. `;
      }
      if (passed) {
        message = 'All targets met.';
      }

      return {
        passed,
        statistics: stats,
        message: message.trim()
      };
    }
  };
}
