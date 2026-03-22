/**
 * Engine.ts
 * 
 * Main engine class for OasisSDF
 * Orchestrates rendering pipeline and manages scene objects
 */

import { DeviceManager } from './DeviceManager.js';
import { BufferManager } from './BufferManager.js';
import { PipelineManager } from './PipelineManager.js';
import { ObjectManager } from '../objects/ObjectManager.js';
import type {
  SDFObjectData,
  MaterialData,
  UniformData,
  CameraData,
  EngineConfig
} from '../types/index.js';
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
  private objectManager!: ObjectManager;
  private objects: SDFObjectData[];
  private materials: MaterialData[];
  private uniformData: UniformData;
  private cameraData: CameraData;
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
    this.objects = [];
    this.materials = [];
    this.uniformData = {
      time: 0,
      frame: 0,
      objectCount: 0,
      resolution: [
        this.config.canvas.width,
        this.config.canvas.height
      ]
    };
    this.cameraData = {
      position: [0, 0, 5],
      target: [0, 0, 0],
      up: [0, 1, 0],
      fov: 1.57, // 90 degrees in radians
      near: 0.1,
      far: 100
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
    
    // Create object buffer
    const objectBuffer = this.bufferManager.createStorageBuffer(
      'objects',
      maxObjects * 64 // 64 bytes per object
    );

    // Create material buffer
    const materialBuffer = this.bufferManager.createStorageBuffer(
      'materials',
      maxObjects * 48 // 48 bytes per material
    );

    // Create uniform buffer
    const uniformBuffer = this.bufferManager.createUniformBuffer(
      'uniforms',
      32 // 32 bytes
    );

    // Create camera buffer
    const cameraBuffer = this.bufferManager.createUniformBuffer(
      'camera',
      80 // 80 bytes
    );

    // Create bind groups
    this.pipelineManager.createStorageBindGroup(objectBuffer, materialBuffer);
    this.pipelineManager.createUniformBindGroup(uniformBuffer, cameraBuffer);
  }

  /**
   * Add object to scene
   * @param object - SDF object data
   * @returns Object index
   */
  addObject(object: SDFObjectData): number {
    if (this.objects.length >= this.config.maxObjects!) {
      throw new ValidationError('Maximum object count reached');
    }

    this.objects.push(object);
    this.materials.push({
      color: [1, 1, 1],
      metallic: 0.5,
      roughness: 0.5
    });

    this.uniformData.objectCount = this.objects.length;
    this.updateBuffers();

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

    this.uniformData.objectCount = this.objects.length;
    this.updateBuffers();
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
    this.updateBuffers();
  }

  /**
   * Update camera data
   * @param camera - New camera data
   */
  updateCamera(camera: Partial<CameraData>): void {
    this.cameraData = { ...this.cameraData, ...camera };
    this.updateBuffers();
  }

  /**
   * Update buffers with current data
   */
  private updateBuffers(): void {
    // Update object buffer
    const objectBuffer = this.bufferManager.getBuffer('objects');
    if (objectBuffer) {
      this.bufferManager.writeObjectBuffer(objectBuffer, this.objects);
    }

    // Update material buffer
    const materialBuffer = this.bufferManager.getBuffer('materials');
    if (materialBuffer) {
      this.bufferManager.writeMaterialBuffer(materialBuffer, this.materials);
    }

    // Update uniform buffer
    const uniformBuffer = this.bufferManager.getBuffer('uniforms');
    if (uniformBuffer) {
      this.bufferManager.writeUniformBuffer(uniformBuffer, this.uniformData);
    }

    // Update camera buffer
    const cameraBuffer = this.bufferManager.getBuffer('camera');
    if (cameraBuffer) {
      this.bufferManager.writeCameraBuffer(cameraBuffer, this.cameraData);
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

    // Sync objects before rendering
    this.objectManager.syncObjects();

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
   * Get objects
   * @returns Objects array
   */
  getObjects(): SDFObjectData[] {
    return [...this.objects];
  }

  /**
   * Get camera data
   * @returns Camera data
   */
  getCamera(): CameraData {
    return { ...this.cameraData };
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    try {
      this.stop();
      
      if (this.objectManager) {
        this.objectManager.destroyAll();
      }
      
      if (this.pipelineManager) {
        this.pipelineManager.cleanup();
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
