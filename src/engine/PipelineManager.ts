/**
 * PipelineManager.ts
 * 
 * Manages WebGPU pipeline creation and state
 */

import { BufferManager } from './BufferManager.js';
import { PipelineError, ValidationError } from '../types/index.js';

// WebGPU types
type GPUDevice = any;
type GPUBuffer = any;
type GPURenderPipeline = any;
type GPUBindGroup = any;
type GPUBindGroupLayout = any;
type GPUPipelineLayout = any;
type GPUTextureView = any;
type GPUCommandEncoder = any;
type GPURenderPassEncoder = any;

// WebGPU constants
const GPUShaderStage = {
  FRAGMENT: 0x00000010
} as const;

/**
 * Pipeline configuration options
 */
export interface PipelineConfig {
  /** Canvas width */
  width: number;
  /** Canvas height */
  height: number;
  /** Enable debug mode */
  debug?: boolean;
  /** Background color */
  backgroundColor?: [number, number, number, number];
}

/**
 * PipelineManager handles WebGPU pipeline operations
 */
export class PipelineManager {
  private device: GPUDevice;
  private pipeline: GPURenderPipeline | null;
  private bindGroups: Map<string, GPUBindGroup>;
  private bindGroupLayouts: Map<string, GPUBindGroupLayout>;
  private pipelineLayout: GPUPipelineLayout | null;
  private config: PipelineConfig;

  constructor(device: GPUDevice, _bufferManager: BufferManager, config: PipelineConfig) {
    this.device = device;
    this.pipeline = null;
    this.bindGroups = new Map();
    this.bindGroupLayouts = new Map();
    this.pipelineLayout = null;
    this.config = {
      width: config.width,
      height: config.height,
      debug: config.debug || false,
      backgroundColor: config.backgroundColor || [0.0, 0.0, 0.0, 1.0]
    };
  }

  /**
   * Create shader module
   * @param source - Shader source code
   * @param type - Shader type
   * @returns Shader module
   */
  private createShaderModule(source: string, type: 'vertex' | 'fragment'): any {
    try {
      return this.device.createShaderModule({
        code: source
      });
    } catch (error) {
      throw new PipelineError(`Failed to create ${type} shader module: ${error}`);
    }
  }

  /**
   * Create bind group layouts
   */
  private createBindGroupLayouts(): void {
    // Storage buffers layout (objects, materials, lights)
    const storageLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: 'read-only-storage'
          }
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: 'read-only-storage'
          }
        },
        {
          binding: 2,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: 'read-only-storage'
          }
        }
      ]
    });

    // Uniform buffers layout (uniforms, camera)
    const uniformLayout = this.device.createBindGroupLayout({
      entries: [
        {
          binding: 0,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: 'uniform'
          }
        },
        {
          binding: 1,
          visibility: GPUShaderStage.FRAGMENT,
          buffer: {
            type: 'uniform'
          }
        }
      ]
    });

    this.bindGroupLayouts.set('storage', storageLayout);
    this.bindGroupLayouts.set('uniform', uniformLayout);

    // Create pipeline layout
    this.pipelineLayout = this.device.createPipelineLayout({
      bindGroupLayouts: [storageLayout, uniformLayout]
    });
  }

  /**
   * Create render pipeline
   * @param vertexShader - Vertex shader source
   * @param fragmentShader - Fragment shader source
   */
  async createPipeline(vertexShader: string, fragmentShader: string): Promise<void> {
    try {
      // Create bind group layouts
      this.createBindGroupLayouts();

      // Create shader modules
      const vertexModule = this.createShaderModule(vertexShader, 'vertex');
      const fragmentModule = this.createShaderModule(fragmentShader, 'fragment');

      // Create render pipeline
      this.pipeline = this.device.createRenderPipeline({
        layout: this.pipelineLayout!,
        vertex: {
          module: vertexModule,
          entryPoint: 'main',
          buffers: []
        },
        fragment: {
          module: fragmentModule,
          entryPoint: 'main',
          targets: [
            {
              format: 'bgra8unorm'
            }
          ]
        },
        primitive: {
          topology: 'triangle-list'
        },
        depthStencil: {
          format: 'depth24plus',
          depthWriteEnabled: true,
          depthCompare: 'less'
        }
      });
    } catch (error) {
      throw new PipelineError(`Failed to create pipeline: ${error}`);
    }
  }

  /**
   * Create storage bind group
   * @param objectsBuffer - Objects buffer
   * @param materialsBuffer - Materials buffer
   * @param lightsBuffer - Lights buffer
   */
  createStorageBindGroup(objectsBuffer: GPUBuffer, materialsBuffer: GPUBuffer, lightsBuffer: GPUBuffer): void {
    const bindGroup = this.device.createBindGroup({
      layout: this.bindGroupLayouts.get('storage')!,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: objectsBuffer
          }
        },
        {
          binding: 1,
          resource: {
            buffer: materialsBuffer
          }
        },
        {
          binding: 2,
          resource: {
            buffer: lightsBuffer
          }
        }
      ]
    });

    this.bindGroups.set('storage', bindGroup);
  }

  /**
   * Create uniform bind group
   * @param uniformBuffer - Uniform buffer
   * @param cameraBuffer - Camera buffer
   */
  createUniformBindGroup(uniformBuffer: GPUBuffer, cameraBuffer: GPUBuffer): void {
    const bindGroup = this.device.createBindGroup({
      layout: this.bindGroupLayouts.get('uniform')!,
      entries: [
        {
          binding: 0,
          resource: {
            buffer: uniformBuffer
          }
        },
        {
          binding: 1,
          resource: {
            buffer: cameraBuffer
          }
        }
      ]
    });

    this.bindGroups.set('uniform', bindGroup);
  }

  /**
   * Begin render pass
   * @param encoder - Command encoder
   * @param textureView - Texture view
   * @param depthTextureView - Depth texture view
   * @returns Render pass encoder
   */
  beginRenderPass(
    encoder: GPUCommandEncoder,
    textureView: GPUTextureView,
    depthTextureView: GPUTextureView
  ): GPURenderPassEncoder {
    const renderPass = encoder.beginRenderPass({
      colorAttachments: [
        {
          view: textureView,
          clearValue: this.config.backgroundColor!,
          loadOp: 'clear',
          storeOp: 'store'
        }
      ],
      depthStencilAttachment: {
        view: depthTextureView,
        depthClearValue: 1.0,
        depthLoadOp: 'clear',
        depthStoreOp: 'store'
      }
    });

    return renderPass;
  }

  /**
   * Draw fullscreen quad
   * @param renderPass - Render pass encoder
   */
  drawFullscreenQuad(renderPass: GPURenderPassEncoder): void {
    renderPass.setPipeline(this.pipeline!);
    renderPass.setBindGroup(0, this.bindGroups.get('storage')!);
    renderPass.setBindGroup(1, this.bindGroups.get('uniform')!);
    renderPass.draw(6); // Fullscreen quad (2 triangles)
  }

  /**
   * Get pipeline
   * @returns Render pipeline
   */
  getPipeline(): GPURenderPipeline {
    if (!this.pipeline) {
      throw new ValidationError('Pipeline not created');
    }
    return this.pipeline;
  }

  /**
   * Get bind group
   * @param name - Bind group name
   * @returns Bind group
   */
  getBindGroup(name: string): GPUBindGroup {
    const bindGroup = this.bindGroups.get(name);
    if (!bindGroup) {
      throw new ValidationError(`Bind group '${name}' not found`);
    }
    return bindGroup;
  }

  /**
   * Resize pipeline
   * @param width - New width
   * @param height - New height
   */
  resize(width: number, height: number): void {
    this.config.width = width;
    this.config.height = height;
  }

  /**
   * Cleanup resources
   */
  cleanup(): void {
    try {
      if (this.pipeline) {
        // WebGPU resources are automatically cleaned up when device is destroyed
      }
      this.bindGroups.clear();
      this.bindGroupLayouts.clear();
      this.pipeline = null;
      this.pipelineLayout = null;
      console.log('PipelineManager cleaned up');
    } catch (error) {
      console.warn('Error during PipelineManager cleanup:', error);
    }
  }
}
