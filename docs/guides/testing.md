# Testing Guide

This guide explains how to run tests, interpret results, and add new tests for OasisSDF.

## Quick Start

### Run All Tests

```bash
npm test
```

### Run Specific Test Categories

```bash
# Unit tests only
npm test -- --run tests/unit

# Integration tests only
npm test -- --run tests/integration

# Benchmark tests only
npm test -- --run tests/benchmark

# Compatibility tests only
npm test -- --run tests/compatibility
```

### Run Specific Test File

```bash
npm test -- --run tests/unit/Engine.test.ts
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

---

## Test Structure

```
tests/
├── setup.ts                    # Test environment setup
├── unit/                       # Unit tests
│   ├── BufferManager.test.ts
│   ├── DeviceManager.test.ts
│   ├── Engine.test.ts
│   ├── LightManager.test.ts
│   ├── MemoryProfiler.test.ts
│   ├── ObjectManager.test.ts
│   ├── ObjectPool.test.ts
│   ├── PerformanceProfiler.test.ts
│   ├── PipelineManager.test.ts
│   ├── Scene.test.ts
│   ├── SDFObject.test.ts
│   └── Transform.test.ts
├── integration/                # Integration tests
│   ├── buffer-management.test.ts
│   ├── engine-lifecycle.test.ts
│   ├── rendering.test.ts
│   └── stress.test.ts
├── benchmark/                  # Performance benchmarks
│   ├── benchmark.test.ts
│   ├── memory.test.ts
│   ├── performance.ts
│   └── runner.ts
└── compatibility/              # Browser compatibility
    └── browser.test.ts
```

---

## Test Categories

### Unit Tests

Test individual components in isolation.

**Example**:
```typescript
import { describe, it, expect } from 'vitest';
import { PerformanceProfiler } from '../../src/utils/PerformanceProfiler.js';

describe('PerformanceProfiler', () => {
  it('should measure FPS accurately', async () => {
    const profiler = new PerformanceProfiler();
    profiler.start();
    
    for (let i = 0; i < 30; i++) {
      profiler.recordFrame(0);
      await new Promise(resolve => setTimeout(resolve, 16));
    }
    
    profiler.stop();
    
    const stats = profiler.getStatistics();
    expect(stats.totalFrames).toBe(30);
    expect(stats.avgFPS).toBeGreaterThan(0);
  });
});
```

### Integration Tests

Test how components work together.

**Example**:
```typescript
import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Engine } from '../../src/engine/Engine.js';

describe('Engine Lifecycle', () => {
  let engine: Engine;
  let canvas: HTMLCanvasElement;

  beforeEach(() => {
    canvas = document.createElement('canvas');
    engine = new Engine({ canvas });
  });

  afterEach(() => {
    engine.cleanup();
  });

  it('should initialize and render', async () => {
    if (!navigator.gpu) return;
    
    await engine.initialize();
    expect(engine.isInitialized()).toBe(true);
    
    engine.addObject({
      type: 1,
      position: [0, 0, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1]
    });
    
    expect(() => engine.render(0.016)).not.toThrow();
  });
});
```

### Benchmark Tests

Measure performance characteristics.

**Example**:
```typescript
import { describe, it, expect } from 'vitest';
import { PerformanceProfiler } from '../../src/utils/PerformanceProfiler.js';

describe('Performance Benchmarks', () => {
  it('should meet single frame performance target', async () => {
    const profiler = new PerformanceProfiler();
    profiler.start();
    
    for (let i = 0; i < 60; i++) {
      profiler.recordFrame(0);
      await new Promise(resolve => setTimeout(resolve, 1));
    }
    
    profiler.stop();
    
    const stats = profiler.getStatistics();
    expect(stats.avgFrameTime).toBeLessThan(32);
  });
});
```

---

## Interpreting Results

### Test Output

```
 ✓ tests/unit/Engine.test.ts (24)
   ✓ Engine (24)
     ✓ Initialization (3)
       ✓ should initialize engine successfully
       ✓ should handle multiple initialization calls
       ✓ should fail gracefully without WebGPU
     ...
```

- ✓ = Test passed
- × = Test failed
- Number in parentheses = Number of tests

### Performance Metrics

| Metric | Target | Meaning |
|--------|--------|---------|
| FPS | >60 | Frames per second |
| Frame Time | <16ms | Time per frame |
| Memory | <10MB | Peak memory usage |

---

## Adding New Tests

### 1. Create Test File

Create a new file in the appropriate directory:

```typescript
// tests/unit/NewComponent.test.ts
import { describe, it, expect } from 'vitest';
import { NewComponent } from '../../src/NewComponent.js';

describe('NewComponent', () => {
  it('should work correctly', () => {
    const component = new NewComponent();
    expect(component).toBeDefined();
  });
});
```

### 2. Follow Naming Convention

- Unit tests: `tests/unit/ComponentName.test.ts`
- Integration tests: `tests/integration/feature-name.test.ts`
- Benchmark tests: `tests/benchmark/benchmark-name.test.ts`

### 3. Use Descriptive Test Names

```typescript
// Good
it('should return null when max lights reached', () => { ... });

// Bad
it('test lights', () => { ... });
```

### 4. Handle Async Operations

```typescript
it('should handle async operations', async () => {
  const result = await someAsyncOperation();
  expect(result).toBe(expected);
});
```

### 5. Skip Tests When Necessary

```typescript
// Skip if WebGPU not available
it('should render with WebGPU', async () => {
  if (!navigator.gpu) return;
  // ... test code
});

// Or use skip
it.skip('work in progress', () => { ... });
```

---

## Performance Profiling

### Using PerformanceProfiler

```typescript
import { PerformanceProfiler } from 'oasissdf';

const profiler = new PerformanceProfiler({
  sampleInterval: 1000,
  trackMemory: true
});

profiler.start();

// Your rendering loop
function render() {
  profiler.recordFrame(objectCount);
  // ... render code
  requestAnimationFrame(render);
}

// After testing
profiler.stop();

// Get statistics
const stats = profiler.getStatistics();
console.log(`Average FPS: ${stats.avgFPS}`);
console.log(`Average Frame Time: ${stats.avgFrameTime}ms`);

// Generate report
const report = profiler.generateReport();
console.log(report);
```

### Using MemoryProfiler

```typescript
import { MemoryProfiler } from 'oasissdf';

const memoryProfiler = new MemoryProfiler();

// Track buffer allocations
memoryProfiler.recordBufferAllocation('buffer1', 1024 * 1024);

// Take snapshots
memoryProfiler.takeSnapshot(objectCount, sceneCount);

// Check for leaks
const stats = memoryProfiler.getStatistics();
if (stats.potentialLeak) {
  console.warn('Potential memory leak detected!');
}
```

---

## Browser Compatibility

### Checking WebGPU Support

```typescript
import { BrowserSupport, isWebGPUAvailable } from 'oasissdf';

// Quick check
if (isWebGPUAvailable()) {
  // WebGPU is supported
}

// Detailed check
const result = await BrowserSupport.checkCompatibility();
if (result.supported) {
  // All features supported
} else {
  console.log('Missing features:', result.missingFeatures);
  console.log('Recommendation:', result.recommendation);
}
```

---

## Continuous Integration

Tests are automatically run on:

- Every push to main branch
- Every pull request
- Before releases

### CI Configuration

```yaml
# .github/workflows/test.yml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npm test
```

---

## Troubleshooting

### Common Issues

1. **"navigator.gpu is undefined"**
   - WebGPU not supported in this browser
   - Use Chrome 113+ or Edge 113+

2. **"GPUDevice was lost"**
   - GPU driver crash
   - Reduce object count or texture size

3. **"Buffer size exceeds limit"**
   - Reduce maxObjects in config
   - Split into multiple scenes

### Debug Mode

Enable verbose logging:

```typescript
const engine = new Engine({
  canvas,
  debug: true
});
```

---

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Cleanup**: Always cleanup resources after tests
3. **Async Handling**: Use async/await for async operations
4. **Mocking**: Mock external dependencies when needed
5. **Coverage**: Aim for >80% code coverage

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [WebGPU Specification](https://www.w3.org/TR/webgpu/)
- [Testing Best Practices](https://testingjavascript.com/)
