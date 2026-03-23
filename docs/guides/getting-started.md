# Getting Started with OasisSDF

This guide will help you get up and running with OasisSDF, the data-driven WebGPU SDF rendering engine.

## Prerequisites

Before you begin, ensure you have:

- A modern browser with WebGPU support (Chrome 113+, Edge 113+, Firefox Nightly)
- Node.js 18 or higher
- Basic knowledge of TypeScript/JavaScript

## Installation

### Using NPM

```bash
npm install oasissdf
```

### Using Yarn

```bash
yarn add oasissdf
```

### Using CDN

```html
<script type="module">
  import { Engine, SDFPrimitive } from 'https://unpkg.com/oasissdf@latest/dist/oasissdf.es.js';
</script>
```

## Your First Scene

Let's create a simple scene with a rotating sphere.

### 1. Create HTML File

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>My First OasisSDF Scene</title>
  <style>
    body { margin: 0; overflow: hidden; background: #000; }
    canvas { display: block; width: 100vw; height: 100vh; }
  </style>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script type="module" src="./main.ts"></script>
</body>
</html>
```

### 2. Create TypeScript File

```typescript
import { Engine, SDFPrimitive } from 'oasissdf';

async function main() {
  // Get canvas element
  const canvas = document.getElementById('canvas') as HTMLCanvasElement;
  
  // Create engine instance
  const engine = new Engine({
    canvas,
    maxObjects: 100,
    backgroundColor: [0.1, 0.1, 0.15]
  });
  
  // Initialize engine (async WebGPU setup)
  await engine.initialize();
  
  // Add a sphere
  const sphereIndex = engine.addObject({
    type: SDFPrimitive.Sphere,
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: [1, 1, 1]
  });
  
  // Add lighting
  engine.getActiveScene().addLight({
    type: 0, // Directional light
    direction: [-1, -1, -1],
    color: [1, 1, 1],
    intensity: 1.0
  });
  
  // Start rendering loop
  engine.start();
  
  // Animate the sphere
  let time = 0;
  function animate() {
    time += 0.016;
    
    // Update sphere position
    engine.updateObject(sphereIndex, {
      type: SDFPrimitive.Sphere,
      position: [Math.sin(time) * 2, 0, 0],
      rotation: [0, time, 0],
      scale: [1, 1, 1]
    });
    
    requestAnimationFrame(animate);
  }
  
  animate();
}

main().catch(console.error);
```

### 3. Run Development Server

```bash
npm run dev
```

Open your browser to `http://localhost:5173` and you should see a rotating sphere!

## Understanding the Basics

### The Engine

The `Engine` class is your main entry point. It manages:
- WebGPU device and context
- Scene management
- Rendering loop
- Resource allocation

```typescript
const engine = new Engine({
  canvas: HTMLCanvasElement,    // Required: Canvas to render to
  maxObjects: 1000,             // Optional: Max objects (default: 10000)
  maxLights: 10,                // Optional: Max lights (default: 10)
  backgroundColor: [0, 0, 0],   // Optional: Background color
  debug: false                  // Optional: Enable debug logging
});
```

### Scenes

Scenes organize your 3D content. You can have multiple scenes and switch between them:

```typescript
// Create multiple scenes
const scene1 = engine.createScene('scene1', {
  maxObjects: 50,
  ambientLight: [0.1, 0.1, 0.1]
});

const scene2 = engine.createScene('scene2', {
  maxObjects: 100,
  ambientLight: [0.2, 0.2, 0.2]
});

// Switch scenes
engine.setActiveScene('scene1');
```

### Objects

Objects are SDF primitives defined by their type, position, rotation, and scale:

```typescript
// Available primitive types
SDFPrimitive.Sphere    // 1
SDFPrimitive.Box       // 2
SDFPrimitive.Torus     // 3
SDFPrimitive.Capsule   // 4
SDFPrimitive.Cylinder  // 5
SDFPrimitive.Cone      // 6

// Add object
const index = engine.addObject({
  type: SDFPrimitive.Box,
  position: [1, 2, 3],
  rotation: [0, Math.PI / 4, 0],
  scale: [1, 1, 1]
});

// Update object
engine.updateObject(index, {
  type: SDFPrimitive.Box,
  position: [2, 3, 4],
  rotation: [0, Math.PI / 2, 0],
  scale: [1.5, 1.5, 1.5]
});

// Remove object
engine.removeObject(index);
```

### Lighting

OasisSDF supports three types of lights:

```typescript
// Directional Light (like sun)
scene.addLight({
  type: 0,
  direction: [-1, -1, -1],
  color: [1, 1, 1],
  intensity: 1.0
});

// Point Light (like a bulb)
scene.addLight({
  type: 1,
  position: [2, 3, 4],
  color: [1, 0.8, 0.6],
  intensity: 2.0,
  range: 10.0
});

// Spot Light (like a flashlight)
scene.addLight({
  type: 2,
  position: [0, 5, 0],
  direction: [0, -1, 0],
  color: [0.5, 0.8, 1],
  intensity: 3.0,
  range: 15.0,
  spotAngle: Math.PI / 6
});
```

### Camera

Control the camera to view your scene:

```typescript
// Update camera
engine.updateCamera({
  position: [5, 5, 5],
  target: [0, 0, 0],
  up: [0, 1, 0],
  fov: Math.PI / 3,
  near: 0.1,
  far: 100
});

// Get current camera
const camera = engine.getCamera();
console.log(camera.position); // [5, 5, 5]
```

## Next Steps

- Learn about [Scene Management](./scene-management.md)
- Explore [Performance Optimization](./performance.md)
- Check out the [API Reference](../api/Engine.md)
- View more [Examples](../../examples/)

## Troubleshooting

### WebGPU Not Supported

If you see "WebGPU not supported" error:
- Update to Chrome 113+ or Edge 113+
- Enable WebGPU flag in browser settings
- Check [WebGPU Implementation Status](https://github.com/gpuweb/gpuweb/wiki/Implementation-Status)

### Performance Issues

If experiencing low FPS:
- Reduce object count
- Lower canvas resolution
- Check browser's GPU acceleration is enabled
- Use `debug: true` to see performance metrics

### Memory Errors

If seeing memory-related errors:
- Reduce `maxObjects` in engine config
- Call `cleanup()` when destroying engine
- Ensure proper scene destruction

## Getting Help

- 📖 [Full Documentation](../README.md)
- 🐛 [Report Issues](https://github.com/oasiscompany/OasisSDF/issues)
- 💬 [Join Discussion](https://github.com/oasiscompany/OasisSDF/discussions)
