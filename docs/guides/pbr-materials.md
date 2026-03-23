# PBR Material Guide

This guide provides detailed information about Physically Based Rendering (PBR) materials in OasisSDF, including material properties, presets, and best practices.

## Overview

PBR materials in OasisSDF follow the Disney/Burley BRDF model, which provides physically accurate rendering of materials under different lighting conditions. This approach allows for more realistic and consistent results across various lighting scenarios.

## Material Properties

### Base Properties

| Property | Type | Range | Description |
|----------|------|-------|-------------|
| `color` | `[number, number, number]` | 0.0 - 1.0 | Base diffuse color of the material |
| `metallic` | `number` | 0.0 - 1.0 | How metallic the material is (0 = dielectric, 1 = metal) |
| `roughness` | `number` | 0.0 - 1.0 | How rough the surface is (0 = smooth, 1 = rough) |
| `reflectance` | `number` | 0.0 - 1.0 | Base reflectance at normal incidence |
| `emission` | `[number, number, number]` | 0.0 - Infinity | Emissive color of the material |
| `emissionIntensity` | `number` | 0.0 - Infinity | Intensity of the emissive color |
| `ambientOcclusion` | `number` | 0.0 - 1.0 | Ambient occlusion factor |

### Property Details

#### Color

The base color of the material. For dielectrics (non-metals), this represents the diffuse color. For metals, this represents the reflectance color.

```typescript
// Example: Red plastic
const redPlastic = engine.createMaterial({
  color: [1, 0, 0],
  metallic: 0.0,
  roughness: 0.8
});

// Example: Gold metal
const gold = engine.createMaterial({
  color: [1, 0.84, 0],
  metallic: 1.0,
  roughness: 0.1
});
```

#### Metallic

Controls how metallic the material is. A value of 0 means the material is a dielectric (like plastic or glass), while 1 means it's a pure metal.

| Value | Material Type |
|-------|---------------|
| 0.0 | Dielectric (plastic, glass, wood) |
| 0.5 | Semi-metallic (corroded metal) |
| 1.0 | Pure metal (gold, silver, aluminum) |

#### Roughness

Controls the surface roughness. Lower values result in sharper reflections, while higher values result in more diffuse reflections.

| Value | Appearance |
|-------|------------|
| 0.0 | Perfect mirror |
| 0.2 | Polished surface |
| 0.5 | Matte surface |
| 0.8 | Rough surface |
| 1.0 | Very rough surface |

#### Emission

Controls the self-illumination of the material. Emissive materials emit light and can be used for things like light sources, neon signs, or glowing objects.

```typescript
// Example: Neon sign
const neon = engine.createMaterial({
  color: [0, 0, 0],
  emission: [0, 1, 1],
  emissionIntensity: 3.0
});
```

## Using the PBRMaterial Class

The `PBRMaterial` class provides a more flexible way to work with materials, including validation, presets, and helper methods.

### Creating Materials

```typescript
import { PBRMaterial } from 'oasissdf';

// Create a material with custom properties
const material = new PBRMaterial({
  color: [0.8, 0.6, 0.4],
  metallic: 0.2,
  roughness: 0.8,
  reflectance: 0.04,
  emission: [0, 0, 0],
  emissionIntensity: 0.0,
  ambientOcclusion: 1.0
});

// Convert to material data for engine use
const materialData = material.toData();
const materialId = engine.createMaterial(materialData);
```

### Material Presets

The `PBRMaterial` class includes several presets for common material types:

#### Metallic

```typescript
// Create a metallic material
const gold = PBRMaterial.createMetallic(
  [1, 0.84, 0], // Color
  1.0,          // Metallic
  0.1           // Roughness
);
```

#### Dielectric

```typescript
// Create a dielectric material
const plastic = PBRMaterial.createDielectric(
  [0.8, 0.8, 0.8], // Color
  0.5              // Roughness
);
```

#### Emissive

```typescript
// Create an emissive material
const glow = PBRMaterial.createEmissive(
  [1, 0.5, 0], // Emission color
  2.0          // Intensity
);
```

#### Plastic

```typescript
// Create a plastic material
const redPlastic = PBRMaterial.createPlastic([1, 0, 0]);
```

#### Glass

```typescript
// Create a glass material
const glass = PBRMaterial.createGlass();

// Create tinted glass
const blueGlass = PBRMaterial.createGlass([0.8, 0.9, 1.0]);
```

### Updating Materials

```typescript
// Update material properties
material.color = [1, 0, 0];
material.roughness = 0.3;

// Apply updates to engine
engine.updateMaterial(materialId, material.toData());
```

### Cloning Materials

```typescript
// Create a copy of a material
const materialCopy = material.clone();

// Modify the copy
materialCopy.color = [0, 1, 0];

// Create in engine
const copyId = engine.createMaterial(materialCopy.toData());
```

## Advanced Material Techniques

### Layered Materials

Create complex materials by layering multiple materials:

```typescript
class LayeredMaterial {
  private baseMaterial: PBRMaterial;
  private topMaterial: PBRMaterial;
  private blendFactor: number;

  constructor(base: PBRMaterial, top: PBRMaterial, blend: number) {
    this.baseMaterial = base;
    this.topMaterial = top;
    this.blendFactor = blend;
  }

  toData(): MaterialData {
    const base = this.baseMaterial.toData();
    const top = this.topMaterial.toData();

    return {
      color: this.blendArrays(base.color, top.color),
      metallic: this.blendValue(base.metallic, top.metallic),
      roughness: this.blendValue(base.roughness, top.roughness),
      reflectance: this.blendValue(base.reflectance, top.reflectance),
      emission: this.blendArrays(base.emission, top.emission),
      emissionIntensity: this.blendValue(base.emissionIntensity, top.emissionIntensity),
      ambientOcclusion: this.blendValue(base.ambientOcclusion, top.ambientOcclusion)
    };
  }

  private blendArrays(a: [number, number, number], b: [number, number, number]): [number, number, number] {
    return [
      a[0] * (1 - this.blendFactor) + b[0] * this.blendFactor,
      a[1] * (1 - this.blendFactor) + b[1] * this.blendFactor,
      a[2] * (1 - this.blendFactor) + b[2] * this.blendFactor
    ];
  }

  private blendValue(a: number, b: number): number {
    return a * (1 - this.blendFactor) + b * this.blendFactor;
  }
}

// Usage
const baseMaterial = new PBRMaterial({ color: [0.8, 0.6, 0.4], roughness: 0.8 });
const topMaterial = new PBRMaterial({ color: [1, 1, 1], metallic: 0.5, roughness: 0.2 });
const layered = new LayeredMaterial(baseMaterial, topMaterial, 0.3);
const layeredId = engine.createMaterial(layered.toData());
```

### Procedural Materials

Create materials with procedural variations:

```typescript
function createMarbleMaterial(intensity: number = 0.1): PBRMaterial {
  // Generate random marble pattern
  const r = 0.8 + Math.random() * 0.2;
  const g = 0.8 + Math.random() * 0.2;
  const b = 0.8 + Math.random() * 0.2;

  return new PBRMaterial({
    color: [r, g, b],
    metallic: 0.0,
    roughness: 0.3 + Math.random() * 0.2,
    ambientOcclusion: 0.9
  });
}

// Create multiple marble materials
for (let i = 0; i < 5; i++) {
  const material = createMarbleMaterial();
  const materialId = engine.createMaterial(material.toData());
  
  // Add object with material
  engine.addObject({
    type: 2, // Box
    position: [i * 2, 0, 0],
    scale: [1, 1, 1],
    materialId
  });
}
```

## Performance Considerations

### Material Count

Each unique material adds to the material buffer size. To optimize performance:

1. **Reuse materials** across similar objects
2. **Limit unique materials** to what's necessary
3. **Batch objects** with the same material together

### Material Updates

Frequent material updates can cause buffer reuploads. To minimize this:

1. **Batch material changes** into fewer updates
2. **Avoid per-frame material changes** unless necessary
3. **Use emissive materials** for animated effects instead of constantly updating base color

## Troubleshooting

### Common Issues

#### Material Not Applying

```typescript
// Check if material exists
if (!engine.getMaterial(materialId)) {
  console.error('Material not found:', materialId);
}

// Check if material ID is valid
const object = engine.getObjects()[objectIndex];
console.log('Object material ID:', object.materialId);
```

#### Materials Look Too Dark/Light

```typescript
// Check lighting setup
const scene = engine.getActiveScene();
console.log('Ambient light:', scene.getAmbientLight());
console.log('Light count:', scene.getLightCount());

// Adjust material properties
engine.updateMaterial(materialId, {
  emissiveIntensity: 1.0, // Add some emission for brightness
  ambientOcclusion: 1.0   // Increase ambient occlusion
});
```

#### Materials Look Unrealistic

```typescript
// Use physically plausible values
const realisticMaterial = new PBRMaterial({
  color: [0.8, 0.8, 0.8],
  metallic: 0.0,    // Non-metal
  roughness: 0.5,   // Medium roughness
  reflectance: 0.04 // Default for dielectrics
});
```

## Best Practices

1. **Start with presets**: Use material presets as a starting point
2. **Use physically plausible values**: Follow real-world material properties
3. **Test under different lighting**: Materials look different under different lighting conditions
4. **Optimize for performance**: Reuse materials and limit unique material count
5. **Validate inputs**: Use the `PBRMaterial` class for automatic validation

## Example: Creating a Material Library

```typescript
class MaterialLibrary {
  private engine: Engine;
  private materials: Map<string, number> = new Map();

  constructor(engine: Engine) {
    this.engine = engine;
    this.initializeMaterials();
  }

  private initializeMaterials(): void {
    // Create common materials
    this.materials.set('gold', this.createGold());
    this.materials.set('silver', this.createSilver());
    this.materials.set('plastic', this.createPlastic());
    this.materials.set('glass', this.createGlass());
    this.materials.set('wood', this.createWood());
    this.materials.set('concrete', this.createConcrete());
  }

  private createGold(): number {
    const material = PBRMaterial.createMetallic([1, 0.84, 0], 1.0, 0.1);
    return this.engine.createMaterial(material.toData());
  }

  private createSilver(): number {
    const material = PBRMaterial.createMetallic([0.9, 0.9, 0.9], 1.0, 0.1);
    return this.engine.createMaterial(material.toData());
  }

  private createPlastic(): number {
    const material = PBRMaterial.createPlastic([0.8, 0.8, 0.8]);
    return this.engine.createMaterial(material.toData());
  }

  private createGlass(): number {
    const material = PBRMaterial.createGlass();
    return this.engine.createMaterial(material.toData());
  }

  private createWood(): number {
    const material = new PBRMaterial({
      color: [0.8, 0.5, 0.3],
      metallic: 0.0,
      roughness: 0.7
    });
    return this.engine.createMaterial(material.toData());
  }

  private createConcrete(): number {
    const material = new PBRMaterial({
      color: [0.6, 0.6, 0.6],
      metallic: 0.0,
      roughness: 0.8,
      ambientOcclusion: 0.8
    });
    return this.engine.createMaterial(material.toData());
  }

  getMaterial(name: string): number | null {
    return this.materials.get(name) || null;
  }

  getAllMaterials(): Map<string, number> {
    return new Map(this.materials);
  }
}

// Usage
const materialLib = new MaterialLibrary(engine);
const goldId = materialLib.getMaterial('gold');

// Add object with gold material
engine.addObject({
  type: 1, // Sphere
  position: [0, 0, 0],
  scale: [1, 1, 1],
  materialId: goldId
});
```

## Next Steps

- Learn about [Scene Management](./scene-management.md)
- Explore [Performance Optimization](./performance.md)
- Check out [Example Projects](../../examples/)
