# Lighting System Guide

Welcome to the Lighting System guide for OasisSDF. This document provides detailed information about the lighting capabilities of OasisSDF, including the available light types, their parameters, and best practices for creating realistic lighting in your scenes.

## Overview

The OasisSDF lighting system supports multiple light types to create realistic and dynamic lighting effects. Lights interact with materials to produce physically accurate shading and reflections, especially when using PBR (Physically Based Rendering) materials.

## Available Light Types

OasisSDF currently supports the following light types:

### 1. Directional Light

A directional light simulates light coming from a distant source, like the sun. It has a uniform direction but no specific position.

#### Parameters
- `direction`: The direction of the light (default: [0, -1, 0])
- `color`: The color of the light (default: [1, 1, 1])
- `intensity`: The intensity of the light (default: 1.0)

#### Example
```typescript
const directionalLight = engine.createLight('directional');
directionalLight.setVec3('direction', [0.5, -1, 0.5]);
directionalLight.setVec3('color', [1, 0.9, 0.8]);
directionalLight.setFloat('intensity', 1.5);
```

### 2. Point Light

A point light emits light in all directions from a specific position, like a light bulb.

#### Parameters
- `position`: The position of the light (default: [0, 0, 0])
- `color`: The color of the light (default: [1, 1, 1])
- `intensity`: The intensity of the light (default: 1.0)
- `attenuation`: The attenuation factor (default: 0.1)

#### Example
```typescript
const pointLight = engine.createLight('point');
pointLight.setVec3('position', [0, 2, 0]);
pointLight.setVec3('color', [1, 0.5, 0.2]);
pointLight.setFloat('intensity', 2.0);
pointLight.setFloat('attenuation', 0.05);
```

### 3. Spot Light

A spot light emits light in a cone shape from a specific position, like a spotlight or flashlight.

#### Parameters
- `position`: The position of the light (default: [0, 0, 0])
- `direction`: The direction of the light (default: [0, -1, 0])
- `color`: The color of the light (default: [1, 1, 1])
- `intensity`: The intensity of the light (default: 1.0)
- `attenuation`: The attenuation factor (default: 0.1)
- `spotAngle`: The angle of the spotlight cone in radians (default: Math.PI/4)
- `spotFalloff`: The falloff factor for the spotlight (default: 1.0)

#### Example
```typescript
const spotLight = engine.createLight('spot');
spotLight.setVec3('position', [0, 3, 0]);
spotLight.setVec3('direction', [0, -1, 0]);
spotLight.setVec3('color', [1, 1, 1]);
spotLight.setFloat('intensity', 3.0);
spotLight.setFloat('attenuation', 0.05);
spotLight.setFloat('spotAngle', Math.PI/6);
spotLight.setFloat('spotFalloff', 2.0);
```

## Light Properties

### Common Light Properties

All light types share the following properties:

- `color`: The RGB color of the light
- `intensity`: The brightness of the light

### Type-Specific Properties

#### Directional Light
- `direction`: The direction the light is pointing

#### Point Light
- `position`: The location of the light source
- `attenuation`: How quickly the light intensity fades with distance

#### Spot Light
- `position`: The location of the light source
- `direction`: The direction the spotlight is pointing
- `attenuation`: How quickly the light intensity fades with distance
- `spotAngle`: The angle of the spotlight cone
- `spotFalloff`: How quickly the light intensity fades from the center to the edge of the cone

## Managing Lights

### Creating Lights

```typescript
// Create a directional light
const directionalLight = engine.createLight('directional');

// Create a point light
const pointLight = engine.createLight('point');

// Create a spot light
const spotLight = engine.createLight('spot');
```

### Updating Lights

```typescript
// Update light properties
directionalLight.setVec3('direction', [1, -1, 0]);
pointLight.setVec3('position', [1, 2, -1]);
spotLight.setFloat('intensity', 2.5);
```

### Removing Lights

```typescript
// Remove a light
engine.removeLight(directionalLight);
```

## Lighting and Materials

Lights interact with materials to create realistic shading effects. Different materials respond differently to light:

### PBR Materials

PBR (Physically Based Rendering) materials provide the most realistic lighting interactions, including:
- Diffuse reflection
- Specular reflection
- Metallic properties
- Roughness
- Normal mapping

### Basic Materials

Basic materials provide simpler lighting interactions, including:
- Diffuse reflection
- Specular reflection

## Performance Considerations

- **Light Count**: The number of lights in a scene affects performance. Limit the number of lights for optimal performance.
- **Light Type**: Directional lights are the most efficient, while spot lights are the most computationally expensive.
- **Attenuation**: Use appropriate attenuation values to limit the influence of lights to specific areas.
- **Shadow Casting**: Future versions of OasisSDF will include shadow casting, which will have additional performance implications.

## Best Practices

1. **Layered Lighting**: Use a combination of directional, point, and spot lights to create depth and interest.
2. **Color Temperature**: Use realistic color temperatures for different light sources (e.g., warm for incandescent, cool for daylight).
3. **Light Positioning**: Position lights to highlight important objects and create interesting shadows.
4. **Intensity Balancing**: Balance the intensity of multiple lights to avoid overexposure or underexposure.
5. **Attenuation Settings**: Use appropriate attenuation to create realistic light falloff.

## Example: Creating a Scene with Multiple Lights

```typescript
import { Engine } from '../src/Engine';

// Initialize engine
const engine = new Engine();
await engine.initialize();

// Create a directional light (sunlight)
const sunLight = engine.createLight('directional');
sunLight.setVec3('direction', [0.5, -1, 0.5]);
sunLight.setVec3('color', [1, 0.9, 0.8]);
sunLight.setFloat('intensity', 1.2);

// Create a point light (warm light)
const warmLight = engine.createLight('point');
warmLight.setVec3('position', [2, 1, 0]);
warmLight.setVec3('color', [1, 0.6, 0.3]);
warmLight.setFloat('intensity', 1.5);
warmLight.setFloat('attenuation', 0.1);

// Create a spot light (accent light)
const spotLight = engine.createLight('spot');
spotLight.setVec3('position', [-2, 2, -2]);
spotLight.setVec3('direction', [1, -1, 1]);
spotLight.setVec3('color', [0.8, 0.9, 1]);
spotLight.setFloat('intensity', 2.0);
spotLight.setFloat('attenuation', 0.05);
spotLight.setFloat('spotAngle', Math.PI/8);

// Create an object to illuminate
const sphere = engine.createObject();
sphere.setSDFType('sphere');
sphere.setFloat('radius', 1.0);
sphere.setPosition([0, 0, 0]);

// Start rendering
engine.start();
```

## Troubleshooting

### Lights Not Affecting Objects
- Check if the light is within range of the objects (for point and spot lights)
- Verify the light's intensity and color settings
- Ensure the objects have materials assigned

### Performance Issues
- Reduce the number of lights in the scene
- Use directional lights for global illumination
- Increase attenuation values to limit light influence

### Unrealistic Lighting
- Adjust the light's color temperature to match the light source
- Use appropriate attenuation for realistic falloff
- Balance multiple lights to create natural lighting

## Conclusion

The lighting system in OasisSDF provides a powerful way to create realistic and dynamic scenes. By understanding the different light types and their parameters, you can create a wide range of lighting effects to enhance your 3D environments. Experiment with different light configurations to achieve the desired mood and atmosphere for your scenes.
