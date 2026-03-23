import { ObjectManager } from '../objects/ObjectManager.js';
import { LightManager } from '../engine/LightManager.js';
import type {
  SDFObjectData,
  MaterialData,
  CameraData
} from '../types/index.js';
import type { LightData, LightCreateInfo } from '../types/lights.js';
import type { SceneConfig, SceneRenderData } from './types.js';
import { ValidationError } from '../types/index.js';

/**
 * Scene class for managing objects, lights, and camera
 */
export class Scene {
  private config: SceneConfig;
  private objects: SDFObjectData[];
  private materials: MaterialData[];
  private lights: LightData[];
  private camera: CameraData;
  private ambientLight: [number, number, number];
  private objectManager: ObjectManager | null;
  private lightManager: LightManager;
  private dirty: boolean;

  /**
   * Create a new scene
   * @param config - Scene configuration
   */
  constructor(config: SceneConfig = {}) {
    this.config = {
      maxObjects: config.maxObjects || 10000,
      maxLights: config.maxLights || 8,
      camera: config.camera,
      ambientLight: config.ambientLight
    };

    this.objects = [];
    this.materials = [];
    this.lights = [];
    this.camera = config.camera || {
      position: [0, 0, 5],
      target: [0, 0, 0],
      up: [0, 1, 0],
      fov: 1.57, // 90 degrees in radians
      near: 0.1,
      far: 100
    };
    this.ambientLight = config.ambientLight || [0.03, 0.03, 0.03];
    this.objectManager = null;
    this.lightManager = new LightManager(this.config.maxLights!);
    this.dirty = false;
  }

  /**
   * Initialize scene with object manager
   * @param objectManager - Object manager instance
   */
  initialize(objectManager: ObjectManager): void {
    this.objectManager = objectManager;
  }

  /**
   * Add object to scene
   * @param object - SDF object data
   * @param material - Material data (optional)
   * @returns Object index
   */
  addObject(object: SDFObjectData, material?: MaterialData): number {
    if (this.objects.length >= this.config.maxObjects!) {
      throw new ValidationError('Maximum object count reached');
    }

    this.objects.push(object);
    this.materials.push(material || {
      color: [1, 1, 1],
      metallic: 0.5,
      roughness: 0.5,
      reflectance: 0.5,
      emission: [0, 0, 0],
      emissionIntensity: 0,
      ambientOcclusion: 1.0
    });

    this.dirty = true;
    return this.objects.length - 1;
  }

  /**
   * Remove object from scene
   * @param index - Object index
   */
  removeObject(index: number): void {
    if (index < 0 || index >= this.objects.length) {
      throw new ValidationError('Invalid object index');
    }

    this.objects.splice(index, 1);
    this.materials.splice(index, 1);

    this.dirty = true;
  }

  /**
   * Update object data
   * @param index - Object index
   * @param object - New object data
   */
  updateObject(index: number, object: SDFObjectData): void {
    if (index < 0 || index >= this.objects.length) {
      throw new ValidationError('Invalid object index');
    }

    this.objects[index] = object;
    this.dirty = true;
  }

  /**
   * Update material data
   * @param index - Object index
   * @param material - New material data
   */
  updateMaterial(index: number, material: MaterialData): void {
    if (index < 0 || index >= this.materials.length) {
      throw new ValidationError('Invalid object index');
    }

    this.materials[index] = material;
    this.dirty = true;
  }

  /**
   * Add light to scene
   * @param config - Light configuration
   * @returns Light ID or null if failed
   */
  addLight(config: LightCreateInfo): number | null {
    const id = this.lightManager.createLight(config);
    if (id !== null) {
      this.lights = this.lightManager.getAllLights();
      this.dirty = true;
    }
    return id;
  }

  /**
   * Remove light from scene
   * @param id - Light ID
   * @returns Whether light was removed
   */
  removeLight(id: number): boolean {
    const removed = this.lightManager.removeLight(id);
    if (removed) {
      this.lights = this.lightManager.getAllLights();
      this.dirty = true;
    }
    return removed;
  }

  /**
   * Update light data
   * @param id - Light ID
   * @param updates - Light updates
   * @returns Whether light was updated
   */
  updateLight(id: number, updates: Partial<LightCreateInfo>): boolean {
    const updated = this.lightManager.updateLight(id, updates);
    if (updated) {
      this.lights = this.lightManager.getAllLights();
      this.dirty = true;
    }
    return updated;
  }

  /**
   * Update camera data
   * @param camera - Camera updates
   */
  updateCamera(camera: Partial<CameraData>): void {
    this.camera = { ...this.camera, ...camera };
    this.dirty = true;
  }

  /**
   * Set ambient light
   * @param ambientLight - Ambient light color
   */
  setAmbientLight(ambientLight: [number, number, number]): void {
    this.ambientLight = ambientLight;
    this.dirty = true;
  }

  /**
   * Get objects
   * @returns Objects array
   */
  getObjects(): SDFObjectData[] {
    return [...this.objects];
  }

  /**
   * Get materials
   * @returns Materials array
   */
  getMaterials(): MaterialData[] {
    return [...this.materials];
  }

  /**
   * Get lights
   * @returns Lights array
   */
  getLights(): LightData[] {
    return [...this.lights];
  }

  /**
   * Get camera data
   * @returns Camera data
   */
  getCamera(): CameraData {
    return { ...this.camera };
  }

  /**
   * Get ambient light
   * @returns Ambient light color
   */
  getAmbientLight(): [number, number, number] {
    return [...this.ambientLight] as [number, number, number];
  }

  /**
   * Get object count
   * @returns Object count
   */
  getObjectCount(): number {
    return this.objects.length;
  }

  /**
   * Get light count
   * @returns Light count
   */
  getLightCount(): number {
    return this.lights.length;
  }

  /**
   * Get light manager
   * @returns Light manager
   */
  getLightManager(): LightManager {
    return this.lightManager;
  }

  /**
   * Get object manager
   * @returns Object manager or null
   */
  getObjectManager(): ObjectManager | null {
    return this.objectManager;
  }

  /**
   * Check if scene is dirty
   * @returns Whether scene is dirty
   */
  isDirty(): boolean {
    return this.dirty;
  }

  /**
   * Clear dirty flag
   */
  clearDirtyFlag(): void {
    this.dirty = false;
  }

  /**
   * Get render data
   * @returns Scene render data
   */
  getRenderData(): SceneRenderData {
    return {
      objects: this.objects,
      materials: this.materials,
      lights: this.lights,
      camera: this.camera,
      objectCount: this.objects.length,
      lightCount: this.lights.length,
      ambientLight: this.ambientLight
    };
  }

  /**
   * Update scene
   * @param deltaTime - Time since last frame
   */
  update(deltaTime: number): void {
    // Sync objects if object manager is available
    if (this.objectManager) {
      this.objectManager.syncObjects();
    }
    
    // Clear dirty flag after update
    this.clearDirtyFlag();
  }

  /**
   * Clear scene
   */
  clear(): void {
    this.objects = [];
    this.materials = [];
    this.lights = [];
    this.lightManager.clear();
    this.dirty = true;
  }

  /**
   * Destroy scene
   */
  destroy(): void {
    this.clear();
    if (this.objectManager) {
      this.objectManager.destroyAll();
    }
  }
}
