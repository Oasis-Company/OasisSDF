/**
 * Material Manager
 * 
 * Manages material lifecycle, instantiation, and buffer synchronization
 * for the OasisSDF engine.
 */

import type { MaterialData } from '../types/index.js';
import { BufferLayout, ValidationError } from '../types/index.js';

/**
 * Material instance with reference counting
 */
export interface MaterialInstance {
  id: number;
  data: MaterialData;
  refCount: number;
  isDirty: boolean;
  bufferIndex: number;
}

/**
 * Material Manager
 * 
 * Handles material creation, destruction, updating, and buffer management
 */
export class MaterialManager {
  private materials: Map<number, MaterialInstance> = new Map();
  private materialIdToIndex: Map<number, number> = new Map();
  private freeSlots: number[] = [];
  private nextMaterialId: number = 1;
  private nextBufferIndex: number = 0;
  private dirtyMaterials: Set<number> = new Set();
  private maxMaterials: number;

  /**
   * Create a new MaterialManager
   * @param maxMaterials Maximum number of materials to support
   */
  constructor(maxMaterials: number = 1000) {
    this.maxMaterials = maxMaterials;
  }

  /**
   * Allocate a buffer slot for a new material
   * @returns Buffer index
   */
  private allocateSlot(): number {
    if (this.freeSlots.length > 0) {
      return this.freeSlots.pop()!;
    }
    if (this.nextBufferIndex >= this.maxMaterials) {
      throw new ValidationError(`Maximum material capacity reached: ${this.maxMaterials}`);
    }
    return this.nextBufferIndex++;
  }

  /**
   * Release a buffer slot when material is destroyed
   * @param index Buffer index to release
   */
  private releaseSlot(index: number): void {
    this.freeSlots.push(index);
  }

  /**
   * Create a new material instance
   * @param materialData Material properties
   * @returns Material ID
   */
  createMaterial(materialData: Partial<MaterialData>): number {
    if (this.materials.size >= this.maxMaterials) {
      throw new ValidationError(`Maximum material count reached: ${this.maxMaterials}`);
    }

    const defaultMaterial: MaterialData = {
      color: [0.5, 0.5, 0.5],
      metallic: 0.0,
      roughness: 0.5,
      reflectance: 0.04,
      emission: [0, 0, 0],
      emissionIntensity: 0.0,
      ambientOcclusion: 1.0
    };

    const bufferIndex = this.allocateSlot();
    const material: MaterialInstance = {
      id: this.nextMaterialId++,
      data: {
        ...defaultMaterial,
        ...materialData
      },
      refCount: 1,
      isDirty: true,
      bufferIndex
    };

    this.materials.set(material.id, material);
    this.materialIdToIndex.set(material.id, bufferIndex);
    this.dirtyMaterials.add(material.id);

    return material.id;
  }

  /**
   * Get material data by ID
   * @param materialId Material ID
   * @returns Material data
   */
  getMaterial(materialId: number): MaterialData | null {
    const material = this.materials.get(materialId);
    return material ? { ...material.data } : null;
  }

  /**
   * Update material properties
   * @param materialId Material ID
   * @param materialData Material properties to update
   */
  updateMaterial(materialId: number, materialData: Partial<MaterialData>): void {
    const material = this.materials.get(materialId);
    if (!material) {
      throw new ValidationError(`Material not found: ${materialId}`);
    }

    material.data = {
      ...material.data,
      ...materialData
    };
    material.isDirty = true;
    this.dirtyMaterials.add(materialId);
  }

  /**
   * Increment material reference count
   * @param materialId Material ID
   */
  referenceMaterial(materialId: number): void {
    const material = this.materials.get(materialId);
    if (!material) {
      throw new ValidationError(`Material not found: ${materialId}`);
    }

    material.refCount++;
  }

  /**
   * Decrement material reference count and destroy if no references
   * @param materialId Material ID
   * @returns True if material was destroyed
   */
  releaseMaterial(materialId: number): boolean {
    const material = this.materials.get(materialId);
    if (!material) {
      throw new ValidationError(`Material not found: ${materialId}`);
    }

    material.refCount--;

    if (material.refCount <= 0) {
      this.releaseSlot(material.bufferIndex);
      this.materials.delete(materialId);
      this.materialIdToIndex.delete(materialId);
      this.dirtyMaterials.delete(materialId);
      return true;
    }

    return false;
  }

  /**
   * Get all materials as an array for buffer writing
   * @returns Array of material data
   */
  getMaterialsForBuffer(): MaterialData[] {
    // Create array with nulls for all buffer slots
    const materials: (MaterialData | null)[] = Array(this.nextBufferIndex).fill(null);
    
    // Fill with material data at their buffer indices
    for (const material of this.materials.values()) {
      materials[material.bufferIndex] = material.data;
    }
    
    // Filter out nulls and return only active materials
    return materials.filter((material): material is MaterialData => material !== null);
  }

  /**
   * Get all materials as an array
   * @returns Array of material data
   */
  getAllMaterials(): MaterialData[] {
    return Array.from(this.materials.values()).map(material => material.data);
  }

  /**
   * Get dirty materials that need to be updated in the buffer
   * @returns Set of material IDs
   */
  getDirtyMaterials(): Set<number> {
    return this.dirtyMaterials;
  }

  /**
   * Clear dirty flag for all materials
   */
  clearDirtyMaterials(): void {
    for (const id of this.dirtyMaterials) {
      const material = this.materials.get(id);
      if (material) {
        material.isDirty = false;
      }
    }
    this.dirtyMaterials.clear();
  }

  /**
   * Get current material count
   * @returns Number of active materials
   */
  getMaterialCount(): number {
    return this.materials.size;
  }

  /**
   * Get maximum material capacity
   * @returns Maximum number of materials
   */
  getMaxMaterials(): number {
    return this.maxMaterials;
  }

  /**
   * Check if material exists
   * @param materialId Material ID
   * @returns True if material exists
   */
  hasMaterial(materialId: number): boolean {
    return this.materials.has(materialId);
  }

  /**
   * Get buffer index for a material
   * @param materialId Material ID
   * @returns Buffer index or -1 if not found
   */
  getBufferIndex(materialId: number): number {
    return this.materialIdToIndex.get(materialId) || -1;
  }

  /**
   * Clear all materials
   */
  clear(): void {
    this.materials.clear();
    this.materialIdToIndex.clear();
    this.freeSlots = [];
    this.dirtyMaterials.clear();
    this.nextMaterialId = 1;
    this.nextBufferIndex = 0;
  }

  /**
   * Get material instance by ID (internal use only)
   * @param materialId Material ID
   * @returns Material instance or null
   */
  getMaterialInstance(materialId: number): MaterialInstance | null {
    return this.materials.get(materialId) || null;
  }
}
