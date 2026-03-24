# SDF Primitives Guide

Welcome to the SDF (Signed Distance Function) Primitives guide for OasisSDF. This document provides detailed information about all the available SDF primitives and how to use them in your scenes.

## What are SDF Primitives?

SDF primitives are basic geometric shapes defined by functions that return the signed distance from any point in space to the surface of the shape. In OasisSDF, these primitives are used as building blocks for creating complex 3D scenes.

## Available SDF Primitives

OasisSDF currently supports the following SDF primitives:

### 1. Sphere

A perfect sphere with a specified radius.

#### Parameters
- `radius`: The radius of the sphere (default: 1.0)

#### Example
```typescript
const sphere = engine.createObject();
sphere.setSDFType('sphere');
sphere.setFloat('radius', 2.0);
sphere.setPosition([0, 0, 0]);
```

### 2. Box

An axis-aligned box with specified dimensions.

#### Parameters
- `size`: The size of the box along each axis (default: [1, 1, 1])

#### Example
```typescript
const box = engine.createObject();
box.setSDFType('box');
box.setVec3('size', [2, 1, 3]);
box.setPosition([1, 0, -1]);
```

### 3. Torus

A torus (doughnut shape) with specified radii.

#### Parameters
- `radiusMajor`: The major radius (distance from the center to the center of the tube) (default: 1.0)
- `radiusMinor`: The minor radius (radius of the tube) (default: 0.25)

#### Example
```typescript
const torus = engine.createObject();
torus.setSDFType('torus');
torus.setFloat('radiusMajor', 1.5);
torus.setFloat('radiusMinor', 0.3);
torus.setPosition([0, 0, 0]);
torus.setRotation([0, Math.PI/2, 0]);
```

### 4. Capsule

A capsule shape, which is a cylinder with hemispherical ends.

#### Parameters
- `height`: The height of the capsule (excluding the hemispherical ends) (default: 2.0)
- `radius`: The radius of the capsule (default: 0.5)

#### Example
```typescript
const capsule = engine.createObject();
capsule.setSDFType('capsule');
capsule.setFloat('height', 3.0);
capsule.setFloat('radius', 0.4);
capsule.setPosition([-1, 0, 0]);
capsule.setRotation([Math.PI/2, 0, 0]);
```

### 5. Cylinder

A cylinder with specified height and radius.

#### Parameters
- `height`: The height of the cylinder (default: 2.0)
- `radius`: The radius of the cylinder (default: 0.5)

#### Example
```typescript
const cylinder = engine.createObject();
cylinder.setSDFType('cylinder');
cylinder.setFloat('height', 2.5);
cylinder.setFloat('radius', 0.6);
cylinder.setPosition([0, 0, 1]);
```

### 6. Cone

A cone with specified height and base radius.

#### Parameters
- `height`: The height of the cone (default: 2.0)
- `radius`: The radius of the cone's base (default: 0.5)

#### Example
```typescript
const cone = engine.createObject();
cone.setSDFType('cone');
cone.setFloat('height', 2.0);
cone.setFloat('radius', 0.8);
cone.setPosition([1, 0, 1]);
```

## Transforming SDF Primitives

All SDF primitives can be transformed using the following methods:

### Position
```typescript
object.setPosition([x, y, z]);
```

### Rotation
```typescript
// Rotation in radians around each axis (X, Y, Z)
object.setRotation([rx, ry, rz]);
```

### Scale
```typescript
object.setScale([sx, sy, sz]);
```

## Combining SDF Primitives

While OasisSDF currently supports individual SDF primitives, future versions will include operations for combining primitives (union, intersection, difference) to create more complex shapes.

## Performance Considerations

- **SDF Complexity**: Different SDF primitives have different computational costs. Spheres are the fastest, while torus and capsule are slightly more complex.
- **Object Count**: Keep the number of objects reasonable for your target performance. OasisSDF can handle 10,000+ simple objects at 60 FPS.
- **Level of Detail**: Use simpler primitives for distant objects and more complex ones for close-up objects.

## Best Practices

1. **Reuse Objects**: Instead of creating multiple identical objects, create one and reuse it with different transformations.
2. **Material Assignment**: Assign materials to objects to enhance their appearance.
3. **Hierarchical Scenes**: Organize objects into logical groups for easier management.
4. **Bounding Volumes**: For complex scenes, consider using bounding volumes to optimize ray marching.

## Example: Creating a Scene with Multiple Primitives

```typescript
import { Engine } from '../src/Engine';

// Initialize engine
const engine = new Engine();
await engine.initialize();

// Create a sphere
const sphere = engine.createObject();
sphere.setSDFType('sphere');
sphere.setFloat('radius', 1.0);
sphere.setPosition([-2, 0, 0]);

// Create a box
const box = engine.createObject();
box.setSDFType('box');
box.setVec3('size', [1, 1, 1]);
box.setPosition([0, 0, 0]);

// Create a torus
const torus = engine.createObject();
torus.setSDFType('torus');
torus.setFloat('radiusMajor', 1.0);
torus.setFloat('radiusMinor', 0.3);
torus.setPosition([2, 0, 0]);
torus.setRotation([0, Math.PI/2, 0]);

// Start rendering
engine.start();
```

## Troubleshooting

### Object Not Visible
- Check if the object is within the camera's view frustum
- Verify the object's position and scale
- Ensure the object's SDF type and parameters are correctly set

### Performance Issues
- Reduce the number of objects in the scene
- Use simpler SDF primitives where possible
- Optimize material usage

## Conclusion

SDF primitives are the building blocks of your OasisSDF scenes. By combining these primitives with transformations and materials, you can create complex and visually appealing 3D environments. Experiment with different primitives and configurations to achieve your desired results.
