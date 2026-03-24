# MaterialBuffer API Reference

## Overview

The `MaterialBuffer` class manages the GPU buffer for material data in the OasisSDF engine. It handles buffer creation, updates, and synchronization, with support for dynamic resizing and efficient sparse updates.

## Import

```typescript
import { MaterialBuffer } from '../src/engine/MaterialBuffer.js';
```

## Constructor

### `new MaterialBuffer(bufferManager, maxMaterials, bufferName)`

Creates a new MaterialBuffer instance.

**Parameters:**
- `bufferManager` (BufferManager): BufferManager instance for buffer operations.
- `maxMaterials` (number, optional): Maximum number of materials. Defaults to 1000.
- `bufferName` (string, optional): Buffer name for identification. Defaults to 'materials'.

**Returns:**
- A new MaterialBuffer instance.

**Example:**

```typescript
const materialBuffer = new MaterialBuffer(bufferManager, 1000, 'materials');
```

## Methods

### `setMaterialManager(manager)`

Sets the material manager for this buffer.

**Parameters:**
- `manager` (MaterialManager): MaterialManager instance.

**Returns:**
- (void)

**Example:**

```typescript
const materialManager = new MaterialManager(1000);
materialBuffer.setMaterialManager(materialManager);
```

### `update()`

Updates the buffer with all materials, resizing if needed.

**Returns:**
- (void)

**Example:**

```typescript
materialBuffer.update();
```

### `updateDirtyMaterials()`

Updates only the dirty materials in the buffer.

**Returns:**
- (void)

**Example:**

```typescript
materialBuffer.updateDirtyMaterials();
```

### `resizeBuffer(newMaxMaterials)`

Resizes the material buffer to the specified maximum number of materials.

**Parameters:**
- `newMaxMaterials` (number): New maximum number of materials.

**Returns:**
- (void)

**Example:**

```typescript
materialBuffer.resizeBuffer(2000);
```

### `getBuffer()`

Gets the GPU buffer.

**Returns:**
- (any): The GPU buffer.

**Example:**

```typescript
const buffer = materialBuffer.getBuffer();
```

### `getMaxMaterials()`

Gets the maximum material capacity.

**Returns:**
- (number): The maximum number of materials.

**Example:**

```typescript
const max = materialBuffer.getMaxMaterials();
console.log('Max materials:', max);
```

### `getBufferSize()`

Gets the current buffer size in bytes.

**Returns:**
- (number): Buffer size in bytes.

**Example:**

```typescript
const size = materialBuffer.getBufferSize();
console.log('Buffer size:', size, 'bytes');
```

### `destroy()`

Destroys the material buffer.

**Returns:**
- (void)

**Example:**

```typescript
materialBuffer.destroy();
```

## Internal Methods

### `createBuffer()`

Creates the material buffer.

**Returns:**
- (void)

### `shouldResize()`

Checks if the buffer needs resizing based on material utilization.

**Returns:**
- (boolean): True if the buffer needs resizing, false otherwise.

### `resizeIfNeeded()`

Resizes the buffer if needed based on material utilization.

**Returns:**
- (void)

## Properties

### `bufferManager`
- (BufferManager): BufferManager instance for buffer operations.

### `bufferName`
- (string): Buffer name for identification.

### `maxMaterials`
- (number): Maximum number of materials.

### `bufferSize`
- (number): Current buffer size in bytes.

### `materialManager`
- (MaterialManager | null): MaterialManager instance.

### `targetUtilization`
- (number): Target buffer utilization (default: 0.7).

### `minBufferSize`
- (number): Minimum buffer size (default: 100).

### `maxBufferSize`
- (number): Maximum buffer size (default: 10000).

## Usage Examples

### Basic Usage

```typescript
// Create buffer manager
const bufferManager = new BufferManager(device);

// Create material manager
const materialManager = new MaterialManager(1000);

// Create material buffer
const materialBuffer = new MaterialBuffer(bufferManager, 1000);
materialBuffer.setMaterialManager(materialManager);

// Create materials
const material1 = materialManager.createMaterial({ color: [1, 0, 0] });
const material2 = materialManager.createMaterial({ color: [0, 1, 0] });
const material3 = materialManager.createMaterial({ color: [0, 0, 1] });

// Update buffer
materialBuffer.update();

// Update only dirty materials
materialManager.updateMaterial(material1, { color: [1, 1, 0] });
materialBuffer.updateDirtyMaterials();

// Resize buffer
materialBuffer.resizeBuffer(2000);

// Cleanup
materialBuffer.destroy();
```

### Dynamic Buffer Resizing

The MaterialBuffer automatically resizes based on material utilization:

1. When material utilization exceeds 70%, the buffer size doubles
2. When material utilization drops below 35%, the buffer size halves
3. Buffer size is constrained between `minBufferSize` (100) and `maxBufferSize` (10000)

### Sparse Buffer Updates

The MaterialBuffer optimizes buffer updates by:

1. Only updating dirty materials
2. Using sparse allocation to minimize memory usage
3. Reusing buffer slots for destroyed materials

### Error Handling

The MaterialBuffer throws `BufferError` in the following cases:

- When failing to create the material buffer
- When failing to update the material buffer
- When failing to resize the material buffer

```typescript
try {
  materialBuffer.update();
} catch (error) {
  console.error('Error updating material buffer:', error);
}
```
