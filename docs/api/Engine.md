# Engine API Documentation

## Overview

The `Engine` class is the main entry point for the OasisSDF engine. It orchestrates the rendering pipeline, manages scene objects, and provides a high-level interface for creating and manipulating 3D scenes using signed distance functions (SDFs).

## Constructor

```typescript
new Engine(config: EngineConfig)
```

### Parameters

- `config`: Configuration options for the engine
  - `canvas`: HTMLCanvasElement - The canvas element to render to
  - `maxObjects` (optional): number - Maximum number of objects (default: 10000)
  - `debug` (optional): boolean - Enable debug mode (default: false)
  - `backgroundColor` (optional): [number, number, number] - Background color (default: [0, 0, 0])

### Example

```typescript
const canvas = document.getElementById('canvas');
const engine = new Engine({
  canvas,
  maxObjects: 5000,
  debug: true,
  backgroundColor: [0.1, 0.1, 0.15]
});
```

## Methods

### initialize()

Initializes the engine and sets up WebGPU resources.

```typescript
async initialize(): Promise<void>
```

### addObject(object: SDFObjectData): number

Adds an object to the scene.

#### Parameters

- `object`: SDFObjectData - The object data
  - `type`: number - Object type (1=sphere, 2=box, 3=torus, 4=capsule, 5=cylinder, 6=cone)
  - `position`: [number, number, number] - Object position
  - `rotation`: [number, number, number] - Object rotation
  - `scale`: [number, number, number] - Object scale

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

### render(deltaTime: number): void

Renders a single frame.

#### Parameters

- `deltaTime`: number - Time since last frame in seconds

### start(): void

Starts the animation loop.

### stop(): void

Stops the animation loop.

### resize(width: number, height: number): void

Resizes the canvas and updates the rendering resolution.

#### Parameters

- `width`: number - New width
- `height`: number - New height

### getObjects(): SDFObjectData[]

Gets all objects in the scene.

#### Returns

- SDFObjectData[]: Array of object data

### getCamera(): CameraData

Gets the current camera data.

#### Returns

- CameraData: Camera data

### getDeviceManager(): DeviceManager

Gets the device manager instance.

#### Returns

- DeviceManager: Device manager instance

### getBufferManager(): BufferManager

Gets the buffer manager instance.

#### Returns

- BufferManager: Buffer manager instance

### getPipelineManager(): PipelineManager

Gets the pipeline manager instance.

#### Returns

- PipelineManager: Pipeline manager instance

### cleanup(): void

Cleans up all resources.

## Examples

### Basic Usage

```typescript
// Initialize engine
await engine.initialize();

// Add a sphere
const sphere = {
  type: 1,
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1]
};

const sphereIndex = engine.addObject(sphere);

// Start animation
engine.start();

// Update object after 2 seconds
setTimeout(() => {
  const updatedSphere = {
    type: 1,
    position: [1, 1, 1],
    rotation: [0, Math.PI, 0],
    scale: [1.5, 1.5, 1.5]
  };
  
  engine.updateObject(sphereIndex, updatedSphere);
}, 2000);

// Update camera
engine.updateCamera({
  position: [5, 5, 5],
  target: [0, 0, 0],
  fov: Math.PI / 4
});
```

### Multiple Objects

```typescript
// Add multiple objects
for (let i = 0; i < 10; i++) {
  const object = {
    type: (i % 6) + 1, // Different primitive types
    position: [
      (i % 5) * 2 - 4,
      Math.floor(i / 5) * 2 - 2,
      0
    ],
    rotation: [0, 0, 0],
    scale: [0.8, 0.8, 0.8]
  };
  
  engine.addObject(object);
}
```

### Camera Control

```typescript
// Simple orbit camera
let isDragging = false;
let lastX = 0;
let lastY = 0;

canvas.addEventListener('mousedown', (e) => {
  isDragging = true;
  lastX = e.clientX;
  lastY = e.clientY;
});

canvas.addEventListener('mousemove', (e) => {
  if (isDragging) {
    const deltaX = e.clientX - lastX;
    const deltaY = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    const camera = engine.getCamera();
    const sensitivity = 0.01;
    
    // Orbit calculation
    const radius = Math.sqrt(
      camera.position[0] * camera.position[0] +
      camera.position[2] * camera.position[2]
    );
    
    const theta = Math.atan2(camera.position[0], camera.position[2]) + deltaX * sensitivity;
    const phi = Math.atan2(
      Math.sqrt(camera.position[0] * camera.position[0] + camera.position[2] * camera.position[2]),
      camera.position[1]
    ) - deltaY * sensitivity;

    const newX = radius * Math.sin(theta) * Math.sin(phi);
    const newY = radius * Math.cos(phi);
    const newZ = radius * Math.cos(theta) * Math.sin(phi);

    engine.updateCamera({
      position: [newX, newY, newZ]
    });
  }
});

canvas.addEventListener('mouseup', () => {
  isDragging = false;
});
```

## Error Handling

The engine throws various error types for different error conditions:

- `EngineError`: General engine errors
- `WebGPUError`: WebGPU-specific errors
- `BufferError`: Buffer-related errors
- `PipelineError`: Pipeline-related errors
- `ValidationError`: Validation errors

Always wrap engine operations in try-catch blocks to handle potential errors:

```typescript
try {
  await engine.initialize();
  // Add objects and start rendering
} catch (error) {
  console.error('Engine initialization failed:', error);
  // Handle error gracefully
}
```

## Performance Considerations

- **Object Count**: Keep the number of objects below the `maxObjects` limit for optimal performance
- **Buffer Updates**: Frequent updates to large buffers can impact performance
- **Camera Movement**: Smooth camera movements are recommended for better user experience
- **Canvas Size**: Larger canvas sizes require more GPU resources

## Debugging

When `debug` is set to `true`, the engine will log additional information to the console, including:

- Initialization steps
- Resource creation
- Buffer updates
- Performance metrics

This can be helpful for diagnosing issues during development.
