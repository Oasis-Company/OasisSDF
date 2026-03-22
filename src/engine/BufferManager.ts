/**
 * BufferManager.ts
 * 
 * Manages WebGPU buffer allocation, writing, and lifecycle
 * Ensures 16-byte alignment for all buffer operations
 */

import type {
  SDFObjectData,
  MaterialData,
  UniformData,
  CameraData
} from '../types/index.js';
import {
  BufferError,
  ValidationError
} from '../types/index.js';

type GPUDevice = any;
type GPUBuffer = any;
const GPUBufferUsage = {
  STORAGE: 0x0008,
  COPY_DST: 0x0004,
  UNIFORM: 0x0001,
  MAP_WRITE: 0x0002,
  COPY_SRC: 0x0001
} as const;
const GPUMapMode = {
  WRITE: 0x01
} as const;

/**
 * Memory usage information
 */
export interface MemoryInfo {
  used: number;
  allocated: number;
}

/**
 * BufferManager handles all GPU buffer operations
 * Provides type-safe buffer creation and writing with automatic alignment
 */
export class BufferManager {
  private device: GPUDevice;
  private buffers: Map<string, GPUBuffer>;
  private stagingBuffers: Map<string, GPUBuffer>;
  private memoryUsage: MemoryInfo;

  constructor(device: GPUDevice) {
    this.device = device;
    this.buffers = new Map();
    this.stagingBuffers = new Map();
    this.memoryUsage = { used: 0, allocated: 0 };
  }

  createBuffer(name: string, size: number, usage: number): GPUBuffer {
    this.validateAlignment(size);

    if (this.buffers.has(name)) {
      throw new BufferError(`Buffer '${name}' already exists`);
    }

    try {
      const buffer = this.device.createBuffer({
        size,
        usage,
        mappedAtCreation: false
      });

      this.buffers.set(name, buffer);
      this.memoryUsage.allocated += size;

      return buffer;
    } catch (error) {
      throw new BufferError(`Failed to create buffer '${name}': ${error}`);
    }
  }

  createStorageBuffer(name: string, size: number): GPUBuffer {
    return this.createBuffer(
      name,
      size,
      GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST
    );
  }

  createUniformBuffer(name: string, size: number): GPUBuffer {
    return this.createBuffer(
      name,
      size,
      GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    );
  }

  createStagingBuffer(name: string, size: number): GPUBuffer {
    try {
      const buffer = this.device.createBuffer({
        size,
        usage: GPUBufferUsage.MAP_WRITE | GPUBufferUsage.COPY_SRC,
        mappedAtCreation: false
      });

      this.stagingBuffers.set(name, buffer);
      this.memoryUsage.allocated += size;

      return buffer;
    } catch (error) {
      throw new BufferError(`Failed to create staging buffer '${name}': ${error}`);
    }
  }

  writeBuffer<T>(buffer: GPUBuffer, data: T[], byteOffset: number = 0): void {
    const dataSize = data.length * 4;

    this.validateBounds(buffer, byteOffset, dataSize);

    if (dataSize < 4096) {
      this.writeBufferDirect(buffer, data, byteOffset);
    } else {
      this.writeBufferViaStaging(buffer, data, byteOffset);
    }

    this.memoryUsage.used += dataSize;
  }

  writeBufferDirect<T>(buffer: GPUBuffer, data: T[], byteOffset: number = 0): void {
    const dataSize = data.length * 4;

    const tempBuffer = new Float32Array(data.length);
    for (let i = 0; i < data.length; i++) {
      tempBuffer[i] = data[i] as number;
    }

    this.device.queue.writeBuffer(
      buffer,
      byteOffset,
      tempBuffer.buffer,
      0,
      dataSize
    );
  }

  async writeBufferViaStaging<T>(buffer: GPUBuffer, data: T[], byteOffset: number = 0): Promise<void> {
    const dataSize = data.length * 4;
    const stagingName = `staging_${buffer.label || 'temp'}`;

    let stagingBuffer = this.stagingBuffers.get(stagingName);
    if (!stagingBuffer || stagingBuffer.size < dataSize) {
      if (stagingBuffer) {
        stagingBuffer.destroy();
      }
      stagingBuffer = this.createStagingBuffer(stagingName, dataSize);
    }

    const mapped = await stagingBuffer.mapAsync(GPUMapMode.WRITE as any);
    const view = new Float32Array(mapped);

    for (let i = 0; i < data.length; i++) {
      view[i] = data[i] as number;
    }

    stagingBuffer.unmap();

    const encoder = this.device.createCommandEncoder();
    encoder.copyBufferToBuffer(
      stagingBuffer,
      0,
      buffer,
      byteOffset,
      dataSize
    );

    this.device.queue.submit([encoder.finish()]);
  }

  writeObjectBuffer(buffer: GPUBuffer, objects: SDFObjectData[]): void {
    const totalSize = objects.length * 64;
    const data = new Float32Array(totalSize / 4);

    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i]!;
      const offset = i * 16;

      data[offset] = obj.type;

      data[offset + 4] = obj.position[0];
      data[offset + 5] = obj.position[1];
      data[offset + 6] = obj.position[2];

      data[offset + 8] = obj.rotation[0];
      data[offset + 9] = obj.rotation[1];
      data[offset + 10] = obj.rotation[2];

      data[offset + 12] = obj.scale[0];
      data[offset + 13] = obj.scale[1];
      data[offset + 14] = obj.scale[2];
    }

    this.writeBuffer(buffer, Array.from(data));
  }

  writeMaterialBuffer(buffer: GPUBuffer, materials: MaterialData[]): void {
    const totalSize = materials.length * 48;
    const data = new Float32Array(totalSize / 4);

    for (let i = 0; i < materials.length; i++) {
      const mat = materials[i]!;
      const offset = i * 12;

      data[offset] = mat.color[0];
      data[offset + 1] = mat.color[1];
      data[offset + 2] = mat.color[2];

      data[offset + 4] = mat.metallic;
      data[offset + 5] = mat.roughness;
    }

    this.writeBuffer(buffer, Array.from(data));
  }

  writeUniformBuffer(buffer: GPUBuffer, data: UniformData): void {
    const uniformArray = new Float32Array(8);

    uniformArray[0] = data.time;
    uniformArray[1] = data.frame;
    uniformArray[2] = data.objectCount;

    uniformArray[4] = data.resolution[0];
    uniformArray[5] = data.resolution[1];

    this.writeBuffer(buffer, Array.from(uniformArray));
  }

  writeCameraBuffer(buffer: GPUBuffer, data: CameraData): void {
    const cameraArray = new Float32Array(20);

    cameraArray[0] = data.position[0];
    cameraArray[1] = data.position[1];
    cameraArray[2] = data.position[2];

    cameraArray[4] = data.target[0];
    cameraArray[5] = data.target[1];
    cameraArray[6] = data.target[2];

    cameraArray[8] = data.up[0];
    cameraArray[9] = data.up[1];
    cameraArray[10] = data.up[2];

    cameraArray[12] = data.fov;
    cameraArray[13] = data.near;
    cameraArray[14] = data.far;

    this.writeBuffer(buffer, Array.from(cameraArray));
  }

  getBuffer(name: string): GPUBuffer | undefined {
    return this.buffers.get(name);
  }

  destroyBuffer(name: string): void {
    const buffer = this.buffers.get(name);
    if (buffer) {
      this.memoryUsage.allocated -= buffer.size;
      this.memoryUsage.used -= buffer.size;
      buffer.destroy();
      this.buffers.delete(name);
    }

    const stagingBuffer = this.stagingBuffers.get(name);
    if (stagingBuffer) {
      this.memoryUsage.allocated -= stagingBuffer.size;
      stagingBuffer.destroy();
      this.stagingBuffers.delete(name);
    }
  }

  destroyAll(): void {
    for (const [_name, buffer] of this.buffers) {
      buffer.destroy();
    }

    for (const [_name, buffer] of this.stagingBuffers) {
      buffer.destroy();
    }

    this.buffers.clear();
    this.stagingBuffers.clear();
    this.memoryUsage = { used: 0, allocated: 0 };
  }

  getMemoryInfo(): MemoryInfo {
    return { ...this.memoryUsage };
  }

  validateAlignment(size: number): void {
    if (size % 16 !== 0) {
      throw new ValidationError(
        `Buffer size ${size} is not 16-byte aligned. ` +
        `Size must be a multiple of 16.`
      );
    }
  }

  validateBounds(buffer: GPUBuffer, offset: number, size: number): void {
    if (offset + size > buffer.size) {
      throw new ValidationError(
        `Buffer write out of bounds. ` +
        `Buffer size: ${buffer.size}, ` +
        `Offset: ${offset}, ` +
        `Data size: ${size}`
      );
    }
  }

  cleanup(): void {
    try {
      this.destroyAll();
      console.log('BufferManager cleaned up');
    } catch (error) {
      console.warn('Error during BufferManager cleanup:', error);
    }
  }
}
