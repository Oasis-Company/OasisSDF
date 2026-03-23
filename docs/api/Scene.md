# Scene API Documentation

## Overview

The `Scene` class represents a 3D scene in the OasisSDF engine. It manages objects, lights, materials, and camera settings for a specific environment. Multiple scenes can be created and switched between at runtime.

## Constructor

```typescript
new Scene(config: SceneConfig = {})
```

### Parameters

- `config` (optional): Configuration options for the scene
  - `maxObjects` (optional): number - Maximum number of objects (default: 1000)
  - `maxLights` (optional): number - Maximum number of lights (default: 10)
  - `camera` (optional): CameraData - Initial camera configuration
  - `ambientLight` (optional): [number, number, number] - Initial ambient light (default: [0.1, 0.1, 0.1])

### Example

```typescript
const scene = new Scene({
  maxObjects: 500,
  maxLights: 5,
  camera: {
    position: [0, 0, 10],
    target: [0, 0, 0],
    fov: Math.PI / 3
  },
  ambientLight: [0.2, 0.2, 0.2]
});
```

## Methods

### initialize(objectManager: ObjectManager): void

Initializes the scene with an object manager.

#### Parameters

- `objectManager`: ObjectManager - The object manager to use

### addObject(object: SDFObjectData, material?: MaterialData): number

Adds an object to the scene.

#### Parameters

- `object`: SDFObjectData - The object data
  - `type`: number - Object type (1=sphere, 2=box, 3=torus, 4=capsule, 5=cylinder, 6=cone)
  - `position`: [number, number, number] - Object position
  - `rotation`: [number, number, number] - Object rotation
  - `scale`: [number, number, number] - Object scale
- `material` (optional): MaterialData - Material data for the object

#### Returns

- number: The index of the added object

### removeObject(index: number): void

Removes an object from the scene.

#### Parameters

- `index`: number - The index of the object to remove

### updateObject(index: number, object: SDFObjectData): void

Updates an existing object in the scene.

#### Parameters

- `index`: number - The index of the object to update
- `object`: SDFObjectData - The new object data

### getObjects(): SDFObjectData[]

Gets all objects in the scene.

#### Returns

- SDFObjectData[]: Array of object data

### getObjectCount(): number

Gets the number of objects in the scene.

#### Returns

- number: Number of objects

### clearObjects(): void

Clears all objects from the scene.

### addLight(config: LightCreateInfo): number | null

Adds a light to the scene.

#### Parameters

- `config`: LightCreateInfo - Light configuration
  - `type`: number - Light type (0=directional, 1=point, 2=spot)
  - `position` (optional): [number, number, number] - Light position (for point and spot lights)
  - `direction` (optional): [number, number, number] - Light direction (for directional and spot lights)
  - `color` (optional): [number, number, number] - Light color (default: [1, 1, 1])
  - `intensity` (optional): number - Light intensity (default: 1)
  - `range` (optional): number - Light range (for point and spot lights)
  - `spotAngle` (optional): number - Spot light angle (for spot lights)

#### Returns

- number | null: The ID of the added light, or null if maximum light count reached

### removeLight(id: number): boolean

Removes a light from the scene.

#### Parameters

- `id`: number - The ID of the light to remove

#### Returns

- boolean: True if the light was removed

### updateLight(id: number, updates: Partial<LightCreateInfo>): boolean

Updates an existing light in the scene.

#### Parameters

- `id`: number - The ID of the light to update
- `updates`: Partial<LightCreateInfo> - Light properties to update

#### Returns

- boolean: True if the light was updated

### getLights(): LightData[]

Gets all lights in the scene.

#### Returns

- LightData[]: Array of light data

### getLightCount(): number

Gets the number of lights in the scene.

#### Returns

- number: Number of lights

### clearLights(): void

Clears all lights from the scene.

### updateCamera(camera: Partial<CameraData>): void

Updates the camera parameters.

#### Parameters

- `camera`: Partial<CameraData> - Camera data to update
  - `position` (optional): [number, number, number] - Camera position
  - `target` (optional): [number, number, number] - Camera target
  - `up` (optional): [number, number, number] - Camera up vector
  - `fov` (optional): number - Field of view in radians
  - `near` (optional): number - Near clipping plane
  - `far` (optional): number - Far clipping plane

### getCamera(): CameraData

Gets the current camera data.

#### Returns

- CameraData: Camera data

### setAmbientLight(ambientLight: [number, number, number]): void

Sets the ambient light.

#### Parameters

- `ambientLight`: [number, number, number] - Ambient light color

### getAmbientLight(): [number, number, number]

Gets the current ambient light.

#### Returns

- [number, number, number]: Ambient light color

### getRenderData(): SceneRenderData

Gets the render data for the scene.

#### Returns

- SceneRenderData: Render data including objects, materials, lights, and camera

### update(deltaTime: number): void

Updates the scene and synchronizes changes to the GPU.

#### Parameters

- `deltaTime`: number - Time since last frame in seconds

### clear(): void

Clears all objects and lights from the scene.

### destroy(): void

Destroys the scene and cleans up resources.

### isDirty(): boolean

Checks if the scene has changes that need to be synchronized.

#### Returns

- boolean: True if the scene is dirty

## Examples

### Basic Scene Creation

```typescript
// Create a scene
const scene = new Scene({
  maxObjects: 100,
  maxLights: 5
});

// Initialize with object manager
scene.initialize(objectManager);

// Add objects
const sphere = {
  type: 1, // Sphere
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1]
};

const sphereIndex = scene.addObject(sphere);

// Add light
const lightId = scene.addLight({
  type: 0, // Directional light
  direction: [0, -1, 0],
  color: [1, 1, 1],
  intensity: 1
});

// Update camera
scene.updateCamera({
  position: [5, 5, 5],
  target: [0, 0, 0]
});

// Get render data
const renderData = scene.getRenderData();
console.log(`Scene has ${renderData.objectCount} objects and ${renderData.lightCount} lights`);
```

### Multiple Scenes

```typescript
// Create engine
const engine = new Engine({ canvas });
await engine.initialize();

// Create multiple scenes
const scene1 = engine.createScene('scene1', {
  maxObjects: 50,
  ambientLight: [0.1, 0.1, 0.1]
});

const scene2 = engine.createScene('scene2', {
  maxObjects: 100,
  ambientLight: [0.2, 0.2, 0.2]
});

// Add objects to scene1
scene1.addObject({
  type: 1,
  position: [0, 0, 0],
  scale: [1, 1, 1]
});

// Add objects to scene2
scene2.addObject({
  type: 2,
  position: [1, 1, 1],
  scale: [1, 1, 1]
});

// Switch between scenes
engine.setActiveScene('scene1');
// Render scene1...

engine.setActiveScene('scene2');
// Render scene2...
```

### Scene with Lights

```typescript
const scene = new Scene({
  maxLights: 3
});

// Add directional light
scene.addLight({
  type: 0,
  direction: [-1, -1, -1],
  color: [1, 1, 1],
  intensity: 1
});

// Add point light
scene.addLight({
  type: 1,
  position: [2, 2, 2],
  color: [1, 0.5, 0],
  intensity: 2,
  range: 10
});

// Add spot light
scene.addLight({
  type: 2,
  position: [0, 5, 0],
  direction: [0, -1, 0],
  color: [0, 0.5, 1],
  intensity: 3,
  range: 15,
  spotAngle: Math.PI / 6
});

console.log(`Scene has ${scene.getLightCount()} lights`);
```

## Performance Considerations

- **Object Count**: Keep the number of objects below `maxObjects` for optimal performance
- **Light Count**: More lights increase shader complexity, keep below `maxLights`
- **Dirty Flag**: The scene uses a dirty flag to avoid unnecessary buffer updates
- **Memory Usage**: Each scene maintains its own buffers, so be mindful of memory usage when creating multiple scenes

## Error Handling

The Scene class throws `ValidationError` for invalid operations:

- Adding objects beyond `maxObjects`
- Removing objects with invalid indices
- Updating objects with invalid indices
- Adding lights beyond `maxLights`
- Removing lights with invalid IDs
- Updating lights with invalid IDs

Always wrap scene operations in try-catch blocks:

```typescript
try {
  const index = scene.addObject(object);
  // Object added successfully
} catch (error) {
  console.error('Failed to add object:', error);
  // Handle error
}
```