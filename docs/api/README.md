# OasisSDF API Reference

Welcome to the OasisSDF API reference. This document provides an overview of all the available API documentation for the OasisSDF engine.

## Table of Contents

- [Core Classes](#core-classes)
- [Material System](#material-system)
- [Scene Management](#scene-management)
- [Utilities](#utilities)

## Core Classes

### Engine

**File**: [Engine.md](./Engine.md)

The main engine class that manages the entire rendering system.

**Key Features**:
- Initialization and configuration
- Scene management
- Object creation and manipulation
- Rendering control
- Buffer management

**Main Methods**:
- `initialize()`: Initialize the engine
- `createScene()`: Create a new scene
- `createObject()`: Create a new SDF object
- `createLight()`: Create a new light
- `start()`: Start the rendering loop
- `stop()`: Stop the rendering loop

## Material System

### MaterialManager

**File**: [MaterialManager.md](./MaterialManager.md)

Manages materials and their lifecycle.

**Key Features**:
- Material creation and destruction
- Material property updates
- Sparse buffer allocation
- Memory optimization

**Main Methods**:
- `createMaterial()`: Create a new material
- `updateMaterial()`: Update material properties
- `removeMaterial()`: Remove a material
- `getMaterialCount()`: Get the number of materials

### MaterialBuffer

**File**: [MaterialBuffer.md](./MaterialBuffer.md)

Manages the GPU buffer for material data.

**Key Features**:
- Dynamic buffer resizing
- Sparse updates
- Memory optimization
- Buffer synchronization

**Main Methods**:
- `allocate()`: Allocate space for a new material
- `update()`: Update material data
- `free()`: Free space for a removed material
- `getMemoryInfo()`: Get memory usage information

### PBRMaterial

**File**: [PBRMaterial.md](./PBRMaterial.md)

Physically Based Rendering (PBR) material class.

**Key Features**:
- Metallic-roughness PBR model
- Material presets
- Property validation
- Material cloning

**Main Methods**:
- `setBaseColor()`: Set the base color
- `setMetallic()`: Set the metallic value
- `setRoughness()`: Set the roughness value
- `setEmissive()`: Set the emissive color
- `clone()`: Create a copy of the material

## Scene Management

### Scene

**File**: [Scene.md](./Scene.md)

Manages a collection of objects and lights.

**Key Features**:
- Object management
- Light management
- Scene configuration
- Rendering settings

**Main Methods**:
- `addObject()`: Add an object to the scene
- `removeObject()`: Remove an object from the scene
- `updateObject()`: Update object properties
- `addLight()`: Add a light to the scene
- `removeLight()`: Remove a light from the scene
- `updateLight()`: Update light properties

## Utilities

### Type Definitions

**File**: `src/types.ts`

Contains TypeScript type definitions for the engine.

**Key Types**:
- `SDFObjectData`: SDF object data structure
- `LightData`: Light data structure
- `MaterialData`: Material data structure
- `CameraData`: Camera data structure

### Shader Utilities

**File**: `src/shaders/`

Contains WGSL shaders for SDF rendering.

**Key Shaders**:
- `sdf-primitives.wgsl`: SDF primitive functions
- `pbr.wgsl`: PBR lighting functions
- `render.wgsl`: Main render shader

## API Usage Examples

### Basic Engine Initialization

```typescript
import { Engine } from '../src/Engine';

async function init() {
  const engine = new Engine();
  await engine.initialize();
  
  // Create a scene
  const scene = engine.createScene('main');
  
  // Create an object
  const sphere = engine.createObject();
  sphere.setSDFType('sphere');
  sphere.setFloat('radius', 1.0);
  sphere.setPosition([0, 0, 0]);
  
  // Start rendering
  engine.start();
}

init();
```

### Material Creation

```typescript
import { Engine } from '../src/Engine';

async function init() {
  const engine = new Engine();
  await engine.initialize();
  
  // Create a PBR material
  const material = engine.createMaterial('pbr');
  material.setBaseColor([0.8, 0.2, 0.2]);
  material.setMetallic(0.8);
  material.setRoughness(0.2);
  
  // Create an object with the material
  const sphere = engine.createObject();
  sphere.setSDFType('sphere');
  sphere.setFloat('radius', 1.0);
  sphere.setMaterial(material.id);
  
  engine.start();
}

init();
```

### Scene Management

```typescript
import { Engine } from '../src/Engine';

async function init() {
  const engine = new Engine();
  await engine.initialize();
  
  // Create multiple scenes
  const scene1 = engine.createScene('scene1');
  const scene2 = engine.createScene('scene2');
  
  // Add objects to scene1
  const sphere = engine.createObject();
  sphere.setSDFType('sphere');
  sphere.setFloat('radius', 1.0);
  sphere.setPosition([0, 0, 0]);
  
  // Add objects to scene2
  const box = engine.createObject();
  box.setSDFType('box');
  box.setVec3('size', [1, 1, 1]);
  box.setPosition([0, 0, 0]);
  
  // Switch between scenes
  engine.setActiveScene('scene1');
  
  // Later...
  setTimeout(() => {
    engine.setActiveScene('scene2');
  }, 5000);
  
  engine.start();
}

init();
```

## API Versioning

OasisSDF uses semantic versioning for its API:

- **Major**: Breaking changes
- **Minor**: New features, no breaking changes
- **Patch**: Bug fixes, no breaking changes

## Deprecation Policy

When an API is deprecated:
- It will be marked as deprecated in the documentation
- A warning will be logged when using the deprecated API
- The deprecated API will be removed in the next major version

## Error Handling

All API methods that can fail will throw errors with descriptive messages. Always use try-catch blocks when calling these methods:

```typescript
try {
  const engine = new Engine();
  await engine.initialize();
} catch (error) {
  console.error('Engine initialization failed:', error);
}
```

## Performance Considerations

- **Buffer Updates**: Batch updates to minimize GPU transfers
- **Object Count**: Keep object count under 10,000 for optimal performance
- **Material Usage**: Use PBR materials sparingly on lower-end devices
- **Light Count**: Limit light count to 4-8 for best performance

## Conclusion

The OasisSDF API provides a powerful and flexible way to create and manage 3D scenes using SDFs and WebGPU. By understanding the core classes and their methods, you can create complex and visually stunning 3D applications with high performance.

For more detailed information about each class, please refer to the individual API documentation files linked above.
