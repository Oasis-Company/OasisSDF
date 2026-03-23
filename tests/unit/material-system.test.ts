/**
 * Material System Tests
 * 
 * Tests for the material system components:
 * - MaterialManager
 * - MaterialBuffer
 * - PBRMaterial
 */

import { vi } from 'vitest';
import { MaterialManager } from '../../src/engine/MaterialManager.js';
import { MaterialBuffer } from '../../src/engine/MaterialBuffer.js';
import { PBRMaterial } from '../../src/objects/PBRMaterial.js';
import { BufferManager } from '../../src/engine/BufferManager.js';
import type { MaterialData } from '../../src/types/index.js';

// Mock device for testing
const mockDevice = {
  createBuffer: vi.fn(() => ({
    destroy: vi.fn()
  })),
  queue: {
    writeBuffer: vi.fn()
  }
} as any;

// Mock BufferManager
class MockBufferManager implements BufferManager {
  private buffers: Map<string, any> = new Map();

  createStorageBuffer(name: string, size: number): any {
    const buffer = { name, size, destroy: vi.fn() };
    this.buffers.set(name, buffer);
    return buffer;
  }

  createUniformBuffer(name: string, size: number): any {
    const buffer = { name, size, destroy: vi.fn() };
    this.buffers.set(name, buffer);
    return buffer;
  }

  getBuffer(name: string): any {
    return this.buffers.get(name);
  }

  writeObjectBuffer(buffer: any, objects: any[]): void {
    // Mock implementation
  }

  writeMaterialBuffer(buffer: any, materials: MaterialData[]): void {
    // Mock implementation
  }

  writeLightBuffer(buffer: any, lights: any[]): void {
    // Mock implementation
  }

  writeUniformBuffer(buffer: any, data: any): void {
    // Mock implementation
  }

  writeCameraBuffer(buffer: any, data: any): void {
    // Mock implementation
  }

  destroyBuffer(name: string): void {
    const buffer = this.buffers.get(name);
    if (buffer) {
      buffer.destroy();
      this.buffers.delete(name);
    }
  }

  cleanup(): void {
    this.buffers.forEach(buffer => buffer.destroy());
    this.buffers.clear();
  }
}

describe('Material System', () => {
  let materialManager: MaterialManager;
  let bufferManager: BufferManager;
  let materialBuffer: MaterialBuffer;

  beforeEach(() => {
    materialManager = new MaterialManager(10);
    bufferManager = new MockBufferManager();
    materialBuffer = new MaterialBuffer(bufferManager, 10);
    materialBuffer.setMaterialManager(materialManager);
  });

  afterEach(() => {
    bufferManager.cleanup();
  });

  describe('MaterialManager', () => {
    test('should create a new material', () => {
      const materialId = materialManager.createMaterial({
        color: [1, 0, 0],
        metallic: 1,
        roughness: 0.5
      });

      expect(materialId).toBeGreaterThan(0);
      expect(materialManager.getMaterialCount()).toBe(1);

      const material = materialManager.getMaterial(materialId);
      expect(material).toEqual({
        color: [1, 0, 0],
        metallic: 1,
        roughness: 0.5,
        reflectance: 0.04,
        emission: [0, 0, 0],
        emissionIntensity: 0,
        ambientOcclusion: 1
      });
    });

    test('should update an existing material', () => {
      const materialId = materialManager.createMaterial({ color: [1, 0, 0] });
      materialManager.updateMaterial(materialId, { color: [0, 1, 0], roughness: 0.8 });

      const material = materialManager.getMaterial(materialId);
      expect(material).toEqual({
        color: [0, 1, 0],
        metallic: 0,
        roughness: 0.8,
        reflectance: 0.04,
        emission: [0, 0, 0],
        emissionIntensity: 0,
        ambientOcclusion: 1
      });
    });

    test('should handle reference counting', () => {
      const materialId = materialManager.createMaterial({ color: [1, 0, 0] });
      
      // Increment reference count
      materialManager.referenceMaterial(materialId);
      
      // Release once - should not destroy
      const destroyed1 = materialManager.releaseMaterial(materialId);
      expect(destroyed1).toBe(false);
      expect(materialManager.getMaterialCount()).toBe(1);
      
      // Release again - should destroy
      const destroyed2 = materialManager.releaseMaterial(materialId);
      expect(destroyed2).toBe(true);
      expect(materialManager.getMaterialCount()).toBe(0);
    });

    test('should handle dirty materials', () => {
      const materialId = materialManager.createMaterial({ color: [1, 0, 0] });
      const dirtyMaterials = materialManager.getDirtyMaterials();
      
      expect(dirtyMaterials.size).toBe(1);
      expect(dirtyMaterials.has(materialId)).toBe(true);
      
      // Clear dirty materials
      materialManager.clearDirtyMaterials();
      expect(materialManager.getDirtyMaterials().size).toBe(0);
      
      // Update material - should mark as dirty
      materialManager.updateMaterial(materialId, { color: [0, 1, 0] });
      expect(materialManager.getDirtyMaterials().size).toBe(1);
    });

    test('should return all materials', () => {
      materialManager.createMaterial({ color: [1, 0, 0] });
      materialManager.createMaterial({ color: [0, 1, 0] });
      materialManager.createMaterial({ color: [0, 0, 1] });
      
      const materials = materialManager.getAllMaterials();
      expect(materials.length).toBe(3);
    });

    test('should throw error when maximum materials reached', () => {
      const smallManager = new MaterialManager(2);
      smallManager.createMaterial({ color: [1, 0, 0] });
      smallManager.createMaterial({ color: [0, 1, 0] });
      
      expect(() => {
        smallManager.createMaterial({ color: [0, 0, 1] });
      }).toThrow('Maximum material count reached: 2');
    });
  });

  describe('MaterialBuffer', () => {
    test('should initialize with correct capacity', () => {
      expect(materialBuffer.getMaxMaterials()).toBe(10);
      expect(materialBuffer.getBufferSize()).toBe(10 * 64); // 64 bytes per material
    });

    test('should resize buffer', () => {
      materialBuffer.resizeBuffer(20);
      expect(materialBuffer.getMaxMaterials()).toBe(20);
      expect(materialBuffer.getBufferSize()).toBe(20 * 64);
    });

    test('should update buffer with materials', () => {
      materialManager.createMaterial({ color: [1, 0, 0] });
      materialManager.createMaterial({ color: [0, 1, 0] });
      
      // Mock writeMaterialBuffer
      const originalWrite = (bufferManager as any).writeMaterialBuffer;
      (bufferManager as any).writeMaterialBuffer = vi.fn();
      
      materialBuffer.update();
      
      expect((bufferManager as any).writeMaterialBuffer).toHaveBeenCalled();
      
      // Restore original method
      (bufferManager as any).writeMaterialBuffer = originalWrite;
    });

    test('should update only dirty materials', () => {
      const materialId = materialManager.createMaterial({ color: [1, 0, 0] });
      
      // Clear dirty materials
      materialManager.clearDirtyMaterials();
      
      // Mock writeMaterialBuffer
      const originalWrite = (bufferManager as any).writeMaterialBuffer;
      (bufferManager as any).writeMaterialBuffer = vi.fn();
      
      // Update material to mark as dirty
      materialManager.updateMaterial(materialId, { color: [0, 1, 0] });
      
      materialBuffer.updateDirtyMaterials();
      
      expect((bufferManager as any).writeMaterialBuffer).toHaveBeenCalled();
      expect(materialManager.getDirtyMaterials().size).toBe(0);
      
      // Restore original method
      (bufferManager as any).writeMaterialBuffer = originalWrite;
    });
  });

  describe('PBRMaterial', () => {
    test('should create a PBR material', () => {
      const material = new PBRMaterial({
        color: [0.8, 0.8, 0.8],
        metallic: 0.5,
        roughness: 0.2
      });

      expect(material.color).toEqual([0.8, 0.8, 0.8]);
      expect(material.metallic).toBe(0.5);
      expect(material.roughness).toBe(0.2);
      expect(material.reflectance).toBe(0.04);
    });

    test('should create metallic material preset', () => {
      const material = PBRMaterial.createMetallic([1, 0, 0], 0.8, 0.1);
      expect(material.color).toEqual([1, 0, 0]);
      expect(material.metallic).toBe(0.8);
      expect(material.roughness).toBe(0.1);
    });

    test('should create emissive material preset', () => {
      const material = PBRMaterial.createEmissive([1, 1, 0], 2.0);
      expect(material.emission).toEqual([1, 1, 0]);
      expect(material.emissionIntensity).toBe(2.0);
    });

    test('should create glass material preset', () => {
      const material = PBRMaterial.createGlass();
      expect(material.color).toEqual([1, 1, 1]);
      expect(material.metallic).toBe(0);
      expect(material.roughness).toBe(0);
      expect(material.reflectance).toBe(0.04);
    });

    test('should clone material', () => {
      const original = new PBRMaterial({ color: [1, 0, 0], metallic: 1 });
      const clone = original.clone();

      expect(clone.color).toEqual(original.color);
      expect(clone.metallic).toBe(original.metallic);
      expect(clone).not.toBe(original);
    });

    test('should validate material properties', () => {
    expect(() => {
      new PBRMaterial({ metallic: 2 }); // Invalid metallic value
    }).toThrow('Value must be between 0 and 1');

    expect(() => {
      new PBRMaterial({ roughness: -0.5 }); // Invalid roughness value
    }).toThrow('Value must be between 0 and 1');
  });
  });
});
