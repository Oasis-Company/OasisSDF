# Scene Management Guide

This guide covers advanced scene management techniques in OasisSDF, including multi-scene workflows, scene transitions, and best practices.

## Overview

The Scene system in OasisSDF allows you to:
- Organize 3D content into logical groups
- Switch between different environments instantly
- Manage memory efficiently across scenes
- Create complex multi-stage applications

## Basic Scene Operations

### Creating Scenes

```typescript
import { Engine } from 'oasissdf';

const engine = new Engine({ canvas });
await engine.initialize();

// Create a scene with custom configuration
const mainScene = engine.createScene('main', {
  maxObjects: 1000,
  maxLights: 10,
  camera: {
    position: [0, 5, 10],
    target: [0, 0, 0],
    fov: Math.PI / 3
  },
  ambientLight: [0.1, 0.1, 0.1]
});

// Create another scene
const uiScene = engine.createScene('ui', {
  maxObjects: 100,
  maxLights: 2,
  ambientLight: [0.5, 0.5, 0.5]
});
```

### Switching Between Scenes

```typescript
// Switch to main scene
engine.setActiveScene('main');

// Add objects to main scene
const sphere = engine.addObject({
  type: 1,
  position: [0, 0, 0],
  rotation: [0, 0, 0],
  scale: [1, 1, 1]
});

// Switch to UI scene
engine.setActiveScene('ui');

// Add UI elements
const button = engine.addObject({
  type: 2, // Box
  position: [0, 0, 0],
  scale: [2, 0.5, 0.1]
});
```

### Accessing Scene Data

```typescript
// Get current active scene
const activeScene = engine.getActiveScene();

// Get specific scene
const mainScene = engine.getScene('main');

// Get all scenes
const allScenes = engine.getScenes();
allScenes.forEach((scene, name) => {
  console.log(`Scene ${name} has ${scene.getObjectCount()} objects`);
});
```

## Advanced Scene Patterns

### Scene Preloading

Preload scenes in the background for instant switching:

```typescript
class SceneManager {
  private engine: Engine;
  private loadedScenes: Map<string, Scene> = new Map();

  constructor(engine: Engine) {
    this.engine = engine;
  }

  async preloadScene(name: string, config: SceneConfig): Promise<void> {
    const scene = this.engine.createScene(name, config);
    
    // Pre-populate with content
    await this.loadSceneContent(scene, name);
    
    this.loadedScenes.set(name, scene);
  }

  async switchToScene(name: string): Promise<void> {
    if (!this.loadedScenes.has(name)) {
      await this.preloadScene(name, this.getSceneConfig(name));
    }
    
    this.engine.setActiveScene(name);
  }

  private async loadSceneContent(scene: Scene, name: string): Promise<void> {
    // Load scene-specific content
    switch (name) {
      case 'level1':
        this.loadLevel1(scene);
        break;
      case 'level2':
        this.loadLevel2(scene);
        break;
    }
  }
}
```

### Scene Transitions

Create smooth transitions between scenes:

```typescript
class SceneTransition {
  private engine: Engine;
  private isTransitioning: boolean = false;

  constructor(engine: Engine) {
    this.engine = engine;
  }

  async fadeTransition(fromScene: string, toScene: string, duration: number = 1000): Promise<void> {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    // Fade out
    await this.fade(0, 1, duration / 2);
    
    // Switch scene
    this.engine.setActiveScene(toScene);
    
    // Fade in
    await this.fade(1, 0, duration / 2);
    
    this.isTransitioning = false;
  }

  private async fade(from: number, to: number, duration: number): Promise<void> {
    const startTime = performance.now();
    
    return new Promise((resolve) => {
      const animate = () => {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const opacity = from + (to - from) * progress;
        
        // Apply fade overlay
        this.applyFadeOverlay(opacity);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        } else {
          resolve();
        }
      };
      
      requestAnimationFrame(animate);
    });
  }

  private applyFadeOverlay(opacity: number): void {
    // Implementation depends on your overlay system
    // Could use a full-screen quad with alpha blending
  }
}
```

### Layered Scenes

Combine multiple scenes for complex effects:

```typescript
class LayeredSceneManager {
  private engine: Engine;
  private layers: Map<string, string> = new Map();

  constructor(engine: Engine) {
    this.engine = engine;
  }

  createLayer(name: string, config: SceneConfig): void {
    const sceneName = `layer_${name}`;
    this.engine.createScene(sceneName, config);
    this.layers.set(name, sceneName);
  }

  renderLayers(): void {
    // Render each layer in order
    this.layers.forEach((sceneName, layerName) => {
      this.engine.setActiveScene(sceneName);
      // Render layer with appropriate blending
    });
  }
}
```

## Memory Management

### Scene Cleanup

Properly clean up scenes to free memory:

```typescript
// Remove a scene
engine.removeScene('tempScene');

// Clear all objects from a scene
const scene = engine.getScene('main');
scene.clear();

// Destroy scene and free all resources
scene.destroy();
```

### Memory-Conscious Scene Switching

```typescript
class MemoryEfficientSceneManager {
  private engine: Engine;
  private maxLoadedScenes: number = 3;
  private sceneAccessOrder: string[] = [];

  constructor(engine: Engine, maxLoadedScenes: number = 3) {
    this.engine = engine;
    this.maxLoadedScenes = maxLoadedScenes;
  }

  switchScene(sceneName: string): void {
    // Update access order
    this.updateAccessOrder(sceneName);
    
    // Switch to scene
    this.engine.setActiveScene(sceneName);
    
    // Unload old scenes if necessary
    this.unloadOldScenes();
  }

  private updateAccessOrder(sceneName: string): void {
    const index = this.sceneAccessOrder.indexOf(sceneName);
    if (index > -1) {
      this.sceneAccessOrder.splice(index, 1);
    }
    this.sceneAccessOrder.push(sceneName);
  }

  private unloadOldScenes(): void {
    while (this.sceneAccessOrder.length > this.maxLoadedScenes) {
      const oldestScene = this.sceneAccessOrder.shift();
      if (oldestScene) {
        this.engine.removeScene(oldestScene);
      }
    }
  }
}
```

## Best Practices

### 1. Scene Organization

- **Group related content**: Keep objects that belong together in the same scene
- **Use meaningful names**: Name scenes descriptively (e.g., 'mainMenu', 'level1', 'gameOver')
- **Limit scene count**: Don't create too many scenes; use object grouping instead

### 2. Performance Optimization

```typescript
// Good: Reuse scenes
const reusableScene = engine.createScene('reusable', {
  maxObjects: 100 // Only allocate what you need
});

// Bad: Creating scenes with excessive limits
const wastefulScene = engine.createScene('wasteful', {
  maxObjects: 10000 // Too many if you only need 10
});
```

### 3. State Management

```typescript
// Maintain scene state separately
interface SceneState {
  objects: SDFObjectData[];
  lights: LightData[];
  camera: CameraData;
}

class SceneStateManager {
  private states: Map<string, SceneState> = new Map();

  saveSceneState(sceneName: string): void {
    const scene = this.engine.getScene(sceneName);
    this.states.set(sceneName, {
      objects: scene.getObjects(),
      lights: scene.getLights(),
      camera: scene.getCamera()
    });
  }

  restoreSceneState(sceneName: string): void {
    const state = this.states.get(sceneName);
    if (state) {
      const scene = this.engine.getScene(sceneName);
      // Restore state
      state.objects.forEach(obj => scene.addObject(obj));
      state.lights.forEach(light => scene.addLight(light));
      scene.updateCamera(state.camera);
    }
  }
}
```

### 4. Error Handling

```typescript
try {
  const scene = engine.createScene('newScene');
  // Add content to scene
} catch (error) {
  if (error instanceof ValidationError) {
    console.error('Invalid scene configuration:', error.message);
  } else if (error instanceof EngineError) {
    console.error('Engine error:', error.message);
  }
}
```

## Common Patterns

### Game Level System

```typescript
class LevelSystem {
  private engine: Engine;
  private currentLevel: number = 0;

  constructor(engine: Engine) {
    this.engine = engine;
  }

  async loadLevel(levelNumber: number): Promise<void> {
    const sceneName = `level_${levelNumber}`;
    
    // Create or get scene
    let scene = this.engine.getScene(sceneName);
    if (!scene) {
      scene = this.engine.createScene(sceneName, {
        maxObjects: 500,
        maxLights: 5
      });
      await this.populateLevel(scene, levelNumber);
    }
    
    // Switch to level
    this.engine.setActiveScene(sceneName);
    this.currentLevel = levelNumber;
  }

  private async populateLevel(scene: Scene, level: number): Promise<void> {
    // Load level-specific content
    const levelData = await fetch(`levels/level${level}.json`).then(r => r.json());
    
    levelData.objects.forEach((obj: SDFObjectData) => {
      scene.addObject(obj);
    });
    
    levelData.lights.forEach((light: LightCreateInfo) => {
      scene.addLight(light);
    });
  }
}
```

### UI Overlay System

```typescript
class UISystem {
  private engine: Engine;
  private uiScene: Scene;

  constructor(engine: Engine) {
    this.engine = engine;
    this.uiScene = engine.createScene('ui', {
      maxObjects: 50,
      maxLights: 1,
      ambientLight: [1, 1, 1]
    });
  }

  showMenu(): void {
    this.uiScene.clear();
    
    // Add menu buttons
    this.addButton('Start Game', [0, 1, 0]);
    this.addButton('Options', [0, 0, 0]);
    this.addButton('Exit', [0, -1, 0]);
    
    // Show UI scene on top
    this.engine.setActiveScene('ui');
  }

  private addButton(text: string, position: [number, number, number]): void {
    this.uiScene.addObject({
      type: 2, // Box
      position,
      rotation: [0, 0, 0],
      scale: [2, 0.5, 0.1]
    });
  }
}
```

## Troubleshooting

### Scene Not Found

```typescript
const scene = engine.getScene('nonexistent');
if (!scene) {
  console.error('Scene not found. Available scenes:', 
    Array.from(engine.getScenes().keys())
  );
}
```

### Memory Leaks

```typescript
// Check scene count
console.log('Active scenes:', engine.getScenes().size);

// Monitor object counts
engine.getScenes().forEach((scene, name) => {
  console.log(`Scene ${name}: ${scene.getObjectCount()} objects`);
});
```

### Performance Issues

```typescript
// Profile scene switching
console.time('sceneSwitch');
engine.setActiveScene('newScene');
console.timeEnd('sceneSwitch');

// Check buffer updates
const scene = engine.getActiveScene();
console.log('Scene dirty:', scene.isDirty());
```

## Next Steps

- Learn about [Performance Optimization](./performance.md)
- Explore [Advanced Rendering Techniques](../api/Scene.md)
- Check out [Example Projects](../../examples/)
