import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Scene } from '../../src/scene/Scene.js';
import { ObjectManager } from '../../src/objects/ObjectManager.js';
import { Primitives } from '../../src/objects/Primitives.js';
import type { SDFObjectData, MaterialData, CameraData } from '../../src/types/index.js';
import type { LightCreateInfo } from '../../src/types/lights.js';

// Mock ObjectManager
class MockObjectManager {
  syncObjects = vi.fn();
  destroyAll = vi.fn();
}

describe('Scene', () => {
  let scene: Scene;
  let mockObjectManager: MockObjectManager;

  beforeEach(() => {
    scene = new Scene({
      maxObjects: 100,
      maxLights: 8
    });
    mockObjectManager = new MockObjectManager();
  });

  describe('constructor', () => {
    it('should create a scene with default configuration', () => {
      const defaultScene = new Scene();
      expect(defaultScene.getObjectCount()).toBe(0);
      expect(defaultScene.getLightCount()).toBe(0);
      expect(defaultScene.getCamera()).toEqual({
        position: [0, 0, 5],
        target: [0, 0, 0],
        up: [0, 1, 0],
        fov: 1.57,
        near: 0.1,
        far: 100
      });
      expect(defaultScene.getAmbientLight()).toEqual([0.03, 0.03, 0.03]);
    });

    it('should create a scene with custom configuration', () => {
      const customCamera: CameraData = {
        position: [1, 2, 3],
        target: [0, 0, 0],
        up: [0, 1, 0],
        fov: 1.0,
        near: 0.5,
        far: 50
      };

      const customScene = new Scene({
        maxObjects: 50,
        maxLights: 4,
        camera: customCamera,
        ambientLight: [0.1, 0.1, 0.1]
      });

      expect(customScene.getCamera()).toEqual(customCamera);
      expect(customScene.getAmbientLight()).toEqual([0.1, 0.1, 0.1]);
    });
  });

  describe('initialize', () => {
    it('should initialize the scene with object manager', () => {
      scene.initialize(mockObjectManager as any);
      expect(scene.getObjectManager()).toBe(mockObjectManager);
    });
  });

  describe('object management', () => {
    it('should add an object to the scene', () => {
      const object: SDFObjectData = {
        type: 1, // Sphere
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };
      const index = scene.addObject(object);
      
      expect(index).toBe(0);
      expect(scene.getObjectCount()).toBe(1);
      expect(scene.getObjects()[0]).toEqual(object);
      expect(scene.isDirty()).toBe(true);
    });

    it('should remove an object from the scene', () => {
      const object1: SDFObjectData = {
        type: 1, // Sphere
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };
      const object2: SDFObjectData = {
        type: 2, // Box
        position: [1, 1, 1],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };
      
      scene.addObject(object1);
      scene.addObject(object2);
      expect(scene.getObjectCount()).toBe(2);
      
      scene.removeObject(0);
      expect(scene.getObjectCount()).toBe(1);
      expect(scene.getObjects()[0]).toEqual(object2);
      expect(scene.isDirty()).toBe(true);
    });

    it('should update an object in the scene', () => {
      const object1: SDFObjectData = {
        type: 1,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };
      const object2: SDFObjectData = {
        type: 1,
        position: [1, 1, 1],
        rotation: [0, 0, 0],
        scale: [2, 2, 2]
      };
      
      scene.addObject(object1);
      scene.updateObject(0, object2);
      
      expect(scene.getObjects()[0]).toEqual(object2);
      expect(scene.isDirty()).toBe(true);
    });

    it('should throw error when adding object beyond maxObjects', () => {
      const smallScene = new Scene({ maxObjects: 1 });
      const object1: SDFObjectData = {
        type: 1,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };
      smallScene.addObject(object1);
      
      const object2: SDFObjectData = {
        type: 2,
        position: [1, 1, 1],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };
      
      expect(() => {
        smallScene.addObject(object2);
      }).toThrow('Maximum object count reached');
    });

    it('should throw error when removing invalid object index', () => {
      expect(() => {
        scene.removeObject(999);
      }).toThrow('Invalid object index');
    });

    it('should throw error when updating invalid object index', () => {
      expect(() => {
        scene.updateObject(999, Primitives.sphere([0, 0, 0], 1));
      }).toThrow('Invalid object index');
    });
  });

  describe('material management', () => {
    it('should add object with default material', () => {
      const object = Primitives.sphere([0, 0, 0], 1);
      scene.addObject(object);
      
      const materials = scene.getMaterials();
      expect(materials.length).toBe(1);
      expect(materials[0]).toEqual({
        color: [1, 1, 1],
        metallic: 0.5,
        roughness: 0.5,
        reflectance: 0.5,
        emission: [0, 0, 0],
        emissionIntensity: 0,
        ambientOcclusion: 1.0
      });
    });

    it('should add object with custom material', () => {
      const object = Primitives.sphere([0, 0, 0], 1);
      const customMaterial: MaterialData = {
        color: [1, 0, 0],
        metallic: 1.0,
        roughness: 0.1,
        reflectance: 0.9,
        emission: [1, 1, 1],
        emissionIntensity: 1.0,
        ambientOcclusion: 0.5
      };
      
      scene.addObject(object, customMaterial);
      
      const materials = scene.getMaterials();
      expect(materials.length).toBe(1);
      expect(materials[0]).toEqual(customMaterial);
    });

    it('should update material', () => {
      const object = Primitives.sphere([0, 0, 0], 1);
      scene.addObject(object);
      
      const updatedMaterial: MaterialData = {
        color: [0, 1, 0],
        metallic: 0.0,
        roughness: 1.0,
        reflectance: 0.1,
        emission: [0, 0, 0],
        emissionIntensity: 0,
        ambientOcclusion: 1.0
      };
      
      scene.updateMaterial(0, updatedMaterial);
      
      const materials = scene.getMaterials();
      expect(materials[0]).toEqual(updatedMaterial);
      expect(scene.isDirty()).toBe(true);
    });
  });

  describe('light management', () => {
    it('should add a directional light', () => {
      const lightConfig: LightCreateInfo = {
        type: 0, // DIRECTIONAL
        direction: [0, -1, 0],
        color: [1, 1, 1],
        intensity: 1.0,
        castShadows: true
      };
      
      const lightId = scene.addLight(lightConfig);
      expect(lightId).toBe(0);
      expect(scene.getLightCount()).toBe(1);
      expect(scene.isDirty()).toBe(true);
    });

    it('should add a point light', () => {
      const lightConfig: LightCreateInfo = {
        type: 1, // POINT
        position: [0, 1, 0],
        color: [1, 0, 0],
        intensity: 2.0,
        range: 10.0
      };
      
      const lightId = scene.addLight(lightConfig);
      expect(lightId).toBe(0);
      expect(scene.getLightCount()).toBe(1);
    });

    it('should add a spot light', () => {
      const lightConfig: LightCreateInfo = {
        type: 2, // SPOT
        position: [0, 2, 0],
        direction: [0, -1, 0],
        color: [0, 1, 0],
        intensity: 1.5,
        range: 5.0,
        innerConeAngle: 0.1,
        outerConeAngle: 0.3
      };
      
      const lightId = scene.addLight(lightConfig);
      expect(lightId).toBe(0);
      expect(scene.getLightCount()).toBe(1);
    });

    it('should remove a light', () => {
      const lightConfig: LightCreateInfo = {
        type: 0,
        direction: [0, -1, 0]
      };
      
      const lightId = scene.addLight(lightConfig);
      expect(scene.getLightCount()).toBe(1);
      
      const removed = scene.removeLight(lightId!);
      expect(removed).toBe(true);
      expect(scene.getLightCount()).toBe(0);
      expect(scene.isDirty()).toBe(true);
    });

    it('should update a light', () => {
      const lightConfig: LightCreateInfo = {
        type: 0,
        direction: [0, -1, 0],
        color: [1, 1, 1]
      };
      
      const lightId = scene.addLight(lightConfig);
      
      const updates: Partial<LightCreateInfo> = {
        color: [0, 0, 1],
        intensity: 2.0
      };
      
      const updated = scene.updateLight(lightId!, updates);
      expect(updated).toBe(true);
      expect(scene.isDirty()).toBe(true);
    });
  });

  describe('camera management', () => {
    it('should update camera data', () => {
      const cameraUpdates: Partial<CameraData> = {
        position: [1, 2, 3],
        fov: 1.0
      };
      
      scene.updateCamera(cameraUpdates);
      
      const camera = scene.getCamera();
      expect(camera.position).toEqual([1, 2, 3]);
      expect(camera.fov).toBe(1.0);
      expect(camera.target).toEqual([0, 0, 0]); // Should remain unchanged
      expect(scene.isDirty()).toBe(true);
    });
  });

  describe('ambient light', () => {
    it('should set ambient light', () => {
      const newAmbientLight = [0.1, 0.2, 0.3];
      scene.setAmbientLight(newAmbientLight);
      
      expect(scene.getAmbientLight()).toEqual(newAmbientLight);
      expect(scene.isDirty()).toBe(true);
    });
  });

  describe('render data', () => {
    it('should get render data', () => {
      const object: SDFObjectData = {
        type: 1,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };
      scene.addObject(object);
      
      const lightConfig: LightCreateInfo = {
        type: 0,
        direction: [0, -1, 0]
      };
      scene.addLight(lightConfig);
      
      const renderData = scene.getRenderData();
      
      expect(renderData.objects.length).toBe(1);
      expect(renderData.materials.length).toBe(1);
      expect(renderData.lights.length).toBe(1);
      expect(renderData.objectCount).toBe(1);
      expect(renderData.lightCount).toBe(1);
      expect(renderData.camera).toEqual(scene.getCamera());
      expect(renderData.ambientLight).toEqual(scene.getAmbientLight());
    });
  });

  describe('update', () => {
    it('should update scene and clear dirty flag', () => {
      scene.initialize(mockObjectManager as any);
      
      const object: SDFObjectData = {
        type: 1,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };
      scene.addObject(object);
      expect(scene.isDirty()).toBe(true);
      
      scene.update(0.016);
      
      expect(mockObjectManager.syncObjects).toHaveBeenCalled();
      expect(scene.isDirty()).toBe(false);
    });
  });

  describe('clear and destroy', () => {
    it('should clear scene', () => {
      const object: SDFObjectData = {
        type: 1,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };
      scene.addObject(object);
      
      const lightConfig: LightCreateInfo = {
        type: 0,
        direction: [0, -1, 0]
      };
      scene.addLight(lightConfig);
      
      expect(scene.getObjectCount()).toBe(1);
      expect(scene.getLightCount()).toBe(1);
      
      scene.clear();
      
      expect(scene.getObjectCount()).toBe(0);
      expect(scene.getLightCount()).toBe(0);
      expect(scene.isDirty()).toBe(true);
    });

    it('should destroy scene', () => {
      scene.initialize(mockObjectManager as any);
      
      const object: SDFObjectData = {
        type: 1,
        position: [0, 0, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1]
      };
      scene.addObject(object);
      
      scene.destroy();
      
      expect(scene.getObjectCount()).toBe(0);
      expect(mockObjectManager.destroyAll).toHaveBeenCalled();
    });
  });
});
