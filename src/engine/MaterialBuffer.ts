/**
 * Material Buffer
 * 
 * Manages GPU buffer for material data, handling creation, updates, and synchronization
 * for the OasisSDF engine.
 */

import { MaterialManager } from './MaterialManager.js';
import { BufferError, ValidationError } from '../types/index.js';
import { BufferLayout } from '../types/index.js';
import type { BufferManager } from './BufferManager.js';

/**
 * Material Buffer
 * 
 * Manages GPU buffer for material data with dynamic resizing and efficient updates
 */
export class MaterialBuffer {
  private bufferManager: BufferManager;
  private bufferName: string;
  private maxMaterials: number;
  private bufferSize: number;
  private materialManager: MaterialManager | null;
  private targetUtilization: number = 0.7;
  private minBufferSize: number = 100;
  private maxBufferSize: number = 10000;

  /**
   * Create a new MaterialBuffer
   * @param bufferManager BufferManager instance
   * @param maxMaterials Maximum number of materials
   * @param bufferName Buffer name for identification
   */
  constructor(bufferManager: BufferManager, maxMaterials: number = 1000, bufferName: string = 'materials') {
    this.bufferManager = bufferManager;
    this.bufferName = bufferName;
    this.maxMaterials = Math.max(maxMaterials, this.minBufferSize);
    this.bufferSize = BufferLayout.materialBufferSize(this.maxMaterials);
    this.materialManager = null;

    this.createBuffer();
  }

  /**
   * Set material manager
   * @param manager MaterialManager instance
   */
  setMaterialManager(manager: MaterialManager): void {
    this.materialManager = manager;
  }

  /**
   * Create the material buffer
   */
  private createBuffer(): void {
    try {
      this.bufferManager.createStorageBuffer(this.bufferName, this.bufferSize);
    } catch (error) {
      throw new BufferError(`Failed to create material buffer: ${error}`);
    }
  }

  /**
   * Check if buffer needs resizing
   * @returns True if buffer needs resizing
   */
  private shouldResize(): boolean {
    if (!this.materialManager) {
      return false;
    }

    const currentCount = this.materialManager.getMaterialCount();
    const utilization = currentCount / this.maxMaterials;
    
    // Check if utilization is too high or too low
    return utilization > this.targetUtilization || utilization < this.targetUtilization / 2;
  }

  /**
   * Resize buffer if needed
   */
  private resizeIfNeeded(): void {
    if (!this.materialManager || !this.shouldResize()) {
      return;
    }

    const currentCount = this.materialManager.getMaterialCount();
    let newSize = Math.max(this.minBufferSize, Math.ceil(currentCount / this.targetUtilization));
    newSize = Math.min(newSize, this.maxBufferSize);
    
    if (newSize !== this.maxMaterials) {
      this.resizeBuffer(newSize);
    }
  }

  /**
   * Update the buffer with all materials
   */
  update(): void {
    if (!this.materialManager) {
      return;
    }

    // Resize buffer if needed
    this.resizeIfNeeded();

    const buffer = this.getBuffer();
    if (!buffer) {
      throw new BufferError('Material buffer not found');
    }

    try {
      // Get materials for buffer (sparse allocation)
      const materials = this.materialManager.getMaterialsForBuffer();
      this.bufferManager.writeMaterialBuffer(buffer, materials);
    } catch (error) {
      throw new BufferError(`Failed to update material buffer: ${error}`);
    }
  }

  /**
   * Update only dirty materials
   */
  updateDirtyMaterials(): void {
    if (!this.materialManager) {
      return;
    }

    const dirtyMaterials = this.materialManager.getDirtyMaterials();
    if (dirtyMaterials.size === 0) {
      return;
    }

    const buffer = this.getBuffer();
    if (!buffer) {
      throw new BufferError('Material buffer not found');
    }

    try {
      // Create materials array with current max size
      const materials = new Array(this.maxMaterials);
      
      // Populate only dirty materials using buffer indices
      for (const id of dirtyMaterials) {
        const material = this.materialManager.getMaterial(id);
        const bufferIndex = this.materialManager.getBufferIndex(id);
        if (material && bufferIndex >= 0 && bufferIndex < this.maxMaterials) {
          materials[bufferIndex] = material;
        }
      }

      this.bufferManager.writeMaterialBuffer(buffer, materials);
      this.materialManager.clearDirtyMaterials();
    } catch (error) {
      throw new BufferError(`Failed to update dirty materials: ${error}`);
    }
  }

  /**
   * Resize the material buffer
   * @param newMaxMaterials New maximum number of materials
   */
  resizeBuffer(newMaxMaterials: number): void {
    if (newMaxMaterials <= 0) {
      throw new ValidationError('Maximum materials must be greater than 0');
    }

    if (newMaxMaterials === this.maxMaterials) {
      return; // No change needed
    }

    // Calculate new buffer size
    const newBufferSize = BufferLayout.materialBufferSize(newMaxMaterials);

    try {
      // Destroy old buffer
      this.bufferManager.destroyBuffer(this.bufferName);

      // Update properties
      this.maxMaterials = newMaxMaterials;
      this.bufferSize = newBufferSize;

      // Create new buffer
      this.createBuffer();
    } catch (error) {
      throw new BufferError(`Failed to resize material buffer: ${error}`);
    }
  }

  /**
   * Get the GPU buffer
   * @returns GPU buffer
   */
  getBuffer(): any {
    return this.bufferManager.getBuffer(this.bufferName);
  }

  /**
   * Get maximum material capacity
   * @returns Maximum number of materials
   */
  getMaxMaterials(): number {
    return this.maxMaterials;
  }

  /**
   * Get current buffer size in bytes
   * @returns Buffer size in bytes
   */
  getBufferSize(): number {
    return this.bufferSize;
  }

  /**
   * Destroy the material buffer
   */
  destroy(): void {
    try {
      this.bufferManager.destroyBuffer(this.bufferName);
    } catch (error) {
      console.warn('Error destroying material buffer:', error);
    }
  }
}
