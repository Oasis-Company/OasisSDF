# Material System Guide

## Overview

The OasisSDF material system provides a comprehensive framework for creating, managing, and applying materials to objects in your scenes. This guide will walk you through the key components of the material system and how to use them effectively.

## Core Components

### 1. MaterialManager

The `MaterialManager` is responsible for:
- Creating and destroying materials
- Managing material lifecycle and reference counting
- Tracking dirty materials for efficient updates
- Providing sparse buffer allocation for memory optimization

### 2. MaterialBuffer

The `MaterialBuffer` handles:
- GPU buffer management for material data
- Dynamic buffer resizing based on usage
- Efficient updates of only dirty materials
- Synchronization between CPU and GPU material data

### 3. PBRMaterial

The `PBRMaterial` class represents:
- Physically based rendering (PBR) material properties
- Material presets for common material types
- Material cloning and serialization
- Property validation for consistent material data

## Getting Started

### Creating a Material Manager

```typescript
import { MaterialManager } from '../src/engine/MaterialManager.js';

// Create a material manager with capacity for 1000 materials
const materialManager = new MaterialManager(1000);
```

### Creating Materials

```typescript
// Create a basic material
const materialId = materialManager.createMaterial({
  color: [0.8, 0.2, 0.2], // Red
  metallic: 0.0,
  roughness: 0.5
});

// Create a metallic material
const metallicId = materialManager.createMaterial({
  color: [0.8, 0.8, 0.8], // Silver
  metallic: 1.0,
  roughness: 0.2
});

// Create an emissive material
const emissiveId = materialManager.createMaterial({
  color: [0.0, 0.0, 0.0],
  emission: [1.0, 0.5, 0.0], // Orange glow
  emissionIntensity: 2.0
});
```

### Using PBRMaterial Presets

```typescript
import { PBRMaterial } from '../src/objects/PBRMaterial.js';

// Create a gold material
const goldMaterial = PBRMaterial.createMetallic([0.8, 0.6, 0.2], 1.0, 0.1);
const goldId = materialManager.createMaterial(goldMaterial.toJSON());

// Create a glass material
const glassMaterial = PBRMaterial.createGlass([0.9, 0.9, 1.0], 1.0, 1.5);
const glassId = materialManager.createMaterial(glassMaterial.toJSON());

// Create a neon material
const neonMaterial = PBRMaterial.createEmissive([1.0, 0.2, 0.2], 3.0);
const neonId = materialManager.createMaterial(neonMaterial.toJSON());
```

### Applying Materials to Objects

```typescript
// Create an object and apply a material
const box = engine.createObject('box');
box.setPosition([0, 0, 0]);
box.setMaterial(materialId);
```

### Updating Materials

```typescript
// Update material properties
materialManager.updateMaterial(materialId, {
  color: [0.2, 0.8, 0.2], // Green
  roughness: 0.3
});

// The material buffer will automatically update the GPU buffer
materialBuffer.updateDirtyMaterials();
```

### Managing Material Lifecycle

```typescript
// Reference a material (increment ref count)
materialManager.referenceMaterial(materialId);

// Release a material (decrement ref count)
const destroyed = materialManager.releaseMaterial(materialId);
console.log('Material destroyed:', destroyed);

// Check material count
console.log('Active materials:', materialManager.getMaterialCount());

// Clear all materials
materialManager.clear();
```

## Advanced Usage

### Sparse Buffer Allocation

The material system uses sparse buffer allocation to optimize memory usage:

1. When materials are created, they are assigned to available buffer slots
2. When materials are destroyed, their buffer slots are reused
3. This reduces memory usage by only allocating buffer space for active materials

### Dynamic Buffer Resizing

The `MaterialBuffer` automatically resizes based on material utilization:

- When utilization > 70%: Buffer size doubles
- When utilization < 35%: Buffer size halves
- Buffer size is constrained between 100 and 10000 materials

### Material Updates

For efficient updates:

1. Use `updateMaterial()` to modify material properties
2. The material is marked as dirty
3. Call `updateDirtyMaterials()` to only update changed materials
4. This minimizes GPU buffer transfers

### Error Handling

Always handle potential errors when working with materials:

```typescript
try {
  // Try to create a material with invalid properties
  const materialId = materialManager.createMaterial({
    color: [1, 0, 0],
    metallic: 2.0, // Invalid: should be between 0 and 1
    roughness: 0.5
  });
} catch (error) {
  console.error('Error creating material:', error);
}
```

## Performance Best Practices

1. **Reuse Materials**: Instead of creating multiple identical materials, reuse the same material ID for multiple objects
2. **Batch Updates**: Group material updates and call `updateDirtyMaterials()` once per frame
3. **Limit Material Count**: Keep the number of unique materials reasonable (hundreds, not thousands)
4. **Use Presets**: Use PBRMaterial presets for common material types
5. **Monitor Memory**: Keep an eye on memory usage when working with many materials

## Example: Complete Material Workflow

```typescript
import { Engine, MaterialManager, MaterialBuffer, PBRMaterial } from '../src/index.js';

// Initialize engine
const engine = new Engine({
  canvas: document.querySelector('canvas')
});
await engine.initialize();

// Get material manager and buffer
const materialManager = engine.getMaterialManager();
const materialBuffer = engine.getMaterialBuffer();

// Create materials
const redMaterial = materialManager.createMaterial({
  color: [1, 0, 0],
  metallic: 0,
  roughness: 0.5
});

const goldMaterial = materialManager.createMaterial(
  PBRMaterial.createMetallic([0.8, 0.6, 0.2]).toJSON()
);

const glassMaterial = materialManager.createMaterial(
  PBRMaterial.createGlass([0.9, 0.9, 1.0]).toJSON()
);

// Create objects with materials
const box1 = engine.createObject('box');
box1.setPosition([-2, 0, 0]);
box1.setMaterial(redMaterial);

const box2 = engine.createObject('box');
box2.setPosition([0, 0, 0]);
box2.setMaterial(goldMaterial);

const box3 = engine.createObject('box');
box3.setPosition([2, 0, 0]);
box3.setMaterial(glassMaterial);

// Update a material
setInterval(() => {
  const time = Date.now() * 0.001;
  materialManager.updateMaterial(redMaterial, {
    color: [
      Math.sin(time * 0.5) * 0.5 + 0.5,
      Math.sin(time * 0.3) * 0.5 + 0.5,
      Math.sin(time * 0.7) * 0.5 + 0.5
    ]
  });
  materialBuffer.updateDirtyMaterials();
}, 1000);

// Start rendering
engine.start();

// Cleanup on exit
process.on('SIGINT', () => {
  materialManager.releaseMaterial(redMaterial);
  materialManager.releaseMaterial(goldMaterial);
  materialManager.releaseMaterial(glassMaterial);
  engine.destroy();
  process.exit(0);
});
```

## Troubleshooting

### Common Issues

1. **Material not updating**: Make sure to call `updateDirtyMaterials()` after modifying materials
2. **Memory usage high**: Check if materials are being properly released with `releaseMaterial()`
3. **Buffer resize errors**: Ensure buffer size stays within reasonable limits (100-10000 materials)
4. **Validation errors**: Check that material properties are within valid ranges

### Debugging Tips

- Log material counts to monitor memory usage
- Check buffer sizes and utilization
- Use the `getDirtyMaterials()` method to see which materials are being updated
- Monitor frame rates to ensure material updates aren't causing performance issues

## Conclusion

The OasisSDF material system provides a powerful and flexible framework for managing materials in your scenes. By following this guide and best practices, you can create rich, visually appealing scenes with efficient material management.

For more detailed information, refer to the API documentation for each component:
- [MaterialManager API](./../api/MaterialManager.md)
- [MaterialBuffer API](./../api/MaterialBuffer.md)
- [PBRMaterial API](./../api/PBRMaterial.md)
