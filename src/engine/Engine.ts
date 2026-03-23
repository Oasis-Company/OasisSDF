/**
 * Engine.ts
 * 
 * Main engine class for OasisSDF
 * Orchestrates rendering pipeline and manages scene objects
 */

import { DeviceManager } from './DeviceManager.js';
import { BufferManager } from './BufferManager.js';
import { PipelineManager } from './PipelineManager.js';
import { MaterialManager } from './MaterialManager.js';
import { MaterialBuffer } from './MaterialBuffer.js';
import { ObjectManager } from '../objects/ObjectManager.js';
import { LightManager } from './LightManager.js';
import { Scene } from '../scene/Scene.js';
import type {
  SDFObjectData,
  MaterialData,
  UniformData,
  CameraData,
  EngineConfig
} from '../types/index.js';
import type { LightCreateInfo } from '../types/lights.js';
import type { SceneConfig } from '../scene/types.js';
import { EngineError, ValidationError } from '../types/index.js';

// WebGPU constants
const GPUTextureUsage = {
  DEPTH_ATTACHMENT: 0x00000080
} as const;

/**
 * OasisSDF Engine
 */
export class Engine {
  private config: EngineConfig;
  private deviceManager: DeviceManager;
  private bufferManager!: BufferManager;
  private pipelineManager!: PipelineManager;
  private materialManager!: MaterialManager;
  private materialBuffer!: MaterialBuffer;
  private objectManager!: ObjectManager;
  private scenes: Map<string, Scene>;
  private activeScene: Scene;
  private defaultSceneName: string;
  private uniformData: UniformData;
  private animationId: number | null;
  private frame: number;

  constructor(config: EngineConfig) {
    this.config = {
      canvas: config.canvas,
      maxObjects: config.maxObjects || 10000,
      debug: config.debug || false,
      backgroundColor: config.backgroundColor || [0, 0, 0]
    };

    this.deviceManager = new DeviceManager();
    this.scenes = new Map();
    this.defaultSceneName = 'default';
    
    // Create default scene
    const defaultScene = new Scene({
      maxObjects: this.config.maxObjects,
      maxLights: 8
    });
    this.scenes.set(this.defaultSceneName, defaultScene);
    this.activeScene = defaultScene;
    
    this.uniformData = {
      time: 0,
      frame: 0,
      objectCount: 0,
      lightCount: 0,
      resolution: [
        this.config.canvas.width,
        this.config.canvas.height
      ],
      ambientLight: [0.03, 0.03, 0.03]
    };
    this.animationId = null;
    this.frame = 0;
  }

  /**
   * Initialize engine
   */
  async initialize(): Promise<void> {
    try {
      // Initialize device
      await this.deviceManager.initialize(this.config.canvas);
      const device = this.deviceManager.getDevice();

      // Create buffer manager
      this.bufferManager = new BufferManager(device);

      // Create material manager
      this.materialManager = new MaterialManager(this.config.maxObjects!);

      // Create material buffer
      this.materialBuffer = new MaterialBuffer(this.bufferManager, this.config.maxObjects!);
      this.materialBuffer.setMaterialManager(this.materialManager);

      // Create pipeline manager
      this.pipelineManager = new PipelineManager(device, this.bufferManager, {
        width: this.config.canvas.width,
        height: this.config.canvas.height,
        debug: this.config.debug,
        backgroundColor: [...this.config.backgroundColor!, 1.0]
      });

      // Load shaders
      const vertexShader = await this.loadShader('src/shaders/vertex.wgsl');
      const fragmentShader = await this.loadShader('src/shaders/raymarch.wgsl');

      // Create pipeline
      await this.pipelineManager.createPipeline(vertexShader, fragmentShader);

      // Create buffers
      this.createBuffers();

      // Create object manager
              this.objectManager = new ObjectManager(
                this.config.maxObjects!,
                this.bufferManager
              );

              // Initialize default scene with object manager
              this.activeScene.initialize(this.objectManager);

      console.log('OasisSDF Engine initialized successfully');
    } catch (error) {
      throw new EngineError(`Failed to initialize engine: ${error}`);
    }
  }

  /**
   * Load shader file
   * @param path - Shader file path
   * @returns Shader source code
   */
  private async loadShader(path: string): Promise<string> {
    try {
      const response = await fetch(path);
      if (!response.ok) {
        throw new EngineError(`Failed to load shader: ${path}`);
      }
      return await response.text();
    } catch (error) {
      throw new EngineError(`Error loading shader ${path}: ${error}`);
    }
  }

  /**
   * Create buffers
   */
  private createBuffers(): void {
    const maxObjects = this.config.maxObjects!;
    const maxLights = 8;
    
    // Create object buffer
    const objectBuffer = this.bufferManager.createStorageBuffer(
      'objects',
      maxObjects * 64 // 64 bytes per object
    );

    // Create material buffer (handled by MaterialBuffer class)
    const materialBuffer = this.materialBuffer.getBuffer();

    // Create light buffer
    const lightBuffer = this.bufferManager.createStorageBuffer(
      'lights',
      maxLights * 80 // 80 bytes per light
    );

    // Create uniform buffer
    const uniformBuffer = this.bufferManager.createUniformBuffer(
      'uniforms',
      48 // 48 bytes
    );

    // Create camera buffer
    const cameraBuffer = this.bufferManager.createUniformBuffer(
      'camera',
      80 // 80 bytes
    );

    // Create bind groups
    this.pipelineManager.createStorageBindGroup(objectBuffer, materialBuffer, lightBuffer);
    this.pipelineManager.createUniformBindGroup(uniformBuffer, cameraBuffer);
  }

  /**
   * Add object to active scene
   * @param object - SDF object data
   * @returns Object index
   */
  addObject(object: SDFObjectData): number {
    const index = this.activeScene.addObject(object);
    this.uniformData.objectCount = this.activeScene.getObjectCount();
    this.updateBuffers();
    return index;
  }

  /**
   * Remove object from active scene
   * @param index - Object index
   */
  removeObject(index: number): void {
    this.activeScene.removeObject(index);
    this.uniformData.objectCount = this.activeScene.getObjectCount();
    this.updateBuffers();
  }

  /**
   * Update object data in active scene
   * @param index - Object index
   * @param object - New object data
   */
  updateObject(index: number, object: SDFObjectData): void {
    this.activeScene.updateObject(index, object);
    this.updateBuffers();
  }

  /**
   * Update camera data in active scene
   * @param camera - New camera data
   */
  updateCamera(camera: Partial<CameraData>): void {
    this.activeScene.updateCamera(camera);
    this.updateBuffers();
  }

  /**
   * Add light to active scene
   */
  addLight(config: LightCreateInfo): number | null {
    const id = this.activeScene.addLight(config);
    if (id !== null) {
      this.uniformData.lightCount = this.activeScene.getLightCount();
      this.updateBuffers();
    }
    return id;
  }

  /**
   * Remove light from active scene
   */
  removeLight(id: number): boolean {
    const removed = this.activeScene.removeLight(id);
    if (removed) {
      this.uniformData.lightCount = this.activeScene.getLightCount();
      this.updateBuffers();
    }
    return removed;
  }

  /**
   * Update light data in active scene
   */
  updateLight(id: number, updates: Partial<LightCreateInfo>): boolean {
    const updated = this.activeScene.updateLight(id, updates);
    if (updated) {
      this.updateBuffers();
    }
    return updated;
  }

  /**
   * Get light manager from active scene
   */
  getLightManager(): LightManager {
    return this.activeScene.getLightManager();
  }

  /**
   * Create a new material
   * @param material - Material data
   * @returns Material ID
   */
  createMaterial(material: Partial<MaterialData>): number {
    return this.materialManager.createMaterial(material);
  }

  /**
   * Update an existing material
   * @param id - Material ID
   * @param material - Material data
   * @returns Whether update was successful
   */
  updateMaterial(id: number, material: Partial<MaterialData>): boolean {
    return this.materialManager.updateMaterial(id, material);
  }

  /**
   * Get material by ID
   * @param id - Material ID
   * @returns Material data or null
   */
  getMaterial(id: number): MaterialData | null {
    return this.materialManager.getMaterial(id);
  }

  /**
   * Remove material
   * @param id - Material ID
   * @returns Whether material was removed
   */
  removeMaterial(id: number): boolean {
    return this.materialManager.removeMaterial(id);
  }

  /**
   * Reference a material (increment ref count)
   * @param id - Material ID
   * @returns Whether reference was successful
   */
  referenceMaterial(id: number): boolean {
    return this.materialManager.referenceMaterial(id);
  }

  /**
   * Release a material (decrement ref count)
   * @param id - Material ID
   * @returns Whether release was successful
   */
  releaseMaterial(id: number): boolean {
    return this.materialManager.releaseMaterial(id);
  }

  /**
   * Get material manager
   * @returns Material manager
   */
  getMaterialManager(): MaterialManager {
    return this.materialManager;
  }

  /**
   * Get material buffer
   * @returns Material buffer
   */
  getMaterialBuffer(): MaterialBuffer {
    return this.materialBuffer;
  }

  /**
   * Update buffers with current data
   */
  private updateBuffers(): void {
    const renderData = this.activeScene.getRenderData();
    
    // Update object buffer
    const objectBuffer = this.bufferManager.getBuffer('objects');
    if (objectBuffer) {
      this.bufferManager.writeObjectBuffer(objectBuffer, renderData.objects);
    }

    // Update material buffer
    if (this.materialBuffer) {
      this.materialBuffer.update();
    }

    // Update light buffer
    const lightBuffer = this.bufferManager.getBuffer('lights');
    if (lightBuffer) {
      this.bufferManager.writeLightBuffer(lightBuffer, renderData.lights);
    }

    // Update uniform buffer
    const uniformBuffer = this.bufferManager.getBuffer('uniforms');
    if (uniformBuffer) {
      // Update ambient light from scene
      this.uniformData.ambientLight = renderData.ambientLight;
      this.bufferManager.writeUniformBuffer(uniformBuffer, this.uniformData);
    }

    // Update camera buffer
    const cameraBuffer = this.bufferManager.getBuffer('camera');
    if (cameraBuffer) {
      this.bufferManager.writeCameraBuffer(cameraBuffer, renderData.camera);
    }
  }

  /**
   * Render frame
   * @param deltaTime - Time since last frame
   */
  render(deltaTime: number): void {
    const device = this.deviceManager.getDevice();
    const context = this.deviceManager.getContext();

    // Update time and frame count
    this.uniformData.time += deltaTime;
    this.uniformData.frame = this.frame++;

    // Update active scene
    this.activeScene.update(deltaTime);

    // Update buffers
    this.updateBuffers();

    // Get current texture
    const texture = context.getCurrentTexture();
    const textureView = texture.createView();

    // Create depth texture
    const depthTexture = device.createTexture({
      size: [this.config.canvas.width, this.config.canvas.height, 1],
      format: 'depth24plus',
      usage: GPUTextureUsage.DEPTH_ATTACHMENT
    });
    const depthTextureView = depthTexture.createView();

    // Create command encoder
    const encoder = device.createCommandEncoder();

    // Begin render pass
    const renderPass = this.pipelineManager.beginRenderPass(
      encoder,
      textureView,
      depthTextureView
    );

    // Draw fullscreen quad
    this.pipelineManager.drawFullscreenQuad(renderPass);

    // End render pass
    renderPass.end();

    // Submit command
    device.queue.submit([encoder.finish()]);

    // Cleanup depth texture
    depthTexture.destroy();
  }

  /**
   * Start animation loop
   */
  start(): void {
    if (this.animationId) {
      return;
    }

    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      this.render(deltaTime);
      this.animationId = requestAnimationFrame(animate);
    };

    this.animationId = requestAnimationFrame(animate);
  }

  /**
   * Stop animation loop
   */
  stop(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  /**
   * Resize canvas
   * @param width - New width
   * @param height - New height
   */
  resize(width: number, height: number): void {
    this.config.canvas.width = width;
    this.config.canvas.height = height;
    
    this.uniformData.resolution = [width, height];
    this.pipelineManager.resize(width, height);
    
    this.updateBuffers();
  }

  /**
   * Get device manager
   * @returns Device manager
   */
  getDeviceManager(): DeviceManager {
    return this.deviceManager;
  }

  /**
   * Get buffer manager
   * @returns Buffer manager
   */
  getBufferManager(): BufferManager {
    return this.bufferManager;
  }

  /**
   * Get pipeline manager
   * @returns Pipeline manager
   */
  getPipelineManager(): PipelineManager {
    return this.pipelineManager;
  }

  /**
   * Get object manager
   * @returns Object manager
   */
  getObjectManager(): ObjectManager {
    return this.objectManager;
  }

  /**
   * Get objects from active scene
   * @returns Objects array
   */
  getObjects(): SDFObjectData[] {
    return this.activeScene.getObjects();
  }

  /**
   * Get camera data from active scene
   * @returns Camera data
   */
  getCamera(): CameraData {
    return this.activeScene.getCamera();
  }

  /**
   * Create a new scene
   * @param name - Scene name
   * @param config - Scene configuration
   * @returns Created scene
   */
  createScene(name: string, config: SceneConfig = {}): Scene {
    if (this.scenes.has(name)) {
      throw new ValidationError(`Scene with name "${name}" already exists`);
    }

    const scene = new Scene({
      maxObjects: config.maxObjects || this.config.maxObjects,
      maxLights: config.maxLights || 8,
      ...config
    });

    // Initialize with object manager if engine is initialized
    if (this.objectManager) {
      scene.initialize(this.objectManager);
    }

    this.scenes.set(name, scene);
    return scene;
  }

  /**
   * Set active scene
   * @param name - Scene name
   * @returns Whether scene was set successfully
   */
  setActiveScene(name: string): boolean {
    const scene = this.scenes.get(name);
    if (!scene) {
      return false;
    }

    this.activeScene = scene;
    this.uniformData.objectCount = scene.getObjectCount();
    this.uniformData.lightCount = scene.getLightCount();
    this.updateBuffers();
    return true;
  }

  /**
   * Get active scene
   * @returns Active scene
   */
  getActiveScene(): Scene {
    return this.activeScene;
  }

  /**
   * Get scene by name
   * @param name - Scene name
   * @returns Scene or null
   */
  getScene(name: string): Scene | null {
    return this.scenes.get(name) || null;
  }

  /**
   * Remove scene
   * @param name - Scene name
   * @returns Whether scene was removed
   */
  removeScene(name: string): boolean {
    if (name === this.defaultSceneName) {
      throw new ValidationError('Cannot remove default scene');
    }

    const scene = this.scenes.get(name);
    if (!scene) {
      return false;
    }

    scene.destroy();
    this.scenes.delete(name);

    // If we removed the active scene, switch to default
    if (this.activeScene === scene) {
      this.activeScene = this.scenes.get(this.defaultSceneName)!;
      this.uniformData.objectCount = this.activeScene.getObjectCount();
      this.uniformData.lightCount = this.activeScene.getLightCount();
      this.updateBuffers();
    }

    return true;
  }

  /**
   * Get all scenes
   * @returns Map of scenes
   */
  getScenes(): Map<string, Scene> {
    return new Map(this.scenes);
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    try {
      this.stop();
      
      // Cleanup all scenes
      for (const [, scene] of this.scenes) {
        scene.destroy();
      }
      this.scenes.clear();
      
      if (this.objectManager) {
        this.objectManager.destroyAll();
      }
      
      if (this.pipelineManager) {
        this.pipelineManager.cleanup();
      }
      
      if (this.materialBuffer) {
        this.materialBuffer.destroy();
      }
      
      if (this.bufferManager) {
        this.bufferManager.cleanup();
      }
      
      this.deviceManager.cleanup();
      console.log('OasisSDF Engine cleaned up');
    } catch (error) {
      console.warn('Error during engine cleanup:', error);
    }
  }
}
