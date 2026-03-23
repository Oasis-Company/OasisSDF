# Performance Optimization Guide

This guide covers techniques and best practices for optimizing OasisSDF applications to achieve maximum performance.

## Overview

OasisSDF is designed for high-performance rendering of thousands of objects. However, achieving optimal performance requires understanding the engine's architecture and applying appropriate optimization techniques.

## Performance Targets

- **60 FPS**: Minimum acceptable frame rate
- **120 FPS**: Target for high-refresh displays
- **10,000+ objects**: Supported object count at 60 FPS
- **<1ms buffer updates**: CPU-side update time

## Key Performance Factors

### 1. Object Count

The number of objects directly impacts GPU performance:

```typescript
// Good: Batch similar objects
const scene = engine.createScene('optimized', {
  maxObjects: 1000 // Allocate only what you need
});

// Monitor object count
console.log('Objects:', scene.getObjectCount());
```

**Recommendations:**
- Keep object count under 10,000 for 60 FPS
- Use object pooling for dynamic scenes
- Remove unused objects promptly

### 2. Buffer Updates

Minimize buffer updates by using dirty flagging:

```typescript
// Good: Batch updates
scene.addObject(obj1);
scene.addObject(obj2);
scene.addObject(obj3);
// Single buffer update on next frame

// Bad: Force immediate updates
scene.addObject(obj1);
scene.update(0.016); // Immediate update
scene.addObject(obj2);
scene.update(0.016); // Another update
```

### 3. Scene Complexity

Optimize scene configuration:

```typescript
// Good: Right-size your scenes
const gameScene = engine.createScene('game', {
  maxObjects: 500,  // Only what you need
  maxLights: 4      // Fewer lights = better performance
});

// Bad: Over-allocating resources
const wastefulScene = engine.createScene('wasteful', {
  maxObjects: 10000, // You only use 50
  maxLights: 100     // You only use 2
});
```

## Optimization Techniques

### Object Pooling

Reuse objects instead of creating/destroying:

```typescript
class ObjectPool {
  private available: number[] = [];
  private inUse: Set<number> = new Set();
  private scene: Scene;

  constructor(scene: Scene, poolSize: number) {
    this.scene = scene;
    // Pre-allocate objects
    for (let i = 0; i < poolSize; i++) {
      const index = scene.addObject({
        type: SDFPrimitive.Sphere,
        position: [0, -1000, 0], // Hide initially
        scale: [0, 0, 0]
      });
      this.available.push(index);
    }
  }

  acquire(): number | null {
    if (this.available.length === 0) return null;
    const index = this.available.pop()!;
    this.inUse.add(index);
    return index;
  }

  release(index: number): void {
    if (this.inUse.has(index)) {
      this.inUse.delete(index);
      // Hide object
      this.scene.updateObject(index, {
        type: SDFPrimitive.Sphere,
        position: [0, -1000, 0],
        scale: [0, 0, 0]
      });
      this.available.push(index);
    }
  }
}
```

### Level of Detail (LOD)

Adjust detail based on distance:

```typescript
class LODSystem {
  private engine: Engine;
  private lodLevels = [
    { distance: 10, scale: 1.0 },
    { distance: 20, scale: 0.5 },
    { distance: 50, scale: 0.2 }
  ];

  updateLOD(camera: CameraData, objects: SDFObjectData[]): void {
    objects.forEach((obj, index) => {
      const distance = this.calculateDistance(camera.position, obj.position);
      const lod = this.getLODLevel(distance);
      
      this.engine.updateObject(index, {
        ...obj,
        scale: [
          obj.scale[0] * lod.scale,
          obj.scale[1] * lod.scale,
          obj.scale[2] * lod.scale
        ]
      });
    });
  }

  private calculateDistance(a: number[], b: number[]): number {
    const dx = a[0] - b[0];
    const dy = a[1] - b[1];
    const dz = a[2] - b[2];
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
  }

  private getLODLevel(distance: number) {
    return this.lodLevels.find(l => distance < l.distance) || 
           this.lodLevels[this.lodLevels.length - 1];
  }
}
```

### Frustum Culling

Skip objects outside camera view:

```typescript
class FrustumCuller {
  private engine: Engine;

  cullObjects(camera: CameraData, objects: SDFObjectData[]): void {
    const frustum = this.calculateFrustum(camera);
    
    objects.forEach((obj, index) => {
      const visible = this.isInFrustum(frustum, obj.position);
      if (!visible) {
        // Hide object by scaling to zero
        this.engine.updateObject(index, {
          ...obj,
          scale: [0, 0, 0]
        });
      }
    });
  }

  private calculateFrustum(camera: CameraData) {
    // Calculate view frustum planes
    // Implementation depends on your camera setup
    return {
      planes: [] // Array of 6 planes
    };
  }

  private isInFrustum(frustum: any, position: number[]): boolean {
    // Check if point is inside frustum
    return true; // Simplified
  }
}
```

### Batched Updates

Group updates to minimize buffer transfers:

```typescript
class BatchedUpdater {
  private updates: Map<number, SDFObjectData> = new Map();
  private scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  queueUpdate(index: number, object: SDFObjectData): void {
    this.updates.set(index, object);
  }

  flush(): void {
    this.updates.forEach((object, index) => {
      this.scene.updateObject(index, object);
    });
    this.updates.clear();
  }
}

// Usage
const updater = new BatchedUpdater(scene);

// Queue multiple updates
updater.queueUpdate(0, newObj1);
updater.queueUpdate(1, newObj2);
updater.queueUpdate(2, newObj3);

// Apply all at once
updater.flush();
```

## Memory Optimization

### Buffer Management

```typescript
// Monitor buffer usage
const bufferManager = engine.getBufferManager();
const memoryInfo = bufferManager.getMemoryInfo();

console.log('Buffer memory:', memoryInfo.used / 1024 / 1024, 'MB');
```

### Scene Cleanup

```typescript
// Clean up unused scenes
function cleanupUnusedScenes(engine: Engine, activeScenes: string[]): void {
  const allScenes = engine.getScenes();
  
  allScenes.forEach((scene, name) => {
    if (!activeScenes.includes(name) && name !== 'default') {
      engine.removeScene(name);
    }
  });
}
```

## Rendering Optimization

### Resolution Scaling

```typescript
class AdaptiveResolution {
  private canvas: HTMLCanvasElement;
  private targetFPS: number = 60;
  private scale: number = 1.0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
  }

  update(currentFPS: number): void {
    if (currentFPS < this.targetFPS * 0.9) {
      this.scale = Math.max(0.5, this.scale - 0.1);
    } else if (currentFPS > this.targetFPS * 1.1) {
      this.scale = Math.min(1.0, this.scale + 0.05);
    }

    const width = Math.floor(this.canvas.clientWidth * this.scale);
    const height = Math.floor(this.canvas.clientHeight * this.scale);
    
    this.canvas.width = width;
    this.canvas.height = height;
  }
}
```

### VSync and Frame Pacing

```typescript
class FramePacer {
  private targetFrameTime: number = 1000 / 60; // 60 FPS
  private lastFrameTime: number = 0;

  shouldRender(currentTime: number): boolean {
    const elapsed = currentTime - this.lastFrameTime;
    
    if (elapsed >= this.targetFrameTime) {
      this.lastFrameTime = currentTime;
      return true;
    }
    
    return false;
  }
}
```

## Profiling and Debugging

### Performance Metrics

```typescript
class PerformanceMonitor {
  private frameCount: number = 0;
  private lastTime: number = performance.now();
  private fps: number = 0;

  update(): void {
    this.frameCount++;
    const currentTime = performance.now();
    
    if (currentTime - this.lastTime >= 1000) {
      this.fps = this.frameCount;
      this.frameCount = 0;
      this.lastTime = currentTime;
      
      console.log(`FPS: ${this.fps}`);
    }
  }
}
```

### GPU Timing

```typescript
// Enable GPU timing (if supported)
const engine = new Engine({
  canvas,
  debug: true // Enables performance logging
});

// Check render time
console.time('render');
engine.render(0.016);
console.timeEnd('render');
```

## Best Practices

### 1. Minimize State Changes

```typescript
// Good: Group similar objects
for (let i = 0; i < 100; i++) {
  scene.addObject({
    type: SDFPrimitive.Sphere,
    position: [i * 2, 0, 0],
    scale: [1, 1, 1]
  });
}

// Bad: Mixing object types (if possible to avoid)
for (let i = 0; i < 100; i++) {
  scene.addObject({
    type: i % 2 === 0 ? SDFPrimitive.Sphere : SDFPrimitive.Box,
    position: [i * 2, 0, 0],
    scale: [1, 1, 1]
  });
}
```

### 2. Use Appropriate Data Types

```typescript
// Use Float32Array for buffer data
const positions = new Float32Array(objectCount * 3);
// Instead of regular arrays
const positions = []; // Slower
```

### 3. Avoid Unnecessary Updates

```typescript
// Good: Only update when changed
if (objectMoved) {
  engine.updateObject(index, newData);
}

// Bad: Updating every frame
engine.updateObject(index, newData); // Even if unchanged
```

### 4. Pre-allocate Resources

```typescript
// Good: Pre-allocate
const engine = new Engine({
  canvas,
  maxObjects: 1000 // Allocate upfront
});

// Bad: Dynamic allocation
// Engine allocates more as needed (slower)
```

## Troubleshooting Performance Issues

### Low FPS

1. **Check object count**: `scene.getObjectCount()`
2. **Profile buffer updates**: Enable `debug: true`
3. **Monitor GPU usage**: Browser DevTools Performance tab
4. **Check for memory leaks**: Monitor `engine.getScenes().size`

### Stuttering

1. **Enable VSync**: Check browser settings
2. **Reduce update frequency**: Don't update every frame
3. **Use requestAnimationFrame**: Proper frame scheduling
4. **Check for GC pauses**: Avoid creating objects in render loop

### High Memory Usage

1. **Clean up scenes**: `engine.removeScene()`
2. **Use object pooling**: Reuse objects
3. **Monitor buffer sizes**: `bufferManager.getMemoryInfo()`
4. **Check for leaks**: Scene/object counts growing over time

## Benchmarking

```typescript
async function benchmark(engine: Engine): Promise<void> {
  const objectCounts = [100, 500, 1000, 5000, 10000];
  const results = [];

  for (const count of objectCounts) {
    // Create test scene
    const scene = engine.createScene('benchmark', {
      maxObjects: count
    });

    // Add objects
    const startTime = performance.now();
    for (let i = 0; i < count; i++) {
      scene.addObject({
        type: SDFPrimitive.Sphere,
        position: [Math.random() * 10, Math.random() * 10, Math.random() * 10],
        scale: [1, 1, 1]
      });
    }
    const addTime = performance.now() - startTime;

    // Measure FPS
    let frames = 0;
    const fpsStart = performance.now();
    
    const measureFPS = () => {
      frames++;
      if (performance.now() - fpsStart < 1000) {
        requestAnimationFrame(measureFPS);
      } else {
        const fps = frames;
        results.push({ count, addTime, fps });
        engine.removeScene('benchmark');
      }
    };
    
    measureFPS();
  }

  console.table(results);
}
```

## Next Steps

- Review [Scene Management](./scene-management.md) for optimization patterns
- Check [API Reference](../api/Engine.md) for detailed method documentation
- Explore [Example Projects](../../examples/) for real-world implementations
