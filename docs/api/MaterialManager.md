# MaterialManager API Reference

## Overview

The `MaterialManager` class manages the lifecycle, instantiation, and buffer synchronization of materials in the OasisSDF engine. It provides methods for creating, updating, and destroying materials, as well as handling reference counting and dirty state tracking.

## Import

```typescript
import { MaterialManager } from '../src/engine/MaterialManager.js';
```

## Constructor

### `new MaterialManager(maxMaterials)`

Creates a new MaterialManager instance.

**Parameters:**
- `maxMaterials` (number, optional): Maximum number of materials to support. Defaults to 1000.

**Returns:**
- A new MaterialManager instance.

**Example:**

```typescript
const materialManager = new MaterialManager(1000);
```

## Methods

### `createMaterial(materialData)`

Creates a new material instance with the provided properties.

**Parameters:**
- `materialData` (Partial<MaterialData>): Material properties to set.

**Returns:**
- (number): The ID of the created material.

**Example:**

```typescript
const materialId = materialManager.createMaterial({
  color: [0.8, 0.2, 0.2],
  metallic: 0.0,
  roughness: 0.5
});
```

### `getMaterial(materialId)`

Gets the material data for the specified material ID.

**Parameters:**
- `materialId` (number): The ID of the material to get.

**Returns:**
- (MaterialData | null): The material data, or null if the material does not exist.

**Example:**

```typescript
const material = materialManager.getMaterial(1);
console.log('Material color:', material?.color);
```

### `updateMaterial(materialId, materialData)`

Updates the properties of an existing material.

**Parameters:**
- `materialId` (number): The ID of the material to update.
- `materialData` (Partial<MaterialData>): Material properties to update.

**Returns:**
- (void)

**Example:**

```typescript
materialManager.updateMaterial(1, {
  color: [0.2, 0.8, 0.2],
  roughness: 0.3
});
```

### `referenceMaterial(materialId)`

Increments the reference count for a material.

**Parameters:**
- `materialId` (number): The ID of the material to reference.

**Returns:**
- (void)

**Example:**

```typescript
materialManager.referenceMaterial(1);
```

### `releaseMaterial(materialId)`

Decrements the reference count for a material and destroys it if no references remain.

**Parameters:**
- `materialId` (number): The ID of the material to release.

**Returns:**
- (boolean): True if the material was destroyed, false otherwise.

**Example:**

```typescript
const destroyed = materialManager.releaseMaterial(1);
console.log('Material destroyed:', destroyed);
```

### `getMaterialsForBuffer()`

Gets all materials as an array for buffer writing, using sparse allocation.

**Returns:**
- (MaterialData[]): An array of material data.

**Example:**

```typescript
const materials = materialManager.getMaterialsForBuffer();
console.log('Materials for buffer:', materials.length);
```

### `getAllMaterials()`

Gets all materials as an array.

**Returns:**
- (MaterialData[]): An array of material data.

**Example:**

```typescript
const materials = materialManager.getAllMaterials();
console.log('All materials:', materials.length);
```

### `getDirtyMaterials()`

Gets the set of material IDs that need to be updated in the buffer.

**Returns:**
- (Set<number>): A set of material IDs.

**Example:**

```typescript
const dirtyMaterials = materialManager.getDirtyMaterials();
console.log('Dirty materials:', dirtyMaterials.size);
```

### `clearDirtyMaterials()`

Clears the dirty flag for all materials.

**Returns:**
- (void)

**Example:**

```typescript
materialManager.clearDirtyMaterials();
```

### `getMaterialCount()`

Gets the current number of active materials.

**Returns:**
- (number): The number of active materials.

**Example:**

```typescript
const count = materialManager.getMaterialCount();
console.log('Material count:', count);
```

### `getMaxMaterials()`

Gets the maximum material capacity.

**Returns:**
- (number): The maximum number of materials.

**Example:**

```typescript
const max = materialManager.getMaxMaterials();
console.log('Max materials:', max);
```

### `hasMaterial(materialId)`

Checks if a material with the specified ID exists.

**Parameters:**
- `materialId` (number): The ID of the material to check.

**Returns:**
- (boolean): True if the material exists, false otherwise.

**Example:**

```typescript
const exists = materialManager.hasMaterial(1);
console.log('Material exists:', exists);
```

### `getBufferIndex(materialId)`

Gets the buffer index for a material.

**Parameters:**
- `materialId` (number): The ID of the material.

**Returns:**
- (number): The buffer index, or -1 if the material does not exist.

**Example:**

```typescript
const index = materialManager.getBufferIndex(1);
console.log('Buffer index:', index);
```

### `clear()`

Clears all materials.

**Returns:**
- (void)

**Example:**

```typescript
materialManager.clear();
console.log('Materials cleared');
```

### `getMaterialInstance(materialId)`

Gets the material instance for the specified ID (internal use only).

**Parameters:**
- `materialId` (number): The ID of the material.

**Returns:**
- (MaterialInstance | null): The material instance, or null if the material does not exist.

**Example:**

```typescript
const instance = materialManager.getMaterialInstance(1);
console.log('Material ref count:', instance?.refCount);
```

## MaterialInstance Interface

```typescript
interface MaterialInstance {
  id: number;
  data: MaterialData;
  refCount: number;
  isDirty: boolean;
  bufferIndex: number;
}
```

## MaterialData Interface

```typescript
interface MaterialData {
  color: [number, number, number];
  metallic: number;
  roughness: number;
  reflectance: number;
  emission: [number, number, number];
  emissionIntensity: number;
  ambientOcclusion: number;
  transmission?: number;
  ior?: number;
}
```

## Usage Examples

### Basic Material Creation and Management

```typescript
// Create material manager
const materialManager = new MaterialManager(100);

// Create materials
const redMaterial = materialManager.createMaterial({
  color: [1, 0, 0],
  metallic: 0,
  roughness: 0.5
});

const blueMaterial = materialManager.createMaterial({
  color: [0, 0, 1],
  metallic: 1,
  roughness: 0.2
});

// Update material
materialManager.updateMaterial(redMaterial, {
  color: [1, 0.5, 0]
});

// Reference and release materials
materialManager.referenceMaterial(redMaterial);
console.log('Ref count after reference:', materialManager.getMaterialInstance(redMaterial)?.refCount);

const destroyed = materialManager.releaseMaterial(redMaterial);
console.log('Material destroyed:', destroyed);
console.log('Ref count after release:', materialManager.getMaterialInstance(redMaterial)?.refCount);

// Cleanup
materialManager.releaseMaterial(redMaterial);
materialManager.releaseMaterial(blueMaterial);
console.log('Final material count:', materialManager.getMaterialCount());
```

### Sparse Buffer Allocation

The MaterialManager uses sparse buffer allocation to optimize memory usage:

1. When materials are created, they are assigned to available buffer slots
2. When materials are destroyed, their buffer slots are reused
3. This reduces memory usage by only allocating buffer space for active materials

### Error Handling

The MaterialManager throws `ValidationError` in the following cases:

- When trying to create more materials than the maximum capacity
- When trying to access a material that does not exist

```typescript
try {
  // Try to create more materials than maximum
  const materialManager = new MaterialManager(2);
  materialManager.createMaterial({ color: [1, 0, 0] });
  materialManager.createMaterial({ color: [0, 1, 0] });
  materialManager.createMaterial({ color: [0, 0, 1] }); // Will throw error
} catch (error) {
  console.error('Error:', error);
}
```
