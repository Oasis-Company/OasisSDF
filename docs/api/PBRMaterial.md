# PBRMaterial API Reference

## Overview

The `PBRMaterial` class represents a physically based rendering (PBR) material in the OasisSDF engine. It provides methods for creating and managing PBR material properties, including color, metallic, roughness, emission, and transparency.

## Import

```typescript
import { PBRMaterial } from '../src/objects/PBRMaterial.js';
```

## Constructor

### `new PBRMaterial(materialData)`

Creates a new PBRMaterial instance with the provided properties.

**Parameters:**
- `materialData` (Partial<MaterialData>): Material properties to set.

**Returns:**
- A new PBRMaterial instance.

**Example:**

```typescript
const material = new PBRMaterial({
  color: [0.8, 0.2, 0.2],
  metallic: 0.0,
  roughness: 0.5
});
```

## Properties

### `color`
- (readonly [number, number, number]): The material color.

### `metallic`
- (readonly number): The material metallicness (0.0 to 1.0).

### `roughness`
- (readonly number): The material roughness (0.0 to 1.0).

### `reflectance`
- (readonly number): The material reflectance (0.0 to 1.0).

### `emission`
- (readonly [number, number, number]): The material emission color.

### `emissionIntensity`
- (readonly number): The material emission intensity.

### `ambientOcclusion`
- (readonly number): The material ambient occlusion (0.0 to 1.0).

### `transmission`
- (readonly number): The material transmission (0.0 to 1.0).

### `ior`
- (readonly number): The material index of refraction.

## Methods

### `clone()`

Creates a clone of the material.

**Returns:**
- (PBRMaterial): A new PBRMaterial instance with the same properties.

**Example:**

```typescript
const clonedMaterial = material.clone();
```

### `toJSON()`

Converts the material to a JSON object.

**Returns:**
- (Object): The material properties as a JSON object.

**Example:**

```typescript
const materialJSON = material.toJSON();
console.log('Material JSON:', materialJSON);
```

### `static createMetallic(color, metallic, roughness)`

Creates a metallic material preset.

**Parameters:**
- `color` ([number, number, number]): The material color.
- `metallic` (number, optional): The material metallicness. Defaults to 1.0.
- `roughness` (number, optional): The material roughness. Defaults to 0.2.

**Returns:**
- (PBRMaterial): A new PBRMaterial instance with metallic properties.

**Example:**

```typescript
const goldMaterial = PBRMaterial.createMetallic([0.8, 0.6, 0.2], 1.0, 0.1);
```

### `static createEmissive(color, intensity)`

Creates an emissive material preset.

**Parameters:**
- `color` ([number, number, number]): The emission color.
- `intensity` (number, optional): The emission intensity. Defaults to 1.0.

**Returns:**
- (PBRMaterial): A new PBRMaterial instance with emissive properties.

**Example:**

```typescript
const neonMaterial = PBRMaterial.createEmissive([1.0, 0.2, 0.2], 3.0);
```

### `static createGlass(color, transmission, ior)`

Creates a glass material preset.

**Parameters:**
- `color` ([number, number, number]): The material color.
- `transmission` (number, optional): The transmission value. Defaults to 1.0.
- `ior` (number, optional): The index of refraction. Defaults to 1.5.

**Returns:**
- (PBRMaterial): A new PBRMaterial instance with glass properties.

**Example:**

```typescript
const glassMaterial = PBRMaterial.createGlass([0.9, 0.9, 1.0], 1.0, 1.5);
```

### `static createPlastic(color, roughness)`

Creates a plastic material preset.

**Parameters:**
- `color` ([number, number, number]): The material color.
- `roughness` (number, optional): The material roughness. Defaults to 0.1.

**Returns:**
- (PBRMaterial): A new PBRMaterial instance with plastic properties.

**Example:**

```typescript
const plasticMaterial = PBRMaterial.createPlastic([0.2, 0.6, 0.8], 0.1);
```

### `static createRubber(color, roughness)`

Creates a rubber material preset.

**Parameters:**
- `color` ([number, number, number]): The material color.
- `roughness` (number, optional): The material roughness. Defaults to 0.9.

**Returns:**
- (PBRMaterial): A new PBRMaterial instance with rubber properties.

**Example:**

```typescript
const rubberMaterial = PBRMaterial.createRubber([0.2, 0.2, 0.2], 0.9);
```

## Usage Examples

### Basic Material Creation

```typescript
// Create a basic material
const material = new PBRMaterial({
  color: [0.8, 0.2, 0.2],
  metallic: 0.0,
  roughness: 0.5,
  reflectance: 0.04,
  emission: [0, 0, 0],
  emissionIntensity: 0,
  ambientOcclusion: 1.0
});

console.log('Material color:', material.color);
console.log('Material metallic:', material.metallic);
console.log('Material roughness:', material.roughness);
```

### Using Material Presets

```typescript
// Create metallic material
const goldMaterial = PBRMaterial.createMetallic([0.8, 0.6, 0.2], 1.0, 0