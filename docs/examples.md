# OasisSDF Examples

This document provides an index of all the examples included with OasisSDF, along with descriptions of what each example demonstrates and how to run them.

## Table of Contents

- [Basic Examples](#basic-examples)
- [Material Examples](#material-examples)
- [Scene Management Examples](#scene-management-examples)

## Basic Examples

### 1. Sphere Example

**File**: `examples/basic/sphere.html`

**Description**: A simple example demonstrating how to create a basic sphere object with OasisSDF.

**Features**: 
- Creates a single sphere object
- Sets basic properties (position, radius)
- Demonstrates basic engine initialization

**How to run**: 
```bash
# Open directly in browser
open examples/basic/sphere.html

# Or serve through development server
npm run dev
# Then navigate to http://localhost:3000/examples/basic/sphere.html
```

### 2. Objects Example

**File**: `examples/basic/objects.html`

**Description**: Demonstrates creating multiple different SDF objects in a single scene.

**Features**: 
- Creates multiple objects (sphere, box, torus)
- Demonstrates different SDF primitive types
- Shows how to set object properties

**How to run**: 
```bash
open examples/basic/objects.html
# Or through dev server: http://localhost:3000/examples/basic/objects.html
```

### 3. PBR Demo Example

**File**: `examples/basic/pbr-demo.html`

**Description**: A demonstration of Physically Based Rendering (PBR) materials with OasisSDF.

**Features**: 
- Creates objects with PBR materials
- Demonstrates different material properties
- Shows basic lighting setup

**How to run**: 
```bash
open examples/basic/pbr-demo.html
# Or through dev server: http://localhost:3000/examples/basic/pbr-demo.html
```

## Material Examples

### 1. Basic Material Example

**File**: `examples/material-basics.ts`

**Description**: A comprehensive example demonstrating the core functionality of the material system.

**Features**: 
- WebGPU availability check with fallback
- Material creation and management
- Material property updates
- Material lifecycle management
- Performance monitoring

**How to run**: 
```bash
# Using tsx
npx tsx examples/material-basics.ts

# Or as an npm script
npm run example:material-basics
```

**Key Concepts**: 
- MaterialManager for material management
- MaterialBuffer for memory optimization
- Sparse buffer allocation
- Dynamic buffer resizing

### 2. PBR Material Showcase

**File**: `examples/pbr-materials.ts`

**Description**: A showcase of different PBR material presets and their visual effects.

**Features**: 
- 8 different PBR material presets (gold, silver, rust, plastic, rubber, neon, glass, jade)
- Material property adjustments
- Lighting setup for material demonstration
- Performance monitoring

**How to run**: 
```bash
# Using tsx
npx tsx examples/pbr-materials.ts

# Or as an npm script
npm run example:pbr-materials
```

**Material Presets**: 
- **Gold**: Metallic material with warm golden color
- **Silver**: Metallic material with cool silver color
- **Rust**: Non-metallic material with rusty appearance
- **Plastic**: Smooth non-metallic material
- **Rubber**: Rough non-metallic material
- **Neon**: Emissive material with bright colors
- **Glass**: Transparent material with refraction
- **Jade**: Semi-transparent material with green hue

## Scene Management Examples

### 1. Scene Management Demo

**File**: `examples/scene-management.html`

**Description**: Demonstrates how to create and switch between multiple scenes in OasisSDF.

**Features**: 
- Creates multiple scenes
- Demonstrates scene switching
- Shows how to manage objects in different scenes

**How to run**: 
```bash
open examples/scene-management.html
# Or through dev server: http://localhost:3000/examples/scene-management.html
```

## How to Create Your Own Examples

To create your own examples with OasisSDF, follow these steps:

1. **Create a new file** in the `examples` directory
2. **Import the Engine** from the src directory
3. **Initialize the engine**
4. **Create objects** and set their properties
5. **Add lights** to illuminate the scene
6. **Start the engine**

### Example Template

```typescript
import { Engine } from '../src/Engine';

async function run() {
  // Check for WebGPU support
  if (!('gpu' in navigator)) {
    console.error('WebGPU is not supported');
    return;
  }

  try {
    // Initialize the engine
    const engine = new Engine();
    await engine.initialize();

    // Create objects
    const sphere = engine.createObject();
    sphere.setSDFType('sphere');
    sphere.setFloat('radius', 1.0);
    sphere.setPosition([0, 0, 0]);

    // Add lights
    const directionalLight = engine.createLight('directional');
    directionalLight.setVec3('direction', [0.5, -1, 0.5]);
    directionalLight.setVec3('color', [1, 1, 1]);

    // Start rendering
    engine.start();
  } catch (error) {
    console.error('Error:', error);
  }
}

run();
```

## Best Practices for Examples

- **Keep examples focused** on a single concept or feature
- **Include comments** to explain what the code is doing
- **Handle WebGPU compatibility** with appropriate fallbacks
- **Monitor performance** to ensure smooth rendering
- **Clean up resources** when the example is done

## Troubleshooting Examples

### Common Issues

- **WebGPU not available**: Make sure you're using a supported browser (Chrome 113+, Edge 113+)
- **Engine initialization failed**: Check the browser console for error messages
- **Objects not visible**: Verify object positions and camera settings
- **Materials not displaying correctly**: Check material properties and lighting setup

### Debugging Tips

- Use the browser console to log errors and debug information
- Check the WebGPU inspector in Chrome DevTools for shader compilation errors
- Verify that all required dependencies are installed
- Test examples in multiple browsers to ensure compatibility

## Conclusion

The examples provided with OasisSDF demonstrate the core functionality of the engine and serve as a starting point for your own projects. By studying these examples, you can learn how to create objects, apply materials, set up lighting, and manage scenes with OasisSDF.

Feel free to modify and extend these examples to explore the full capabilities of the engine!
